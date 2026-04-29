
import { Budget } from '../types';
import { CATEGORIES } from '../constants';
import { Target, AlertCircle } from 'lucide-react';

interface BudgetProps {
  budgets: Budget;
  onUpdate: (category: string, amount: number) => void;
  monthlySpending: { [category: string]: number };
}

export default function Budgets({ budgets, onUpdate, monthlySpending }: BudgetProps) {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col gap-1 mb-2 px-2">
        <div className="flex items-center gap-3">
          <Target className="w-8 h-8 text-indigo-400" />
          <h2 className="text-3xl font-bold text-white tracking-tight">Active Budgets</h2>
        </div>
        <p className="text-slate-500 text-sm italic ml-11">Manage your spending limits for each category.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {CATEGORIES.expense.map((cat) => {
          const budget = budgets[cat] || 0;
          const spent = monthlySpending[cat] || 0;
          const percent = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
          const isOver = spent > budget && budget > 0;

          return (
            <div key={cat} className="bg-white/5 backdrop-blur-xl p-6 rounded-[32px] shadow-2xl border border-white/10 space-y-5 group hover:bg-white/10 transition-all">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-white">{cat}</h3>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Allocation</p>
                </div>
                <div className="relative group">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-xs">₹</span>
                  <input
                    type="number"
                    value={budget}
                    onChange={(e) => onUpdate(cat, Number(e.target.value))}
                    className="w-28 text-right bg-white/5 border border-white/5 rounded-xl pl-5 pr-3 py-2 font-mono font-bold text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-end text-xs">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-slate-500 font-bold uppercase tracking-tighter text-[9px]">Burned</span>
                    <span className="text-white font-mono font-bold">₹{spent.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="text-slate-500 font-bold uppercase tracking-tighter text-[9px]">Status</span>
                    <span className={`font-mono font-bold ${isOver ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`}>
                      {percent.toFixed(0)}%
                    </span>
                  </div>
                </div>
                
                <div className="h-3 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ease-out shadow-lg ${isOver ? 'bg-rose-500' : 'bg-gradient-to-r from-indigo-500 to-emerald-500'}`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
                
                {isOver && (
                  <div className="flex items-center gap-2 text-rose-400 text-[10px] font-bold uppercase tracking-[0.2em] justify-center pt-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Limit Breached
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
