import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export const fetchTransactions = async (userId: string) => {
  const response = await axios.get(`${API_URL}/transactions/${userId}`);
  return response.data;
};

export const deleteTransaction = async (userId: string, transactionId: string) => {
  const response = await axios.delete(`${API_URL}/transactions/${userId}/${transactionId}`);
  return response.data;
};