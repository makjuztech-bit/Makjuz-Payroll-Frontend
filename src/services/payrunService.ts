import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL}/api/payruns`;

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

// Add response interceptor to transform snake_case to camelCase (just like in employeeService.ts)
axiosInstance.interceptors.response.use(
  (response) => {
    // Skip transformation for binary data like blobs
    const contentType = response.headers['content-type'];
    if (contentType && (
      contentType.includes('application/octet-stream') ||
      contentType.includes('application/vnd.openxmlformats') ||
      contentType.includes('application/vnd.ms-excel') ||
      contentType.includes('blob') ||
      response.config.responseType === 'blob'
    )) {
      return response;
    }

    if (Array.isArray(response.data)) {
      response.data = response.data.map(transformSnakeToCamel);
    } else if (response.data && typeof response.data === 'object') {
      response.data = transformSnakeToCamel(response.data);
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('isLoggedIn');
      window.location.href = '/';
    }
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
    transformed[camelKey] = value;
  });

  // Special case for MongoDB _id
  if (data._id) {
    transformed.id = data._id;
  }

  return transformed;
};

interface PayrunUploadResponse {
  success: any[];
  errors: any[];
  totalProcessed: number;
}

interface PayrunSummary {
  month: string;
  year: string;
  totalEmployees: number;
  totalSalary: number;
  totalBillable: number;
  totalGST: number;
  totalGrandTotal: number;
}

class PayrunService {
  // Upload payrun Excel file
  async uploadPayrunExcel(file: File, month: string, year: string, companyId: string, columnMapping?: Record<string, string>): Promise<PayrunUploadResponse> {
    const formData = new FormData();
    formData.append('payrunFile', file);
    formData.append('month', month);
    formData.append('year', year);
    formData.append('companyId', companyId);

    if (columnMapping) {
      formData.append('columnMapping', JSON.stringify(columnMapping));
    }

    const response = await axiosInstance.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    return response.data;
  }

  // Get payrun summary
  async getPayrunSummary(companyId: string, month: string, year: string): Promise<PayrunSummary> {
    const response = await axiosInstance.get('/summary', {
      params: { companyId, month, year }
    });

    return response.data;
  }

  // Get payrun template
  async getPayrunTemplate(): Promise<Blob> {
    const response = await axiosInstance.get('/template', {
      responseType: 'blob'
    });

    return response.data;
  }

  // Download paysheet
  async downloadPaysheet(companyId: string, month: string, year: string): Promise<Blob> {
    try {
      const response = await axiosInstance.get('/paysheet', {
        params: { companyId, month, year },
        responseType: 'blob'
      });

      // ... existing validation code ...

      return response.data;
    } catch (error: any) {
      console.error('Error downloading paysheet:', error);
      throw error;
    }
  }

  // Download PF Report
  async downloadPFReport(companyId: string, month: string, year: string, format: 'xlsx' | 'txt' = 'xlsx'): Promise<Blob> {
    const response = await axiosInstance.get('/pf-report', {
      params: { companyId, month, year, format },
      responseType: 'blob'
    });
    return response.data;
  }

  // Download ESI Report
  async downloadESIReport(companyId: string, month: string, year: string, format: 'xlsx' | 'txt' = 'xlsx'): Promise<Blob> {
    const response = await axiosInstance.get('/esi-report', {
      params: { companyId, month, year, format },
      responseType: 'blob'
    });
    return response.data;
  }
  // Download Word Payslip
  async downloadWordPayslip(companyId: string, employeeId: string, month: string, year: string): Promise<Blob> {
    const response = await axiosInstance.get('/payslip/word', {
      params: { companyId, employeeId, month, year },
      responseType: 'blob'
    });
    return response.data;
  }

  async downloadInvoice(companyId: string, month: string, year: string): Promise<Blob> {
    const response = await axiosInstance.get('/invoice', {
      params: { companyId, month, year },
      responseType: 'blob'
    });
    return response.data;
  }

  // Download Bank Report (IOB or Non-IOB, Excel or TXT)
  async downloadBankReport(companyId: string, month: string, year: string, type: 'iob' | 'non-iob', format: 'xlsx' | 'txt'): Promise<Blob> {
    const response = await axiosInstance.get('/bank-report', {
      params: { companyId, month, year, type, format },
      responseType: 'blob'
    });
    return response.data;
  }
}

export default new PayrunService(); 