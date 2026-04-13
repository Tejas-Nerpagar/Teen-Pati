import { Room, Player, User, Transaction } from '../models/index.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Returns the index of the next active player.
 * If every player is inactive (all folded) returns the current index as fallback.
 */
const getNextTurn = async (room, players) => {
  const activePlayers = players.filter(p => p.is_active);
  if (activePlayers.length <= 1) return room.current_turn_index; // safety guard

  let nextTurn = (room.current_turn_index + 1) % players.length;
  let loopCount = 0;
  while (!players[nextTurn].is_active && loopCount < players.length) {
    nextTurn = (nextTurn + 1) % players.length;
    loopCount++;
  }
  return nextTurn;
};

const handleWin = async (room, winnerPlayer, io, res) => {
  const pot = room.pot_amount;
  if (winnerPlayer.user_id) {
    await User.increment('balance', { by: pot, where: { id: winnerPlayer.user_id } });
  }

  await Transaction.create({
    user_id: winnerPlayer.user_id,
    guest_name: winnerPlayer.guest_name,
    room_id: room.id,
    amount: pot,
    type: 'win',
  });

  await room.update({ status: 'finished' });
  io.to(room.id).emit('game_over', { winner: winnerPlayer.id, amount: pot, room });

  if (res) {
    res.json({ message: 'Winner declared', room });
  }
};

// ─── Auth endpoints ───────────────────────────────────────────────────────────

