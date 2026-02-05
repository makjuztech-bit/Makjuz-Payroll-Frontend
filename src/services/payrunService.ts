import api from './api';

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
  async uploadPayrunExcel(file: File, month: string, year: string, companyId: string, columnMapping?: Record<string, string>): Promise<PayrunUploadResponse> {
    const formData = new FormData();
    formData.append('payrunFile', file);
    formData.append('month', month);
    formData.append('year', year);
    formData.append('companyId', companyId);

    if (columnMapping) {
      formData.append('columnMapping', JSON.stringify(columnMapping));
    }

    const response = await api.post('/payruns/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    return transformSnakeToCamel(response.data);
  }

  async getPayrunSummary(companyId: string, month: string, year: string): Promise<PayrunSummary> {
    const response = await api.get('/payruns/summary', {
      params: { companyId, month, year }
    });

    return transformSnakeToCamel(response.data);
  }

  async getPayrunTemplate(): Promise<Blob> {
    const response = await api.get('/payruns/template', {
      responseType: 'blob'
    });

    return response.data;
  }

  async downloadPaysheet(companyId: string, month: string, year: string): Promise<Blob> {
    const response = await api.get('/payruns/paysheet', {
      params: { companyId, month, year },
      responseType: 'blob'
    });
    return response.data;
  }

  async downloadPFReport(companyId: string, month: string, year: string, format: 'xlsx' | 'txt' = 'xlsx'): Promise<Blob> {
    const response = await api.get('/payruns/pf-report', {
      params: { companyId, month, year, format },
      responseType: 'blob'
    });
    return response.data;
  }

  async downloadESIReport(companyId: string, month: string, year: string, format: 'xlsx' | 'txt' = 'xlsx'): Promise<Blob> {
    const response = await api.get('/payruns/esi-report', {
      params: { companyId, month, year, format },
      responseType: 'blob'
    });
    return response.data;
  }

  async downloadWordPayslip(companyId: string, employeeId: string, month: string, year: string): Promise<Blob> {
    const response = await api.get('/payruns/payslip/word', {
      params: { companyId, employeeId, month, year },
      responseType: 'blob'
    });
    return response.data;
  }

  async downloadInvoice(companyId: string, month: string, year: string): Promise<Blob> {
    const response = await api.get('/payruns/invoice', {
      params: { companyId, month, year },
      responseType: 'blob'
    });
    return response.data;
  }

  async downloadBankReport(companyId: string, month: string, year: string, type: 'iob' | 'non-iob', format: 'xlsx' | 'txt'): Promise<Blob> {
    const response = await api.get('/payruns/bank-report', {
      params: { companyId, month, year, type, format },
      responseType: 'blob'
    });
    return response.data;
  }
}

export default new PayrunService();