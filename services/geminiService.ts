import { GoogleGenAI } from "@google/genai";
import { Transaction, Category, BankAccount } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getFinancialAdvice = async (
  transactions: Transaction[],
  categories: Category[],
  accounts: BankAccount[]
): Promise<string> => {
  
  if (transactions.length === 0) {
    return "尚無足夠的交易資料來生成分析報告。請先新增一些收支紀錄。";
  }

  // Prepare data summary for the AI
  const recentTransactions = transactions.slice(0, 50); // Limit context size
  const totalBalance = accounts.reduce((acc, curr) => acc + curr.balance, 0);
  
  const categoryMap = categories.reduce((acc, cat) => {
    acc[cat.id] = cat.name;
    return acc;
  }, {} as Record<string, string>);

  const txSummary = recentTransactions.map(t => 
    `- ${t.date}: ${t.type} $${t.amount} (${categoryMap[t.categoryId] || 'Unknown'}) - ${t.note}`
  ).join('\n');

  const prompt = `
    你是一位專業的個人理財顧問。請根據以下使用者的財務數據提供簡短、有見地的分析與建議 (繁體中文)。
    
    總資產: $${totalBalance}
    
    最近 50 筆交易紀錄:
    ${txSummary}
    
    請包含以下幾點：
    1. 消費習慣分析。
    2. 潛在的省錢機會。
    3. 整體財務健康評分 (1-10分)。
    
    請使用 Markdown 格式輸出，語氣親切專業。
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "無法生成分析報告，請稍後再試。";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "AI 服務暫時無法使用，請檢查 API Key 設定。";
  }
};
