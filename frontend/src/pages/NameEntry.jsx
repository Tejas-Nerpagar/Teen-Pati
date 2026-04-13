import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Spade } from 'lucide-react';

export default function NameEntry() {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const { enterGame } = useAuth();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim().length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }
    enterGame(name.trim());
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl bg-gray-800/80 p-8 shadow-2xl backdrop-blur-xl border border-gray-700">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/20 text-amber-400">
            <Spade size={32} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Teen Patti</h1>
          <p className="mt-2 text-sm text-gray-400">Enter your name to start playing</p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-400 border border-red-500/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            autoFocus
            placeholder="Your name..."
            value={name}
            onChange={(e) => { setName(e.target.value); setError(''); }}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit(e)}
            className="w-full rounded-xl border border-gray-600 bg-gray-900/50 px-4 py-3 text-white placeholder-gray-500 transition focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
          <button
            type="submit"
            className="w-full rounded-xl bg-amber-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-amber-400 active:scale-95"
          >
            Let's Play →
          </button>
        </form>
      </div>
    </div>
  );
}
