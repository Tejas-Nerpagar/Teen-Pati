import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import LedgerPanel from '../components/LedgerPanel';
import { User, Coins, SkipForward, Trophy, Copy, Check, Loader2 } from 'lucide-react';

// ── Small helper: inline toast-style error banner ─────────────────────────────
function ErrorBanner({ message, onDismiss }) {
  if (!message) return null;
  return (
    <div className="flex items-center justify-between mb-4 rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
      <span>{message}</span>
      <button onClick={onDismiss} className="ml-4 text-red-400 hover:text-red-200 font-bold">✕</button>
    </div>
  );
}

export default function GameTable() {
  const { id } = useParams();
  const { user, api, fetchUser } = useAuth();
  const socket = useSocket();
  const navigate = useNavigate();

  const [room, setRoom] = useState(null);
  const [players, setPlayers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [betAmount, setBetAmount] = useState(0);
  const [guestName, setGuestName] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // Per-action loading flags
  const [loading, setLoading] = useState({});
  const setActionLoading = (key, val) => setLoading(prev => ({ ...prev, [key]: val }));

  const fetchRoomState = useCallback(async () => {
    try {
      const res = await api.get(`/room/${id}`);
      setRoom(res.data);
      setPlayers(res.data.Players || []);
      setTransactions(res.data.Transactions || []);
    } catch {
      setError('Could not load room. Returning to lobby...');
      setTimeout(() => navigate('/'), 2000);
    }
  }, [api, id, navigate]);

  // Socket subscriptions
  useEffect(() => {
    if (!socket) return;
    socket.emit('join_room', id);
    socket.on('player_joined', fetchRoomState);
    socket.on('game_started', fetchRoomState);
    socket.on('game_update', fetchRoomState);
    socket.on('game_over', fetchRoomState);
    return () => {
      socket.emit('leave_room', id);
      socket.off('player_joined', fetchRoomState);
      socket.off('game_started', fetchRoomState);
      socket.off('game_update', fetchRoomState);
      socket.off('game_over', fetchRoomState);
    };
  }, [socket, id, fetchRoomState]);

  useEffect(() => { fetchRoomState(); }, [fetchRoomState]);

  // Keep bet amount >= current highest bet
  useEffect(() => {
    if (room && betAmount < room.current_highest_bet) {
      setBetAmount(room.current_highest_bet);
    }
  }, [room, betAmount]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const doAction = async (key, fn) => {
    setError('');
    setActionLoading(key, true);
    try {
      await fn();
      await fetchUser();
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading(key, false);
    }
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isHost = room?.host_id === user?.id;
  const currentPlayerTurn = players[room?.current_turn_index];
  const isMyTurn = currentPlayerTurn?.user_id === user?.id;

  // ── Actions ────────────────────────────────────────────────────────────────
  const startGame = () => doAction('start', () => api.post('/start-game', { room_id: id }));
  const placeBet  = () => doAction('bet',   () => api.post('/bet',         { room_id: id, amount: betAmount }));
  const foldUser  = () => doAction('fold',  () => api.post('/fold',        { room_id: id }));
  const showCards = () => doAction('show',  () => api.post('/show',        { room_id: id }));

  const addGuest = () => doAction('guest', async () => {
    if (!guestName.trim()) throw { response: { data: { message: 'Enter a guest name' } } };
    await api.post('/join-guest', { room_id: id, guest_name: guestName.trim() });
    setGuestName('');
  });

  const passTurn = (pid) => doAction('pass', () => api.post('/pass', { room_id: id, player_id: pid }));

  const manualBetHost = (pid, amount) =>
    doAction('manualBet', () => api.post('/manual-bet', { room_id: id, player_id: pid, amount }));

  const declareWinner = (pid) =>
    doAction('winner', () => api.post('/declare-winner', { room_id: id, winner_player_id: pid }));

  if (!room) return (
    <div className="flex h-screen items-center justify-center text-gray-400">
      <Loader2 className="animate-spin mr-2" size={20} /> Loading room...
    </div>
  );

  return (
    <div className="flex h-screen flex-col md:flex-row bg-gray-900">
      {/* ── Main Game Area ──────────────────────────────────────── */}
      <div className="flex-1 flex flex-col p-4 overflow-auto">
        <ErrorBanner message={error} onDismiss={() => setError('')} />

        {/* Header */}
        <div className="flex items-center justify-between p-4 glass rounded-xl mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">Room:</h1>
              <span className="font-mono text-amber-400 text-xl tracking-widest">{room.id}</span>
              <button
                onClick={copyRoomCode}
                title="Copy room code"
                className="ml-1 p-1 rounded text-gray-400 hover:text-white transition"
              >
                {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
              </button>
            </div>
            <p className="text-sm text-gray-400 capitalize">Status: <span className={
              room.status === 'playing' ? 'text-emerald-400' :
              room.status === 'finished' ? 'text-red-400' : 'text-gray-300'
            }>{room.status}</span></p>
          </div>
          <div className="flex gap-2">
            {isHost && room.status === 'waiting' && (
              <button
                onClick={startGame}
                disabled={loading.start}
                className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition"
              >
                {loading.start && <Loader2 size={16} className="animate-spin" />} Start Game
              </button>
            )}
            {isHost && room.status === 'finished' && (
              <button
                onClick={startGame}
                disabled={loading.start}
                className="bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition"
              >
                {loading.start && <Loader2 size={16} className="animate-spin" />} Next Round
              </button>
            )}
          </div>
        </div>

        {/* The Table */}
        <div className="flex-1 glass rounded-2xl relative flex flex-col items-center justify-center p-6 border-4 border-emerald-900/40">
          {room.status === 'playing' ? (
            <div className="text-center mb-8">
              <div className="text-sm text-gray-400 uppercase tracking-widest mb-2">Total Pot</div>
              <div className="text-5xl font-black text-amber-400 font-mono tracking-tight">
                ₹{room.pot_amount.toLocaleString('en-IN')}
              </div>
              <div className="mt-2 text-indigo-300 text-sm">
                Highest Bet: <span className="font-mono font-bold">₹{room.current_highest_bet}</span>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 mb-8 max-w-sm">
              <Coins size={48} className="mx-auto mb-4 opacity-30" />
              {room.status === 'finished'
                ? 'Round finished. Host can start the next round.'
                : 'Waiting for players. Host will start the game.'}
            </div>
          )}

          {/* Players Grid */}
          <div className="w-full max-w-2xl mt-4">
            <h3 className="text-gray-400 mb-4 text-xs font-semibold uppercase tracking-wider">
              Players ({players.length})
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {players.map((p, idx) => {
                const isActiveTurn = room.status === 'playing' && room.current_turn_index === idx;
                return (
                  <div
                    key={p.id}
                    className={`p-4 rounded-xl border relative transition-all ${
                      isActiveTurn
                        ? 'border-amber-500 bg-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.2)] scale-105'
                        : p.is_active
                        ? 'border-gray-700 bg-gray-800'
                        : 'border-gray-800 bg-gray-900 opacity-40'
                    }`}
                  >
                    {isActiveTurn && (
                      <div className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-amber-500 animate-pulse" />
                    )}
                    <div className="truncate font-semibold text-white mb-1 text-sm">
                      {p.User?.username || p.guest_name}
                      {p.guest_name && (
                        <span className="ml-1 text-xs text-gray-500">(guest)</span>
                      )}
                    </div>
                    <div className="text-xs text-indigo-300 mb-2 font-mono">Bet: ₹{p.current_bet}</div>
                    {!p.is_active && (
                      <div className="text-xs text-red-500 uppercase tracking-wider border border-red-500/20 bg-red-500/10 px-2 py-0.5 rounded inline-block">
                        Folded
                      </div>
                    )}

                    {/* Per-player host controls */}
                    {isHost && room.status === 'playing' && p.is_active && (
                      <div className="mt-3 flex flex-col gap-1">
                        <button
                          onClick={() => passTurn(p.id)}
                          disabled={loading.pass}
                          className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded flex items-center justify-center gap-1 transition disabled:opacity-50"
                        >
                          <SkipForward size={11} /> Pass
                        </button>
                        <button
                          onClick={() => {
                            const amt = prompt(`Manual bet for ${p.User?.username || p.guest_name}:`, room.current_highest_bet || room.entry_amount);
                            if (amt && Number(amt) > 0) manualBetHost(p.id, Number(amt));
                          }}
                          disabled={loading.manualBet}
                          className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded flex items-center justify-center gap-1 transition disabled:opacity-50"
                        >
                          <Coins size={11} /> Force Bet
                        </button>
                        <button
                          onClick={() => declareWinner(p.id)}
                          disabled={loading.winner}
                          className="text-xs bg-emerald-700 hover:bg-emerald-600 text-white px-2 py-1 rounded flex items-center justify-center gap-1 transition disabled:opacity-50"
                        >
                          <Trophy size={11} /> Award Pot
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Online Player Action Bar ───────────────────────────── */}
        {room.status === 'playing' && (
          <div className="mt-4 glass rounded-xl p-4">
            {isMyTurn ? (
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-xs text-amber-400 font-semibold uppercase tracking-wider mr-2">Your Turn</span>
                <input
                  type="number"
                  value={betAmount}
                  min={room.current_highest_bet}
                  onChange={(e) => setBetAmount(Number(e.target.value))}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 w-28 text-white font-mono focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
                />
                <button
                  onClick={placeBet}
                  disabled={loading.bet}
                  className="bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold py-2 px-5 rounded-lg transition active:scale-95 flex items-center gap-2"
                >
                  {loading.bet ? <Loader2 size={14} className="animate-spin" /> : null} Bet
                </button>
                <button
                  onClick={foldUser}
                  disabled={loading.fold}
                  className="bg-red-500/20 hover:bg-red-500 border border-red-500/50 disabled:opacity-50 text-white font-bold py-2 px-5 rounded-lg transition active:scale-95 flex items-center gap-2"
                >
                  {loading.fold ? <Loader2 size={14} className="animate-spin" /> : null} Fold
                </button>
                <button
                  onClick={showCards}
                  disabled={loading.show}
                  className="bg-indigo-500/20 hover:bg-indigo-500 border border-indigo-500/50 disabled:opacity-50 text-white font-bold py-2 px-5 rounded-lg transition active:scale-95 flex items-center gap-2"
                >
                  {loading.show ? <Loader2 size={14} className="animate-spin" /> : null} Show
                </button>
              </div>
            ) : (
              <div className="text-gray-400 text-sm flex items-center">
                <User size={16} className="mr-2" />
                Waiting for <span className="mx-1 font-semibold text-white">
                  {currentPlayerTurn?.User?.username || currentPlayerTurn?.guest_name}
                </span>'s turn...
              </div>
            )}
          </div>
        )}

        {/* ── Waiting room: add guest players ────────────────────── */}
        {isHost && room.status === 'waiting' && (
          <div className="mt-4 glass rounded-xl p-4 flex gap-2">
            <input
              type="text"
              placeholder="Guest / offline player name"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addGuest()}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 flex-1 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white"
            />
            <button
              onClick={addGuest}
              disabled={loading.guest}
              className="bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition"
            >
              {loading.guest ? <Loader2 size={14} className="animate-spin" /> : null} Add Player
            </button>
          </div>
        )}
      </div>

      {/* ── Ledger Panel ────────────────────────────────────────── */}
      <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-gray-800 bg-gray-900/50 backdrop-blur-xl flex flex-col h-56 md:h-screen">
        <LedgerPanel transactions={transactions} />
      </div>
    </div>
  );
}
