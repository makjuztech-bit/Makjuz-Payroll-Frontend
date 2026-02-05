
import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/offer-letters`;

export interface Candidate {
    _id?: string;
    name: string;
    email: string;
    role: string;
    joinDate: string;
    salary: number | string;
    status?: string;
    [key: string]: any;
}

const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        headers: {
            Authorization: `Bearer ${token}`,
        }
    };
};

const getCandidates = async () => {
    const response = await axios.get(API_URL, getHeaders());
    return response.data;
};

const addCandidate = async (candidate: Candidate) => {
    const response = await axios.post(API_URL, candidate, getHeaders());
    return response.data;
};

const addCandidatesBulk = async (candidates: Candidate[]) => {
    const response = await axios.post(`${API_URL}/bulk`, { candidates }, getHeaders());
    return response.data;
};

const deleteCandidate = async (id: string) => {
    const response = await axios.delete(`${API_URL}/${id}`, getHeaders());
    return response.data;
};

const sendOfferLetters = async (candidates: Candidate[]) => {
    const response = await axios.post(`${API_URL}/send-batch`, { candidates }, getHeaders());
    return response.data;
};

const downloadOfferLetter = async (candidate: Candidate) => {
    const response = await axios.post(`${API_URL}/download`, { candidate }, {
        ...getHeaders(),
        responseType: 'blob'
    });
    return response.data;
};

const offerLetterService = {
    getCandidates,
    addCandidate,
    addCandidatesBulk,
    deleteCandidate,
    sendOfferLetters,
    downloadOfferLetter
};

export default offerLetterService;
