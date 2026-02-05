import React, { useState, useCallback } from 'react';
import { Modal, Button, Upload, App, Space, Typography, Alert, Table, Collapse, Card, Tooltip } from 'antd';
import { UploadOutlined, FileExcelOutlined, DownloadOutlined, CheckCircleOutlined, ExclamationCircleOutlined, SettingOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';
import type { UploadProps } from 'antd/es/upload';
import { useCompany } from '../../context/CompanyContext';
import employeeService from '../../services/employeeService';
import TemplateEditor, { TemplateColumn } from '../Common/TemplateEditor';


const { Title, Text } = Typography;
const { Panel } = Collapse;

export const DEFAULT_FIELD_CONFIG: TemplateColumn[] = [
  { key: 'empIdNo', name: 'Employee ID', required: true, type: 'string', systemLabel: 'Employee ID' },
  { key: 'name', name: 'Full Name', required: true, type: 'string', systemLabel: 'Full Name' },
  { key: 'dateOfJoining', name: 'Date of Joining', required: true, type: 'date', systemLabel: 'Date of Joining' },
  { key: 'department', name: 'Department', required: true, type: 'string', systemLabel: 'Department' },
  { key: 'designation', name: 'Designation', required: true, type: 'string', systemLabel: 'Designation' },
  { key: 'gender', name: 'Gender', required: true, type: 'string', systemLabel: 'Gender' },
  { key: 'fixedStipend', name: 'Fixed Stipend', required: true, type: 'number', systemLabel: 'Fixed Stipend' },
  { key: 'fatherName', name: "Father's Name", required: true, type: 'string', systemLabel: "Father's Name" },
  { key: 'permanentAddress', name: 'Permanent Address', required: true, type: 'string', systemLabel: 'Permanent Address' },
  { key: 'communicationAddress', name: 'Communication Address', required: true, type: 'string', systemLabel: 'Communication Address' },
  { key: 'contactNumber', name: 'Contact Number', required: true, type: 'string', systemLabel: 'Contact Number' },
  { key: 'emergencyContactNumber', name: 'Emergency Contact', required: true, type: 'string', systemLabel: 'Emergency Contact' },
  { key: 'qualification', name: 'Qualification', required: true, type: 'string', systemLabel: 'Qualification' },
  { key: 'qualificationTrade', name: 'Qualification Trade', required: false, type: 'string', systemLabel: 'Qualification Trade' },
  { key: 'bloodGroup', name: 'Blood Group', required: true, type: 'string', systemLabel: 'Blood Group' },
  { key: 'adharNumber', name: 'Aadhar Number', required: true, type: 'string', systemLabel: 'Aadhar Number' },
  { key: 'panNumber', name: 'PAN Number', required: true, type: 'string', systemLabel: 'PAN Number' },
  { key: 'bankName', name: 'Bank Name', required: true, type: 'string', systemLabel: 'Bank Name' },
  { key: 'accountNumber', name: 'Account Number', required: true, type: 'string', systemLabel: 'Account Number' },
  { key: 'ifscCode', name: 'IFSC Code', required: true, type: 'string', systemLabel: 'IFSC Code' },
  { key: 'branch', name: 'Branch', required: true, type: 'string', systemLabel: 'Branch' },
  { key: 'category', name: 'Category', required: true, type: 'string', systemLabel: 'Category' },
  { key: 'DOB', name: 'Date of Birth', required: true, type: 'date', systemLabel: 'Date of Birth' },
  { key: 'salaryType', name: 'Salary Type', required: true, type: 'string', systemLabel: 'Salary Type' },
  { key: 'employeeCategory', name: 'Employee Category', required: true, type: 'string', systemLabel: 'Employee Category' },
];


const ImportExcel: React.FC<{ onSuccess?: () => void }> = ({ onSuccess }) => {
  const { message } = App.useApp();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [importSummary, setImportSummary] = useState<{ success: number; errors: string[] }>({ success: 0, errors: [] });
  const [isConfirming, setIsConfirming] = useState(false);
  const { selectedCompany } = useCompany();
  const [templateColumns, setTemplateColumns] = useState<TemplateColumn[]>(DEFAULT_FIELD_CONFIG);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);

  // Load saved template preference on mount or company change
  React.useEffect(() => {
    if (selectedCompany?._id) {
      const saved = localStorage.getItem(`emp_import_template_${selectedCompany._id}`);
      if (saved) {
        try {
          setTemplateColumns(JSON.parse(saved));
        } catch (e) {
          console.error('Failed to load saved template', e);
        }
      } else {
        setTemplateColumns(DEFAULT_FIELD_CONFIG);
      }
    }
  }, [selectedCompany]);

  const saveTemplate = (newColumns: TemplateColumn[]) => {
    setTemplateColumns(newColumns);
    if (selectedCompany?._id) {
      localStorage.setItem(`emp_import_template_${selectedCompany._id}`, JSON.stringify(newColumns));
    }
  };

  const parseDateValue = (value: any): string | null => {
    if (!value) return null;
    if (typeof value === 'number') {
      try {
        const date = new Date((value - 25569) * 86400 * 1000);
        return date.toISOString().split('T')[0];
      } catch (e) {
        return null;
      }
    }
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
    return null;
  };

  const downloadTemplate = useCallback(() => {
    try {
      // Use the configured columns for headers
      const headers = ["Sr-No-", ...templateColumns.map(col => col.name)];

      // Generate sample data based on columns
      const sampleRow = templateColumns.map(col => {
        if (col.key === 'empIdNo') return "EMP1001";
        if (col.key === 'name') return "John Doe";
        if (col.key === 'fixedStipend') return 25000;
        if (col.type === 'date') return "2023-01-15";
        return "Sample";
      });

      const sampleData = [["1", ...sampleRow]];

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);
      ws['!cols'] = headers.map(() => ({ width: 20 }));
      XLSX.utils.book_append_sheet(wb, ws, "Employees");
      XLSX.writeFile(wb, "Levivaan_Employee_Template.xlsx");
      message.success('Customized template downloaded');
    } catch (error) {

      console.error('Template download error:', error);
      message.error('Failed to download template');
    }
  }, [message, templateColumns]);

  const handleFile = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (jsonData.length < 2) {
          message.error('File is empty or missing headers');
          return;
        }

        const headers = jsonData[0] as string[];
        const headerMap = new Map<string, number>();
        headers.forEach((h, idx) => {
          if (!h) return;
          // Robust normalization: remove everything except alphanumeric
          const normalized = h.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
          headerMap.set(normalized, idx);
        });

        const parsedEntries: any[] = [];
        const errors: string[] = [];

        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i] as any[];
          if (!row || row.length === 0 || !row.some(c => c)) continue;

          const employee: any = { company: selectedCompany?._id };
          let missingFields: string[] = [];

          // Use templateColumns to map data
          templateColumns.forEach(field => {
            // Robust matching logic
            const templateNameNorm = field.name.toLowerCase().replace(/[^a-z0-9]/g, '');
            const systemLabelNorm = (field.systemLabel || '').toLowerCase().replace(/[^a-z0-9]/g, '');
            const keyNorm = field.key.toLowerCase().replace(/[^a-z0-9]/g, '');

            let colIdx = headerMap.get(templateNameNorm);
            if (colIdx === undefined && systemLabelNorm) colIdx = headerMap.get(systemLabelNorm);
            if (colIdx === undefined) colIdx = headerMap.get(keyNorm);

            if (colIdx !== undefined && row[colIdx] !== undefined) {
              let val = row[colIdx];
              if (field.type === 'number') val = Number(val) || 0;
              else if (field.type === 'date') val = parseDateValue(val);
              else val = String(val).trim();

              if (field.key.startsWith('custom_')) {
                if (!employee.customFields) employee.customFields = {};
                // extract readable name from key custom_field_name -> Field Name or just use field.name
                employee.customFields[field.name] = val;
              } else {
                employee[field.key] = val;
              }
            } else if (field.required) {
              missingFields.push(field.name);
            }
          });


          if (missingFields.length > 0) {
            errors.push(`Row ${i + 1}: Missing [${missingFields.join(', ')}]`);
          } else {
            parsedEntries.push(employee);
          }
        }

        setPreviewData(parsedEntries);
        setImportSummary({ success: parsedEntries.length, errors });
        setIsConfirming(true);
      } catch (err) {
        console.error('File parse error:', err);
        message.error('Failed to parse Excel file');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const confirmImport = async () => {
    setLoading(true);
    let successCount = 0;
    try {
      for (const emp of previewData) {
        await employeeService.createEmployee(emp);
        successCount++;
      }
      message.success(`Imported ${successCount} employees successfully`);
      onSuccess?.();
      handleCancel();
    } catch (error: any) {
      message.error(`Import failed after ${successCount} records: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setOpen(false);
    setIsConfirming(false);
    setPreviewData([]);
    setImportSummary({ success: 0, errors: [] });
  };

  const columns = [
    { title: 'ID', dataIndex: 'empIdNo', key: 'empIdNo' },
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Dept', dataIndex: 'department', key: 'department' },
    { title: 'Salary', dataIndex: 'fixedStipend', key: 'fixedStipend', render: (v: number) => `₹${v}` },
  ];

  const uploadProps: UploadProps = {
    accept: '.xlsx,.xls',
    beforeUpload: (file) => {
      handleFile(file);
      return false;
    },
    showUploadList: false,
  };

  return (
    <>
      <Button icon={<FileExcelOutlined />} onClick={() => setOpen(true)}>
        Import Excel
      </Button>

      <Modal
        title={isConfirming ? "Confirm Employee Import" : "Import Employees from Excel"}
        open={open}
        onCancel={handleCancel}
        width={900}
        footer={isConfirming ? [
          <Button key="back" onClick={() => setIsConfirming(false)}>Back</Button>,
          <Button key="submit" type="primary" loading={loading} onClick={confirmImport} disabled={previewData.length === 0}>
            Confirm Import ({previewData.length} records)
          </Button>
        ] : [
          <Button key="close" onClick={handleCancel}>Close</Button>
        ]}
      >
        {!isConfirming ? (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Alert
              message="Instructions"
              description={
                <ul>
                  <li>Download the template to see the required column structure.</li>
                  <li>Fields marked with <b>*</b> are mandatory.</li>
                  <li>Employee IDs must be unique.</li>
                </ul>
              }
              type="info"
              showIcon
            />

            <div style={{ textAlign: 'center', padding: '40px', border: '2px dashed #d9d9d9', borderRadius: '12px' }}>
              <Upload {...uploadProps}>
                <Button icon={<UploadOutlined />} size="large" type="primary">
                  Click to Upload Excel File
                </Button>
              </Upload>
              <div style={{ marginTop: '20px' }}>
                <Space>
                  <Button type="default" icon={<DownloadOutlined />} onClick={downloadTemplate}>
                    Download Template
                  </Button>
                  <Tooltip title="Edit Template Columns">
                    <Button icon={<SettingOutlined />} onClick={() => setShowTemplateEditor(true)}>
                      Edit Template
                    </Button>
                  </Tooltip>
                </Space>
              </div>

              <TemplateEditor
                visible={showTemplateEditor}
                onClose={() => setShowTemplateEditor(false)}
                onSave={saveTemplate}
                availableFields={DEFAULT_FIELD_CONFIG.map(f => ({
                  key: f.key,
                  label: f.systemLabel || f.name,
                  type: f.type,
                  required: f.required
                }))}
                currentColumns={templateColumns}
                title="Edit Employee Import Template"
                allowCustomFields={true}
              />
            </div>
          </Space>
        ) : (
          <div>
            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
              <Card style={{ flex: 1, textAlign: 'center', background: '#f6ffed' }}>
                <Text type="success" strong><CheckCircleOutlined /> Valid: {previewData.length}</Text>
              </Card>
              <Card style={{ flex: 1, textAlign: 'center', background: importSummary.errors.length > 0 ? '#fff2e8' : '#f5f5f5' }}>
                <Text type={importSummary.errors.length > 0 ? "warning" : "secondary"} strong>
                  <ExclamationCircleOutlined /> Invalid: {importSummary.errors.length}
                </Text>
              </Card>
            </div>

            {importSummary.errors.length > 0 && (
              <Collapse style={{ marginBottom: '24px' }}>
                <Panel header={<Text type="danger">View Validation Errors ({importSummary.errors.length})</Text>} key="1">
                  <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {importSummary.errors.map((err, i) => (
                      <div key={i} style={{ marginBottom: '4px', borderBottom: '1px solid #f0f0f0' }}>- {err}</div>
                    ))}
                  </div>
                </Panel>
              </Collapse>
            )}

            <Title level={5}>Preview (Top 10 valid records)</Title>
            <Table
              dataSource={previewData.slice(0, 10)}
              columns={columns}
              pagination={false}
              size="small"
              rowKey="empIdNo"
              bordered
            />
          </div>
        )}
      </Modal>
    </>
  );
};

export default ImportExcel;