
import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/incomes`;

export interface Income {
    _id?: string;
    company: string;
    date: string;
    amount: number;
    source: string; // e.g., 'Client Payment', 'Service Revenue', 'Consulting'
    description?: string;
    referenceParams?: string;
}

const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        headers: {
            Authorization: `Bearer ${token}`,
        }
    };
};

const getIncomes = async (companyId: string) => {
    const response = await axios.get(`${API_URL}?companyId=${companyId}`, getHeaders());
    return response.data;
};

const addIncome = async (income: Partial<Income>) => {
    const response = await axios.post(API_URL, income, getHeaders());
    return response.data;
};

const deleteIncome = async (id: string) => {
    const response = await axios.delete(`${API_URL}/${id}`, getHeaders());
    return response.data;
};

const incomeService = {
    getIncomes,
    addIncome,
    deleteIncome
};

export default incomeService;
