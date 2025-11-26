import axios from 'axios';
import { Company } from '../context/CompanyContext';

const API_URL = 'https://makjuz-payroll-backend.onrender.com/api/companies';

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

class CompanyService {
  async getAllCompanies(): Promise<Company[]> {
    const response = await axiosInstance.get('');
    return response.data;
  }

  async getCompanyById(id: string): Promise<Company> {
    const response = await axiosInstance.get(`/${id}`);
    return response.data;
  }

  async createCompany(companyData: Omit<Company, 'id'>): Promise<Company> {
    const response = await axiosInstance.post('', companyData);
    return response.data;
  }

  async updateCompany(id: string, companyData: Partial<Company>): Promise<Company> {
    const response = await axiosInstance.put(`/${id}`, companyData);
    return response.data;
  }

  async deleteCompany(id: string): Promise<void> {
    await axiosInstance.delete(`/${id}`);
  }

  async getEmployeesByCompanyId(companyId: string): Promise<any[]> {
    const response = await axiosInstance.get(`/${companyId}/employees`);
    return response.data;
  }
}

export default new CompanyService();