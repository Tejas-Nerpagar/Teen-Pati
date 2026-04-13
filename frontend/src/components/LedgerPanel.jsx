import React from 'react';
import { ArrowRightLeft, Coins, Trophy, Ban, Send } from 'lucide-react';

export default function LedgerPanel({ transactions }) {
  
  const getIcon = (type) => {
      switch(type) {
          case 'entry': return <ArrowRightLeft size={16} className="text-gray-400" />;
          case 'bet': return <Coins size={16} className="text-amber-400" />;
          case 'win': return <Trophy size={16} className="text-emerald-400" />;
          case 'loss': return <ArrowRightLeft size={16} className="text-red-400" />;
          case 'fold': return <Ban size={16} className="text-red-500" />;
          case 'pass': return <Send size={16} className="text-indigo-400" />;
          case 'show': return <Trophy size={16} className="text-purple-400" />;
          default: return <Coins size={16} className="text-gray-400" />;
      }
  }

  const getColor = (type) => {
      switch(type) {
          case 'entry': return 'text-gray-300';
          case 'bet': return 'text-amber-400 font-semibold';
          case 'win': return 'text-emerald-400 font-bold';
          case 'fold': return 'text-red-500 line-through';
          case 'pass': return 'text-indigo-300';
          default: return 'text-white';
      }
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-900 border-l border-gray-800">
        <div className="p-4 border-b border-gray-800 bg-gray-900/80 sticky top-0 backdrop-blur z-10">
            <h2 className="text-sm uppercase tracking-widest font-semibold text-gray-400">Live Ledger</h2>
        </div>
        <div className="flex-1 p-4 overflow-auto scroll-smooth flex flex-col-reverse">
            {transactions.map((tx) => (
                <div key={tx.id} className="flex items-start mb-4 bg-gray-800/30 p-3 rounded-lg border border-gray-800 animate-fade-in">
                    <div className="mt-1 mr-3 p-1.5 bg-gray-900 rounded-full">
                        {getIcon(tx.type)}
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                            <span className="font-medium text-sm text-white">
                                {tx.User ? tx.User.username : (tx.guest_name || 'System')}
                            </span>
                            <span className="text-xs text-gray-500">
                                {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                        </div>
                        <div className={`text-sm ${getColor(tx.type)} uppercase tracking-wide`}>
                            {tx.type} {tx.amount > 0 && `(₹${tx.amount.toLocaleString('en-IN')})`}
                        </div>
                    </div>
                </div>
            ))}
            {transactions.length === 0 && (
                <div className="text-center text-gray-500 text-sm mt-10">
                    No transactions yet.
                </div>
            )}
        </div>
    </div>
  );
}
