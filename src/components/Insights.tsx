
import { useState } from 'react';
import { Transaction, SpendingInsight } from '../types';
import { getSpendingInsights } from '../lib/gemini';
import { Sparkles, Loader2, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

interface InsightsProps {
  transactions: Transaction[];
}

export default function Insights({ transactions }: InsightsProps) {
  const [insight, setInsight] = useState<SpendingInsight | null>(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (transactions.length === 0) return;
    setLoading(true);
    const res = await getSpendingInsights(transactions);
    setInsight(res);
    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="bg-white/5 backdrop-blur-3xl rounded-[48px] p-10 border border-white/10 shadow-2xl relative overflow-hidden group">
        {/* Animated Background Element */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-600/20 rounded-full blur-[80px] group-hover:bg-indigo-600/30 transition-all duration-700"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-600/10 rounded-full blur-[80px] group-hover:bg-purple-600/20 transition-all duration-700"></div>
        
        <div className="relative z-10 space-y-8">
          <div className="flex flex-col gap-3">
             <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10 shadow-xl mb-2">
                <Sparkles className="w-6 h-6 text-indigo-400 animate-pulse" />
             </div>
            <h2 className="text-4xl font-bold tracking-tight text-white">AI Financial Coach</h2>
            <p className="text-slate-400 text-sm max-w-sm leading-relaxed opacity-80">
              Harness the power of Gemini AI to decode your spending behavior and optimize your financial future.
            </p>
          </div>

          {!insight && !loading && (
            <button
              onClick={generate}
              disabled={transactions.length < 5}
              className="bg-white text-slate-950 px-8 py-4 rounded-3xl font-bold uppercase tracking-widest text-xs hover:bg-indigo-50 transition-all flex items-center gap-3 group disabled:opacity-30 self-start shadow-xl shadow-white/5"
            >
              Analyze Spending Patterns
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          )}

          {loading && (
            <div className="flex items-center gap-4 text-indigo-300 font-bold uppercase tracking-widest text-xs">
              <Loader2 className="w-5 h-5 animate-spin" />
              Ingesting Transaction Data...
            </div>
          )}

          {insight && (
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="p-[1px] bg-gradient-to-br from-white/20 to-transparent rounded-[32px] shadow-inner">
                <div className="bg-slate-950/40 p-8 rounded-[32px] backdrop-blur-md border border-white/5">
                  <h3 className="text-2xl font-bold text-white mb-4 tracking-tight">{insight.title}</h3>
                  <p className="text-slate-300 leading-relaxed text-base italic">
                    "{insight.analysis}"
                  </p>
                </div>
              </div>

              <div className="bg-emerald-500/5 border border-emerald-500/20 p-8 rounded-[32px] backdrop-blur-sm relative overflow-hidden group/reco">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover/reco:bg-emerald-500/20 transition-all"></div>
                <h4 className="text-emerald-400 text-[10px] font-bold uppercase tracking-[0.3em] mb-4">Strategic Initiative</h4>
                <p className="text-emerald-50/90 leading-relaxed text-sm font-medium relative z-10">
                  {insight.recommendation}
                </p>
              </div>

              <button
                onClick={generate}
                className="text-slate-500 text-[10px] font-bold uppercase tracking-widest hover:text-white transition-all underline underline-offset-4 decoration-slate-800 hover:decoration-white"
              >
                Request Fresh Perspective
              </button>
            </motion.div>
          )}
        </div>
      </div>

      {transactions.length < 5 && (
        <div className="flex items-center justify-center gap-2 text-slate-500">
           <div className="h-[1px] w-8 bg-slate-800"></div>
           <p className="text-[10px] font-bold uppercase tracking-widest">
             Need {5 - transactions.length} more entries for calibration
           </p>
           <div className="h-[1px] w-8 bg-slate-800"></div>
        </div>
      )}
    </div>
  );
}
