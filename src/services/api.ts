import axios from 'axios';
import CryptoJS from 'crypto-js';

const API_URL = `${import.meta.env.VITE_API_URL}/api`;
// Hardcoded key for demo/obfuscation - normally strictly env var
// Must match backend ENCRYPTION_KEY
const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'your-fallback-secret-key-change-in-prod';

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true
});

// Response Interceptor: Decrypt data if encrypted
api.interceptors.response.use(
    (response) => {
        // specific check for encrypted wrapper
        if (response.data && response.data._enc) {
            try {
                const bytes = CryptoJS.AES.decrypt(response.data._enc, ENCRYPTION_KEY);
                const decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
                response.data = decryptedData;
            } catch (e) {
                console.error('Failed to decrypt response', e);
            }
        }
        return response;
    },
    (error) => {
        if (error.response?.status === 401) {
            if (window.location.pathname !== '/') {
                localStorage.removeItem('user');
                localStorage.removeItem('isLoggedIn');
                window.location.href = '/';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
