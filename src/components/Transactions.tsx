
import React, { useState, useMemo } from 'react';
import { Transaction, Type } from '../types';
import { CATEGORIES } from '../constants';
import { Plus, Trash2, IndianRupee, Edit2, Search, X, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  getDay, 
  isSameDay, 
  addMonths, 
  subMonths,
  startOfWeek,
  endOfWeek
} from 'date-fns';

interface TransactionsProps {
  transactions: Transaction[];
  onAdd: (t: Transaction) => void;
  onDelete: (id: string) => void;
  onUpdate: (t: Transaction) => void;
}

export default function Transactions({ transactions, onAdd, onDelete, onUpdate }: TransactionsProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(null);

  // Advanced Filters
  const [filterType, setFilterType] = useState<'all' | Type>('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  const [type, setType] = useState<Type>(Type.EXPENSE);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Other');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isRecurring, setIsRecurring] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rawAmount = Number(amount);
    if (isNaN(rawAmount)) return;

    // Explicitly round to 2 decimal places to avoid floating point issues
    const safeAmount = Math.round(rawAmount * 100) / 100;

    const data = {
      id: editingId || crypto.randomUUID(),
      type,
      amount: safeAmount,
      category,
      note,
      date: new Date(date).toISOString(),
      isRecurring,
    };

    if (editingId) {
      onUpdate(data);
      setEditingId(null);
    } else {
      onAdd(data);
    }

    resetForm();
  };

  const resetForm = () => {
    setAmount('');
    setNote('');
    setCategory('Other');
    setIsRecurring(false);
    setEditingId(null);
  };

  const handleEdit = (t: Transaction) => {
    setEditingId(t.id);
    setType(t.type);
    setAmount(t.amount.toString());
    setCategory(t.category);
    setNote(t.note);
    setDate(new Date(t.date).toISOString().split('T')[0]);
    setIsRecurring(!!t.isRecurring);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(t => {
        const matchesSearch = t.note.toLowerCase().includes(search.toLowerCase()) || 
                             t.category.toLowerCase().includes(search.toLowerCase());
        
        const matchesDate = selectedCalendarDate ? isSameDay(new Date(t.date), selectedCalendarDate) : true;
        
        const matchesType = filterType === 'all' || t.type === filterType;
        const matchesCategory = filterCategory === 'all' || t.category === filterCategory;
        
        const tDate = new Date(t.date);
        const matchesStartDate = filterStartDate ? tDate >= new Date(filterStartDate) : true;
        const matchesEndDate = filterEndDate ? tDate <= new Date(filterEndDate) : true;

        return matchesSearch && matchesDate && matchesType && matchesCategory && matchesStartDate && matchesEndDate;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, search, selectedCalendarDate, filterType, filterCategory, filterStartDate, filterEndDate]);

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const dayTransactions = (date: Date) => {
    return filteredTransactions.filter(t => isSameDay(new Date(t.date), date));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-1">
        <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur-xl p-6 rounded-[32px] shadow-2xl border border-white/10 flex flex-col gap-4 sticky top-24">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold text-white ml-1">{editingId ? 'Edit Entry' : 'New Entry'}</h2>
            {editingId && (
              <button 
                type="button" 
                onClick={resetForm}
                className="text-slate-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          
          <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
            <button
              type="button"
              onClick={() => setType(Type.EXPENSE)}
              className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-widest rounded-xl transition-all ${type === Type.EXPENSE ? 'bg-white/10 text-rose-400 shadow-xl border border-white/10' : 'text-slate-500 hover:text-slate-400'}`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => setType(Type.INCOME)}
              className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-widest rounded-xl transition-all ${type === Type.INCOME ? 'bg-white/10 text-emerald-400 shadow-xl border border-white/10' : 'text-slate-500 hover:text-slate-400'}`}
            >
              Income
            </button>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">Quantity (₹)</label>
            <div className="relative">
              <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-12 pr-6 py-4 bg-white/5 border border-white/5 rounded-2xl focus:ring-2 focus:ring-indigo-500/50 focus:bg-white/10 outline-none text-xl font-mono text-white transition-all placeholder:text-slate-700"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">Timestamp</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-6 py-4 bg-white/5 border border-white/5 rounded-2xl focus:ring-2 focus:ring-indigo-500/50 outline-none text-sm text-slate-300 transition-all font-mono"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">Memo</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Private note..."
              className="w-full px-6 py-4 bg-white/5 border border-white/5 rounded-2xl focus:ring-2 focus:ring-indigo-500/50 outline-none text-sm text-slate-300 transition-all placeholder:text-slate-700"
            />
          </div>

          <div className="flex items-center gap-3 px-1 py-1">
            <button
              type="button"
              onClick={() => setIsRecurring(!isRecurring)}
              className={`w-10 h-6 rounded-full transition-all relative ${isRecurring ? 'bg-indigo-600' : 'bg-white/10'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full transition-all bg-white ${isRecurring ? 'left-5' : 'left-1'}`} />
            </button>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Recurring Monthly</span>
          </div>

          <button
            type="submit"
            className="mt-4 w-full py-4 bg-gradient-to-br from-indigo-600 to-indigo-800 text-white rounded-2xl font-bold uppercase tracking-widest text-xs hover:from-indigo-500 hover:to-indigo-700 transition-all shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-3"
          >
            {editingId ? <Edit2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            {editingId ? 'Update Ledger' : `Post ${type}`}
          </button>
        </form>
      </div>

      <div className="md:col-span-2 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-white tracking-tight shrink-0">Ledger</h2>
            <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
              <button 
                onClick={() => { setViewMode('list'); setSelectedCalendarDate(null); }}
                className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}
              >
                List
              </button>
              <button 
                onClick={() => { setViewMode('calendar'); setSelectedCalendarDate(null); }}
                className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${viewMode === 'calendar' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Calendar
              </button>
            </div>
            {selectedCalendarDate && (
              <button 
                onClick={() => setSelectedCalendarDate(null)}
                className="flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-[10px] font-bold text-indigo-400 uppercase tracking-widest hover:bg-indigo-500/20 transition-all"
              >
                {format(selectedCalendarDate, 'MMM d')}
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 w-full sm:max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search ledger..."
                className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-white/10 outline-none text-sm text-slate-300 transition-all placeholder:text-slate-600 shadow-xl"
              />
              {search && (
                <button 
                  onClick={() => setSearch('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-0.5 text-slate-600 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`p-3 rounded-2xl border transition-all ${showFilters ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400' : 'bg-white/5 border-white/10 text-slate-500 hover:text-white'}`}
            >
              <Filter className="w-5 h-5" />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-white/5 backdrop-blur-xl p-6 rounded-[32px] border border-white/10 shadow-2xl space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Type</label>
                    <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
                      {['all', Type.EXPENSE, Type.INCOME].map(t => (
                        <button
                          key={t}
                          onClick={() => setFilterType(t as any)}
                          className={`flex-1 py-1.5 text-[9px] font-bold uppercase tracking-widest rounded-lg transition-all ${filterType === t ? 'bg-white/10 text-white' : 'text-slate-500'}`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Category</label>
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="w-full px-4 py-2 bg-white/5 border border-white/5 rounded-xl outline-none text-xs text-slate-300 transition-all appearance-none"
                    >
                      <option value="all" className="bg-slate-900">All Categories</option>
                      {Object.values(CATEGORIES).flat().map(cat => (
                        <option key={cat} value={cat} className="bg-slate-900">{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">From</label>
                    <input 
                      type="date"
                      value={filterStartDate}
                      onChange={(e) => setFilterStartDate(e.target.value)}
                      className="w-full px-4 py-2 bg-white/5 border border-white/5 rounded-xl outline-none text-xs text-slate-300 transition-all font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">To</label>
                    <input 
                      type="date"
                      value={filterEndDate}
                      onChange={(e) => setFilterEndDate(e.target.value)}
                      className="w-full px-4 py-2 bg-white/5 border border-white/5 rounded-xl outline-none text-xs text-slate-300 transition-all font-mono"
                    />
                  </div>
                </div>

                <div className="flex justify-end border-t border-white/5 pt-4">
                  <button 
                    onClick={() => {
                      setFilterType('all');
                      setFilterCategory('all');
                      setFilterStartDate('');
                      setFilterEndDate('');
                      setSearch('');
                    }}
                    className="text-[10px] font-bold text-slate-500 uppercase tracking-widest hover:text-white transition-colors"
                  >
                    Reset All Filters
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {viewMode === 'calendar' ? (
          <div className="bg-white/5 backdrop-blur-xl p-6 rounded-[32px] border border-white/10 shadow-2xl space-y-6">
            <div className="flex items-center justify-between px-2">
              <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5 rotate-90" /> {/* Using X as simple arrow for now or lucide Chevron */}
              </button>
              <h3 className="text-lg font-bold text-white capitalize">{format(currentMonth, 'MMMM yyyy')}</h3>
              <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5 -rotate-90" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest py-2">
                  {day}
                </div>
              ))}
              {calendarDays.map((date, i) => {
                const dayTx = dayTransactions(date);
                const isCurrentMonth = format(date, 'MMM') === format(currentMonth, 'MMM');
                const isToday = isSameDay(date, new Date());
                
                return (
                  <div 
                    key={i} 
                    onClick={() => {
                      if (selectedCalendarDate && isSameDay(selectedCalendarDate, date)) {
                        setSelectedCalendarDate(null);
                      } else {
                        setSelectedCalendarDate(date);
                        setDate(format(date, 'yyyy-MM-dd'));
                      }
                    }}
                    className={`min-h-[80px] p-2 rounded-2xl border transition-all cursor-pointer ${
                      isCurrentMonth ? 'bg-white/5 border-white/5' : 'bg-transparent border-transparent opacity-20'
                    } ${selectedCalendarDate && isSameDay(selectedCalendarDate, date) ? 'ring-2 ring-indigo-500 bg-indigo-500/10' : isToday ? 'ring-2 ring-indigo-500/50' : 'border-transparent'} hover:bg-white/10`}
                  >
                    <span className={`text-[10px] font-bold ${isToday || (selectedCalendarDate && isSameDay(selectedCalendarDate, date)) ? 'text-indigo-400' : 'text-slate-500'}`}>
                      {format(date, 'd')}
                    </span>
                    <div className="mt-1 space-y-1">
                      {dayTx.map(t => (
                        <div 
                          key={t.id} 
                          title={`${t.category}: ₹${t.amount}`}
                          className={`h-1.5 rounded-full ${t.type === Type.EXPENSE ? 'bg-rose-500/40' : 'bg-emerald-500/40'}`}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        <div className="space-y-4">
          <AnimatePresence initial={false}>
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-20 bg-white/5 rounded-[32px] border border-dashed border-white/10 backdrop-blur-sm">
                <p className="text-slate-500 text-sm italic">
                  {search ? 'No matches found in records...' : 'The ledger is currently empty...'}
                </p>
              </div>
            ) : (
              filteredTransactions.map((t) => (
                <motion.div
                  key={t.id}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`bg-white/5 backdrop-blur-md p-5 rounded-[24px] border border-white/10 flex items-center justify-between group hover:bg-white/10 transition-all shadow-lg ${editingId === t.id ? 'ring-2 ring-indigo-500/50 bg-white/10' : ''}`}
                >
                  <div className="flex items-center gap-5">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-inner ${t.type === Type.EXPENSE ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                      {t.category.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-100">{t.note || t.category}</h3>
                        {t.isRecurring && (
                          <span className="text-[8px] bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded-md font-bold border border-indigo-500/30 uppercase tracking-widest">Auto</span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.15em] mt-0.5">{t.category} • {new Date(t.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 sm:gap-6">
                    <span className={`font-mono font-bold text-lg ${t.type === Type.EXPENSE ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {t.type === Type.EXPENSE ? '-' : '+'}₹{t.amount.toLocaleString('en-IN')}
                    </span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                      <button
                        onClick={() => handleEdit(t)}
                        className="p-2 text-slate-600 hover:text-indigo-400 transition-colors"
                        title="Edit Entry"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => onDelete(t.id)}
                        className="p-2 text-slate-600 hover:text-rose-400 transition-colors"
                        title="Delete Entry"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
