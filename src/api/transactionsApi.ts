import axios from 'axios';

// Usamos process.env para que a variável de ambiente funcione corretamente
// com o Create React App e na Vercel.
const API_URL = process.env.REACT_APP_API_URL;

export const fetchTransactions = async (userId: string) => {
  const response = await axios.get(`${API_URL}/transactions/${userId}`);
  return response.data;
};

export const deleteTransaction = async (userId: string, transactionId: string) => {
  const response = await axios.delete(`${API_URL}/transactions/${userId}/${transactionId}`);
  return response.data;
};