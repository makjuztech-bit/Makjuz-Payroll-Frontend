import api from './api';
import { Employee } from '../context/CompanyContext';

// Helper function to transform snake_case to camelCase
const transformSnakeToCamel = (data: any): any => {
  if (Array.isArray(data)) {
    return data.map(transformSnakeToCamel);
  }

  if (data === null || typeof data !== 'object') {
    return data;
  }

  const transformed: any = {};
  Object.entries(data).forEach(([key, value]) => {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());

    // Recursively transform nested objects and arrays
    if (value !== null && typeof value === 'object') {
      transformed[camelKey] = transformSnakeToCamel(value);
    } else {
      transformed[camelKey] = value;
    }
  });

  // Special case for MongoDB _id
  if (data._id) {
    transformed.id = data._id;
  }

  return transformed;
};

class EmployeeService {
  async getAllEmployees(companyId?: string): Promise<Employee[]> {
    const params = companyId ? { companyId } : {};
    const response = await api.get('/employees', { params });
    return transformSnakeToCamel(response.data);
  }

  async getEmployeeById(id: string | number): Promise<Employee> {
    const response = await api.get(`/employees/${id}`);
    return transformSnakeToCamel(response.data);
  }

  async createEmployee(employeeData: Omit<Employee, 'id'>): Promise<Employee> {
    const response = await api.post('/employees', employeeData);
    return transformSnakeToCamel(response.data);
  }

  async updateEmployee(id: string | number, employeeData: Partial<Employee>): Promise<Employee> {
    const response = await api.put(`/employees/${id}`, employeeData);
    return transformSnakeToCamel(response.data);
  }

  async deleteEmployee(id: string | number): Promise<void> {
    await api.delete(`/employees/${id}`);
  }

  async getEmployeeCount(companyId?: string): Promise<number> {
    const params = companyId ? { companyId } : {};
    const response = await api.get('/employees/count', { params });
    return response.data.count || 0;
  }

  async getPayrunDetails(id: string | number, month: string, year: string): Promise<Employee> {
    const response = await api.get(`/employees/${id}/payrun`, {
      params: { month, year }
    });
    return transformSnakeToCamel(response.data);
  }
}

export default new EmployeeService();