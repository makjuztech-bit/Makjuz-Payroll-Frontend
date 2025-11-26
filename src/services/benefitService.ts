import axios from 'axios';

const API_URL = 'https://makjuz-payroll-backend.onrender.com/api/benefits';

const axiosInstance = axios.create({
  baseURL: API_URL
});

// Add token to requests
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export interface Benefit {
  _id: string;
  title: string;
  description: string;
  type: 'WC' | 'Transportation' | 'Housing' | 'Canteen';
  amount: number;
  active: boolean;
  company: string;  // Company ID
  createdAt: string;
}

class BenefitService {
  async getBenefits(companyId: string): Promise<Benefit[]> {
    try {
      const response = await axiosInstance.get(`/company/${companyId}`);
      return response.data;
    } catch (error) {
      console.error('Error in getBenefits:', error);
      throw error;
    }
  }

  async createBenefit(benefitData: Omit<Benefit, '_id' | 'createdAt'>): Promise<Benefit> {
    try {
      const response = await axiosInstance.post('', benefitData);
      return response.data;
    } catch (error) {
      console.error('Error in createBenefit:', error);
      throw error;
    }
  }

  async updateBenefit(id: string, benefitData: Partial<Benefit>): Promise<Benefit> {
    try {
      const response = await axiosInstance.put(`/${id}`, benefitData);
      return response.data;
    } catch (error) {
      console.error('Error in updateBenefit:', error);
      throw error;
    }
  }

  async deleteBenefit(id: string): Promise<void> {
    try {
      await axiosInstance.delete(`/${id}`);
    } catch (error) {
      console.error('Error in deleteBenefit:', error);
      throw error;
    }
  }
}

export default new BenefitService();