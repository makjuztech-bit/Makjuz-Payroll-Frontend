import React, { useState, useCallback } from 'react';
import { Modal, Button, Upload, message, Space, Typography, Alert, App } from 'antd';
import { UploadOutlined, WarningOutlined, DownloadOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';
import type { UploadFile, UploadProps } from 'antd/es/upload';
import { useCompany } from '../../context/CompanyContext';
import employeeService from '../../services/employeeService';

const { Dragger } = Upload;
const { Text } = Typography;

const ImportExcel: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const { selectedCompany } = useCompany();

  // Field configuration with validation rules
  const FIELD_CONFIG = [
    { key: 'empIdNo', name: 'Employee ID', required: true, type: 'string', maxLength: 20 },
    { key: 'name', name: 'Full Name', required: true, type: 'string', maxLength: 100 },
    { key: 'dateOfJoining', name: 'Date of Joining', required: true, type: 'date' },
    { key: 'department', name: 'Department', required: true, type: 'string', maxLength: 50 },
    { key: 'designation', name: 'Designation', required: true, type: 'string', maxLength: 50 },
    { key: 'gender', name: 'Gender', required: true, type: 'enum', values: ['Male', 'Female', 'Other'] },
    { key: 'fixedStipend', name: 'Fixed Stipend', required: true, type: 'number', min: 0 },
    { key: 'fatherName', name: "Father's Name", required: true, type: 'string', maxLength: 100 },
    { key: 'permanentAddress', name: 'Permanent Address', required: true, type: 'string', maxLength: 200 },
    { key: 'communicationAddress', name: 'Communication Address', required: true, type: 'string', maxLength: 200 },
    { key: 'contactNumber', name: 'Contact Number', required: true, type: 'string', pattern: /^[0-9]{10}$/ },
    { key: 'emergencyContactNumber', name: 'Emergency Contact', required: true, type: 'string', pattern: /^[0-9]{10}$/ },
    { key: 'qualification', name: 'Qualification', required: true, type: 'string', maxLength: 100 },
    { key: 'qualificationTrade', name: 'Qualification Trade', required: false, type: 'string', maxLength: 100 },
    { key: 'bloodGroup', name: 'Blood Group', required: true, type: 'string', pattern: /^(A|B|AB|O)[+-]$/ },
    { key: 'adharNumber', name: 'Aadhar Number', required: true, type: 'string', pattern: /^[0-9]{12}$/ },
    { key: 'panNumber', name: 'PAN Number', required: true, type: 'string', pattern: /^[A-Z]{5}[0-9]{4}[A-Z]$/ },
    { key: 'bankName', name: 'Bank Name', required: true, type: 'string', maxLength: 100 },
    { key: 'accountNumber', name: 'Account Number', required: true, type: 'string', maxLength: 20 },
    { key: 'ifscCode', name: 'IFSC Code', required: true, type: 'string', pattern: /^[A-Z]{4}0[A-Z0-9]{6}$/ },
    { key: 'branch', name: 'Branch', required: true, type: 'string', maxLength: 100 },
    { key: 'photo', name: 'Photo URL', required: false, type: 'string' },
    { key: 'experience', name: 'Experience', required: false, type: 'string' },
    { key: 'uan', name: 'UAN Number', required: false, type: 'string' },
    { key: 'esiNumber', name: 'ESI Number', required: false, type: 'string' },
    { key: 'insuranceNumber', name: 'Insurance Number', required: false, type: 'string' },
    { key: 'category', name: 'Category', required: true, type: 'string' },
    { key: 'status', name: 'Status', required: false, type: 'string', default: 'Active' },
    { key: 'dateOfBirth', name: 'Date of Birth', required: true, type: 'date', minAge: 18 },
    { key: 'salaryType', name: 'Salary Type', required: true, type: 'enum', values: ['Wages', 'Salary'] },
    { key: 'employeeCategory', name: 'Employee Category', required: true, type: 'enum', values: ['NAPS', 'NON-NAPS', 'NATS', 'NON-NATS'] },
  ];

  const showModal = useCallback(() => {
    if (!selectedCompany) {
      message.warning('Please select a company first');
      return;
    }
    setOpen(true);
  }, [selectedCompany]);

  const handleCancel = useCallback(() => {
    setOpen(false);
    setFileList([]);
    setValidationErrors([]);
    setShowErrorModal(false);
    setLoading(false);
  }, []);

  const downloadTemplate = useCallback(() => {
    try {
      const headers = FIELD_CONFIG.map(field => 
        `${field.name}${field.required ? '*' : ''}`
      );

      const sampleData = [
        [
          "EMP1001", "John Doe", "2023-01-15", "IT", "Developer", "Male", 50000,
          "Robert Doe", "123 Main St", "123 Main St", "9876543210", "9876543211",
          "B.Tech", "Computer Science", "A+", "123412341234", "ABCDE1234F",
          "State Bank", "123456789012", "SBIN0001234", "Main Branch", "", "",
          "", "", "", "Regular", "Active", "1990-05-20", "Salary", "NON-NAPS"
        ],
        [
          "EMP1002", "Jane Smith", "2023-02-20", "HR", "Manager", "Female", 60000,
          "William Smith", "456 Park Ave", "456 Park Ave", "8765432109", "8765432108",
          "MBA", "Human Resources", "B+", "234523452345", "BCDPQ5678E",
          "HDFC Bank", "234567890123", "HDFC0005678", "Park Street", "", "",
          "", "", "", "Contract", "Active", "1985-11-15", "Salary", "NAPS"
        ]
      ];

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);

      // Set column widths
      const cols = headers.map(() => ({ width: 20 }));
      ws['!cols'] = cols;

      XLSX.utils.book_append_sheet(wb, ws, "Employees");
      XLSX.writeFile(wb, "Employee_Import_Template.xlsx");
      message.success('Template downloaded successfully');
    } catch (error) {
      console.error('Template download error:', error);
      message.error('Failed to download template');
    }
  }, []);

  // FIXED: Unified date parsing function with proper Excel date handling
  const parseDateValue = (value: any): string | null => {
    if (value === null || value === undefined) return null;
    
    // If it's already a valid date string, return it
    if (typeof value === 'string' && !isNaN(Date.parse(value))) {
      return value;
    }
    
    // Handle Excel date numbers
    if (typeof value === 'number' && value > 0) {
      try {
        // FIXED: Proper Excel date serial number conversion
        // Excel uses 1900-01-01 as epoch, but treats 1900 as a leap year (it's not)
        // So we need to subtract 1 day for dates after Feb 28, 1900
        const EXCEL_EPOCH = new Date(1900, 0, 1).getTime();
        const MS_PER_DAY = 24 * 60 * 60 * 1000;
        
        // Convert Excel serial number to JavaScript date
        let jsDate = new Date(EXCEL_EPOCH + (value - 1) * MS_PER_DAY);
        
        // Account for Excel's leap year bug (1900 is not a leap year)
        if (value > 59) {
          jsDate = new Date(jsDate.getTime() - MS_PER_DAY);
        }
        
        if (!isNaN(jsDate.getTime())) {
          return jsDate.toISOString().split('T')[0];
        }
      } catch (error) {
        console.error('Error parsing Excel date:', error);
      }
    }
    
    if (value instanceof Date && !isNaN(value.getTime())) {
      return value.toISOString().split('T')[0];
    }
    
    return null;
  };

  // FIXED: Create header mapping for flexible column ordering
  const createHeaderMapping = (headers: string[]): Map<string, number> => {
    const headerMap = new Map<string, number>();
    
    headers.forEach((header, index) => {
      // Normalize header by removing * and trimming
      const normalizedHeader = header.replace('*', '').trim();
      
      // Find matching field config
      const fieldConfig = FIELD_CONFIG.find(field => 
        field.name.toLowerCase() === normalizedHeader.toLowerCase()
      );
      
      if (fieldConfig) {
        headerMap.set(fieldConfig.key, index);
      }
    });
    
    return headerMap;
  };

  const validateField = (field: any, value: any, rowIndex: number): string | null => {
    // Check required fields
    if (field.required && (value === '' || value === null || value === undefined)) {
      return `Row ${rowIndex}: ${field.name} is required`;
    }

    // If value is empty and not required, skip validation
    if (value === '' || value === null || value === undefined) {
      return null;
    }

    try {
      switch (field.type) {
        case 'string':
          const strValue = String(value).trim();
          if (field.maxLength && strValue.length > field.maxLength) {
            return `Row ${rowIndex}: ${field.name} must be ≤ ${field.maxLength} characters`;
          }
          if (field.pattern && !field.pattern.test(strValue)) {
            return `Row ${rowIndex}: ${field.name} format is invalid`;
          }
          break;
        case 'number':
          const numValue = Number(value);
          if (isNaN(numValue)) {
            return `Row ${rowIndex}: ${field.name} must be a number`;
          }
          if (field.min !== undefined && numValue < field.min) {
            return `Row ${rowIndex}: ${field.name} must be ≥ ${field.min}`;
          }
          break;
        case 'date':
          const dateStr = parseDateValue(value);
          if (!dateStr) {
            return `Row ${rowIndex}: ${field.name} must be a valid date`;
          }
          
          if (field.minAge) {
            const birthDate = new Date(dateStr);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
              age--;
            }
            
            if (age < field.minAge) {
              return `Row ${rowIndex}: ${field.name} - Employee must be ≥ ${field.minAge} years old`;
            }
          }
          break;
        case 'enum':
          if (field.values && !field.values.includes(value)) {
            return `Row ${rowIndex}: ${field.name} must be one of: ${field.values.join(', ')}`;
          }
          break;
      }
    } catch (error) {
      console.error('Validation error:', error);
      return `Row ${rowIndex}: ${field.name} validation failed`;
    }

    return null;
  };

  const handleSubmit = useCallback(async () => {
    if (!selectedCompany) {
      message.warning('Please select a company first');
      return;
    }

    if (fileList.length === 0) {
      message.error('Please select an Excel file first.');
      return;
    }

    const file = fileList[0].originFileObj as File;
    if (!file) {
      message.error('File not found');
      return;
    }

    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        setLoading(true);
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array', cellDates: true });
        const ws = wb.Sheets[wb.SheetNames[0]];

        // Convert to JSON with header row
        const jsonData = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
        
        if (jsonData.length < 2) {
          message.warning('Excel file must contain at least a header row and one data row');
          setLoading(false);
          return;
        }

        // FIXED: Create header mapping for flexible column ordering
        const headers = jsonData[0] as string[];
        const headerMap = createHeaderMapping(headers);

        // Check if all required fields are present
        const missingFields = FIELD_CONFIG
          .filter(field => field.required && !headerMap.has(field.key))
          .map(field => field.name);

        if (missingFields.length > 0) {
          setValidationErrors([
            `Missing required columns: ${missingFields.join(', ')}`,
            'Please ensure your Excel file contains all required columns.'
          ]);
          setShowErrorModal(true);
          setLoading(false);
          return;
        }

        const employees = [];
        const errors: string[] = [];

        // Process data rows (skip header)
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i] as any[];
          
          // Skip empty rows
          if (!row || row.length === 0 || !row[0]) continue;

          const employee: Record<string, any> = { 
            company: selectedCompany._id,
            payrunDetails: {}
          };
          
          let rowHasErrors = false;

          // FIXED: Process each field using header mapping
          FIELD_CONFIG.forEach((field) => {
            const colIndex = headerMap.get(field.key);
            
            // Skip if column doesn't exist in Excel
            if (colIndex === undefined) {
              if (field.required) {
                errors.push(`Row ${i + 1}: Missing required field ${field.name}`);
                rowHasErrors = true;
              }
              return;
            }

            let value = row[colIndex];
            
            // Apply default value if empty and default exists
            if ((value === '' || value === null || value === undefined) && field.default) {
              value = field.default;
            }

            // Convert types based on frontend schema
            switch (field.type) {
              case 'number':
                value = value ? Number(value) : (field.required ? null : 0);
                break;
              case 'date':
                value = parseDateValue(value);
                break;
              default:
                value = value ? String(value).trim() : '';
            }

            // Validate field
            const error = validateField(field, value, i + 1);
            if (error) {
              errors.push(error);
              rowHasErrors = true;
            }

            employee[field.key] = value;
          });

          if (!rowHasErrors) {
            employees.push(employee);
          }
        }

        // Show validation errors if any
        if (errors.length > 0) {
          setValidationErrors(errors);
          setShowErrorModal(true);
          setLoading(false);
          return;
        }

        if (employees.length === 0) {
          message.warning('No valid employee records found to import');
          setLoading(false);
          return;
        }

        // FIXED: Enhanced duplicate checking with better error handling
        try {
          const existingEmployees = await employeeService.getAllEmployees(selectedCompany._id);
          const existingEmpIds = new Set(
            existingEmployees.map(emp => emp.empIdNo?.toString().toUpperCase())
          );

          const duplicateRows = employees.filter(emp => 
            existingEmpIds.has(emp.empIdNo?.toString().toUpperCase())
          );

          if (duplicateRows.length > 0) {
            const duplicateMessages = duplicateRows.map(emp => {
              const rowIndex = employees.findIndex(e => e.empIdNo === emp.empIdNo) + 2;
              return `Row ${rowIndex}: Employee ID ${emp.empIdNo} already exists`;
            });
            setValidationErrors(duplicateMessages);
            setShowErrorModal(true);
            setLoading(false);
            return;
          }

          // Import new employees with better error handling
          const results = await Promise.allSettled(
            employees.map(emp => employeeService.createEmployee(emp))
          );

          const successful = results.filter(r => r.status === 'fulfilled').length;
          const failed = results.filter(r => r.status === 'rejected').length;

          if (successful > 0) {
            message.success(`Successfully imported ${successful} employees`);
          }
          if (failed > 0) {
            const failedErrors = results
              .filter(r => r.status === 'rejected')
              .map((r, index) => {
                const error = (r as PromiseRejectedResult).reason;
                return `Employee ${index + 1}: ${error.response?.data?.message || error.message}`;
              });
            
            setValidationErrors(failedErrors);
            setShowErrorModal(true);
            setLoading(false);
            return;
          }

          handleCancel();
        } catch (error: any) {
          console.error('Import error:', error);
          const errorMessage = error.response?.data?.message || error.message || 'Failed to import employees';
          setValidationErrors([errorMessage]);
          setShowErrorModal(true);
        }
      } catch (err: any) {
        console.error('Excel processing error:', err);
        message.error('Failed to process Excel file. Please check the file format.');
        setValidationErrors([
          'Failed to process Excel file',
          'Please ensure the file is a valid Excel format (.xlsx or .xls)',
          err.message || 'Unknown error occurred'
        ]);
        setShowErrorModal(true);
      } finally {
        setLoading(false);
      }
    };

    reader.onerror = () => {
      message.error('Failed to read file');
      setLoading(false);
    };

    reader.readAsArrayBuffer(file);
  }, [fileList, selectedCompany, handleCancel]);

  const uploadProps: UploadProps = {
    accept: '.xlsx,.xls',
    multiple: false,
    maxCount: 1,
    fileList,
    beforeUpload: (file) => {
      // FIXED: Add file size validation
      const isValidSize = file.size / 1024 / 1024 < 10; // 10MB limit
      if (!isValidSize) {
        message.error('File size must be less than 10MB');
        return false;
      }
      return false; // Prevent automatic upload
    },
    onChange(info) {
      setFileList(info.fileList.slice(-1)); // Keep only the last file
    },
    onRemove() {
      setFileList([]);
    },
  };

  return (
    <App>
      <Space>
        <Button 
          type="primary" 
          icon={<UploadOutlined />} 
          onClick={showModal}
          disabled={!selectedCompany}
        >
          Import Excel
        </Button>
        <Button 
          icon={<DownloadOutlined />}
          onClick={downloadTemplate}
        >
          Download Template
        </Button>
      </Space>

      <Modal
        title="Import Employees from Excel"
        open={open}
        onCancel={handleCancel}
        onOk={handleSubmit}
        okText="Import"
        width={800}
        destroyOnClose
        confirmLoading={loading}
        okButtonProps={{ disabled: fileList.length === 0 }}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Alert
            message="Import Guidelines"
            description={
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                <li>Download and use the provided template format</li>
                <li>Fields marked with * are mandatory</li>
                <li>Dates should be in YYYY-MM-DD format (e.g., 1990-05-20)</li>
                <li>Fixed Stipend must be numbers only (no currency symbols)</li>
                <li>Employee must be at least 18 years old</li>
                <li>Employee ID must be unique within the company</li>
                <li>File size limit: 10MB</li>
              </ul>
            }
            type="info"
            showIcon
          />
          <Dragger {...uploadProps}>
            <p className="ant-upload-drag-icon">
              <UploadOutlined />
            </p>
            <p className="ant-upload-text">Click or drag Excel file to this area</p>
            <p className="ant-upload-hint">Supports .xlsx and .xls files only (max 10MB)</p>
          </Dragger>
        </Space>
      </Modal>

      <Modal
        title={<><WarningOutlined style={{ color: '#faad14' }} /> Import Issues Detected</>}
        open={showErrorModal}
        onCancel={() => setShowErrorModal(false)}
        footer={[
          <Button key="close" onClick={() => setShowErrorModal(false)}>
            Close
          </Button>
        ]}
        width={600}
      >
        <Alert
          message="Cannot complete import"
          description="Please correct the following issues and try again:"
          type="warning"
          showIcon
        />
        <div style={{ 
          maxHeight: 300, 
          overflow: 'auto', 
          marginTop: 16,
          padding: 8,
          backgroundColor: '#fafafa',
          borderRadius: 4
        }}>
          {validationErrors.map((item, index) => (
            <Text key={index} type="warning" style={{ display: 'block', marginBottom: 8 }}>
              • {item}
            </Text>
          ))}
        </div>
      </Modal>
    </App>
  );
};

export default ImportExcel;