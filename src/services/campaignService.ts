import api from './api';

export interface Campaign {
    _id: string;
    campaignName: string;
    targetIndustry: string;
    channel: string[];
    startDate: string;
    endDate: string;
    salary: number;
    serviceCharge: number;
    createdAt?: string;
}

export const getAllCampaigns = async (): Promise<Campaign[]> => {
    const response = await api.get('/campaigns');
    return response.data;
};

export const createCampaign = async (campaignData: Omit<Campaign, '_id' | 'createdAt'>): Promise<Campaign> => {
    const response = await api.post('/campaigns', campaignData);
    return response.data;
};

export const updateCampaign = async (id: string, campaignData: Partial<Campaign>): Promise<Campaign> => {
    const response = await api.put(`/campaigns/${id}`, campaignData);
    return response.data;
};

export const deleteCampaign = async (id: string): Promise<void> => {
    await api.delete(`/campaigns/${id}`);
};
