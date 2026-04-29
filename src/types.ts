
export enum Type {
  INCOME = 'income',
  EXPENSE = 'expense'
}

export interface Transaction {
  id: string;
  type: Type;
  amount: number;
  category: string;
  note: string;
  date: string; // ISO string
  isRecurring?: boolean;
}

export interface Budget {
  [category: string]: number;
}

export interface SpendingInsight {
  title: string;
  analysis: string;
  recommendation: string;
}
