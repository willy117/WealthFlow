import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { TransactionType } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { getFinancialAdvice } from '../services/geminiService';
import { Sparkles, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const Dashboard: React.FC = () => {
  const { transactions, accounts, categories } = useData();
  const [aiAdvice, setAiAdvice] = useState<string>('');
  const [loadingAi, setLoadingAi] = useState(false);

  // Calculate Totals
  const totalBalance = useMemo(() => accounts.reduce((acc, curr) => acc + curr.balance, 0), [accounts]);
  
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthlyTransactions = useMemo(() => transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }), [transactions, currentMonth, currentYear]);

  const income = useMemo(() => monthlyTransactions
    .filter(t => t.type === TransactionType.INCOME)
    .reduce((acc, t) => acc + t.amount, 0), [monthlyTransactions]);

  const expense = useMemo(() => monthlyTransactions
    .filter(t => t.type === TransactionType.EXPENSE)
    .reduce((acc, t) => acc + t.amount, 0), [monthlyTransactions]);

  // Chart Data Preparation
  const expenseByCategory = useMemo(() => {
    const data: Record<string, number> = {};
    monthlyTransactions.filter(t => t.type === TransactionType.EXPENSE).forEach(t => {
      const catName = categories.find(c => c.id === t.categoryId)?.name || '未分類';
      data[catName] = (data[catName] || 0) + t.amount;
    });
    return Object.entries(data).map(([name, value]) => ({ name, value }));
  }, [monthlyTransactions, categories]);

  const handleGetAiAdvice = async () => {
    setLoadingAi(true);
    const advice = await getFinancialAdvice(transactions, categories, accounts);
    setAiAdvice(advice);
    setLoadingAi(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">財務總覽</h2>
          <p className="text-gray-500">本月收支狀況 ({currentYear}年{currentMonth + 1}月)</p>
        </div>
        <button 
          onClick={handleGetAiAdvice}
          disabled={loadingAi}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow transition-all ${
            loadingAi ? 'bg-gray-300 cursor-not-allowed' : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:opacity-90'
          }`}
        >
          <Sparkles size={18} />
          {loadingAi ? 'AI 分析中...' : 'AI 智能分析'}
        </button>
      </div>

      {/* AI Advice Section */}
      {aiAdvice && (
        <div className="bg-white border border-indigo-100 rounded-xl p-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Sparkles size={100} className="text-indigo-500" />
          </div>
          <h3 className="text-lg font-bold text-indigo-700 mb-4 flex items-center gap-2">
            <Sparkles size={20} />
            Gemini 財務建議
          </h3>
          <div className="prose prose-indigo max-w-none text-gray-700 text-sm">
            <ReactMarkdown>{aiAdvice}</ReactMarkdown>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-brand-500">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-brand-50 rounded-full text-brand-600">
              <Wallet size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">總資產</p>
              <p className="text-2xl font-bold text-gray-800">${totalBalance.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-emerald-500">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-50 rounded-full text-emerald-600">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">本月收入</p>
              <p className="text-2xl font-bold text-gray-800">+${income.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-red-500">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-50 rounded-full text-red-600">
              <TrendingDown size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">本月支出</p>
              <p className="text-2xl font-bold text-gray-800">-${expense.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expense Breakdown */}
        <div className="bg-white p-6 rounded-xl shadow-sm h-80 flex flex-col">
          <h3 className="text-lg font-bold text-gray-800 mb-4">本月支出類別</h3>
          {expenseByCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseByCategory}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {expenseByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `$${value}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              尚無支出資料
            </div>
          )}
        </div>

        {/* Monthly Trend (Mockup for visual completeness) */}
        <div className="bg-white p-6 rounded-xl shadow-sm h-80 flex flex-col">
          <h3 className="text-lg font-bold text-gray-800 mb-4">近期收支趨勢</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={[
                { name: '本月', income: income, expense: expense },
                // Ideally this would come from historical aggregation
              ]}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="income" name="收入" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" name="支出" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