export const createRoom = async (req, res) => {
  try {
    const { entry_amount } = req.body;
    const room_id = Math.random().toString(36).substring(2, 8).toUpperCase();

    const room = await Room.create({
      id: room_id,
      entry_amount: entry_amount || 100,
      host_id: req.user.id,
    });

    // Auto-join host
    await Player.create({
      user_id: req.user.id,
      room_id: room.id,
      turn_order: 1,
    });

    res.status(201).json(room);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const joinRoom = async (req, res) => {
  try {
    const { room_id } = req.body;

    const room = await Room.findByPk(room_id);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    if (room.status !== 'waiting') return res.status(400).json({ message: 'Game already started or finished' });

    const existingPlayer = await Player.findOne({ where: { user_id: req.user.id, room_id } });
    if (existingPlayer) return res.status(400).json({ message: 'Already in room' });

    const playerCount = await Player.count({ where: { room_id } });
    const player = await Player.create({ user_id: req.user.id, room_id, turn_order: playerCount + 1 });

    const io = req.app.get('io');
    const user = await User.findByPk(req.user.id);
    io.to(room_id).emit('player_joined', { player, user });

    res.json(player);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const joinGuest = async (req, res) => {
  try {
    const { room_id, guest_name } = req.body;
    if (!guest_name?.trim()) return res.status(400).json({ message: 'Guest name is required' });

    const room = await Room.findByPk(room_id);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    if (room.host_id !== req.user.id) return res.status(403).json({ message: 'Only host can add guests' });

    const playerCount = await Player.count({ where: { room_id } });
    const player = await Player.create({ guest_name: guest_name.trim(), room_id, turn_order: playerCount + 1 });

    const io = req.app.get('io');
    io.to(room_id).emit('player_joined', { player, user: { username: guest_name } });

    res.json(player);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const startGame = async (req, res) => {
  try {
    const { room_id } = req.body;
    const room = await Room.findByPk(room_id);

    if (!room || room.host_id !== req.user.id) {
      return res.status(403).json({ message: 'Only host can start the game' });
    }

    const players = await Player.findAll({ where: { room_id }, order: [['turn_order', 'ASC']] });
    if (players.length < 2) return res.status(400).json({ message: 'Need at least 2 players' });

    let pot_amount = 0;

    for (const player of players) {
      if (player.user_id) {
        await User.decrement('balance', { by: room.entry_amount, where: { id: player.user_id } });
      }
      await Transaction.create({
        user_id: player.user_id,
        guest_name: player.guest_name,
        room_id,
        amount: room.entry_amount,
        type: 'entry',
      });
      pot_amount += room.entry_amount;

      // Reset player state for the new round
      await player.update({ current_bet: 0, is_active: true, has_passed: false });
    }

    // Reset room state fully for new round
    await room.update({
      status: 'playing',
      pot_amount,               // reset to fresh entry fees only
      current_highest_bet: 0,
      current_turn_index: 0,
    });

    const io = req.app.get('io');
    io.to(room_id).emit('game_started', { room });

    res.json({ message: 'Game started', room });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const bet = async (req, res) => {
  try {
    const { room_id, amount } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ message: 'Invalid bet amount' });

    const room = await Room.findByPk(room_id);
    if (!room || room.status !== 'playing') return res.status(400).json({ message: 'Game not active' });

    const players = await Player.findAll({ where: { room_id }, order: [['turn_order', 'ASC']] });
    const currentPlayer = players[room.current_turn_index];

    if (currentPlayer.user_id !== req.user.id) {
      return res.status(400).json({ message: 'Not your turn' });
    }
    if (amount < room.current_highest_bet) {
      return res.status(400).json({ message: `Bet must be ≥ current highest bet (₹${room.current_highest_bet})` });
    }

    await User.decrement('balance', { by: amount, where: { id: req.user.id } });
    await Transaction.create({ user_id: req.user.id, room_id, amount, type: 'bet' });

    const nextTurn = await getNextTurn(room, players);
    await room.update({
      pot_amount: room.pot_amount + amount,
      current_highest_bet: Math.max(room.current_highest_bet, amount),
      current_turn_index: nextTurn,
    });
    await currentPlayer.update({ current_bet: currentPlayer.current_bet + amount });

    const io = req.app.get('io');
    io.to(room_id).emit('game_update', { action: 'bet', player: currentPlayer.id, amount, room });

    res.json({ message: 'Bet placed', room });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const fold = async (req, res) => {
  try {
    const { room_id } = req.body;
    const room = await Room.findByPk(room_id);
    if (!room || room.status !== 'playing') return res.status(400).json({ message: 'Game not active' });

    const players = await Player.findAll({ where: { room_id }, order: [['turn_order', 'ASC']] });
    const currentPlayer = players[room.current_turn_index];

    if (currentPlayer.user_id !== req.user.id) {
      return res.status(400).json({ message: 'Not your turn' });
    }

    // Mark as folded
    await currentPlayer.update({ is_active: false });
    await Transaction.create({ user_id: req.user.id, room_id, amount: 0, type: 'fold' });

    // Re-fetch fresh state from DB to get accurate active count
    const freshPlayers = await Player.findAll({ where: { room_id }, order: [['turn_order', 'ASC']] });
    const activePlayers = freshPlayers.filter(p => p.is_active);

    if (activePlayers.length === 1) {
      return handleWin(room, activePlayers[0], req.app.get('io'), res);
    }

    const nextTurn = await getNextTurn(room, freshPlayers);
    await room.update({ current_turn_index: nextTurn });

    const io = req.app.get('io');
    io.to(room_id).emit('game_update', { action: 'fold', player: currentPlayer.id, room });

    res.json({ message: 'Folded' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const show = async (req, res) => {
  try {
    const { room_id } = req.body;
    const room = await Room.findByPk(room_id);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    const io = req.app.get('io');
    io.to(room_id).emit('game_update', { action: 'show_requested', room });
    res.json({ message: 'Show requested — host must declare winner' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const pass = async (req, res) => {
  try {
    const { room_id, player_id } = req.body;
    const room = await Room.findByPk(room_id);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    if (room.host_id !== req.user.id) return res.status(403).json({ message: 'Only host can trigger pass' });

    const players = await Player.findAll({ where: { room_id }, order: [['turn_order', 'ASC']] });

    await Transaction.create({ user_id: player_id || null, room_id, amount: 0, type: 'pass' });

    const nextTurn = await getNextTurn(room, players);
    await room.update({ current_turn_index: nextTurn });

    const io = req.app.get('io');
    io.to(room_id).emit('game_update', { action: 'pass', room });
    res.json({ message: 'Passed turn' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const manualBet = async (req, res) => {
  try {
    const { room_id, player_id, amount } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ message: 'Invalid bet amount' });

    const room = await Room.findByPk(room_id);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    if (room.host_id !== req.user.id) return res.status(403).json({ message: 'Only host can add manual bets' });

    const players = await Player.findAll({ where: { room_id }, order: [['turn_order', 'ASC']] });
    const targetPlayer = players.find(p => p.id === player_id);
    if (!targetPlayer) return res.status(404).json({ message: 'Player not found' });

    if (targetPlayer.user_id) {
      await User.decrement('balance', { by: amount, where: { id: targetPlayer.user_id } });
    }

    await Transaction.create({
      user_id: targetPlayer.user_id,
      guest_name: targetPlayer.guest_name,
      room_id,
      amount,
      type: 'bet',
    });

    const nextTurn = await getNextTurn(room, players);
    await room.update({
      pot_amount: room.pot_amount + amount,
      current_highest_bet: Math.max(room.current_highest_bet, amount),
      current_turn_index: nextTurn,
    });
    await targetPlayer.update({ current_bet: targetPlayer.current_bet + amount });

    const io = req.app.get('io');
    io.to(room_id).emit('game_update', { action: 'manual_bet', player: targetPlayer.id, amount, room });

    res.json({ message: 'Manual bet placed', room });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const declareWinner = async (req, res) => {
  try {
    const { room_id, winner_player_id } = req.body;
    const room = await Room.findByPk(room_id);

    if (!room) return res.status(404).json({ message: 'Room not found' });
    if (room.host_id !== req.user.id) return res.status(403).json({ message: 'Only host can declare winner' });

    const winner = await Player.findByPk(winner_player_id);
    if (!winner) return res.status(404).json({ message: 'Player not found' });

    return handleWin(room, winner, req.app.get('io'), res);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getRoomState = async (req, res) => {
  try {
    const room = await Room.findByPk(req.params.id, {
      include: [
        { model: Player, include: [{ model: User, attributes: ['username'] }] },
        {
          model: Transaction,
          include: [{ model: User, attributes: ['username'] }],
          order: [['createdAt', 'DESC']],
        },
      ],
    });
    if (!room) return res.status(404).json({ message: 'Room not found' });
    res.json(room);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
