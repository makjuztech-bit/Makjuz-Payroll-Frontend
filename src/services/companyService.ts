import api from './api';
import { Company } from '../context/CompanyContext';

class CompanyService {
  async getAllCompanies(): Promise<Company[]> {
    const response = await api.get('/companies');
    return response.data;
  }

  async getCompanyById(id: string): Promise<Company> {
    const response = await api.get(`/companies/${id}`);
    return response.data;
  }

  async createCompany(companyData: any): Promise<Company> {
    const response = await api.post('/companies', companyData);
    return response.data;
  }

  async updateCompany(id: string, companyData: Partial<Company>): Promise<Company> {
    const response = await api.put(`/companies/${id}`, companyData);
    return response.data;
  }

  async deleteCompany(id: string): Promise<void> {
    await api.delete(`/companies/${id}`);
  }

  async getEmployeesByCompanyId(companyId: string): Promise<any[]> {
    const response = await api.get(`/companies/${companyId}/employees`);
    return response.data;
  }
}

export default new CompanyService();