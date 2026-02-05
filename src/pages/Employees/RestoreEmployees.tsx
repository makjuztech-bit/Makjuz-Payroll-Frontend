
import React, { useState, useEffect } from 'react';
import { Typography, Table, Button, message, Space, Tooltip, Modal } from 'antd';
import { ReloadOutlined, DeleteOutlined, FileExcelOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { useCompany, Employee } from '../../context/CompanyContext';
import employeeService from '../../services/employeeService';
import { DEFAULT_FIELD_CONFIG } from '../../components/Employee/ImportExcel';

const { Title } = Typography;

const RestoreEmployees: React.FC = () => {
    const [messageApi, contextHolder] = message.useMessage();
    const { selectedCompany } = useCompany();
    const navigate = useNavigate();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchRecycledEmployees();
    }, [selectedCompany]);

    const fetchRecycledEmployees = async () => {
        if (!selectedCompany) return;
        setLoading(true);
        try {
            // Fetch all employees and filter locally for 'Recycled' status
            const data = await employeeService.getAllEmployees(selectedCompany._id);
            setEmployees(data.filter(emp => emp.status === 'Recycled'));
        } catch (error) {
            console.error('Error fetching employees:', error);
            messageApi.error('Failed to fetch recycled employees');
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async (employee: Employee) => {
        try {
            await employeeService.updateEmployee(employee.id, { status: 'Active' });
            messageApi.success('Employee restored successfully');
            setEmployees(prev => prev.filter(e => e.id !== employee.id));
        } catch (error) {
            console.error('Error restoring employee:', error);
            messageApi.error('Failed to restore employee');
        }
    };

    const handlePermanentDelete = async (id: number) => {
        try {
            await employeeService.deleteEmployee(id);
            messageApi.success('Employee permanently deleted');
            setEmployees(prev => prev.filter(e => e.id !== id));
        } catch (error) {
            console.error('Error deleting employee:', error);
            messageApi.error('Failed to delete employee');
        }
    };

    const downloadExcel = () => {
        try {
            if (employees.length === 0) {
                messageApi.warning('No employees to export');
                return;
            }

            // Use the imported configuration to match the template structure
            const columns = DEFAULT_FIELD_CONFIG;

            // Header row
            const headers = ["Sr-No-", ...columns.map(col => col.name)];

            // Data rows
            const dataRows = employees.map((emp: any, index) => {
                const row = columns.map(col => {
                    let val = emp[col.key];

                    // Handle Date formatting
                    if (col.type === 'date' && val) {
                        return new Date(val).toISOString().split('T')[0];
                    }
                    // Handle Number formatting
                    if (col.type === 'number' && val) {
                        return Number(val);
                    }

                    // Handle missing values
                    if (val === undefined || val === null) {
                        return "";
                    }

                    return val;
                });
                return [index + 1, ...row];
            });

            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);

            // Auto-width for columns
            const colWidths = headers.map(h => ({ wch: Math.max(h.length, 15) }));
            ws['!cols'] = colWidths;

            XLSX.utils.book_append_sheet(wb, ws, "Restorable Employees");
            XLSX.writeFile(wb, "Restorable_Employees.xlsx");
            messageApi.success('Exported successfully');
        } catch (error) {
            console.error('Export error:', error);
            messageApi.error('Failed to export to Excel');
        }
    };

    const columns = [
        {
            title: 'EMP ID',
            dataIndex: 'empIdNo',
            key: 'empIdNo',
        },
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Department',
            dataIndex: 'department',
            key: 'department',
        },
        {
            title: 'Designation',
            dataIndex: 'designation',
            key: 'designation',
        },
        {
            title: 'Action',
            key: 'action',
            render: (_: any, record: Employee) => (
                <Space>
                    <Tooltip title="Restore">
                        <Button
                            type="primary"
                            icon={<ReloadOutlined />}
                            onClick={() => handleRestore(record)}
                            style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                        >
                            Restore
                        </Button>
                    </Tooltip>
                    <Tooltip title="Delete Permanently">
                        <Button
                            type="primary"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => {
                                Modal.confirm({
                                    title: 'Are you sure?',
                                    content: 'This action cannot be undone.',
                                    okText: 'Yes, Delete',
                                    okType: 'danger',
                                    cancelText: 'No',
                                    onOk: () => handlePermanentDelete(record.id)
                                });
                            }}
                        >
                            Delete
                        </Button>
                    </Tooltip>
                </Space>
            ),
        },
    ];

    return (
        <div style={{ padding: 24 }}>
            {contextHolder}
            <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Space>
                    <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/employees')}>
                        Back to Employees
                    </Button>
                    <Title level={4} style={{ margin: 0 }}>Recycle Bin</Title>
                </Space>

                <Button
                    icon={<FileExcelOutlined />}
                    onClick={downloadExcel}
                    type="primary"
                >
                    Export to Excel
                </Button>
            </div>

            <Table
                dataSource={employees}
                columns={columns}
                rowKey="id"
                loading={loading}
            />
        </div>
    );
};

export default RestoreEmployees;
