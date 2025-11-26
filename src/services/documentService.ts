import axios from 'axios';

interface DocumentResponse {
  fileName: string;
  uploadedAt: string;
  fileType: string;
  fileContent?: string;
}

const API_URL = 'http://localhost:3000/api/documents';

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

const documentService = {
  uploadDocument: async (employeeId: string, file: File): Promise<DocumentResponse> => {
    try {
      const reader = new FileReader();
      
      const fileContent = await new Promise<string>((resolve) => {
        reader.onload = () => {
          const base64String = reader.result as string;
          resolve(base64String.split(',')[1]); // Remove data URL prefix
        };
        reader.readAsDataURL(file);
      });

      const response = await axiosInstance.post(`/${employeeId}`, {
        fileName: file.name,
        fileContent,
        fileType: file.type
      });

      return response.data;
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  },

  getEmployeeDocument: async (employeeId: string): Promise<DocumentResponse | null> => {
    try {
      const response = await axiosInstance.get(`/${employeeId}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  deleteDocument: async (employeeId: string): Promise<void> => {
    try {
      await axiosInstance.delete(`/${employeeId}`);
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }
};

export default documentService;
