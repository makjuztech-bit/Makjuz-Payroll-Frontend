// src/components/LogoutButton.tsx
import React from 'react';
import authService from '../../services/authService';

const LogoutButton: React.FC = () => {
  const handleLogout = () => {
    authService.logout();
  };

  return (
    <button 
      onClick={handleLogout} 
      style={{
        marginLeft: 'auto',
        padding: '8px 16px',
        background: '#e74c3c',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer'
      }}
    >
      Logout
    </button>
  );
};

export default LogoutButton;
