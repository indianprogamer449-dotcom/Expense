/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { Transaction, Budget, Type } from './types';
import { INITIAL_BUDGETS } from './constants';
import Transactions from './components/Transactions';
import Budgets from './components/Budgets';
import Visuals from './components/Visuals';
import Insights from './components/Insights';
import { LayoutDashboard, Receipt, Target, Sparkles, Download, FileJson, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import { startOfMonth, addMonths, isBefore, isSameMonth, setDate as setDateInMonth, format } from 'date-fns';

type Tab = 'overview' | 'transactions' | 'budgets' | 'insights';

export default function App() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useLocalStorage<Budget>('budgets', INITIAL_BUDGETS);
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  // Load transactions from server on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetch('/api/transactions');
        const data = await res.json();
        if (Array.isArray(data)) {
          setTransactions(data);
        }
      } catch (err) {
        console.error('Failed to load transactions:', err);
      }
    };
    loadData();
  }, []);

  // Save transactions to server on change
  useEffect(() => {
    const saveData = async () => {
      try {
        await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(transactions)
        });
      } catch (err) {
        console.error('Failed to save transactions:', err);
      }
    };
    
    // Simple debouncing or just skip initial empty save if data hasn't loaded yet
    if (transactions.length > 0) {
      saveData();
    }
  }, [transactions]);

  const addTransaction = (t: Transaction) => setTransactions([...transactions, t]);
  const deleteTransaction = (id: string) => setTransactions(transactions.filter(t => t.id !== id));
  const updateTransaction = (updated: Transaction) => {
    setTransactions(transactions.map(t => t.id === updated.id ? updated : t));
  };
  const updateBudget = (cat: string, amount: number) => setBudgets({ ...budgets, [cat]: amount });

  useEffect(() => {
    const processRecurring = () => {
      const now = new Date();
      const newEntries: Transaction[] = [];
      const seen = new Set<string>();

      // Build a map of existing recurring-like transactions to avoid duplicates
      transactions.forEach(t => {
        const monthKey = `${format(new Date(t.date), 'yyyy-MM')}-${t.type}-${t.category}-${t.amount}-${t.note}`;
        seen.add(monthKey);
      });

      transactions.forEach(t => {
        if (!t.isRecurring) return;

        let checkDate = addMonths(startOfMonth(new Date(t.date)), 1);
        while (isBefore(checkDate, addMonths(startOfMonth(now), 1))) {
          const monthKey = `${format(checkDate, 'yyyy-MM')}-${t.type}-${t.category}-${t.amount}-${t.note}`;
          
          if (!seen.has(monthKey)) {
            // Try to keep the same day of the month
            const originalDay = new Date(t.date).getDate();
            const newDate = setDateInMonth(checkDate, originalDay);
            
            const newT: Transaction = {
              ...t,
              id: crypto.randomUUID(),
              date: newDate.toISOString(),
            };
            newEntries.push(newT);
            seen.add(monthKey);
          }
          checkDate = addMonths(checkDate, 1);
        }
      });

      if (newEntries.length > 0) {
        setTransactions(prev => [...prev, ...newEntries]);
      }
    };

    if (transactions.length > 0) {
      processRecurring();
    }
  }, []); // Only run on mount

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(transactions.map(t => ({
      Date: new Date(t.date).toLocaleDateString(),
      Type: t.type.toUpperCase(),
      Category: t.category,
      Amount: t.amount,
      Note: t.note || '-'
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");
    XLSX.writeFile(workbook, `Smart_Hisaab_Transactions_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportToJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(transactions, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `Smart_Hisaab_Backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const importFromJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (Array.isArray(json)) {
          setTransactions(json);
          alert('Data restored successfully from JSON backup!');
        }
      } catch (error) {
        alert('Invalid JSON file format.');
      }
    };
    reader.readAsText(file);
  };

  const monthlySpending = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return transactions
      .filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear && t.type === Type.EXPENSE;
      })
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as { [key: string]: number });
  }, [transactions]);

  const TABS = [
    { id: 'overview', label: 'Summary', icon: LayoutDashboard },
    { id: 'transactions', label: 'Activity', icon: Receipt },
    { id: 'budgets', label: 'Plan', icon: Target },
    { id: 'insights', label: 'Analysis', icon: Sparkles },
  ] as const;

  return (
    <div className="min-h-screen font-sans text-slate-100 pb-24 md:pb-8 relative">
      {/* Background Meshes */}
      <div className="mesh-gradient">
        <div className="mesh-1"></div>
        <div className="mesh-2"></div>
        <div className="mesh-3"></div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/5 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">Smart Hisaab</h1>
            </div>
            <p className="text-slate-400 text-[10px] italic uppercase tracking-widest opacity-60">Aapka Financial Companion</p>
          </div>
          
          <nav className="hidden md:flex items-center gap-1 bg-white/5 p-1 rounded-2xl border border-white/5">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`px-6 py-2 text-sm font-medium rounded-xl transition-all ${
                  activeTab === tab.id 
                    ? 'bg-white/10 text-white shadow-xl border border-white/10 backdrop-blur-md' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <label className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer" title="Import from JSON">
              <Upload className="w-5 h-5" />
              <input type="file" accept=".json" onChange={importFromJSON} className="hidden" />
            </label>
            <button 
              onClick={exportToJSON}
              disabled={transactions.length === 0}
              className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-30"
              title="Backup as JSON"
            >
              <FileJson className="w-5 h-5" />
            </button>
            <button 
              onClick={exportToExcel}
              disabled={transactions.length === 0}
              className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-30"
              title="Export to Excel"
            >
              <Download className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex flex-col text-right">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Month Balance</p>
              <p className="text-xl font-mono font-bold text-emerald-400">
                ₹{((transactions.filter(t => t.type === Type.INCOME).reduce((s, t) => s + t.amount, 0)) - (transactions.filter(t => t.type === Type.EXPENSE).reduce((s, t) => s + t.amount, 0))).toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'overview' && (
              <Visuals transactions={transactions} budgets={budgets} />
            )}
            {activeTab === 'transactions' && (
              <Transactions 
                transactions={transactions} 
                onAdd={addTransaction} 
                onDelete={deleteTransaction}
                onUpdate={updateTransaction}
              />
            )}
            {activeTab === 'budgets' && (
              <Budgets 
                budgets={budgets} 
                onUpdate={updateBudget} 
                monthlySpending={monthlySpending} 
              />
            )}
            {activeTab === 'insights' && (
              <Insights transactions={transactions} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-6 left-6 right-6 bg-white/5 backdrop-blur-2xl border border-white/10 px-8 py-4 flex justify-between items-center z-50 rounded-3xl shadow-2xl">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`flex flex-col items-center gap-1 transition-all ${
                isActive ? 'text-white scale-110' : 'text-slate-500'
              }`}
            >
              <Icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5px]' : 'stroke-[1.5px]'}`} />
              {isActive && <span className="text-[8px] font-bold uppercase tracking-wider">●</span>}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

