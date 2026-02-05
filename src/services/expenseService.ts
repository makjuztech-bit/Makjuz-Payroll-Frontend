import api from './api';

export interface Expense {
    _id: string;
    amount: number;
    date: string;
    category: string;
    merchant: string;
    paymentMethod: string;
    description: string;
    status: string;
    company: string;
}

class ExpenseService {
    async getExpenses(companyId: string): Promise<Expense[]> {
        const response = await api.get('/expenses', { params: { companyId } });
        return response.data;
    }

    async addExpense(expenseData: Partial<Expense>): Promise<Expense> {
        const response = await api.post('/expenses', expenseData);
        return response.data;
    }

    async deleteExpense(id: string): Promise<void> {
        await api.delete(`/expenses/${id}`);
    }
}

export default new ExpenseService();
