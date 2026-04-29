
import { Type } from './types';

export const CATEGORIES = {
  [Type.EXPENSE]: [
    'Food',
    'Transport',
    'Rent',
    'Utilities',
    'Shopping',
    'Entertainment',
    'Health',
    'Other'
  ],
  [Type.INCOME]: [
    'Salary',
    'Freelance',
    'Investments',
    'Gift',
    'Other'
  ]
};

export const INITIAL_BUDGETS = {
  'Food': 500,
  'Transport': 200,
  'Rent': 1000,
  'Utilities': 150,
  'Shopping': 300,
  'Entertainment': 200,
  'Health': 100,
  'Other': 100
};
