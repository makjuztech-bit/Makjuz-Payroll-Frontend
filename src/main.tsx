import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider, App as AntApp } from 'antd';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#722ed1',
          colorLink: '#722ed1',
        },
        components: {
          Button: {
            colorPrimary: '#722ed1',
            algorithm: true,
          },
          Menu: {
            colorPrimary: '#722ed1',
            algorithm: true,
          },
        },
      }}
    >
      <AntApp>
        <App />
      </AntApp>
    </ConfigProvider>
  </React.StrictMode>
);
