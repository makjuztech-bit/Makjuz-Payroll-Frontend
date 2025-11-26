import React from 'react';
import { 
  Card, 
  Typography, 
  Tabs, 
  Form, 
  Input, 
  Button, 
  Switch, 
  Select,
  Row,
  Col,
  Upload,
  message
} from 'antd';
import {
  UserOutlined,
  BankOutlined,
  SecurityScanOutlined,
  NotificationOutlined,
  UploadOutlined
} from '@ant-design/icons';
import { useCompany } from '../../context/CompanyContext';

const { Title } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

const SettingsPage: React.FC = () => {
  const { selectedCompany } = useCompany();

  const onFinish = (values: any) => {
    console.log('Success:', values);
    message.success('Settings updated successfully');
  };

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24 }}>Settings</Title>

      {selectedCompany ? (
        <Card variant="outlined" style={{ borderRadius: '8px' }}>
          <Tabs defaultActiveKey="1">
            <TabPane
              tab={
                <span>
                  <BankOutlined />
                  Company Settings
                </span>
              }
              key="1"
            >
              <Form
                layout="vertical"
                onFinish={onFinish}
                initialValues={{
                  companyName: selectedCompany.name,
                  industry: 'Technology',
                  taxId: '123456789',
                  fiscalYear: '2024'
                }}
              >
                <Row gutter={24}>
                  <Col span={12}>
                    <Form.Item
                      label="Company Name"
                      name="companyName"
                      rules={[{ required: true, message: 'Please input company name!' }]}
                    >
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label="Industry"
                      name="industry"
                      rules={[{ required: true, message: 'Please select industry!' }]}
                    >
                      <Select>
                        <Option value="Technology">Technology</Option>
                        <Option value="Healthcare">Healthcare</Option>
                        <Option value="Finance">Finance</Option>
                        <Option value="Manufacturing">Manufacturing</Option>
                        <Option value="Retail">Retail</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={24}>
                  <Col span={12}>
                    <Form.Item
                      label="Tax ID"
                      name="taxId"
                      rules={[{ required: true, message: 'Please input tax ID!' }]}
                    >
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label="Fiscal Year"
                      name="fiscalYear"
                      rules={[{ required: true, message: 'Please select fiscal year!' }]}
                    >
                      <Select>
                        <Option value="2023">2023-24</Option>
                        <Option value="2024">2024-25</Option>
                        <Option value="2025">2025-26</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={24}>
                  <Col span={24}>
                    <Form.Item
                      label="Company Logo"
                      name="logo"
                    >
                      <Upload>
                        <Button icon={<UploadOutlined />}>Click to Upload</Button>
                      </Upload>
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item>
                  <Button type="primary" htmlType="submit">
                    Save Company Settings
                  </Button>
                </Form.Item>
              </Form>
            </TabPane>

            <TabPane
              tab={
                <span>
                  <UserOutlined />
                  User Preferences
                </span>
              }
              key="2"
            >
              <Form layout="vertical" onFinish={onFinish}>
                <Row gutter={24}>
                  <Col span={12}>
                    <Form.Item
                      label="Language"
                      name="language"
                      initialValue="english"
                    >
                      <Select>
                        <Option value="english">English</Option>
                        <Option value="spanish">Spanish</Option>
                        <Option value="french">French</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label="Time Zone"
                      name="timezone"
                      initialValue="UTC"
                    >
                      <Select>
                        <Option value="UTC">UTC</Option>
                        <Option value="EST">EST</Option>
                        <Option value="PST">PST</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>
                <Form.Item
                  label="Email Notifications"
                  name="emailNotifications"
                  valuePropName="checked"
                  initialValue={true}
                >
                  <Switch />
                </Form.Item>
                <Form.Item>
                  <Button type="primary" htmlType="submit">
                    Save Preferences
                  </Button>
                </Form.Item>
              </Form>
            </TabPane>

            <TabPane
              tab={
                <span>
                  <SecurityScanOutlined />
                  Security
                </span>
              }
              key="3"
            >
              <Form layout="vertical" onFinish={onFinish}>
                <Form.Item
                  label="Two-Factor Authentication"
                  name="twoFactor"
                  valuePropName="checked"
                  initialValue={false}
                >
                  <Switch />
                </Form.Item>
                <Form.Item
                  label="Session Timeout (minutes)"
                  name="sessionTimeout"
                  initialValue={30}
                >
                  <Select>
                    <Option value={15}>15 minutes</Option>
                    <Option value={30}>30 minutes</Option>
                    <Option value={60}>1 hour</Option>
                  </Select>
                </Form.Item>
                <Form.Item>
                  <Button type="primary" htmlType="submit">
                    Save Security Settings
                  </Button>
                </Form.Item>
              </Form>
            </TabPane>

            <TabPane
              tab={
                <span>
                  <NotificationOutlined />
                  Notifications
                </span>
              }
              key="4"
            >
              <Form layout="vertical" onFinish={onFinish}>
                <Form.Item
                  label="Email Notifications"
                  name="emailNotifs"
                  valuePropName="checked"
                  initialValue={true}
                >
                  <Switch />
                </Form.Item>
                <Form.Item
                  label="Push Notifications"
                  name="pushNotifs"
                  valuePropName="checked"
                  initialValue={true}
                >
                  <Switch />
                </Form.Item>
                <Form.Item
                  label="Notification Frequency"
                  name="notifFrequency"
                  initialValue="immediate"
                >
                  <Select>
                    <Option value="immediate">Immediate</Option>
                    <Option value="daily">Daily Digest</Option>
                    <Option value="weekly">Weekly Digest</Option>
                  </Select>
                </Form.Item>
                <Form.Item>
                  <Button type="primary" htmlType="submit">
                    Save Notification Settings
                  </Button>
                </Form.Item>
              </Form>
            </TabPane>
          </Tabs>
        </Card>
      ) : (
        <Card variant="outlined" style={{ borderRadius: '8px' }}>
          <div style={{ textAlign: 'center', padding: '24px' }}>
            Please select a company to manage settings
          </div>
        </Card>
      )}
    </div>
  );
};

export default SettingsPage;