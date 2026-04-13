import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, Plus, Users, Wallet } from 'lucide-react';

export default function Dashboard() {
  const { user, api, logout } = useAuth();
  const [roomId, setRoomId] = useState('');
  const [entryAmount, setEntryAmount] = useState(100);
  const navigate = useNavigate();

  const handleCreateRoom = async () => {
    try {
      const res = await api.post('/create-room', { entry_amount: entryAmount });
      navigate(`/room/${res.data.id}`);
    } catch (err) {
      alert('Failed to create room');
    }
  };

  const handleJoinRoom = async () => {
    if (!roomId) return;
    try {
      await api.post('/join-room', { room_id: roomId });
      navigate(`/room/${roomId}`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to join room');
    }
  };

  return (
    <div className="mx-auto max-w-4xl p-6">
      <header className="mb-10 flex items-center justify-between glass rounded-2xl p-6">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">
            Welcome, {user?.username}
          </h1>
          <div className="mt-2 flex items-center text-emerald-400 font-mono text-xl">
            <Wallet className="mr-2" size={24} />
            ₹{user?.balance?.toLocaleString('en-IN')}
          </div>
        </div>
        <button onClick={logout} className="rounded-full bg-gray-800 p-3 text-gray-400 hover:bg-red-500/20 hover:text-red-400 transition">
          <LogOut size={24} />
        </button>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Create Room */}
        <div className="glass rounded-2xl p-6">
          <div className="mb-6 flex items-center text-indigo-400">
            <Plus size={24} className="mr-3" />
            <h2 className="text-xl font-semibold text-white">Create Room</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Entry Amount</label>
              <input
                type="number"
                value={entryAmount}
                onChange={(e) => setEntryAmount(parseInt(e.target.value))}
                className="w-full rounded-xl border border-gray-700 bg-gray-800/50 p-3 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
              />
            </div>
            <button
              onClick={handleCreateRoom}
              className="w-full rounded-xl bg-indigo-500 py-3 font-semibold text-white hover:bg-indigo-400 transition active:scale-95"
            >
              Start Game
            </button>
          </div>
        </div>

        {/* Join Room */}
        <div className="glass rounded-2xl p-6">
          <div className="mb-6 flex items-center text-emerald-400">
            <Users size={24} className="mr-3" />
            <h2 className="text-xl font-semibold text-white">Join Room</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Room Code</label>
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                placeholder="e.g. A1B2C3"
                className="w-full rounded-xl border border-gray-700 bg-gray-800/50 p-3 text-white uppercase focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
              />
            </div>
            <button
              onClick={handleJoinRoom}
              className="w-full rounded-xl bg-emerald-500 py-3 font-semibold text-white hover:bg-emerald-400 transition active:scale-95"
            >
              Join Table
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
