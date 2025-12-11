import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { BankAccount } from '../types';
import { StorageService } from '../services/storage';
import { Plus, Trash2, Edit2, CreditCard } from 'lucide-react';

const Accounts: React.FC = () => {
  const { accounts, addAccount, removeAccount, updateAccount } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  
  // Form State
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');
  const [color, setColor] = useState('#0ea5e9');

  const openModal = (acc?: BankAccount) => {
    if (acc) {
      setEditingAccount(acc);
      setName(acc.name);
      setBalance(acc.balance.toString());
      setColor(acc.color);
    } else {
      setEditingAccount(null);
      setName('');
      setBalance('0');
      setColor('#0ea5e9');
    }
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const accountData: BankAccount = {
      id: editingAccount ? editingAccount.id : StorageService.generateId(),
      userId: '', // Handled by service/context
      name,
      balance: parseFloat(balance),
      currency: 'TWD',
      color
    };

    if (editingAccount) {
      updateAccount(accountData);
    } else {
      addAccount(accountData);
    }
    closeModal();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('確定要刪除此帳戶嗎？這將不會刪除歷史交易紀錄，但可能影響統計。')) {
      removeAccount(id);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">帳戶管理</h2>
        <button
          onClick={() => openModal()}
          className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-colors"
        >
          <Plus size={18} /> 新增帳戶
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map(account => (
          <div key={account.id} className="bg-white rounded-xl shadow-sm p-6 border-l-4 relative group" style={{ borderLeftColor: account.color }}>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 text-sm mb-1">總餘額</p>
                <h3 className="text-2xl font-bold text-gray-800">${account.balance.toLocaleString()}</h3>
                <div className="flex items-center gap-2 mt-2">
                   <CreditCard size={16} className="text-gray-400"/>
                   <span className="text-gray-600 font-medium">{account.name}</span>
                </div>
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => openModal(account)}
                  className="p-2 text-gray-400 hover:text-brand-600 hover:bg-gray-100 rounded-full"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={() => handleDelete(account.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
        
        {accounts.length === 0 && (
          <div className="col-span-full text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
            <p className="text-gray-500">尚無帳戶，請新增一個銀行帳戶或錢包。</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-bold">{editingAccount ? '編輯帳戶' : '新增帳戶'}</h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600"><Plus className="rotate-45" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">帳戶名稱</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="例如：薪資轉帳戶、現金錢包"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">當前餘額</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                  value={balance}
                  onChange={e => setBalance(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">代表顏色</label>
                <div className="flex gap-2">
                  {['#0ea5e9', '#22c55e', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899'].map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-8 h-8 rounded-full border-2 ${color === c ? 'border-gray-800' : 'border-transparent'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
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

export default Accounts;
