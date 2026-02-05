import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL}/api`;

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true // Required for sending cookies to the server
});

// Handle token expiration / unauthorized access
api.interceptors.response.use(
    (response) => response,
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
