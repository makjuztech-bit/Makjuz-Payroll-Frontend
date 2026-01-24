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

      // Check if the response is an error message in JSON format
      const contentType = response.headers['content-type'];
      if (contentType && contentType.includes('application/json')) {
        // Convert blob to text to read the error message
        const text = await response.data.text();
        const error = JSON.parse(text);
        throw new Error(error.message || error.details || 'Failed to download paysheet');
      }

      // Validate that we have a proper blob
      if (!(response.data instanceof Blob)) {
        console.error('Response is not a Blob:', response.data);
        throw new Error('Invalid response format from server');
      }

      // Make sure it's an Excel blob
      if (!response.data.type.includes('spreadsheetml.sheet') &&
        !response.data.type.includes('application/octet-stream') &&
        !response.data.type.includes('application/vnd.ms-excel')) {
        console.error('Invalid file type:', response.data.type);
        throw new Error('Invalid file type received from server');
      }

      return response.data;
    } catch (error: any) {
      console.error('Error downloading paysheet:', error);

      // Handle axios errors
      if (error.response) {
        // Server responded with an error status
        if (error.response.data instanceof Blob) {
          // Try to read the error message from the blob
          const text = await error.response.data.text();
          try {
            const errorData = JSON.parse(text);
            throw new Error(errorData.message || errorData.details || `Server error: ${error.response.status}`);
          } catch (e) {
            throw new Error(`Server error: ${error.response.status}`);
          }
        }
        throw new Error(`Server error: ${error.response.status}`);
      } else if (error.request) {
        // Request made but no response received
        throw new Error('No response from server. Please check your connection.');
      }
      // Rethrow the error for the caller to handle
      throw error;
    }
  }
}

export default new PayrunService(); 