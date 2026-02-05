import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaUser, FaLock, FaEnvelope } from 'react-icons/fa';
import './Login.css';
import authService from '../../services/authService';

const Register: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async () => {
    try {
      setLoading(true);
      setError('');

      // Validation
      if (!username || !password || !email) {
        setError('All fields are required');
        return;
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      const response = await authService.register(username, password, email);

      if (response.token) {
        // Registration successful, set local storage and navigate to dashboard
        localStorage.setItem('isLoggedIn', 'true');
        navigate('/dashboard');
        window.location.reload(); // Refresh to update AuthWrapper state
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-container">
      <div className="glass-card">
        <h2 className="glass-title">Payroll<span> Levivaan</span></h2>
        <p className="glass-subtitle">Create Account</p>
        <p className="glass-desc">Please fill in your details to register</p>

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
          <FaEnvelope className="icon" />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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

        <div className="input-group">
          <FaLock className="icon" />
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        <button
          onClick={handleRegister}
          disabled={loading}
          style={{ opacity: loading ? 0.7 : 1 }}
        >
          {loading ? 'Registering...' : 'Register'}
        </button>

        {error && <p className="error">{error}</p>}

        <p style={{ marginTop: '20px', fontSize: '14px', color: '#aaa' }}>
          Already have an account? <Link to="/login" style={{ color: '#00d4ff' }}>Login here</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;