import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, Plus, Users, Wallet, Loader2 } from 'lucide-react';

export default function Dashboard() {
  const { user, api, logout, fetchUser } = useAuth();
  const [roomId, setRoomId] = useState('');
  const [entryAmount, setEntryAmount] = useState(100);
  const [createError, setCreateError] = useState('');
  const [joinError, setJoinError] = useState('');
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const navigate = useNavigate();

  // Refresh balance on mount
  useEffect(() => { fetchUser(); }, [fetchUser]);

  const handleCreateRoom = async () => {
    if (entryAmount <= 0) { setCreateError('Entry amount must be positive'); return; }
    setCreateError('');
    setCreating(true);
    try {
      const res = await api.post('/create-room', { entry_amount: entryAmount });
      navigate(`/room/${res.data.id}`);
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Failed to create room');
    } finally {
      setCreating(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!roomId.trim()) { setJoinError('Enter a room code'); return; }
    setJoinError('');
    setJoining(true);
    try {
      await api.post('/join-room', { room_id: roomId.trim().toUpperCase() });
      navigate(`/room/${roomId.trim().toUpperCase()}`);
    } catch (err) {
      setJoinError(err.response?.data?.message || 'Failed to join room');
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl p-6">
      {/* Header */}
      <header className="mb-10 flex items-center justify-between glass rounded-2xl p-6">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">
            Welcome, {user?.username}
          </h1>
          <div className="mt-2 flex items-center text-emerald-400 font-mono text-xl">
            <Wallet className="mr-2" size={22} />
            ₹{user?.balance?.toLocaleString('en-IN')}
          </div>
        </div>
        <button
          onClick={logout}
          title="Logout"
          className="rounded-full bg-gray-800 p-3 text-gray-400 hover:bg-red-500/20 hover:text-red-400 transition"
        >
          <LogOut size={22} />
        </button>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Create Room */}
        <div className="glass rounded-2xl p-6 flex flex-col">
          <div className="mb-6 flex items-center text-indigo-400">
            <Plus size={24} className="mr-3" />
            <h2 className="text-xl font-semibold text-white">Create Room</h2>
          </div>
          <div className="space-y-4 flex-1">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Entry Amount (₹)</label>
              <input
                type="number"
                min={1}
                value={entryAmount}
                onChange={(e) => setEntryAmount(parseInt(e.target.value) || 0)}
                className="w-full rounded-xl border border-gray-700 bg-gray-800/50 p-3 text-white font-mono focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
              />
            </div>
            {createError && (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {createError}
              </p>
            )}
            <button
              onClick={handleCreateRoom}
              disabled={creating}
              className="w-full rounded-xl bg-indigo-500 py-3 font-semibold text-white hover:bg-indigo-400 disabled:opacity-50 transition active:scale-95 flex items-center justify-center gap-2"
            >
              {creating && <Loader2 size={16} className="animate-spin" />}
              Start Game
            </button>
          </div>
        </div>

        {/* Join Room */}
        <div className="glass rounded-2xl p-6 flex flex-col">
          <div className="mb-6 flex items-center text-emerald-400">
            <Users size={24} className="mr-3" />
            <h2 className="text-xl font-semibold text-white">Join Room</h2>
          </div>
          <div className="space-y-4 flex-1">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Room Code</label>
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
                placeholder="e.g. A1B2C3"
                maxLength={10}
                className="w-full rounded-xl border border-gray-700 bg-gray-800/50 p-3 text-white uppercase font-mono tracking-widest focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
              />
            </div>
            {joinError && (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {joinError}
              </p>
            )}
            <button
              onClick={handleJoinRoom}
              disabled={joining}
              className="w-full rounded-xl bg-emerald-500 py-3 font-semibold text-white hover:bg-emerald-400 disabled:opacity-50 transition active:scale-95 flex items-center justify-center gap-2"
            >
              {joining && <Loader2 size={16} className="animate-spin" />}
              Join Table
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
