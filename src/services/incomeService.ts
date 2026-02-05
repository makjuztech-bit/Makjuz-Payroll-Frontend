import api from './api';

export interface Income {
    _id?: string;
    amount: number;
    date: string;
    source: string;
    referenceParams?: string;
    description?: string;
    company: string;
}

class IncomeService {
    async getIncomes(companyId: string): Promise<Income[]> {
        const response = await api.get('/incomes', { params: { companyId } });
        return response.data;
    }

    async addIncome(incomeData: Income): Promise<Income> {
        const response = await api.post('/incomes', incomeData);
        return response.data;
    }

    async deleteIncome(id: string): Promise<void> {
        await api.delete(`/incomes/${id}`);
    }
}

export default new IncomeService();
