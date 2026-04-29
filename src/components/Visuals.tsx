
import { useMemo } from 'react';
import { Transaction, Type, Budget } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';

interface VisualsProps {
  transactions: Transaction[];
  budgets: Budget;
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#8b5cf6', '#f43f5e'];

export default function Visuals({ transactions, budgets }: VisualsProps) {
  const stats = useMemo(() => {
    const expenses = transactions.filter(t => t.type === Type.EXPENSE);
    const income = transactions.filter(t => t.type === Type.INCOME);
    
    const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
    const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
    
    const categoryDataMap = expenses.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

    const categoryData = Object.entries(categoryDataMap).map(([name, value]) => ({
      name,
      value
    })).sort((a, b) => b.value - a.value);

    // Last 7 days trend
    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayTotal = transactions
        .filter(t => t.date.split('T')[0] === dateStr && t.type === Type.EXPENSE)
        .reduce((sum, t) => sum + t.amount, 0);
      return { 
        name: d.toLocaleDateString(undefined, { weekday: 'short' }), 
        amount: dayTotal 
      };
    }).reverse();

    return { totalExpenses, totalIncome, categoryData, last7Days };
  }, [transactions]);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white/5 backdrop-blur-xl p-6 rounded-[32px] border border-white/10 shadow-2xl flex items-center gap-5 hover:bg-white/10 transition-all">
          <div className="w-14 h-14 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center border border-emerald-500/20 shadow-inner">
            <TrendingUp className="w-7 h-7" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Monthly Income</p>
            <p className="text-3xl font-mono font-bold text-white">₹{stats.totalIncome.toLocaleString('en-IN')}</p>
          </div>
        </div>
        
        <div className="bg-white/5 backdrop-blur-xl p-6 rounded-[32px] border border-white/10 shadow-2xl flex items-center gap-5 hover:bg-white/10 transition-all">
          <div className="w-14 h-14 bg-rose-500/10 text-rose-400 rounded-2xl flex items-center justify-center border border-rose-500/20 shadow-inner">
            <TrendingDown className="w-7 h-7" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Total Outflow</p>
            <p className="text-3xl font-mono font-bold text-white">₹{stats.totalExpenses.toLocaleString('en-IN')}</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-600/20 to-purple-600/20 backdrop-blur-2xl p-6 rounded-[32px] border border-indigo-500/30 shadow-2xl flex items-center gap-5 relative overflow-hidden group hover:scale-[1.02] transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-2xl -mr-8 -mt-8 group-hover:bg-white/10 transition-colors"></div>
          <div className="w-14 h-14 bg-indigo-500/20 text-indigo-300 rounded-2xl flex items-center justify-center border border-indigo-500/30 shadow-inner z-10">
            <Wallet className="w-7 h-7" />
          </div>
          <div className="z-10">
            <p className="text-[10px] text-indigo-300/60 font-bold uppercase tracking-widest">Net Wealth</p>
            <p className="text-3xl font-mono font-bold text-white">₹{(stats.totalIncome - stats.totalExpenses).toLocaleString('en-IN')}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[40px] border border-white/10 shadow-2xl">
          <div className="flex justify-between items-center mb-8 px-2">
            <h3 className="text-xl font-bold text-white tracking-tight">Spending Allocation</h3>
            <div className="px-3 py-1 bg-white/5 rounded-full border border-white/5 text-[10px] text-slate-500 font-bold uppercase tracking-widest">Top Segments</div>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.categoryData}
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  {stats.categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} fillOpacity={0.8} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, 'Amount']}
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(12px)', color: '#fff' }}
                  itemStyle={{ color: '#cbd5e1' }}
                />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[40px] border border-white/10 shadow-2xl">
          <div className="flex justify-between items-center mb-8 px-2">
            <h3 className="text-xl font-bold text-white tracking-tight">Weekly Trajectory</h3>
            <div className="px-3 py-1 bg-white/5 rounded-full border border-white/5 text-[10px] text-slate-500 font-bold uppercase tracking-widest">Last 7 Days</div>
          </div>
          <div className="h-[350px]">
            {stats.last7Days.length > 0 && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.last7Days}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={1}/>
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0.3}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 'bold' }} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 'bold' }}
                    tickFormatter={(val) => `₹${val}`}
                  />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.03)' }} 
                    formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, 'Spent']}
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(12px)', color: '#fff' }}
                  />
                  <Bar dataKey="amount" fill="url(#barGradient)" radius={[10, 10, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
