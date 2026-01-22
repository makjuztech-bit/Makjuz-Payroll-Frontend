import React, { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  Button,
  Table,
  Upload,
  Space,
  message,
  Input,
  Row,
  Col
} from 'antd';
import {
  UploadOutlined,
  FileOutlined,
  DeleteOutlined,
  SearchOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { useCompany } from '../../context/CompanyContext';
import employeeService from '../../services/employeeService';
import documentService from '../../services/documentService';
import type { Employee } from '../../context/CompanyContext';

const { Title } = Typography;

const DocumentsPage: React.FC = () => {
  const { selectedCompany } = useCompany();
  const [employeeDocuments, setEmployeeDocuments] = useState<Record<string, { fileName: string; uploadedAt: string }>>({});
  const [searchText, setSearchText] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchEmployees = async () => {
      if (!selectedCompany?._id) return;

      setLoading(true);
      try {
        const data = await employeeService.getAllEmployees(selectedCompany._id);
        setEmployees(data);

        // Fetch documents for all employees
        const documents: Record<string, { fileName: string; uploadedAt: string }> = {};
        for (const employee of data) {
          const doc = await documentService.getEmployeeDocument(employee.id.toString());
          if (doc) {
            documents[employee.id] = {
              fileName: doc.fileName,
              uploadedAt: doc.uploadedAt
            };
          }
        }
        setEmployeeDocuments(documents);
      } catch (error) {
        console.error('Error fetching employees:', error);
        message.error('Failed to fetch employees');
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, [selectedCompany]);

  const handleUpload = async (employeeId: number, info: any) => {
    const file = info.file;
    if (!file) return;

    try {
      const result = await documentService.uploadDocument(employeeId.toString(), file);
      setEmployeeDocuments(prev => ({
        ...prev,
        [employeeId]: {
          fileName: result.fileName,
          uploadedAt: result.uploadedAt
        }
      }));
      message.success(`${file.name} uploaded successfully`);
    } catch (error) {
      console.error('Upload error:', error);
      message.error(`${file.name} upload failed.`);
    }
  };

  const handleDelete = async (employeeId: number) => {
    try {
      await documentService.deleteDocument(employeeId.toString());
      setEmployeeDocuments(prev => {
        const newDocs = { ...prev };
        delete newDocs[employeeId];
        return newDocs;
      });
      message.success('Document deleted successfully');
    } catch (error) {
      console.error('Delete error:', error);
      message.error('Failed to delete document');
    }
  };

  const handleView = async (employeeId: number) => {
    try {
      const doc = await documentService.getEmployeeDocument(employeeId.toString());
      if (doc) {
        // Create a Blob from the base64 content
        const byteCharacters = atob(doc.fileContent || '');
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: doc.fileType });

        // Create download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Download error:', error);
      message.error('Failed to download document');
    }
  };

  const filteredEmployees = employees.filter(emp => {
    const searchLower = searchText.toLowerCase();
    return emp.empIdNo.toLowerCase().includes(searchLower) ||
      emp.name.toLowerCase().includes(searchLower);
  });

  const columns = [
    {
      title: 'Employee ID',
      dataIndex: 'empIdNo',
      key: 'empIdNo',
    },
    {
      title: 'Employee Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Document',
      key: 'document',
      render: (_: any, record: Employee) => {
        const hasDocument = employeeDocuments[record.id];
        return hasDocument ? (
          <Space>
            <FileOutlined />
            {hasDocument.fileName}
            <span style={{ color: '#888', fontSize: '12px' }}>
              {new Date(hasDocument.uploadedAt).toLocaleDateString()}
            </span>
          </Space>
        ) : (
          <Upload
            customRequest={async ({ file, onSuccess, onError }) => {
              try {
                // @ts-ignore
                await handleUpload(record.id, { file });
                onSuccess?.("ok");
              } catch (err) {
                onError?.(err as Error);
              }
            }}
            showUploadList={false}
          >
            <Button type="primary" icon={<UploadOutlined />}>
              Upload Document
            </Button>
          </Upload>
        );
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Employee) => (
        employeeDocuments[record.id] ? (
          <Space>
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleView(record.id)}
            />
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record.id)}
            />
          </Space>
        ) : null
      ),
    },
  ];

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24 }}>Documents Management</Title>

      {selectedCompany ? (
        <Card variant="outlined" style={{ borderRadius: '8px' }}>
          <Row justify="space-between" style={{ marginBottom: 16 }}>
            <Col>
              <Input
                placeholder="Search by Employee ID or Name"
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                style={{ width: 300 }}
                allowClear
              />
            </Col>
          </Row>

          <Table
            columns={columns}
            dataSource={filteredEmployees}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
          />
        </Card>
      ) : (
        <Card variant="outlined" style={{ borderRadius: '8px' }}>
          <div style={{ textAlign: 'center', padding: '24px' }}>
            Please select a company to manage documents
          </div>
        </Card>
      )}


    </div>
  );
};

export default DocumentsPage;