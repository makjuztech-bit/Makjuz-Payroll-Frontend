
// src/components/AuthWrapper.tsx
import React from 'react';
import Login from './login.tsx';

const AuthWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

  if (!isLoggedIn) {
    return <Login />;
  }

  return <>{children}</>;
};

export default AuthWrapper;
