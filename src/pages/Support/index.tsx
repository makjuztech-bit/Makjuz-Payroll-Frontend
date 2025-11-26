import React from 'react';
import { Card, Typography, Row, Col, Button, Space } from 'antd';
import {
  MailOutlined,
  PhoneOutlined,
  MessageOutlined,
  CustomerServiceOutlined,
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

const SupportPage: React.FC = () => {
  return (
    <div>
      <Title level={3} style={{ marginBottom: 24 }}>Contact & Support</Title>

      <Row gutter={[24, 24]}>
        {/* Contact Information Card */}
        <Col xs={24} md={12}>
          <Card 
            variant="outlined"
            style={{ height: '100%', background: '#fff', borderRadius: '8px' }}
          >
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <Title level={4}>
                <CustomerServiceOutlined /> Get in Touch
              </Title>
              <Paragraph>
                We're here to help! Choose your preferred way to contact us.
              </Paragraph>
              
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Card variant="outlined" size="small">
                  <Space>
                    <MailOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
                    <div>
                      <Text strong>Email Us</Text>
                      <br />
                      <a href="mailto:admin@makjuz.com">admin@makjuz.com</a>
                    </div>
                  </Space>
                </Card>

                <Card variant="outlined" size="small">
                  <Space>
                    <PhoneOutlined style={{ fontSize: '24px', color: '#52c41a' }} />
                    <div>
                      <Text strong>Call Us</Text>
                      <br />
                      <a href="tel:+917339692003">+91 7339692003</a>
                    </div>
                  </Space>
                </Card>
              </Space>
            </Space>
          </Card>
        </Col>

        {/* Live Chat Card */}
        <Col xs={24} md={12}>
          <Card 
            variant="outlined"
            style={{ height: '100%', background: '#fff', borderRadius: '8px' }}
          >
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <Title level={4}>
                <MessageOutlined /> Live Chat Support
              </Title>
              <Paragraph>
                Need immediate assistance? Chat with our support team in real-time.
              </Paragraph>
              
              <div style={{ 
                background: '#f6ffed', 
                padding: '24px',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <Space direction="vertical" size="middle">
                  <Text>Our support agents are ready to help you</Text>
                  <Button 
                    type="primary" 
                    icon={<MessageOutlined />}
                    size="large"
                    onClick={() => {
                      // Chat integration will be added here
                      alert('Chat feature coming soon!');
                    }}
                  >
                    Start Chat
                  </Button>
                </Space>
              </div>
            </Space>
          </Card>
        </Col>

        {/* Support Hours Card */}
        <Col xs={24}>
          <Card 
            variant="outlined"
            style={{ background: '#fafafa', borderRadius: '8px' }}
          >
            <Title level={4}>Support Hours</Title>
            <Row gutter={[24, 24]}>
              <Col xs={24} md={8}>
                <Card variant="outlined" size="small" title="Weekdays">
                  <Text>Monday - Friday</Text>
                  <br />
                  <Text strong>9:00 AM - 6:00 PM IST</Text>
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card variant="outlined" size="small" title="Weekends">
                  <Text>Saturday</Text>
                  <br />
                  <Text strong>10:00 AM - 2:00 PM IST</Text>
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card variant="outlined" size="small" title="Holidays">
                  <Text>Emergency Support Only</Text>
                  <br />
                  <Text strong>Via Email</Text>
                </Card>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default SupportPage;