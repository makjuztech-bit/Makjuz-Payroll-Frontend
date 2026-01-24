import React, { useState, useEffect } from 'react';
import {
  Modal, Button, Upload, App, Form, Select, Space, Typography,
  Steps, Result, Table, Tag, Alert, Collapse, Tooltip
} from 'antd';
import {
  UploadOutlined, FileExcelOutlined,
  DownloadOutlined, SettingOutlined
} from '@ant-design/icons';
import type { UploadProps } from 'antd';
import payrunService from '../../services/payrunService';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';
import TemplateEditor, { TemplateColumn } from '../Common/TemplateEditor';

const { Text } = Typography;
const { Option } = Select;
const { Panel } = Collapse;

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

const DEFAULT_PAYRUN_TEMPLATE: TemplateColumn[] = [
  { key: 'empId', name: 'Employee ID', required: true, type: 'string', systemLabel: 'Employee ID' },
  { key: 'name', name: 'Trainee Name', required: true, type: 'string', systemLabel: 'Name' },
  { key: 'presentDays', name: 'Present Days', required: true, type: 'number', systemLabel: 'Present Days' },
  { key: 'holidays', name: 'Holidays', required: true, type: 'number', systemLabel: 'Holidays' },
  { key: 'otHours', name: 'OT Hours', required: false, type: 'number', systemLabel: 'OT Hours' },
  { key: 'totalFixedDays', name: 'Total Fixed Days', required: true, type: 'number', systemLabel: 'Total Fixed Days' },
  { key: 'fixedStipend', name: 'Fixed Stipend', required: true, type: 'number', systemLabel: 'Fixed Stipend' },
  { key: 'specialAllowance', name: 'Special Allowance', required: false, type: 'number', systemLabel: 'Special Allowance' },
  { key: 'transport', name: 'Transport', required: false, type: 'number', systemLabel: 'Transport' },
  { key: 'canteen', name: 'Canteen', required: false, type: 'number', systemLabel: 'Canteen' },
  { key: 'managementFee', name: 'Management Fee', required: false, type: 'number', systemLabel: 'Management Fee' },
  { key: 'insurance', name: 'Insurance', required: false, type: 'number', systemLabel: 'Insurance' },
  { key: 'lop', name: 'LOP', required: false, type: 'number', systemLabel: 'LOSS OF PAY' },
  { key: 'remarks', name: 'Remarks', required: false, type: 'string', systemLabel: 'Remarks' },
  { key: 'bankAccount', name: 'Bank Account', required: false, type: 'string', systemLabel: 'Bank Account' },
];

