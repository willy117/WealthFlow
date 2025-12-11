import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Transaction, TransactionType } from '../types';
import { StorageService } from '../services/storage';
import { Plus, Trash2, Filter } from 'lucide-react';

const Transactions: React.FC = () => {
  const { transactions, accounts, categories, addTransaction, removeTransaction, getAccountName, getCategoryName } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Filter State
  const [filterType, setFilterType] = useState<string>('ALL');
  
  // Form State
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');

  const filteredTransactions = useMemo(() => {
    let res = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (filterType !== 'ALL') {
      res = res.filter(t => t.type === filterType);
    }
    return res;
  }, [transactions, filterType]);

  const openModal = () => {
    // Set defaults
    setType(TransactionType.EXPENSE);
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
    setNote('');
    if (accounts.length > 0) setAccountId(accounts[0].id);
    if (categories.length > 0) setCategoryId(categories[0].id);
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId || !categoryId) {
      alert('請確認已建立帳戶與分類');
      return;
    }

    const tx: Transaction = {
      id: StorageService.generateId(),
      userId: '',
      type,
      amount: parseFloat(amount),
      accountId,
      categoryId,
      date,
      note
    };
    addTransaction(tx);
    closeModal();
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-gray-800">收支紀錄</h2>
        
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="appearance-none w-full bg-white border px-4 py-2 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="ALL">全部類型</option>
              <option value={TransactionType.INCOME}>收入</option>
              <option value={TransactionType.EXPENSE}>支出</option>
            </select>
            <Filter size={16} className="absolute right-3 top-3 text-gray-400 pointer-events-none"/>
          </div>

          <button
            onClick={openModal}
            className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-colors whitespace-nowrap"
          >
            <Plus size={18} /> 新增紀錄
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">日期</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">分類</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">帳戶</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">備註</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase text-right">金額</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTransactions.map(tx => (
                <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">{tx.date}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {getCategoryName(tx.categoryId)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{getAccountName(tx.accountId)}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{tx.note || '-'}</td>
                  <td className={`px-6 py-4 text-sm font-bold text-right whitespace-nowrap ${
                    tx.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    {tx.type === TransactionType.INCOME ? '+' : '-'}${tx.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => {
                          if(window.confirm('確定刪除?')) removeTransaction(tx.id)
                      }}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    尚無交易紀錄
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold">新增交易</h3>
              <button onClick={closeModal}><Plus className="rotate-45 text-gray-500" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              
              {/* Type Switcher */}
              <div className="flex bg-gray-100 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setType(TransactionType.EXPENSE)}
                  className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-all ${
                    type === TransactionType.EXPENSE ? 'bg-white shadow text-red-600' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  支出
                </button>
                <button
                  type="button"
                  onClick={() => setType(TransactionType.INCOME)}
                  className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-all ${
                    type === TransactionType.INCOME ? 'bg-white shadow text-emerald-600' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  收入
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">金額</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-lg font-semibold"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">分類</label>
                  <select
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none bg-white"
                    value={categoryId}
                    onChange={e => setCategoryId(e.target.value)}
                  >
                    <option value="" disabled>選擇分類</option>
                    {categories.filter(c => c.type === type).map(c => (
                      <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">帳戶</label>
                  <select
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none bg-white"
                    value={accountId}
                    onChange={e => setAccountId(e.target.value)}
                  >
                    <option value="" disabled>選擇帳戶</option>
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">日期</label>
                <input
                  type="date"
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">備註 (選填)</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={closeModal} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">取消</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700">儲存</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;
