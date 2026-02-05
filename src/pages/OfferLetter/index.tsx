
import React, { useState } from 'react';
import {
    Card,
    Button,
    Table,
    Typography,
    Upload,
    message,
    Modal,
    Form,
    Input,
    DatePicker,
    Space,
    Tooltip
} from 'antd';
import {
    UploadOutlined,
    MailOutlined,
    PlusOutlined,
    FilePdfOutlined,
    DeleteOutlined
} from '@ant-design/icons';
import * as XLSX from 'xlsx';
import offerLetterService, { Candidate } from '../../services/offerLetterService';

const { Title } = Typography;

const OfferLetterPage: React.FC = () => {
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();

    // Columns for the table
    const columns = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
        },
        {
            title: 'Role',
            dataIndex: 'role',
            key: 'role',
        },
        {
            title: 'Joining Date',
            dataIndex: 'joinDate',
            key: 'joinDate',
        },
        {
            title: 'Salary (CTC)',
            dataIndex: 'salary',
            key: 'salary',
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: any, record: Candidate) => (
                <Space>
                    <Tooltip title="Download PDF">
                        <Button
                            icon={<FilePdfOutlined />}
                            onClick={() => handleDownloadSingle(record)}
                            size="small"
                        />
                    </Tooltip>
                    <Tooltip title="Remove">
                        <Button
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => handleDelete(record._id)}
                            size="small"
                        />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    const fetchCandidates = async () => {
        try {
            setLoading(true);
            const data = await offerLetterService.getCandidates();
            setCandidates(data);
        } catch (error) {
            console.error('Fetch error:', error);
            message.error('Failed to load candidates');
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchCandidates();
    }, []);

    const handleFileUpload = (file: File) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json<Candidate>(sheet);

                // Basic validation/cleaning
                const validData = jsonData.map(item => ({
                    name: item.name || '',
                    email: item.email || '',
                    role: item.role || '',
                    joinDate: item.joinDate || '',
                    salary: item.salary || ''
                })).filter(item => item.name && item.email);

                await offerLetterService.addCandidatesBulk(validData);
                message.success(`${validData.length} candidates imported`);
                fetchCandidates();
            } catch (error) {
                console.error('Excel parse/upload error:', error);
                message.error('Failed to import Excel file');
            }
        };
        reader.readAsArrayBuffer(file);
        return false; // Prevent upload
    };

    const handleManualAdd = async (values: any) => {
        try {
            const newCandidate: Candidate = {
                name: values.name,
                email: values.email,
                role: values.role,
                joinDate: values.joinDate.format('YYYY-MM-DD'),
                salary: values.salary
            };
            await offerLetterService.addCandidate(newCandidate);
            message.success('Candidate added');
            setIsModalVisible(false);
            form.resetFields();
            fetchCandidates();
        } catch (error) {
            console.error('Add error:', error);
            message.error('Failed to add candidate');
        }
    };

    const handleDelete = async (id?: string) => {
        if (!id) return;
        try {
            await offerLetterService.deleteCandidate(id);
            message.success('Candidate removed');
            fetchCandidates();
        } catch (error) {
            message.error('Failed to remove candidate');
        }
    };

    const handleSendEmails = async () => {
        if (candidates.length === 0) return;
        setLoading(true);
        try {
            await offerLetterService.sendOfferLetters(candidates);
            message.success('Offer letters generated and emails sent successfully!');
            fetchCandidates(); // Refresh status if we added that handling
        } catch (error) {
            console.error('Email send error:', error);
            message.error('Failed to send some offer letters.');
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadSingle = async (candidate: Candidate) => {
        try {
            const blob = await offerLetterService.downloadOfferLetter(candidate);
            if (blob.type === 'application/json') {
                const text = await blob.text();
                const error = JSON.parse(text);
                throw new Error(error.message || 'Server error');
            }
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            const safeName = (candidate.name || 'Candidate').replace(/[^a-zA-Z0-9]/g, '_');
            link.setAttribute('download', `Offer_Letter_${safeName}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error: any) {
            console.error('Download error:', error);
            message.error(error.message || 'Failed to download offer letter');
        }
    };



    return (
        <div style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                <Title level={3}>Offer Letter Generation</Title>
                <Space>
                    <Upload beforeUpload={handleFileUpload} showUploadList={false} accept=".xlsx,.xls">
                        <Button icon={<UploadOutlined />}>Import Excel</Button>
                    </Upload>
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>
                        Add Candidate
                    </Button>
                </Space>
            </div>

            <Card>
                <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                    {/* <Button icon={<DownloadOutlined />} onClick={handleDownloadAllPDF} disabled={candidates.length === 0}>
                Download All (One PDF)
            </Button> */}
                    <Button
                        type="primary"
                        icon={<MailOutlined />}
                        onClick={handleSendEmails}
                        loading={loading}
                        disabled={candidates.length === 0}
                    >
                        Generate & Send Emails
                    </Button>
                </div>

                <Table
                    dataSource={candidates}
                    columns={columns}
                    rowKey="email"
                    pagination={{ pageSize: 10 }}
                />
            </Card>

            <Modal
                title="Add Candidate Details"
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                footer={null}
            >
                <Form form={form} layout="vertical" onFinish={handleManualAdd}>
                    <Form.Item name="name" label="Full Name" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="role" label="Job Role/Designation" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="joinDate" label="Joining Date" rules={[{ required: true }]}>
                        <DatePicker style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item name="salary" label="Annual Salary (CTC)" rules={[{ required: true }]}>
                        <Input prefix="₹" />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" block>Add Candidate</Button>
                </Form>
            </Modal>
        </div>
    );
};

export default OfferLetterPage;