const PayrunUploadModal: React.FC<PayrunUploadModalProps> = ({
  visible,
  onClose,
  onSuccess,
  companyId
}) => {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [isConfirming, setIsConfirming] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Template Editor State
  const [templateColumns, setTemplateColumns] = useState<TemplateColumn[]>(DEFAULT_PAYRUN_TEMPLATE);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);

  const currentMonth = dayjs().format('MMMM');
  const currentYear = dayjs().year().toString();

  // Load saved template
  useEffect(() => {
    if (companyId) {
      const saved = localStorage.getItem(`payrun_import_template_${companyId}`);
      if (saved) {
        try {
          setTemplateColumns(JSON.parse(saved));
        } catch (e) {
          console.error('Failed to load saved template', e);
        }
      } else {
        setTemplateColumns(DEFAULT_PAYRUN_TEMPLATE);
      }
    }
  }, [companyId]);

  const saveTemplate = (newColumns: TemplateColumn[]) => {
    setTemplateColumns(newColumns);
    if (companyId) {
      localStorage.setItem(`payrun_import_template_${companyId}`, JSON.stringify(newColumns));
    }
  };

  const handleFilePreview = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (jsonData.length < 1) {
          message.error('File is empty');
          return;
        }

        // Just preview the first few data rows
        const headers = jsonData[0] as string[];
        const rows = jsonData.slice(1, 11).map((row: any) => {
          const obj: any = {};
          headers.forEach((h, idx) => {
            if (h) obj[h] = row[idx];
          });
          return obj;
        });

        setPreviewData(rows);
        setIsConfirming(true);
      } catch (err) {
        console.error('Preview error:', err);
        message.error('Failed to preview file');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleUpload = async () => {
    try {
      await form.validateFields();
      if (fileList.length === 0) {
        message.error('Please select a file');
        return;
      }

      const { month, year } = form.getFieldsValue();
      const file = fileList[0].originFileObj;

      setUploading(true);
      setErrorMessage(null);

      // Create mapping from template config: { key: 'Custom Header Name' }
      const columnMapping = templateColumns.reduce((acc, col) => {
        acc[col.key] = col.name;
        return acc;
      }, {} as Record<string, string>);

      try {
        const result = await payrunService.uploadPayrunExcel(file, month, year, companyId, columnMapping);
        setUploadResult(result);
        setCurrentStep(1);
        setIsConfirming(false);

        if (result.errors.length === 0) {
          message.success('Successfully processed all records!');
          onSuccess();
        } else {
          message.warning(`Processed with ${result.errors.length} errors.`);
        }
      } catch (error: any) {
        const errorMsg = error.response?.data?.message || error.message || 'Upload failed';
        setErrorMessage(errorMsg);
        message.error(errorMsg);
      } finally {
        setUploading(false);
      }
    } catch (error) { }
  };

  const handleDownloadTemplate = () => {
    try {
      // Use configured columns for headers
      const headers = ["Sr-No-", ...templateColumns.map(col => col.name)];

      // Create a sample row
      const sampleRow = templateColumns.map(col => {
        if (col.key === 'empId') return 'EMP1001';
        if (col.key === 'name') return 'John Doe';
        if (col.type === 'number') return 0;
        return '';
      });

      const data = [
        headers,
        ["1", ...sampleRow]
      ];

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(data);
      ws['!cols'] = headers.map(() => ({ width: 18 }));

      XLSX.utils.book_append_sheet(wb, ws, "Payrun Template");
      XLSX.writeFile(wb, "Payrun_Template.xlsx");
      message.success('Template downloaded successfully');
    } catch (error) {
      console.error('Template gen error:', error);
      message.error('Failed to generate template');
    }
  };



  const uploadProps: UploadProps = {
    onRemove: () => setFileList([]),
    beforeUpload: (file) => {
      setFileList([{ originFileObj: file, name: file.name }]);
      handleFilePreview(file);
      return false;
    },
    fileList,
  };

  const successColumns = [
    { title: 'Employee ID', dataIndex: 'employeeId', key: 'employeeId' },
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Net Pay', dataIndex: ['calculatedPayrun', 'finalNetpay'], key: 'finalNetpay', render: (v: number | undefined) => `₹${v?.toFixed(2) || 0}` },
    { title: 'Status', key: 'status', render: () => <Tag color="success">Processed</Tag> },
  ];

  const steps = [
    {
      title: 'Upload and Confirm',
      content: (
        <>
          <Form form={form} layout="vertical">
            <Space style={{ width: '100%', justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <Form.Item name="month" label="Month" initialValue={currentMonth} rules={[{ required: true }]} style={{ width: 150 }}>
                <Select>
                  {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                    <Option key={m} value={m}>{m}</Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item name="year" label="Year" initialValue={currentYear} rules={[{ required: true }]} style={{ width: 100 }}>
                <Select>
                  {[0, 1, 2].map(i => {
                    const year = dayjs().year() - 1 + i;
                    return <Option key={year} value={year.toString()}>{year}</Option>;
                  })}
                </Select>
              </Form.Item>
              <div style={{ marginTop: 24 }}>
                <Space>
                  <Button type="default" icon={<DownloadOutlined />} onClick={handleDownloadTemplate}>
                    Download Template
                  </Button>
                  <Tooltip title="Edit Template Columns">
                    <Button icon={<SettingOutlined />} onClick={() => setShowTemplateEditor(true)}>
                      Edit Template
                    </Button>
                  </Tooltip>
                </Space>
              </div>
            </Space>

            <TemplateEditor
              visible={showTemplateEditor}
              onClose={() => setShowTemplateEditor(false)}
              onSave={saveTemplate}
              availableFields={DEFAULT_PAYRUN_TEMPLATE.map(f => ({
                key: f.key,
                label: f.systemLabel || f.name,
                type: f.type,
                required: f.required
              }))}
              currentColumns={templateColumns}
              title="Edit Payrun Import Template"
              allowCustomFields={false} // Payrun backend is strict, disallow loose fields for now
            />

            {!isConfirming ? (
              <div style={{ textAlign: 'center', padding: '40px', border: '2px dashed #d9d9d9', borderRadius: '12px', marginTop: 16 }}>
                <Upload {...uploadProps} showUploadList={false}>
                  <Button icon={<UploadOutlined />} size="large">Select Payrun Excel</Button>
                </Upload>
              </div>
            ) : (
              <div style={{ marginTop: 20 }}>
                <Alert
                  message="Confirm Upload"
                  description="Please review the data preview below. Are you sure you want to process this payrun?"
                  type="warning"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
                <Text strong>Data Preview (First 5 rows):</Text>
                <Table
                  dataSource={previewData.slice(0, 5)}
                  columns={Object.keys(previewData[0] || {}).slice(0, 6).map(k => ({ title: k, dataIndex: k, key: k }))}
                  size="small"
                  pagination={false}
                  bordered
                  style={{ marginTop: 8 }}
                />
                <div style={{ marginTop: 16, textAlign: 'right' }}>
                  <Space>
                    <Button onClick={() => setIsConfirming(false)}>Change File</Button>
                    <Button type="primary" onClick={handleUpload} loading={uploading}>
                      Yes, Process Payrun
                    </Button>
                  </Space>
                </div>
              </div>
            )}
          </Form>
          {errorMessage && (
            <Alert message="Import Error" description={errorMessage} type="error" showIcon style={{ marginTop: 16 }} />
          )}
        </>
      ),
    },
    {
      title: 'Results',
      content: uploadResult ? (
        <div>
          <Result
            status={uploadResult.errors.length === 0 ? "success" : "warning"}
            title={uploadResult.errors.length === 0 ? "Processed Successfully!" : "Processed with Errors"}
            subTitle={`Total: ${uploadResult.totalProcessed}, Success: ${uploadResult.success.length}, Errors: ${uploadResult.errors.length}`}
          />
          {uploadResult.success.length > 0 && (
            <Table dataSource={uploadResult.success} columns={successColumns} rowKey="employeeId" pagination={{ pageSize: 5 }} />
          )}
          {uploadResult.errors.length > 0 && (
            <Collapse style={{ marginTop: 16 }}>
              <Panel header="View Errors" key="1">
                {uploadResult.errors.map((err, i) => (
                  <div key={i} style={{ color: 'red', marginBottom: 4 }}>Row: {JSON.stringify(err.row)} - Error: {err.error}</div>
                ))}
              </Panel>
            </Collapse>
          )}
        </div>
      ) : null,
    },
  ];

  return (
    <Modal
      title={<span><FileExcelOutlined style={{ color: '#52c41a', marginRight: 8 }} />Import Payrun</span>}
      open={visible}
      onCancel={onClose}
      width={900}
      footer={currentStep === 1 ? [<Button key="finish" type="primary" onClick={onClose}>Finish</Button>] : null}
    >
      <Steps current={currentStep} items={steps.map(s => ({ title: s.title }))} style={{ marginBottom: 24 }} />
      <div className="steps-content">{steps[currentStep].content}</div>
    </Modal>
  );
};

export default PayrunUploadModal;