
import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/expenses`;

export interface Expense {
    _id?: string;
    company: string;
    date: string;
    amount: number;
    category: string;
    description?: string;
    merchant?: string;
    paymentMethod?: string;
    status: string;
    receiptUrl?: string;
}

const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        headers: {
            Authorization: `Bearer ${token}`,
        }
    };
};

const getExpenses = async (companyId: string) => {
    const response = await axios.get(`${API_URL}?companyId=${companyId}`, getHeaders());
    return response.data;
};

const addExpense = async (expense: Partial<Expense>) => {
    const response = await axios.post(API_URL, expense, getHeaders());
    return response.data;
};

const deleteExpense = async (id: string) => {
    const response = await axios.delete(`${API_URL}/${id}`, getHeaders());
    return response.data;
};

const expenseService = {
    getExpenses,
    addExpense,
    deleteExpense
};

export default expenseService;
