import axios from 'axios';

// A URL da API agora é dinâmica para funcionar em ambos os ambientes
const API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://relatorio-financeiro-eight.vercel.app/api' // Substitua pelo seu domínio de produção
  : 'http://localhost:3001/api';

export const fetchTransactions = async (userId: string) => {
  const response = await axios.get(`${API_URL}/transactions/${userId}`);
  return response.data;
};

// NOVA FUNÇÃO: Para deletar uma transação
export const deleteTransaction = async (userId: string, transactionId: string) => {
  const response = await axios.delete(`${API_URL}/transactions/${userId}/${transactionId}`);
  return response.data;
};