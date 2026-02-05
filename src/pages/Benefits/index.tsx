import React, { useState, useEffect } from 'react';
import { Card, Typography, Button, List, Tag, Row, Col, Statistic, message } from 'antd';
import {
  MedicineBoxOutlined,
  CarOutlined,
  HomeOutlined,
  DollarOutlined,
  GiftOutlined,
  PlusOutlined,
  EditOutlined //new
} from '@ant-design/icons';
import { useCompany } from '../../context/CompanyContext';
import BenefitModal from '../../components/Benefit/BenefitModal';
import benefitService, { Benefit } from '../../services/benefitService';




const { Title } = Typography;

const BenefitsPage: React.FC = () => {
  const { selectedCompany } = useCompany();
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingBenefit, setEditingBenefit] = useState<Benefit | null>(null);

  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [loading, setLoading] = useState(false);

  // new

  const handleAddClick = () => {
    setIsAddModalVisible(true);
  };

  const handleEditClick = (benefit: Benefit) => {
    setEditingBenefit(benefit);
    setIsEditModalVisible(true);
  };





  const fetchBenefits = async () => {
    if (!selectedCompany?._id) return;

    setLoading(true);
    try {
      const data = await benefitService.getBenefits(selectedCompany._id);
      setBenefits(data);
    } catch (error) {
      console.error('Error fetching benefits:', error);
      message.error('Failed to fetch benefits');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBenefits();
  }, [selectedCompany]);

  //new 
  const handleAddBenefit = async (values: Omit<Benefit, '_id' | 'createdAt'>) => {
    if (!selectedCompany?._id) {
      message.error('Please select a company first');
      return;
    }

    try {
      const newBenefit = await benefitService.createBenefit({
        ...values,
        company: selectedCompany._id,
      });
      setBenefits(prev => [...prev, newBenefit]);
      message.success('Benefit added successfully');
      setIsAddModalVisible(false);
    } catch (error) {
      console.error('Error adding benefit:', error);
      message.error('Failed to add benefit');
    }
  };

  const handleEditBenefit = async (values: Omit<Benefit, '_id' | 'createdAt'>) => {
    if (!selectedCompany?._id || !editingBenefit) return;

    try {
      const updated = await benefitService.updateBenefit(editingBenefit._id, {
        ...values,
        company: selectedCompany._id,
      });
      setBenefits(prev =>
        prev.map(b => (b._id === updated._id ? updated : b))
      );
      message.success('Benefit updated successfully');
      setIsEditModalVisible(false);
      setEditingBenefit(null);
    } catch (error) {
      console.error('Error updating benefit:', error);
      message.error('Failed to update benefit');
    }
  };


  const handleDeleteBenefit = async (id: string) => {
    try {
      await benefitService.deleteBenefit(id);
      setBenefits(prev => prev.filter(b => b._id !== id));
      message.success('Benefit deleted successfully');
      setIsEditModalVisible(false);
      setEditingBenefit(null);
    } catch (error) {
      console.error('Error deleting benefit:', error);
      message.error('Failed to delete benefit');
    }
  };


  const getBenefitIcon = (type: string) => {
    switch (type) {
      case 'WC':
        return <MedicineBoxOutlined style={{ fontSize: '24px', color: '#722ed1' }} />;
      case 'Transportation':
        return <CarOutlined style={{ fontSize: '24px', color: '#722ed1' }} />;
      case 'Housing':
        return <HomeOutlined style={{ fontSize: '24px', color: '#722ed1' }} />;
      case 'Canteen':
        return <HomeOutlined style={{ fontSize: '24px', color: '#722ed1' }} />;
      default:
        return <GiftOutlined style={{ fontSize: '24px', color: '#722ed1' }} />;
    }
  };

  const activeBenefits = benefits.filter(b => b.active).length;
  const totalAmount = benefits.reduce((sum, b) => sum + b.amount, 0);

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24 }}>Benefits Management</Title>

      {selectedCompany ? (
        <>
          {/* Statistics Overview */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={8}>
              <Card variant="outlined" style={{ background: '#f9f0ff', borderRadius: '8px' }}>
                <Statistic
                  title={<span style={{ color: '#722ed1' }}>Total Benefits</span>}
                  value={benefits.length}
                  prefix={<GiftOutlined style={{ color: '#722ed1' }} />}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card variant="outlined" style={{ background: '#f6ffed', borderRadius: '8px' }}>
                <Statistic
                  title="Active Benefits"
                  value={activeBenefits}
                  prefix={<DollarOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card variant="outlined" style={{ background: '#f9f0ff', borderRadius: '8px' }}>
                <Statistic
                  title={<span style={{ color: '#722ed1' }}>Total Amount</span>}
                  value={totalAmount}
                  prefix="₹"
                  precision={2}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
          </Row>

          {/* Benefits Categories */}
          <Card
            title="Benefits Categories"
            variant="outlined"
            extra={
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddClick}
              >
                Add Benefit
              </Button>


            }
            style={{ marginBottom: 24, borderRadius: '8px' }}
          >
            <List
              grid={{ gutter: 16, column: 3 }}
              dataSource={benefits}
              loading={loading}
              renderItem={benefit => (
                <List.Item>
                  <Card variant="outlined">



                    <div style={{ position: 'relative' }}>

                      <div style={{ position: 'absolute', top: 8, left: 8 }}>
                        <EditOutlined
                          onClick={() => handleEditClick(benefit)}
                          style={{ fontSize: '16px', color: '#722ed1', cursor: 'pointer' }}
                        />
                      </div>

                      {/* Status Tag - top-right */}
                      <div style={{ position: 'absolute', top: 8, right: 8 }}>
                        <Tag color={benefit.active ? 'success' : 'default'}>
                          {benefit.active ? 'Active' : 'Inactive'}
                        </Tag>
                      </div>



                      <div style={{ textAlign: 'center', marginBottom: 16, paddingTop: 24 }}>
                        {getBenefitIcon(benefit.type)}
                      </div>
                      <Title level={5} style={{ textAlign: 'center', marginBottom: 8 }}>
                        {benefit.title}
                      </Title>
                      <p style={{ textAlign: 'center', color: '#666', marginBottom: 16 }}>
                        {benefit.description}
                      </p>
                      {/* Display assigned employee if any */}
                      {benefit.employee && typeof benefit.employee === 'object' && (
                        <p style={{ textAlign: 'center', color: '#888', marginBottom: 8, fontSize: '12px' }}>
                          Assigned to: <strong>{(benefit.employee as any).name}</strong>
                        </p>
                      )}
                      {benefit.employee && typeof benefit.employee === 'string' && (
                        <p style={{ textAlign: 'center', color: '#888', marginBottom: 8, fontSize: '12px' }}>
                          Assigned to: Employee ID {benefit.employee}
                        </p>
                      )}

                      <div style={{ textAlign: 'center', fontSize: '18px', color: '#722ed1' }}>
                        ₹{benefit.amount.toLocaleString()}
                      </div>
                    </div>
                  </Card>
                </List.Item>
              )}
            />
          </Card>
        </>
      ) : (
        <Card variant="outlined">
          <div style={{ textAlign: 'center', padding: '24px' }}>
            Please select a company to manage benefits
          </div>
        </Card>
      )}

      <BenefitModal
        visible={isAddModalVisible}
        onClose={() => setIsAddModalVisible(false)}
        onSubmit={handleAddBenefit}
        companyId={selectedCompany?._id}
      />

      <BenefitModal
        visible={isEditModalVisible}
        onClose={() => {
          setIsEditModalVisible(false);
          setEditingBenefit(null);
        }}
        onSubmit={handleEditBenefit}
        onDelete={handleDeleteBenefit}
        initialValues={editingBenefit || undefined}
        companyId={selectedCompany?._id}
      />

    </div>
  );
};

export default BenefitsPage;