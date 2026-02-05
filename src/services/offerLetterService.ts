import api from './api';

export interface Candidate {
    _id?: string;
    name: string;
    email: string;
    role: string;
    joinDate: string;
    salary: string | number;
}

class OfferLetterService {
    async getCandidates(): Promise<Candidate[]> {
        const response = await api.get('/offer-letters');
        return response.data;
    }

    async addCandidate(candidate: Candidate): Promise<Candidate> {
        const response = await api.post('/offer-letters', candidate);
        return response.data;
    }

    async addCandidatesBulk(candidates: Candidate[]): Promise<Candidate[]> {
        const response = await api.post('/offer-letters/bulk', candidates);
        return response.data;
    }

    async deleteCandidate(id: string): Promise<void> {
        await api.delete(`/offer-letters/${id}`);
    }

    async sendOfferLetters(candidates: Candidate[]): Promise<any> {
        const response = await api.post('/offer-letters/send-batch', { candidates });
        return response.data;
    }

    async downloadOfferLetter(candidate: Candidate): Promise<Blob> {
        const response = await api.post('/offer-letters/download', candidate, {
            responseType: 'blob'
        });
        return response.data;
    }
}

export default new OfferLetterService();
