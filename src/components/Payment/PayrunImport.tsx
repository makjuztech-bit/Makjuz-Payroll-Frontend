import React, { useState } from 'react';
import {
  Upload, Button, Modal, Alert, Progress, Table,
  Typography, Space, message, Card, Tabs, Switch
} from 'antd';
import { InboxOutlined, FileExcelOutlined, DownloadOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useCompany } from '../../context/CompanyContext';

const { Dragger } = Upload;
const { Title, Text } = Typography;
const { TabPane } = Tabs;

interface PayrunImportProps {
  month: string;
  year: string;
  onSuccess: () => void;
}

interface ImportResultItem {
  employeeId: string;
  name: string;
  calculatedPayrun: any;
}

interface ImportError {
  row: any;
  error: string;
}

interface ImportResult {
  success: ImportResultItem[];
  errors: ImportError[];
  totalProcessed: number;
}

const PayrunImport: React.FC<PayrunImportProps> = ({ month, year, onSuccess }) => {
  const { selectedCompany } = useCompany();
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [showDetailedView, setShowDetailedView] = useState(false);

  const showModal = () => {
    setVisible(true);
    // Reset states when opening modal
    setFile(null);
    setImportResult(null);
    setUploadProgress(0);
    setShowDetailedView(false);
  };

  const closeModal = () => {
    setVisible(false);
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await axios.get('/api/payruns/template', {
        responseType: 'blob',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'payrun_template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading template:', error);
      message.error('Failed to download template');
    }
  };

  const handleUploadFile = async () => {
    if (!file || !selectedCompany) return;

    setLoading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('payrunFile', file);
    formData.append('month', month);
    formData.append('year', year);

    try {
      // Upload the file with progress tracking
      const response = await axios.post('/api/payruns/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 100));
          setUploadProgress(percentCompleted);
        }
      });

      setImportResult(response.data);

      if (response.data.errors.length === 0) {
        message.success('Payrun data imported successfully');
        // Trigger the onSuccess callback to refresh the payrun data
        onSuccess();
      } else {
        message.warning(`Payrun data imported with ${response.data.errors.length} errors`);
      }
    } catch (error) {
      console.error('Error uploading payrun file:', error);
      message.error('Failed to import payrun data');
    } finally {
      setLoading(false);
      setUploadProgress(100); // Ensure progress completes
    }
  };

  // Basic columns (ID and Name only)
  const basicColumns = [
    {
      title: 'SR.NO',
      key: 'srNo',
      render: (_: any, _record: any, index: number) => index + 1,
    },
    {
      title: 'ID',
      dataIndex: 'employeeId',
      key: 'employeeId',
    },
    {
      title: 'TRAINEE NAME',
      dataIndex: 'name',
      key: 'name',
    }
  ];

  // Complete columns with all fields
  const detailedColumns = [
    ...basicColumns,
    {
      title: 'PRESENT DAYS',
      dataIndex: ['calculatedPayrun', 'presentDays'],
      key: 'presentDays',
    },
    {
      title: 'HOLIDAYS',
      dataIndex: ['calculatedPayrun', 'holidays'],
      key: 'holidays',
    },
    {
      title: 'OT HOURS',
      dataIndex: ['calculatedPayrun', 'otHours'],
      key: 'otHours',
    },
    {
      title: 'EARNINGS OF OT',
      dataIndex: ['calculatedPayrun', 'earningsOt'],
      key: 'earningsOt',
      render: (value: number) => `₹${value.toFixed(2)}`
    },
    {
      title: 'TOTAL FIXED DAYS',
      dataIndex: ['calculatedPayrun', 'totalFixedDays'],
      key: 'totalFixedDays',
    },
    {
      title: 'TOTAL PAYABLE DAYS',
      dataIndex: ['calculatedPayrun', 'totalPayableDays'],
      key: 'totalPayableDays',
    },
    {
      title: 'FIXED STIPEND',
      dataIndex: ['calculatedPayrun', 'fixedStipend'],
      key: 'fixedStipend',
      render: (value: number) => `₹${value.toFixed(2)}`
    },
    {
      title: 'SPECIAL ALLOWANCE',
      dataIndex: ['calculatedPayrun', 'specialAllowance'],
      key: 'specialAllowance',
      render: (value: number) => `₹${value.toFixed(2)}`
    },
    {
      title: 'EARNED STIPEND',
      dataIndex: ['calculatedPayrun', 'earnedStipend'],
      key: 'earnedStipend',
      render: (value: number) => `₹${value.toFixed(2)}`
    },
    {
      title: 'EARNED SPECIAL ALLOWANCE',
      dataIndex: ['calculatedPayrun', 'earnedSpecialAllowance'],
      key: 'earnedSpecialAllowance',
      render: (value: number) => `₹${value.toFixed(2)}`
    },
    {
      title: 'ATTENDANCE INCENTIVE',
      dataIndex: ['calculatedPayrun', 'attendanceIncentive'],
      key: 'attendanceIncentive',
      render: (value: number) => `₹${value.toFixed(2)}`
    },
    {
      title: 'TRANSPORT',
      dataIndex: ['calculatedPayrun', 'transport'],
      key: 'transport',
      render: (value: number) => `₹${value.toFixed(2)}`
    },
    {
      title: 'CANTEEN',
      dataIndex: ['calculatedPayrun', 'canteen'],
      key: 'canteen',
      render: (value: number) => `₹${value.toFixed(2)}`
    },
    {
      title: 'TOTAL EARNING',
      dataIndex: ['calculatedPayrun', 'totalEarning'],
      key: 'totalEarning',
      render: (value: number) => `₹${value.toFixed(2)}`
    },
    {
      title: 'TOTAL DEDUCTIONS',
      dataIndex: ['calculatedPayrun', 'totalDeductions'],
      key: 'totalDeductions',
      render: (value: number) => `₹${value.toFixed(2)}`
    },
    {
      title: 'NET EARNING',
      dataIndex: ['calculatedPayrun', 'finalNetpay'],
      key: 'finalNetpay',
      render: (value: number) => `₹${value.toFixed(2)}`
    },
    {
      title: 'MANAGEMENT FEE',
      dataIndex: ['calculatedPayrun', 'managementFee'],
      key: 'managementFee',
      render: (value: number) => `₹${value.toFixed(2)}`
    },
    {
      title: 'INSURANCE',
      dataIndex: ['calculatedPayrun', 'insurance'],
      key: 'insurance',
      render: (value: number) => `₹${value.toFixed(2)}`
    },
    {
      title: 'BILLABLE TOTAL',
      dataIndex: ['calculatedPayrun', 'billableTotal'],
      key: 'billableTotal',
      render: (value: number) => `₹${value.toFixed(2)}`
    },
    {
      title: 'GST@ 18%',
      dataIndex: ['calculatedPayrun', 'gst'],
      key: 'gst',
      render: (value: number) => `₹${value.toFixed(2)}`
    },
    {
      title: 'PF AMOUNT',
      dataIndex: ['calculatedPayrun', 'pfAmount'],
      key: 'pfAmount',
      render: (value: number) => `₹${value?.toFixed(2) || '0.00'}`
    },
    {
      title: 'ESI AMOUNT',
      dataIndex: ['calculatedPayrun', 'esiAmount'],
      key: 'esiAmount',
      render: (value: number) => `₹${value?.toFixed(2) || '0.00'}`
    },
    {
      title: 'GRAND TOTAL',
      dataIndex: ['calculatedPayrun', 'grandTotal'],
      key: 'grandTotal',
      render: (value: number) => `₹${value.toFixed(2)}`
    },
    {
      title: 'DBT',
      dataIndex: ['calculatedPayrun', 'dbt'],
      key: 'dbt',
      render: (value: number) => `₹${value.toFixed(2)}`
    },
    {
      title: 'LOP',
      dataIndex: ['calculatedPayrun', 'lop'],
      key: 'lop',
      render: (value: number) => `₹${value.toFixed(2)}`
    },
    {
      title: 'Remarks',
      dataIndex: ['calculatedPayrun', 'remarks'],
      key: 'remarks',
    }
  ];

  const errorColumns = [
    {
      title: 'Row',
      dataIndex: ['row', 'SR.NO'],
      key: 'rowNumber',
      render: (_: any, record: ImportError) => record.row.SR?.NO || record.row.ID || 'Unknown'
    },
    {
      title: 'Employee ID',
      dataIndex: ['row', 'ID'],
      key: 'employeeId',
    },
    {
      title: 'Error',
      dataIndex: 'error',
      key: 'error',
      render: (text: string) => <Text type="danger">{text}</Text>
    }
  ];

  const uploadProps = {
    name: 'file',
    multiple: false,
    accept: '.xlsx,.xls,.csv',
    maxCount: 1,
    beforeUpload: (file: File) => {
      // Check file type
      const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.type === 'application/vnd.ms-excel' ||
        file.name.endsWith('.csv');

      if (!isExcel) {
        message.error('You can only upload Excel or CSV files!');
        return Upload.LIST_IGNORE;
      }

      // Check file size (5MB max)
      const isLessThan5MB = file.size / 1024 / 1024 < 5;
      if (!isLessThan5MB) {
        message.error('File must be smaller than 5MB!');
        return Upload.LIST_IGNORE;
      }

      setFile(file);
      return false; // Prevent automatic upload
    },
    onRemove: () => {
      setFile(null);
      return true;
    }
  };

  return (
    <>
      <Button
        type="primary"
        icon={<FileExcelOutlined />}
        onClick={showModal}
        style={{ marginRight: 8 }}
      >
        Import Excel
      </Button>

      <Modal
        title="Import Payrun Data"
        open={visible}
        width={800}
        onCancel={closeModal}
        footer={[
          <Button key="download" onClick={handleDownloadTemplate} icon={<DownloadOutlined />}>
            Download Template
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={loading}
            onClick={handleUploadFile}
            disabled={!file}
          >
            Upload & Process
          </Button>,
          <Button key="close" onClick={closeModal}>
            Close
          </Button>
        ]}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Alert
            message="Import Payrun Data for Employees"
            description={
              <div>
                <p>Upload an Excel file with payrun data for the month of <strong>{month} {year}</strong>.</p>
                <p>The system will validate employee IDs and calculate all the required fields.</p>
                <p>Use the template button to download a sample file format.</p>
              </div>
            }
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          {!importResult && (
            <Dragger {...uploadProps}>
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">Click or drag Excel file to this area to upload</p>
              <p className="ant-upload-hint">
                Support for .xlsx, .xls, or .csv file formats only
              </p>
            </Dragger>
          )}

          {loading && (
            <Card style={{ marginTop: 16 }}>
              <Progress percent={uploadProgress} status="active" />
              <Text>Processing data...</Text>
            </Card>
          )}

          {importResult && (
            <div style={{ marginTop: 16 }}>
              <Card>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div style={{ marginBottom: 16 }}>
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Title level={5}>Import Summary</Title>
                      <Space>
                        <Text>Total Processed: {importResult.totalProcessed}</Text>
                        <Text type="success">Success: {importResult.success.length}</Text>
                        <Text type="danger">Errors: {importResult.errors.length}</Text>
                      </Space>
                      <div style={{ marginTop: 8 }}>
                        <Switch
                          checkedChildren="Detailed View"
                          unCheckedChildren="Simple View"
                          checked={showDetailedView}
                          onChange={setShowDetailedView}
                        />
                      </div>
                    </Space>
                  </div>

                  <Tabs defaultActiveKey="success">
                    <TabPane tab="Successful Imports" key="success">
                      <Table
                        dataSource={importResult.success}
                        columns={showDetailedView ? detailedColumns : basicColumns}
                        rowKey="employeeId"
                        pagination={{ pageSize: 5 }}
                        size="small"
                        scroll={{ x: showDetailedView ? 3000 : 500 }}
                      />
                    </TabPane>
                    <TabPane tab={`Errors (${importResult.errors.length})`} key="errors">
                      <Table
                        dataSource={importResult.errors}
                        columns={errorColumns}
                        rowKey={(record) => `${record.row.ID || record.row['SR.NO'] || Math.random()}`}
                        pagination={{ pageSize: 5 }}
                        size="small"
                      />
                    </TabPane>
                  </Tabs>
                </Space>
              </Card>
            </div>
          )}
        </Space>
      </Modal>
    </>
  );
};

export default PayrunImport; 