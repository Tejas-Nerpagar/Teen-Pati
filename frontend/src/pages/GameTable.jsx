import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import LedgerPanel from '../components/LedgerPanel';
import { User, Coins, SkipForward, Hand, Trophy, ChevronRight } from 'lucide-react';

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

  const fetchRoomState = async () => {
    try {
      const res = await api.get(`/room/${id}`);
      setRoom(res.data);
      setPlayers(res.data.Players || []);
      setTransactions(res.data.Transactions || []);
    } catch (err) {
      alert('Error fetching room');
      navigate('/');
    }
  };

  useEffect(() => {
    if (socket) {
      socket.emit('join_room', id);
      
      socket.on('player_joined', fetchRoomState);
      socket.on('game_started', fetchRoomState);
      socket.on('game_update', fetchRoomState);
      socket.on('game_over', fetchRoomState);

      return () => {
        socket.emit('leave_room', id);
        socket.off('player_joined');
        socket.off('game_started');
        socket.off('game_update');
        socket.off('game_over');
      };
    }
  }, [socket, id]);

  useEffect(() => {
    fetchRoomState();
  }, [id]);

  useEffect(() => {
     if (room && betAmount < room.current_highest_bet) {
         setBetAmount(room.current_highest_bet);
     }
  }, [room]);

  const isHost = room?.host_id === user?.id;
  
  // Game Actions
  const startGame = async () => await api.post('/start-game', { room_id: id }).then(fetchUser);
  const placeBet = async () => await api.post('/bet', { room_id: id, amount: betAmount }).then(fetchUser);
  const foldUser = async () => await api.post('/fold', { room_id: id });
  const showCards = async () => await api.post('/show', { room_id: id });
  
  // Offline Pass-Pass Features
  const addGuest = async () => {
      if(!guestName) return;
      await api.post('/join-guest', { room_id: id, guest_name: guestName });
      setGuestName('');
  };
  const passTurnHost = async (playerId) => await api.post('/pass', { room_id: id, player_id: playerId });
  const manualBetHost = async (playerId, amount) => await api.post('/manual-bet', { room_id: id, player_id: playerId, amount }).then(fetchUser);
  const declareWinner = async (playerId) => await api.post('/declare-winner', { room_id: id, winner_player_id: playerId }).then(fetchUser);

  if (!room) return <div className="text-center mt-20">Loading...</div>;

  const currentPlayerTurn = players[room.current_turn_index];
  const isMyTurn = currentPlayerTurn?.user_id === user?.id;

  return (
    <div className="flex h-screen flex-col md:flex-row bg-gray-900">
      {/* Main Game Area */}
      <div className="flex-1 flex flex-col p-4">
        {/* Header info */}
        <div className="flex items-center justify-between p-4 glass rounded-xl mb-4">
            <div>
                <h1 className="text-xl font-bold">Room: {room.id}</h1>
                <p className="text-sm text-gray-400 capitalize">Status: {room.status}</p>
            </div>
            {isHost && room.status === 'waiting' && (
                <button onClick={startGame} className="bg-emerald-500 hover:bg-emerald-400 px-4 py-2 rounded-lg font-bold">
                    Start Game
                </button>
            )}
             {isHost && room.status === 'finished' && (
                <button onClick={startGame} className="bg-indigo-500 hover:bg-indigo-400 px-4 py-2 rounded-lg font-bold">
                    Start Next Round
                </button>
            )}
        </div>

        {/* The Table */}
        <div className="flex-1 glass rounded-2xl relative flex flex-col items-center justify-center p-6 border-4 border-emerald-900/40">
           {room.status === 'playing' ? (
              <div className="text-center mb-8">
                  <div className="text-sm text-gray-400 uppercase tracking-widest mb-2">Total Pot</div>
                  <div className="text-5xl font-black text-amber-400 font-mono tracking-tight">₹{room.pot_amount.toLocaleString('en-IN')}</div>
                  <div className="mt-2 text-indigo-300">Highest Bet: ₹{room.current_highest_bet}</div>
              </div>
           ) : (
              <div className="text-center text-gray-500 mb-8 max-w-sm">
                  <Coins size={48} className="mx-auto mb-4 opacity-50" />
                  Waiting for players and host to start the game.
              </div>
           )}

           {/* Players Circular/List Display */}
           <div className="w-full max-w-2xl mt-8 block">
               <h3 className="text-gray-400 mb-4 text-sm font-semibold uppercase tracking-wider">Players</h3>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {players.map((p, idx) => {
                      const isActiveTurn = room.status === 'playing' && room.current_turn_index === idx;
                      return (
                          <div key={p.id} className={`p-4 rounded-xl border relative transition-all ${isActiveTurn ? 'border-amber-500 bg-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.2)] scale-105' : p.is_active ? 'border-gray-700 bg-gray-800' : 'border-gray-800 bg-gray-900 opacity-50'}`}>
                              {isActiveTurn && <div className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-amber-500 animate-pulse"></div>}
                              <div className="truncate font-semibold text-white mb-1">
                                {p.User?.username || p.guest_name}
                              </div>
                              <div className="text-xs text-indigo-300 mb-2 font-mono">Bet: ₹{p.current_bet}</div>
                              
                              {!p.is_active && <div className="text-xs text-red-500 uppercase tracking-wider border border-red-500/20 bg-red-500/10 px-2 py-1 rounded inline-block">Folded</div>}
                          </div>
                      );
                  })}
               </div>
           </div>
        </div>

        {/* Action Panel */}
        {room.status === 'playing' && (
        <div className="mt-4 glass rounded-xl p-6">
           <div className="flex flex-col md:flex-row items-center justify-between gap-4">
               
               {/* Online Player Actions */}
               {isMyTurn ? (
                   <div className="flex gap-2 w-full md:w-auto">
                       <input 
                         type="number" 
                         value={betAmount} 
                         onChange={(e)=>setBetAmount(Number(e.target.value))}
                         className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 w-24 text-white font-mono"
                       />
                       <button onClick={placeBet} className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 px-4 rounded-lg transition active:scale-95 flex-1 md:flex-none">
                           Bet
                       </button>
                       <button onClick={foldUser} className="bg-red-500/20 hover:bg-red-500 border border-red-500/50 text-white font-bold py-2 px-4 rounded-lg transition active:scale-95 flex-1 md:flex-none">
                           Fold
                       </button>
                       <button onClick={showCards} className="bg-indigo-500/20 hover:bg-indigo-500 border border-indigo-500/50 text-white font-bold py-2 px-4 rounded-lg transition active:scale-95 flex-1 md:flex-none">
                           Show
                       </button>
                   </div>
               ) : (
                   <div className="text-gray-400 text-sm flex items-center">
                       <User size={16} className="mr-2"/>
                       Waiting for {currentPlayerTurn?.User?.username || currentPlayerTurn?.guest_name}'s turn...
                   </div>
               )}

               {/* Admin / Pass-Pass Master Tools */}
               {isHost && (
                   <div className="border-t md:border-t-0 md:border-l border-gray-700 pt-4 md:pt-0 md:pl-4 mt-4 md:mt-0 w-full md:w-auto flex flex-col gap-2">
                       <div className="text-xs text-indigo-400 capitalize font-bold tracking-wider mb-1">Host Controls (Offline Mode)</div>
                       <div className="flex gap-2">
                            <button onClick={() => passTurnHost(currentPlayerTurn?.id)} className="flex items-center text-xs bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded">
                                <SkipForward size={14} className="mr-1"/> Force Pass
                            </button>
                            <button onClick={() => {
                                const amt = prompt("Enter bet amount:", room.current_highest_bet);
                                if(amt) manualBetHost(currentPlayerTurn?.id, Number(amt));
                            }} className="flex items-center text-xs bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded">
                                <Coins size={14} className="mr-1"/> Force Bet
                            </button>
                            <button onClick={() => declareWinner(currentPlayerTurn?.id)} className="flex items-center text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded">
                                <Trophy size={14} className="mr-1"/> Award Pot
                            </button>
                       </div>
                   </div>
               )}

           </div>
        </div>
        )}

        {/* Setup tools for waiting room */}
        {isHost && room.status === 'waiting' && (
            <div className="mt-4 glass rounded-xl p-4 flex gap-2 w-full md:w-auto">
                <input 
                    type="text" 
                    placeholder="Guest Name (Offline)" 
                    value={guestName} 
                    onChange={e => setGuestName(e.target.value)} 
                    className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 flex-1 outline-none focus:border-indigo-500 text-white"
                />
                <button onClick={addGuest} className="bg-indigo-500 hover:bg-indigo-400 px-4 py-2 rounded-lg font-bold">Add Local Player</button>
            </div>
        )}

      </div>

      {/* Ledger Panel */}
      <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-gray-800 bg-gray-900/50 backdrop-blur-xl flex flex-col h-1/3 md:h-screen">
          <LedgerPanel transactions={transactions} />
      </div>
    </div>
  );
}
