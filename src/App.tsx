import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/Layout/MainLayout';
import EmployeesPage from './pages/Employees';
import DashboardPage from './pages/Dashboard';
import PayRunsPage from './pages/PayRuns';
import DocumentsPage from './pages/Documents';
import BenefitsPage from './pages/Benefits';
import ReportsPage from './pages/Reports';
import MarketingPage from './pages/Marketing';
import SupportPage from './pages/Support';
import CompanySettings from './pages/CompanySettings';
import { CompanyProvider } from './context/CompanyContext';
import AuthWrapper from './components/Login/authWrapper';
import Register from './components/Login/Register';
import Login from './components/Login/login';

const App: React.FC = () => {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

  return (
    <CompanyProvider>
      <Router>
        {!isLoggedIn ? (
          <Routes>
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        ) : (
          <AuthWrapper>
          <MainLayout>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/employees" element={<EmployeesPage />} />
              <Route path="/pay-runs" element={<PayRunsPage />} />
              <Route path="/documents" element={<DocumentsPage />} />
              <Route path="/benefits" element={<BenefitsPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/marketing" element={<MarketingPage />} />
              <Route path="/company-settings" element={<CompanySettings />} />
              <Route path="/support" element={<SupportPage />} />
            </Routes>
          </MainLayout>
          </AuthWrapper>
        )}
      </Router>
    </CompanyProvider>
  );
};

export default App;
