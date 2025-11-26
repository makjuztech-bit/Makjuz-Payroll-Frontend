import React, { useState } from 'react';
import { 
  Modal, Button, Upload, message, Form, Select, Space, Typography, 
  Steps, Result, Table, Tag, Alert, Divider 
} from 'antd';
import { 
  UploadOutlined, FileExcelOutlined, 
  CheckCircleOutlined, CloseCircleOutlined, 
  DownloadOutlined 
} from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { RcFile } from 'antd/es/upload';
import payrunService from '../../services/payrunService';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

interface PayrunUploadModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  companyId: string;
}

interface UploadResult {
  success: Array<{
    employeeId: string;
    name: string;
    calculatedPayrun: any;
  }>;
  errors: Array<{
    row: any;
    error: string;
  }>;
  totalProcessed: number;
}

const PayrunUploadModal: React.FC<PayrunUploadModalProps> = ({
  visible,
  onClose,
  onSuccess,
  companyId
}) => {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Get current month and year for default values
  const currentMonth = dayjs().format('MMMM');
  const currentYear = dayjs().year().toString();

  const beforeUpload = (file: RcFile) => {
    const isExcel = 
      file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
      file.type === 'application/vnd.ms-excel';
    
    if (!isExcel) {
      message.error('You can only upload Excel files!');
    }
    
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error('File must be smaller than 5MB!');
    }
    
    return false; // Prevent automatic upload
  };

  const handleUpload = async () => {
    try {
      await form.validateFields();
      
      if (fileList.length === 0) {
        message.error('Please select a file to upload');
        return;
      }
      
      const { month, year } = form.getFieldsValue();
      const file = fileList[0].originFileObj;
      
      setUploading(true);
      setErrorMessage(null); // Clear any previous error messages
      
      try {
        const result = await payrunService.uploadPayrunExcel(file, month, year, companyId);
        setUploadResult(result);
        setCurrentStep(1);
        
        if (result.errors.length === 0) {
          message.success('Successfully processed all employee records!');
        } else {
          message.warning(`Processed with ${result.errors.length} errors.`);
        }
      } catch (error: any) {
        // Handle the conflict error for existing month data
        if (error.response?.status === 409) {
          const errorMsg = error.response.data.message || `Data already exists for ${month} ${year}`;
          setErrorMessage(errorMsg);
          message.error(errorMsg);
        } else {
          const errorMsg = error.response?.data?.message || error.message || 'Upload failed';
          setErrorMessage(errorMsg);
          message.error('Upload failed: ' + errorMsg);
        }
      } finally {
        setUploading(false);
      }
    } catch (error) {
      // Form validation failed
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await payrunService.getPayrunTemplate();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'payrun_template.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      message.error('Failed to download template');
    }
  };

  const handleReset = () => {
    setFileList([]);
    setUploadResult(null);
    setErrorMessage(null);
    setCurrentStep(0);
    form.resetFields();
  };

  const handleFinish = () => {
    if (uploadResult && uploadResult.success.length > 0) {
      // Call the onSuccess callback with summary information
      onSuccess();
      
      // Close the modal
      onClose();
    } else {
      // If no success records, just close
      onClose();
    }
  };

  const uploadProps: UploadProps = {
    onRemove: file => {
      setFileList([]);
    },
    beforeUpload,
    fileList,
    onChange: ({ fileList }) => {
      setFileList(fileList.slice(-1)); // Only keep the latest file
    },
  };

  const successColumns = [
    {
      title: 'Employee ID',
      dataIndex: 'employeeId',
      key: 'employeeId',
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Present Days',
      dataIndex: ['calculatedPayrun', 'presentDays'],
      key: 'presentDays',
    },
    {
      title: 'Net Earning',
      dataIndex: ['calculatedPayrun', 'finalNetpay'],
      key: 'finalNetpay',
      render: (value: number) => `₹${value.toFixed(2)}`
    },
    {
      title: 'Status',
      key: 'status',
      render: () => (
        <Tag color="success">
          <CheckCircleOutlined /> Processed
        </Tag>
      ),
    },
  ];

  const errorColumns = [
    {
      title: 'Row Data',
      dataIndex: 'row',
      key: 'row',
      render: (row: any) => (
        <Text ellipsis={{ tooltip: JSON.stringify(row, null, 2) }}>
          {row && row.ID ? `ID: ${row.ID}, Name: ${row['TRAINEE NAME'] || 'N/A'}` : 'Invalid Row'}
        </Text>
      ),
    },
    {
      title: 'Error',
      dataIndex: 'error',
      key: 'error',
    },
    {
      title: 'Status',
      key: 'status',
      render: () => (
        <Tag color="error">
          <CloseCircleOutlined /> Failed
        </Tag>
      ),
    },
  ];

  const steps = [
    {
      title: 'Upload File',
      content: (
        <>
          <Alert
            message="Upload Excel File for Payrun"
            description={
              <div>
                <p>Upload an Excel file with employee payrun data. Make sure the file has the required columns and proper employee IDs that exist in the system.</p>
                <p><strong>Important:</strong> Employee IDs should match exactly as they appear in the system (e.g., LIV-1, LIV-2). The system will try to match IDs in various formats, but exact matches are preferred.</p>
              </div>
            }
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          
          {errorMessage && (
            <Alert
              message="Import Error"
              description={errorMessage}
              type="error"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}
          
          <Form
            form={form}
            layout="vertical"
          >
            <Form.Item
              name="month"
              label="Month"
              initialValue={currentMonth}
              rules={[{ required: true, message: 'Please select month' }]}
            >
              <Select>
                {[
                  'January', 'February', 'March', 'April',
                  'May', 'June', 'July', 'August',
                  'September', 'October', 'November', 'December'
                ].map(month => (
                  <Option key={month} value={month}>{month}</Option>
                ))}
              </Select>
            </Form.Item>
            
            <Form.Item
              name="year"
              label="Year"
              initialValue={currentYear}
              rules={[{ required: true, message: 'Please select year' }]}
            >
              <Select>
                {[...Array(5)].map((_, i) => {
                  const year = dayjs().year() - 2 + i;
                  return <Option key={year} value={year.toString()}>{year}</Option>;
                })}
              </Select>
            </Form.Item>
            
            <Form.Item label="Payrun Excel File">
              <Upload 
                {...uploadProps}
                maxCount={1}
                listType="text"
              >
                <Button icon={<UploadOutlined />}>Select File</Button>
              </Upload>
            </Form.Item>
            
            <Divider />
            
            <Button 
              type="dashed" 
              icon={<DownloadOutlined />} 
              onClick={handleDownloadTemplate}
              style={{ marginBottom: 16 }}
            >
              Download Template
            </Button>
          </Form>
        </>
      ),
    },
    {
      title: 'Results',
      content: uploadResult ? (
        <div>
          <Result
            status={uploadResult.errors.length === 0 ? "success" : "warning"}
            title={
              uploadResult.errors.length === 0
                ? "All records processed successfully!"
                : `Processed with ${uploadResult.errors.length} errors`
            }
            subTitle={`Total Processed: ${uploadResult.totalProcessed}, Success: ${uploadResult.success.length}, Errors: ${uploadResult.errors.length}`}
          />
          
          {uploadResult.success.length > 0 && (
            <>
              <Title level={5}>Successfully Processed ({uploadResult.success.length})</Title>
              <Table 
                dataSource={uploadResult.success} 
                columns={successColumns} 
                rowKey="employeeId"
                pagination={{ pageSize: 5 }}
              />
            </>
          )}
          
          {uploadResult.errors.length > 0 && (
            <>
              <Title level={5}>Errors ({uploadResult.errors.length})</Title>
              <Table 
                dataSource={uploadResult.errors} 
                columns={errorColumns} 
                rowKey={(record) => `${record.row?.ID || Math.random()}`}
                pagination={{ pageSize: 5 }}
              />
            </>
          )}
        </div>
      ) : null,
    },
  ];
  
  const modalFooter = currentStep === 0 
    ? [
        <Button key="back" onClick={onClose}>
          Cancel
        </Button>,
        <Button 
          key="submit" 
          type="primary" 
          onClick={handleUpload} 
          loading={uploading}
          disabled={fileList.length === 0}
        >
          Upload and Process
        </Button>,
      ]
    : [
        <Button key="reset" onClick={handleReset}>
          Upload Another
        </Button>,
        <Button key="finish" type="primary" onClick={handleFinish}>
          Finish
        </Button>,
      ];

  return (
    <Modal
      title={
        <Space>
          <FileExcelOutlined style={{ color: '#52c41a' }} />
          <span>Import Payrun Data</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={800}
      footer={modalFooter}
    >
      <Steps current={currentStep} items={steps} style={{ marginBottom: 24 }} />
      
      <div className="steps-content">
        {steps[currentStep].content}
      </div>
    </Modal>
  );
};

export default PayrunUploadModal; 