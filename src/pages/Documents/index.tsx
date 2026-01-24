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
  Col,
  Modal,
  List,
  Tooltip,
  Divider
} from 'antd';
import {
  FileOutlined,
  DeleteOutlined,
  SearchOutlined,
  EyeOutlined,
  DownloadOutlined,
  PlusOutlined
} from '@ant-design/icons';
import { useCompany } from '../../context/CompanyContext';
import employeeService from '../../services/employeeService';
import documentService, { DocumentResponse } from '../../services/documentService';
import type { Employee } from '../../context/CompanyContext';

const { Title, Text } = Typography;

const DocumentsPage: React.FC = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const { selectedCompany } = useCompany();
  // Map employeeId -> Array of Documents
  const [employeeDocuments, setEmployeeDocuments] = useState<Record<string, DocumentResponse[]>>({});
  const [searchText, setSearchText] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);

  const fetchAllData = async () => {
    if (!selectedCompany?._id) return;

    setLoading(true);
    try {
      const data = await employeeService.getAllEmployees(selectedCompany._id);
      setEmployees(data);

      // Fetch documents for all employees in one batch
      const employeeIds = data.map(e => e.id.toString());
      if (employeeIds.length > 0) {
        const docs = await documentService.getDocumentsBatch(employeeIds);

        const documentsMap: Record<string, DocumentResponse[]> = {};

        // Initialize arrays
        employeeIds.forEach(id => {
          documentsMap[id] = [];
        });

        // Group by employeeId
        docs.forEach((doc: any) => {
          if (doc.employeeId) {
            if (!documentsMap[doc.employeeId]) {
              documentsMap[doc.employeeId] = [];
            }
            documentsMap[doc.employeeId].push(doc);
          }
        });
        setEmployeeDocuments(documentsMap);
      } else {
        setEmployeeDocuments({});
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      messageApi.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [selectedCompany]);

  const handleOpenModal = (employee: Employee) => {
    setCurrentEmployee(employee);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentEmployee(null);
  };

  const handleUpload = async (file: File) => {
    if (!currentEmployee) return;

    try {
      const result = await documentService.uploadDocument(currentEmployee.id.toString(), file);

      // Update state locally
      setEmployeeDocuments(prev => {
        const empId = currentEmployee.id.toString();
        const currentDocs = prev[empId] || [];
        return {
          ...prev,
          [empId]: [result, ...currentDocs] // Add new doc to top
        };
      });

      messageApi.success(`${file.name} uploaded successfully`);
    } catch (error) {
      console.error('Upload error:', error);
      messageApi.error(`${file.name} upload failed.`);
    }
  };

  const handleDeleteDoc = async (docId: string, employeeId: string) => {
    try {
      await documentService.deleteDocument(docId);

      setEmployeeDocuments(prev => {
        const currentDocs = prev[employeeId] || [];
        return {
          ...prev,
          [employeeId]: currentDocs.filter(d => d._id !== docId)
        };
      });

      messageApi.success('Document deleted successfully');
    } catch (error) {
      console.error('Delete error:', error);
      messageApi.error('Failed to delete document');
    }
  };

  const handleDownloadDoc = (doc: DocumentResponse) => {
    try {
      // If content is present, download it (it might not be full content based on API, but service seems to return full object)
      // Wait, batch API usually returns full object? 
      // If fileContent is huge, batch might optimize it out. But currently service code returns full docs.

      // If fileContent is missing (e.g. optimized backend), we might need to fetch individual doc. 
      // Assuming current implementation returns content.
      let content = doc.fileContent;
      if (!content) {
        messageApi.error("Document content missing. Try re-fetching/viewing individually not implemented yet for lightweight batch.");
        return;
      }

      const byteCharacters = atob(content);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: doc.fileType });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
      messageApi.error('Failed to download document');
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
      title: 'Documents',
      key: 'document',
      render: (_: any, record: Employee) => {
        const docs = employeeDocuments[record.id] || [];
        const count = docs.length;

        return (
          <Space>
            <Text>{count} {count === 1 ? 'Document' : 'Documents'}</Text>
          </Space>
        );
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Employee) => (
        <Space>
          <Tooltip title="Manage Documents">
            <Button
              type="primary"
              ghost
              icon={<EyeOutlined />}
              onClick={() => handleOpenModal(record)}
            >
              View / Edit
            </Button>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24 }}>Documents Management</Title>
      {contextHolder}

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

      {/* Document Management Modal */}
      <Modal
        title={`Documents: ${currentEmployee?.name} (${currentEmployee?.empIdNo})`}
        open={isModalOpen}
        onCancel={handleCloseModal}
        footer={[
          <Button key="close" onClick={handleCloseModal}>Close</Button>
        ]}
        width={700}
      >
        <div style={{ marginBottom: 20 }}>
          <Upload
            customRequest={async ({ file, onSuccess, onError }) => {
              try {
                // @ts-ignore
                await handleUpload(file);
                onSuccess?.("ok");
              } catch (err) {
                onError?.(err as Error);
              }
            }}
            showUploadList={false}
            multiple
          >
            <Button type="primary" icon={<PlusOutlined />}>Add New Document</Button>
          </Upload>
        </div>

        <Divider />

        <List
          itemLayout="horizontal"
          dataSource={currentEmployee ? (employeeDocuments[currentEmployee.id] || []) : []}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Button
                  key="download"
                  type="text"
                  icon={<DownloadOutlined />}
                  onClick={() => handleDownloadDoc(item)}
                >
                  Download
                </Button>,
                <Button
                  key="delete"
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleDeleteDoc(item._id, currentEmployee!.id.toString())}
                >
                  Delete
                </Button>
              ]}
            >
              <List.Item.Meta
                avatar={<FileOutlined style={{ fontSize: '24px', color: '#1890ff' }} />}
                title={item.fileName}
                description={`Uploaded: ${new Date(item.uploadedAt).toLocaleString()}`}
              />
            </List.Item>
          )}
          locale={{ emptyText: "No documents uploaded yet" }}
        />

      </Modal>

    </div>
  );
};

export default DocumentsPage;