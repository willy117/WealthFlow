export interface User {
  id: string;
  username: string;
  passwordHash: string; // Simple simulation
  name: string;
}

export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
  TRANSFER = 'TRANSFER'
}

export interface BankAccount {
  id: string;
  userId: string;
  name: string;
  balance: number;
  currency: string;
  color: string;
}

export interface Category {
  id: string;
  userId: string; // 'system' for default ones
  name: string;
  type: TransactionType;
  icon: string;
  color: string;
}

export interface Transaction {
  id: string;
  userId: string;
  accountId: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  date: string; // ISO Date string
  note: string;
}

export interface FinancialReport {
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  categoryBreakdown: { name: string; amount: number; color: string }[];
  monthlyTrend: { month: string; income: number; expense: number }[];
}
