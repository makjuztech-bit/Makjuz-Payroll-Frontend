import api from './api';

export interface DocumentResponse {
    _id: string;
    employeeId: string;
    fileName: string;
    fileContent: string;
    fileType: string;
    uploadedAt: string;
}

class DocumentService {
    async uploadDocument(employeeId: string, file: File): Promise<DocumentResponse> {
        const reader = new FileReader();
        const fileContent = await new Promise<string>((resolve) => {
            reader.onload = (e) => {
                const result = e.target?.result as string;
                // Remove data:application/pdf;base64, etc.
                const base64 = result.split(',')[1];
                resolve(base64);
            };
            reader.readAsDataURL(file);
        });

        const response = await api.post(`/documents/${employeeId}`, {
            fileName: file.name,
            fileContent: fileContent,
            fileType: file.type
        });

        return response.data;
    }

    async getDocuments(employeeId: string): Promise<DocumentResponse[]> {
        const response = await api.get(`/documents/${employeeId}`);
        return response.data;
    }

    async getDocumentsBatch(employeeIds: string[]): Promise<DocumentResponse[]> {
        const response = await api.post('/documents/batch', { employeeIds });
        return response.data;
    }

    async deleteDocument(id: string): Promise<void> {
        await api.delete(`/documents/${id}`);
    }
}

export default new DocumentService();
