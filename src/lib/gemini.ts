
import { GoogleGenAI } from "@google/genai";
import { Transaction, SpendingInsight } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function getSpendingInsights(transactions: Transaction[]): Promise<SpendingInsight> {
  const recentTransactions = transactions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 30);

  const summary = recentTransactions.map(t => `${t.date}: ${t.type} - ${t.category} - ${t.amount}`).join('\n');

  const prompt = `Analyze the following transaction history and provide financial insights. 
  Recent Transactions:
  ${summary}

  Provide a JSON object with:
  - title (a catchy title)
  - analysis (detailed analysis of spending habits)
  - recommendation (specific actionable advice to save more or spend better)

  Do not use any markdown formatting or code blocks in the response, just the JSON string.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    const text = response.text || '';
    // Basic cleaning in case the model ignored instructions
    const jsonStr = text.replace(/```json|```/g, '').trim();
    return JSON.parse(jsonStr) as SpendingInsight;
  } catch (error) {
    console.error("Gemini Insight Error:", error);
    return {
      title: "Keep Tracking!",
      analysis: "We need more data or a stable connection to analyze your habits deeply.",
      recommendation: "Review your recent high-expense categories like Food or Shopping."
    };
  }
}
