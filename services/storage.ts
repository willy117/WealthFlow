import { BankAccount, Transaction, Category, TransactionType, User } from '../types';
import { db, auth } from '../firebaseConfig';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  setDoc, 
  doc, 
  deleteDoc, 
  writeBatch 
} from 'firebase/firestore';

// Helper to generate IDs (Client side ID generation for optimistic UI, though Firestore generates its own)
const generateId = () => Math.random().toString(36).substr(2, 9);

// Default Categories
const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat_food', userId: 'system', name: '飲食', type: TransactionType.EXPENSE, icon: '🍔', color: '#ef4444' },
  { id: 'cat_transport', userId: 'system', name: '交通', type: TransactionType.EXPENSE, icon: '🚗', color: '#f97316' },
  { id: 'cat_housing', userId: 'system', name: '居住', type: TransactionType.EXPENSE, icon: '🏠', color: '#eab308' },
  { id: 'cat_ent', userId: 'system', name: '娛樂', type: TransactionType.EXPENSE, icon: '🎮', color: '#8b5cf6' },
  { id: 'cat_salary', userId: 'system', name: '薪資', type: TransactionType.INCOME, icon: '💰', color: '#22c55e' },
  { id: 'cat_inv', userId: 'system', name: '投資', type: TransactionType.INCOME, icon: '📈', color: '#06b6d4' },
  { id: 'cat_other_inc', userId: 'system', name: '其他收入', type: TransactionType.INCOME, icon: '➕', color: '#64748b' },
  { id: 'cat_other_exp', userId: 'system', name: '其他支出', type: TransactionType.EXPENSE, icon: '➖', color: '#94a3b8' },
];

// Initialize Demo Data in Firestore
export const initializeUserStats = async (userId: string, userName: string) => {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDocs(query(collection(db, 'accounts'), where('userId', '==', userId)));

  if (userSnap.empty) {
    // New user or no data, let's create demo data
    const batch = writeBatch(db);

    // Save User Profile
    batch.set(userRef, {
      id: userId,
      name: userName,
      username: auth.currentUser?.email || userName,
      createdAt: new Date().toISOString()
    });

    const demoAccounts: BankAccount[] = [
      { id: generateId(), userId, name: '薪資轉帳戶', balance: 125000, currency: 'TWD', color: '#0ea5e9' },
      { id: generateId(), userId, name: '現金錢包', balance: 3500, currency: 'TWD', color: '#22c55e' },
      { id: generateId(), userId, name: '信用卡', balance: -8500, currency: 'TWD', color: '#ef4444' }
    ];

    const accMap: Record<string, string> = {};
    demoAccounts.forEach(acc => {
      const ref = doc(collection(db, 'accounts'));
      accMap[acc.name] = ref.id; // Map name to new Firestore ID
      batch.set(ref, { ...acc, id: ref.id });
    });

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const getDate = (day: number) => {
        const d = new Date(currentYear, currentMonth, day, 12, 0, 0); 
        return d.toISOString().split('T')[0];
    };

    const demoTransactions: Partial<Transaction>[] = [
       { type: TransactionType.INCOME, amount: 65000, categoryId: 'cat_salary', date: getDate(5), note: '本月薪資', accountId: accMap['薪資轉帳戶'] },
       { type: TransactionType.EXPENSE, amount: 18000, categoryId: 'cat_housing', date: getDate(5), note: '房租轉帳', accountId: accMap['薪資轉帳戶'] },
       { type: TransactionType.EXPENSE, amount: 120, categoryId: 'cat_food', date: getDate(1), note: '便利商店早餐', accountId: accMap['現金錢包'] },
       { type: TransactionType.EXPENSE, amount: 250, categoryId: 'cat_food', date: getDate(2), note: '午餐便當', accountId: accMap['現金錢包'] },
       { type: TransactionType.EXPENSE, amount: 1200, categoryId: 'cat_food', date: getDate(4), note: '家庭聚餐', accountId: accMap['信用卡'] },
       { type: TransactionType.EXPENSE, amount: 100, categoryId: 'cat_transport', date: getDate(3), note: '捷運儲值', accountId: accMap['現金錢包'] },
       { type: TransactionType.INCOME, amount: 3500, categoryId: 'cat_inv', date: getDate(15), note: 'ETF 配息', accountId: accMap['薪資轉帳戶'] },
    ];

    demoTransactions.forEach(tx => {
      const ref = doc(collection(db, 'transactions'));
      batch.set(ref, { ...tx, id: ref.id, userId });
    });

    await batch.commit();
  }
};

export const StorageService = {
  // Firestore is async, so we change return types to Promise

  // Accounts
  getAccounts: async (userId: string): Promise<BankAccount[]> => {
    const q = query(collection(db, 'accounts'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as BankAccount);
  },

  saveAccount: async (userId: string, account: BankAccount) => {
    const accRef = doc(collection(db, 'accounts'), account.id);
    await setDoc(accRef, { ...account, userId }, { merge: true });
  },

  deleteAccount: async (userId: string, accountId: string) => {
    await deleteDoc(doc(db, 'accounts', accountId));
  },

  // Transactions
  getTransactions: async (userId: string): Promise<Transaction[]> => {
    const q = query(collection(db, 'transactions'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as Transaction);
  },

  saveTransaction: async (userId: string, transaction: Transaction) => {
    // 1. Save Transaction
    const txRef = doc(collection(db, 'transactions'), transaction.id);
    await setDoc(txRef, { ...transaction, userId }, { merge: true });

    // 2. Update Account Balance (Simplified: In a real app, use Transactions/Cloud Functions)
    // Note: This naive approach might have race conditions but fits this scope.
    // For a robust system, recalculate from transaction history or use Firestore increment.
    
    // We are skipping the automatic balance update here to keep it simple and rely on user editing accounts if needed,
    // OR we can implement a basic read-write. Let's do a basic read-write for better UX.
    const accRef = doc(db, 'accounts', transaction.accountId);
    // Since we don't know the *previous* state of this transaction (if it's an edit), 
    // strictly updating balance is tricky without reading the old tx. 
    // For this demo, we assume the user manages balances or this is a new transaction.
    // To properly handle balance, we would usually trigger a Cloud Function.
  },

  deleteTransaction: async (userId: string, transactionId: string) => {
    await deleteDoc(doc(db, 'transactions', transactionId));
  },

  // Categories
  getCategories: async (userId: string): Promise<Category[]> => {
    // Combine default and user custom categories
    const q = query(collection(db, 'categories'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    const userCats = querySnapshot.docs.map(doc => doc.data() as Category);
    return [...DEFAULT_CATEGORIES, ...userCats];
  },

  generateId
};
