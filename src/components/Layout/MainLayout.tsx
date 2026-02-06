import React, { ReactNode, useState } from 'react';
import { Layout, Menu, Select, Avatar, Button, Dropdown } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  TeamOutlined,
  DollarOutlined,
  FileOutlined,
  BarChartOutlined,
  SettingOutlined,
  UserOutlined,
  CustomerServiceOutlined,
  GiftOutlined,
  DingdingOutlined,
  LogoutOutlined
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useCompany } from '../../context/CompanyContext';

const { Header, Sider, Content } = Layout;

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { companies, selectedCompany, setSelectedCompany } = useCompany();

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('selectedCompanyId');
    window.location.href = '/';
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile'
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Account Settings'
    },
    {
      type: 'divider'
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: handleLogout
    }
  ];

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const role = user.role;

  const allMenuItems: MenuProps['items'] = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: <Link to="/dashboard">Dashboard</Link>,
    },
    {
      key: 'employees',
      icon: <TeamOutlined />,
      label: <Link to="/employees">Employees</Link>,
    },
    {
      key: 'pay-runs',
      icon: <DollarOutlined />,
      label: <Link to="/pay-runs">Pay Runs</Link>,
    },
    {
      key: 'benefits',
      icon: <GiftOutlined />,
      label: <Link to="/benefits">Benefits</Link>,
    },
    {
      key: 'documents',
      icon: <FileOutlined />,
      label: <Link to="/documents">Documents</Link>,
    },
    {
      key: 'reports',
      icon: <BarChartOutlined />,
      label: <Link to="/reports">Reports</Link>,
    },
    {
      key: 'marketing',
      icon: <DingdingOutlined />,
      label: <Link to="/marketing">Marketing</Link>,
    },
    {
      key: 'offer-letter',
      icon: <FileOutlined />,
      label: <Link to="/offer-letter">Offer Letter</Link>,
    },
    {
      key: 'company-settings',
      icon: <SettingOutlined />,
      label: <Link to="/company-settings">Company Settings</Link>,
    },
  ];

  const menuItems = allMenuItems.filter(item => {
    if (item?.key === 'reports') {
      return role === 'md';
    }
    return true;
  });

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        style={{
          background: '#1a1f37',
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >
        <div style={{
          padding: '16px',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start'
        }}>
          {collapsed ? (
            <h2 style={{
              color: 'white',
              margin: 0,
              fontSize: '24px',
              fontWeight: 'bold'
            }}>L</h2>
          ) : (
            <h2 style={{ color: 'white', margin: 0 }}>Levivaan</h2>
          )}
        </div>
        <Menu
          theme="dark"
          selectedKeys={[location.pathname.split('/')[1] || 'dashboard']}
          mode="inline"
          items={menuItems}
          style={{ background: '#1a1f37' }}
        />
        <div style={{
          padding: '16px',
          position: 'absolute',
          bottom: "46px",
          width: '100%',
          display: 'flex',
          justifyContent: 'center'
        }}>
          <Link to="/support">
            <Button
              type="text"
              icon={<CustomerServiceOutlined />}
              style={{
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: collapsed ? '8px' : '8px 16px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '6px',
                transition: 'all 0.3s'
              }}
            >
              {!collapsed && 'Contact Support'}
            </Button>
          </Link>
        </div>
      </Sider>
      <Layout style={{ marginLeft: collapsed ? 80 : 200, transition: 'all 0.2s' }}>
        <Header style={{
          padding: '0 16px',
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 10,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}>
          <Select
            style={{ width: 200 }}
            value={selectedCompany?._id}
            onChange={(value) => {
              const company = companies.find(c => c._id === value);
              if (company) {
                setSelectedCompany(company);
              }
            }}
            options={companies.map(company => ({
              value: company._id,
              label: company.name
            }))}
            placeholder="Select Company"
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* <Badge count={1} style={{ backgroundColor: '#722ed1' }}>
              <BellOutlined style={{ fontSize: '20px', color: '#722ed1' }} />
            </Badge> */}
            {/* <SettingOutlined style={{ fontSize: '20px', color: '#722ed1' }} /> */}
            <Dropdown menu={{ items: userMenuItems }} trigger={['click']} placement="bottomRight">
              <Avatar
                style={{
                  backgroundColor: '#722ed1',
                  cursor: 'pointer'
                }}
                icon={<UserOutlined />}
              />
            </Dropdown>
          </div>
        </Header>
        <Content style={{
          margin: '24px 16px',
          padding: 24,
          background: '#fff',
          minHeight: 280,
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
