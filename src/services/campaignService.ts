import axios, { AxiosError } from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL}/api/campaigns`;

// Create axios instance with base configuration
const axiosInstance = axios.create({
    baseURL: API_URL
});

// Add token to requests
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        } else {
            console.warn('No auth token found in localStorage');
        }
        return config;
    },
    (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
    }
);

// Add response interceptor for better error handling
axiosInstance.interceptors.response.use(
    (response) => {
        console.log('API Response:', response.data);
        return response;
    },
    (error: AxiosError) => {
        console.error('API Error:', {
            status: error.response?.status,
            data: error.response?.data,
            config: {
                url: error.config?.url,
                method: error.config?.method,
                headers: error.config?.headers
            }
        });
        return Promise.reject(error);
    }
);

export interface Campaign {
    campaignName: string;
    targetIndustry: string;
    channel: string[];
    startDate: Date;
    endDate: Date;
    salary: number;
    serviceCharge: number;
}

export const createCampaign = async (campaignData: Campaign) => {
    try {
        console.log('Creating campaign with data:', campaignData);
        const response = await axiosInstance.post('', campaignData);
        return response.data;
    } catch (error) {
        console.error('Error in createCampaign:', error);
        throw error;
    }
};

export const getAllCampaigns = async () => {
    try {
        console.log('Fetching all campaigns...');
        const response = await axiosInstance.get('');
        return response.data;
    } catch (error) {
        console.error('Error in getAllCampaigns:', error);
        throw error;
    }
};