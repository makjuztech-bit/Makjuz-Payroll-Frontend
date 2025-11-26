import React, { useState, useEffect } from 'react';
import {
  Typography,
  Form,
  Input,
  DatePicker,
  InputNumber,
  Select,
  Button,
  Table,
  message,
  Card,
  Modal,
  Row,
  Col
} from 'antd';
import type { DatePickerProps } from 'antd';
import { createCampaign, getAllCampaigns, Campaign } from '../../services/campaignService';

const { Title } = Typography;
const { RangePicker } = DatePicker;

const MarketingPage: React.FC = () => {
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false); //new


  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCampaigns = async () => {
    try {
      console.log('Fetching campaigns...');
      const data = await getAllCampaigns();
      console.log('Campaigns fetched:', data);
      setCampaigns(data || []);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      message.error('Failed to fetch campaigns');
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const onFinish = async (values: any) => {
    try {
      setLoading(true);
      console.log('Form values:', values);
      const [startDate, endDate] = values.dateRange;
      const campaignData = {
        ...values,
        startDate,
        endDate,
        channel: Array.isArray(values.channel) ? values.channel : [values.channel]
      };
      delete campaignData.dateRange;

      console.log('Submitting campaign data:', campaignData);
      const response = await createCampaign(campaignData);
      console.log('Campaign created:', response);

      message.success('Campaign created successfully');

      form.resetFields();
      fetchCampaigns();
      setIsModalVisible(false);


    } catch (error) {
      console.error('Error creating campaign:', error);
      message.error('Failed to create campaign');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Campaign Name',
      dataIndex: 'campaignName',
      key: 'campaignName',
    },
    {
      title: 'Target Industry',
      dataIndex: 'targetIndustry',
      key: 'targetIndustry',
    },
    {
      title: 'Channel',
      dataIndex: 'channel',
      key: 'channel',
      render: (channels: string[]) => channels.join(', '),
    },
    {
      title: 'Start Date',
      dataIndex: 'startDate',
      key: 'startDate',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'End Date',
      dataIndex: 'endDate',
      key: 'endDate',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Salary',
      dataIndex: 'salary',
      key: 'salary',
      render: (salary: number) => `$${salary.toLocaleString()}`,
    },
    {
      title: 'Service Charge',
      dataIndex: 'serviceCharge',
      key: 'serviceCharge',
      render: (charge: number) => `$${charge.toLocaleString()}`,
    },
  ];

  return (
    <div style={{ padding: '24px' }}>

      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2} style={{ margin: 0 }}>
            Marketing Campaigns
          </Title>
        </Col>
        <Col>
          <Button type="primary" onClick={() => setIsModalVisible(true)}>
            Add Campaign
          </Button>
        </Col>
      </Row>

      <Modal
        title="Create Campaign"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null} // Use form buttons instead
        destroyOnClose
      >
        <Card title="Create New Campaign" style={{ marginBottom: 24 }}>
          <Form
            form={form}
            name="campaign"
            onFinish={onFinish}
            layout="vertical"
            autoComplete="off"
          >
            <Form.Item
              name="campaignName"
              label="Campaign Name"
              rules={[{ required: true, message: 'Please input campaign name!' }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="targetIndustry"
              label="Target Industry"
              rules={[{ required: true, message: 'Please input target industry!' }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="channel"
              label="Channel"
              rules={[{ required: true, message: 'Please select channel!' }]}
            >
              <Select
                mode="multiple"
                placeholder="Select channels"
                options={[
                  { value: 'Facebook', label: 'Facebook' },
                  { value: 'WhatsApp', label: 'WhatsApp' },
                  { value: 'LinkedIn', label: 'LinkedIn' },
                ]}
              />
            </Form.Item>

            <Form.Item
              name="dateRange"
              label="Campaign Duration"
              rules={[{ required: true, message: 'Please select date range!' }]}
            >
              <RangePicker />
            </Form.Item>

            <Form.Item
              name="salary"
              label="Salary"
              rules={[{ required: true, message: 'Please input salary!' }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => value!.replace(/\$\s?|(,*)/g, '')}
              />
            </Form.Item>

            <Form.Item
              name="serviceCharge"
              label="Service Charge"
              rules={[{ required: true, message: 'Please input service charge!' }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => value!.replace(/\$\s?|(,*)/g, '')}
              />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading}>
                Create Campaign
              </Button>
            </Form.Item>
          </Form>
        </Card>

      </Modal>

      <Card title="Campaign List">




        <Table
          columns={columns}
          dataSource={campaigns}
          rowKey="_id"
          loading={loading}
        />
      </Card>
    </div>
  );
};

export default MarketingPage;
