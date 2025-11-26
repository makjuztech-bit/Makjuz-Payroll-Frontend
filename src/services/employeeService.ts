import axios from 'axios';
import { Employee } from '../context/CompanyContext';

const API_URL = 'https://makjuz-payroll-backend.onrender.com/api/employees';

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

// Add response interceptor to transform snake_case to camelCase
axiosInstance.interceptors.response.use(
  (response) => {
    if (Array.isArray(response.data)) {
      response.data = response.data.map(transformSnakeToCamel);
    } else if (response.data && typeof response.data === 'object') {
      response.data = transformSnakeToCamel(response.data);
    }
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

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
    const response = await axiosInstance.get('', { params });
    return response.data;
  }

  async getEmployeeById(id: number): Promise<Employee> {
    const response = await axiosInstance.get(`/${id}`);
    return response.data;
  }

  async createEmployee(employeeData: Omit<Employee, 'id'>): Promise<Employee> {
    const response = await axiosInstance.post('', employeeData);
    return response.data;
  }

  async updateEmployee(id: number, employeeData: Partial<Employee>): Promise<Employee> {
    const response = await axiosInstance.put(`/${id}`, employeeData);
    return response.data;
  }

  async deleteEmployee(id: number): Promise<void> {
    await axiosInstance.delete(`/${id}`);
  }

  async getEmployeeCount(companyId?: string): Promise<number> {
    try {
      const params = companyId ? { companyId } : {};
      const response = await axiosInstance.get('/count', { params });
      return response.data.count || 0; // Ensure we return 0 if count is undefined
    } catch (error) {
      console.error('Error in getEmployeeCount:', error);
      throw error;
    }
  }

  async getPayrunDetails(id: number, month: string, year: string): Promise<Employee> {
    try {
      console.log(`Fetching payrun details for employee ${id}, month: ${month}, year: ${year}`);
      
      const response = await axiosInstance.get(`/${id}/payrun`, {
        params: { month, year }
      });
      
      if (!response.data) {
        console.error('No payrun data received from server');
        throw new Error('No payrun data received');
      }
      
      console.log('Payrun data received:', JSON.stringify(response.data, null, 2));
      
      return response.data;
    } catch (error: any) {
      console.error('Error fetching payrun details:', error);
      if (error.response?.status === 500) {
        console.error('Server error response:', error.response?.data);
        throw new Error('Server error while fetching payrun details');
      }
      throw error;
    }
  }
}

export default new EmployeeService();