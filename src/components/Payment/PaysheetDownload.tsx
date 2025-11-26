import React, { useState } from 'react';
import { Button, message } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useCompany } from '../../context/CompanyContext';

interface PaysheetDownloadProps {
  month: string;
  year: string;
}

const PaysheetDownload: React.FC<PaysheetDownloadProps> = ({ month, year }) => {
  const { selectedCompany } = useCompany();
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    if (!selectedCompany) {
      message.error('Please select a company first');
      return;
    }

    setLoading(true);
    
    try {
      const response = await axios.get('/api/payruns/paysheet', {
        params: {
          companyId: selectedCompany._id,
          month,
          year
        },
        responseType: 'blob',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      // Create a filename for download
      const filename = `Paysheet_${month}_${year}.xlsx`;
      
      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      message.success('Paysheet downloaded successfully');
    } catch (error) {
      console.error('Error downloading paysheet:', error);
      message.error('Failed to download paysheet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="primary"
      icon={<DownloadOutlined />}
      onClick={handleDownload}
      loading={loading}
      style={{ marginRight: 8 }}
    >
      Download Paysheet
    </Button>
  );
};

export default PaysheetDownload; 