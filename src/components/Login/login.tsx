import React, { useState } from 'react';
import './Login.css';
import { FaUser, FaLock } from 'react-icons/fa';
import axios from 'axios';
import { Link } from 'react-router-dom';

const API_URL = 'http://localhost:3000/api/auth';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await axios.post(`${API_URL}/login`, {
        username,
        password
      });

      const { token, user } = response.data;
      
      // Store the token and user data
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('isLoggedIn', 'true');
      
      // Reload the application
      window.location.href = '/';
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-container">
      <div className="glass-card">
        <h2 className="glass-title"><span>Payroll Levivaan</span></h2>
        <h2 className="glass-desc">Welcome Back</h2>
        <p className="glass-desc">Please enter your credentials to continue</p>

        <div className="input-group">
          <FaUser className="icon" />
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        <div className="input-group">
          <FaLock className="icon" />
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <span
            className="toggle-password"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? '🙈' : '👁️'}
          </span>
        </div>

        <div className="utility">
          <label>
            <input type="checkbox" /> Remember Me
          </label>
          <a href="#" onClick={(e) => e.preventDefault()}>Forgot Password?</a>
        </div>

        <button 
          onClick={handleLogin} 
          disabled={loading}
          style={{ opacity: loading ? 0.7 : 1 }}
        >
          {loading ? 'Signing In...' : 'Sign In'}
        </button>

        {error && <p className="error">{error}</p>}

        <p style={{ marginTop: '20px', fontSize: '14px', color: '#aaa' }}>
          Don't have an account? <Link to="/register" style={{ color: '#00d4ff' }}>Register here</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;