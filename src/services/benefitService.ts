import api from './api';

export interface Benefit {
    _id: string;
    title: string;
    type: string;
    description: string;
    amount: number;
    active: boolean;
    company: string;
    employee?: string | { id: string; name: string };
    createdAt?: string;
}

class BenefitService {
    async getBenefits(companyId: string): Promise<Benefit[]> {
        const response = await api.get('/benefits', { params: { companyId } });
        return response.data;
    }

    async getBenefitById(id: string): Promise<Benefit> {
        const response = await api.get(`/benefits/${id}`);
        return response.data;
    }

    async createBenefit(benefitData: Omit<Benefit, '_id' | 'createdAt'>): Promise<Benefit> {
        const response = await api.post('/benefits', benefitData);
        return response.data;
    }

    async updateBenefit(id: string, benefitData: Partial<Benefit>): Promise<Benefit> {
        const response = await api.put(`/benefits/${id}`, benefitData);
        return response.data;
    }

    async deleteBenefit(id: string): Promise<void> {
        await api.delete(`/benefits/${id}`);
    }
}

export default new BenefitService();
