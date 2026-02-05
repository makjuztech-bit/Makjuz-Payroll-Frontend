import React, { useState } from 'react';
import {
  Typography,
  Card,
  Button,
  Table,
  Modal,
  Form,
  Input,

  message
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useCompany } from '../../context/CompanyContext';

const { Title } = Typography;


const CompanySettings: React.FC = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { companies, addCompany } = useCompany();

  const columns = [
    {
      title: 'Company Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Company Type',
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    }
  ];

  const handleAddCompany = async (values: any) => {
    try {
      setLoading(true);
      await addCompany(values);
      message.success('Company added successfully');
      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('Error adding company:', error);
      message.error('Failed to add company');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={3}>Company Settings</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsModalVisible(true)}
          style={{ width: 200 }}
        >
          Add Company
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={companies}
          rowKey="_id"
          loading={loading}
        />
      </Card>

      <Modal
        title="Add New Company"
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAddCompany}
        >
          <Form.Item
            name="name"
            label="Company Name"
            rules={[{ required: true, message: 'Please input company name!' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="type"
            label="Company Type"
            rules={[{ required: true, message: 'Please enter company type!' }]}
          >
            <Input placeholder="Enter company type" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              Add Company
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CompanySettings;