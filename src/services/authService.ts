import api from './api';

class AuthService {
  async login(username: string, password: string) {
    const response = await api.post('/auth/login', { username, password });
    if (response.data.user) {
      localStorage.setItem('user', JSON.stringify(response.data.user));
      localStorage.setItem('isLoggedIn', 'true');
    }
    return response.data;
  }

  async logout() {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      localStorage.removeItem('user');
      localStorage.removeItem('isLoggedIn');
      window.location.href = '/';
    }
  }

  getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  async getMe() {
    const response = await api.get('/auth/me');
    if (response.data) {
      localStorage.setItem('user', JSON.stringify(response.data));
    }
    return response.data;
  }

  async register(username: string, password: string, email: string) {
    const response = await api.post('/auth/register', {
      username,
      password,
      email
    });
    return response.data;
  }
}

export default new AuthService();