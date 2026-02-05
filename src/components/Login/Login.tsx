import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaUser, FaLock } from 'react-icons/fa';
import './Login.css';
import authService from '../../services/authService';

const Login: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            setError('');

            if (!username || !password) {
                setError('Please enter both username and password');
                return;
            }

            await authService.login(username, password);

            // Navigate to dashboard after successful login
            navigate('/dashboard');
            window.location.reload(); // Refresh to update AuthWrapper state
        } catch (err: any) {
            setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="glass-container">
            <div className="glass-card">
                <h2 className="glass-title">Payroll<span> Levivaan</span></h2>
                <p className="glass-subtitle">Welcome Back</p>
                <p className="glass-desc">Login to manage your payroll</p>

                <form onSubmit={handleLogin}>
                    <div className="input-group">
                        <FaUser className="icon" />
                        <input
                            type="text"
                            placeholder="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <FaLock className="icon" />
                        <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <span
                            className="toggle-password"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? '🙈' : '👁️'}
                        </span>
                    </div>

                    <button type="submit" disabled={loading}>
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>

                {error && <p className="error">{error}</p>}

                <p className="auth-footer">
                    Don't have an account? <Link to="/register">Register here</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
