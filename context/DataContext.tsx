import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { BankAccount, Transaction, Category } from '../types';
import { StorageService } from '../services/storage';

interface DataContextType {
  accounts: BankAccount[];
  transactions: Transaction[];
  categories: Category[];
  loading: boolean;
  refreshData: () => Promise<void>;
  addAccount: (acc: BankAccount) => Promise<void>;
  updateAccount: (acc: BankAccount) => Promise<void>;
  removeAccount: (id: string) => Promise<void>;
  addTransaction: (tx: Transaction) => Promise<void>;
  removeTransaction: (id: string) => Promise<void>;
  getAccountName: (id: string) => string;
  getCategoryName: (id: string) => string;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode; userId: string | null }> = ({ children, userId }) => {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshData = useCallback(async () => {
    if (!userId) {
      setAccounts([]);
      setTransactions([]);
      setCategories([]);
      return;
    }
    setLoading(true);
    try {
      const [accs, txs, cats] = await Promise.all([
        StorageService.getAccounts(userId),
        StorageService.getTransactions(userId),
        StorageService.getCategories(userId)
      ]);
      setAccounts(accs);
      setTransactions(txs);
      setCategories(cats);
    } catch (e) {
      console.error("Failed to load data", e);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const addAccount = async (acc: BankAccount) => {
    if (!userId) return;
    await StorageService.saveAccount(userId, acc);
    await refreshData();
  };

  const updateAccount = async (acc: BankAccount) => {
     if (!userId) return;
     await StorageService.saveAccount(userId, acc);
     await refreshData();
  }

  const removeAccount = async (id: string) => {
    if (!userId) return;
    await StorageService.deleteAccount(userId, id);
    await refreshData();
  };

  const addTransaction = async (tx: Transaction) => {
    if (!userId) return;
    await StorageService.saveTransaction(userId, tx);
    
    // Naive balance update on UI side for immediate feedback
    // The robust way is described in StorageService comments
    const acc = accounts.find(a => a.id === tx.accountId);
    if (acc) {
        let newBalance = acc.balance;
        if (tx.type === 'INCOME') newBalance += tx.amount;
        if (tx.type === 'EXPENSE') newBalance -= tx.amount;
        await StorageService.saveAccount(userId, { ...acc, balance: newBalance });
    }

    await refreshData();
  };

  const removeTransaction = async (id: string) => {
    if (!userId) return;
    await StorageService.deleteTransaction(userId, id);
    await refreshData();
  };

  const getAccountName = (id: string) => accounts.find(a => a.id === id)?.name || 'Unknown Account';
  const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name || 'Unknown Category';

  return (
    <DataContext.Provider value={{ 
      accounts, 
      transactions, 
      categories, 
      loading,
      refreshData,
      addAccount, 
      updateAccount,
      removeAccount, 
      addTransaction, 
      removeTransaction,
      getAccountName,
      getCategoryName
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
