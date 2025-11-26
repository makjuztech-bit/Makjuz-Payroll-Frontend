import React, { useRef, useState, useEffect } from 'react';
import { Modal, Button, Typography, Divider, Row, Col, Card, Alert } from 'antd';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Employee } from '../../context/CompanyContext';
import benefitService, { Benefit } from '../../services/benefitService';

const { Title, Text } = Typography;

interface PayslipModalProps {
  visible: boolean;
  onClose: () => void;
  employee: any; // Change to any to accept both Employee and PayrunEmployee
  companyName: string;
  companyId: string;
}

// Bank details helper to ensure we have all possible field names covered
const getBankDetail = (employee: any, fieldNames: string[]) => {
  for (const field of fieldNames) {
    if (employee[field] !== undefined && employee[field] !== null) {
      return employee[field];
    }
  }
  return '';
};

const PayslipModal: React.FC<PayslipModalProps> = ({
  visible,
  onClose,
  employee,
  companyName,
  companyId
}) => {
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [loading, setLoading] = useState(false);
  
  console.log('PayslipModal received employee data:', employee);
  
  const ref = useRef<HTMLDivElement>(null);
  const currentDate = new Date();
  const payPeriod = `${currentDate.toLocaleString('default', { month: 'long' })} ${currentDate.getFullYear()}`;

  // Fetch benefits when modal opens
  useEffect(() => {
    if (visible && companyId) {
      fetchBenefits();
    }
  }, [visible, companyId]);

  const fetchBenefits = async () => {
    try {
      setLoading(true);
      const companyBenefits = await benefitService.getBenefits(companyId);
      // Only include active benefits
      setBenefits(companyBenefits.filter(benefit => benefit.active));
    } catch (error) {
      console.error('Error fetching benefits:', error);
      setBenefits([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate total benefits amount
  const totalBenefitsAmount = benefits.reduce((sum, benefit) => sum + benefit.amount, 0);

  // Helper function to safely format numbers
  const formatCurrency = (value: number | undefined) => {
    return (value || 0).toFixed(2);
  };

  // Calculate adjusted values
  const adjustedTotalDeductions = (employee.totalDeductions || 0) + totalBenefitsAmount;
  const adjustedFinalNetPay = (employee.finalNetpay || employee.netEarning || 0) - totalBenefitsAmount;

  const handleDownload = async () => {
    if (!ref.current) return;
    try {
      const canvas = await html2canvas(ref.current);
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'pt', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${employee.name}-payslip-${payPeriod}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  // Handle employee ID display properly - could be emp_id_no from API or empIdNo from frontend
  const displayEmployeeId = () => {
    if (employee.emp_id_no) {
      return employee.emp_id_no;
    } else if (employee.empIdNo) {
      return employee.empIdNo;
    } else {
      return `EMP${employee._id?.toString().substring(0, 8) || ''}`;
    }
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Text style={{ 
              fontSize: 20, 
              fontWeight: 'bold', 
              color: '#1890ff',
              fontFamily: 'Arial, sans-serif',
              letterSpacing: '1px',
              marginRight: 12
            }}>
              LEVIVAAN
            </Text>
          </div>
          <Divider type="vertical" style={{ margin: 0 }} />
          <span>Payslip — {companyName}</span>
        </div>
      }
      width={800}
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="download" type="primary" onClick={handleDownload}>
          Download PDF
        </Button>,
        <Button key="close" onClick={onClose}>
          Close
        </Button>,
      ]}
    >
      <div ref={ref} style={{ padding: 16, background: '#fff', marginTop: 12 }}>
        <Card variant="outlined">
          <Title level={3} style={{ textAlign: 'center', color: '#1890ff' }}>
            {companyName}
          </Title>
          <Title level={5} style={{ textAlign: 'center', marginTop: 0 }}>
            Payslip for {payPeriod}
          </Title>
          
          <Divider />
          
          {/* Employee Information */}
          <div style={{ background: '#f5f5f5', padding: 16, borderRadius: 8, marginBottom: 16 }}>
            <Row gutter={[16, 8]}>
              <Col span={12}>
                <Text strong>Employee ID:</Text> {displayEmployeeId()}
              </Col>
              <Col span={12}>
                <Text strong>Employee Name:</Text> {employee.name}
              </Col>
              <Col span={12}>
                <Text strong>Department:</Text> {employee.department}
              </Col>
              <Col span={12}>
                <Text strong>Designation:</Text> {employee.designation}
              </Col>
              <Col span={12}>
                <Text strong>Location:</Text> {employee.location || 'Not specified'}
              </Col>
              <Col span={12}>
                <Text strong>Pay Period:</Text> {payPeriod}
              </Col>
            </Row>
          </div>
          
          {/* Salary Details */}
          <Row gutter={16}>
            <Col span={12}>
              <Card title="Earnings" variant="outlined" style={{ background: '#e6f7ff' }}>
                <Row justify="space-between">
                  <Col>Fixed Stipend</Col>
                  <Col>₹{formatCurrency(employee.fixedStipend || employee.fixed_stipend)}</Col>
                </Row>
                <Row justify="space-between" style={{ marginTop: 8 }}>
                  <Col>Special Allowance</Col>
                  <Col>₹{formatCurrency(employee.specialAllowance)}</Col>
                </Row>
                <Row justify="space-between" style={{ marginTop: 8 }}>
                  <Col>Earned Stipend</Col>
                  <Col>₹{formatCurrency(employee.earnedStipend)}</Col>
                </Row>
                <Row justify="space-between" style={{ marginTop: 8 }}>
                  <Col>Earned Special Allowance</Col>
                  <Col>₹{formatCurrency(employee.earnedSpecialAllowance)}</Col>
                </Row>
                <Row justify="space-between" style={{ marginTop: 8 }}>
                  <Col>Transport</Col>
                  <Col>₹{formatCurrency(employee.transport)}</Col>
                </Row>
                <Row justify="space-between" style={{ marginTop: 8 }}>
                  <Col>OT Earnings</Col>
                  <Col>₹{formatCurrency(employee.earningsOt)}</Col>
                </Row>
                {(employee.attendanceIncentive > 0) && (
                  <Row justify="space-between" style={{ marginTop: 8 }}>
                    <Col>Attendance Incentive</Col>
                    <Col>₹{formatCurrency(employee.attendanceIncentive)}</Col>
                  </Row>
                )}
                <Divider style={{ margin: '12px 0' }} />
                <Row justify="space-between">
                  <Col><Text strong>Total Earnings</Text></Col>
                  <Col><Text strong>₹{formatCurrency(employee.totalEarning)}</Text></Col>
                </Row>
              </Card>
            </Col>
            
            <Col span={12}>
              <Card title="Deductions" variant="outlined" style={{ background: '#fff2e8' }}>
                <Row justify="space-between">
                  <Col>Management Fee</Col>
                  <Col>₹{formatCurrency(employee.managementFee)}</Col>
                </Row>
                <Row justify="space-between" style={{ marginTop: 8 }}>
                  <Col>Insurance</Col>
                  <Col>₹{formatCurrency(employee.insurance)}</Col>
                </Row>
                <Row justify="space-between" style={{ marginTop: 8 }}>
                  <Col>Canteen</Col>
                  <Col>₹{formatCurrency(employee.canteen)}</Col>
                </Row>
                {(employee.lop > 0) && (
                <Row justify="space-between" style={{ marginTop: 8 }}>
                  <Col>LOP Deduction</Col>
                  <Col>₹{formatCurrency(employee.lop)}</Col>
                </Row>
                )}
                
                {/* Benefits Section */}
                {benefits.length > 0 && (
                  <>
                    <Divider style={{ margin: '12px 0' }} />
                    <Text strong style={{ color: '#fa8c16' }}>Benefits:</Text>
                    {benefits.map((benefit) => (
                      <Row justify="space-between" style={{ marginTop: 8 }} key={benefit._id}>
                        <Col>{benefit.title}</Col>
                        <Col>₹{formatCurrency(benefit.amount)}</Col>
                      </Row>
                    ))}
                  </>
                )}
                
                <Divider style={{ margin: '12px 0' }} />
                <Row justify="space-between">
                  <Col><Text strong>Total Deductions</Text></Col>
                  <Col><Text strong>₹{formatCurrency(adjustedTotalDeductions)}</Text></Col>
                </Row>
              </Card>
            </Col>
          </Row>
          
          {/* Net Pay */}
          <div style={{ 
            marginTop: 24, 
            textAlign: 'center', 
            background: '#f6ffed', 
            padding: 16, 
            borderRadius: 8,
            border: '1px solid #b7eb8f'
          }}>
            <Text strong style={{ fontSize: 16 }}>Final Net Pay: </Text>
            <Text style={{ fontSize: 24, color: '#52c41a', fontWeight: 'bold' }}>
              ₹{formatCurrency(adjustedFinalNetPay)}
            </Text>
          </div>
          
          {/* Attendance Summary */}
          <div style={{ marginTop: 24 }}>
            <Title level={5}>Attendance Summary</Title>
            <Row gutter={16}>
              <Col span={6}>
                <Card variant="outlined">
                  <div style={{ textAlign: 'center' }}>
                    <Text strong>Total Fixed Days</Text>
                    <div style={{ fontSize: 24, color: '#1890ff' }}>{employee.totalFixedDays || 0}</div>
                  </div>
                </Card>
              </Col>
              <Col span={6}>
                <Card variant="outlined">
                  <div style={{ textAlign: 'center' }}>
                    <Text strong>Present Days</Text>
                    <div style={{ fontSize: 24, color: '#52c41a' }}>{employee.presentDays || 0}</div>
                  </div>
                </Card>
              </Col>
              <Col span={6}>
                <Card variant="outlined">
                  <div style={{ textAlign: 'center' }}>
                    <Text strong>Holidays</Text>
                    <div style={{ fontSize: 24, color: '#722ed1' }}>{employee.holidays || 0}</div>
                  </div>
                </Card>
              </Col>
              <Col span={6}>
                <Card variant="outlined">
                  <div style={{ textAlign: 'center' }}>
                    <Text strong>Total Payable Days</Text>
                    <div style={{ fontSize: 24, color: '#fa8c16' }}>{employee.totalPayableDays || 0}</div>
                  </div>
                </Card>
              </Col>
            </Row>
          </div>
          
          {/* Additional Details */}
          <div style={{ marginTop: 24 }}>
            <Title level={5}>Billing Summary</Title>
            <Row gutter={16}>
              <Col span={8}>
                <Card variant="outlined">
                  <div style={{ textAlign: 'center' }}>
                    <Text strong>Billable Total</Text>
                    <div style={{ fontSize: 20, color: '#1890ff' }}>₹{formatCurrency(employee.billableTotal)}</div>
                  </div>
                </Card>
              </Col>
              <Col span={8}>
                <Card variant="outlined">
                  <div style={{ textAlign: 'center' }}>
                    <Text strong>GST (18%)</Text>
                    <div style={{ fontSize: 20, color: '#722ed1' }}>₹{formatCurrency(employee.gst)}</div>
                  </div>
                </Card>
              </Col>
              <Col span={8}>
                <Card variant="outlined">
                  <div style={{ textAlign: 'center' }}>
                    <Text strong>Grand Total</Text>
                    <div style={{ fontSize: 20, color: '#52c41a' }}>₹{formatCurrency(employee.grandTotal)}</div>
                  </div>
                </Card>
              </Col>
            </Row>
          </div>
          
          {employee.remarks && (
            <div style={{ marginTop: 24 }}>
              <Title level={5}>Remarks</Title>
              <Alert message={employee.remarks} type="info" />
            </div>
          )}
          
          <div style={{ marginTop: 24 }}>
            <Title level={5}>Payment Details</Title>
            <Card variant="outlined">
              <Row justify="space-between">
                <Col><Text strong>DBT Transfer Amount:</Text></Col>
                <Col><Text strong>₹{formatCurrency(employee.dbt)}</Text></Col>
              </Row>
              <Row justify="space-between" style={{ marginTop: 8 }}>
                <Col>Account Number:</Col>
                <Col>{getBankDetail(employee, ['accountNumber', 'bankAccount', 'account_number', 'bankAccountNumber']) || 'Not provided'}</Col>
              </Row>
              <Row justify="space-between" style={{ marginTop: 8 }}>
                <Col>IFSC Code:</Col>
                <Col>{getBankDetail(employee, ['ifsc', 'ifscCode', 'ifsc_code']) || 'Not provided'}</Col>
              </Row>
              <Row justify="space-between" style={{ marginTop: 8 }}>
                <Col>Bank Name:</Col>
                <Col>{getBankDetail(employee, ['bankName', 'bank_name', 'bank']) || 'Not provided'}</Col>
              </Row>
              <Row justify="space-between" style={{ marginTop: 8 }}>
                <Col>Account Holder:</Col>
                <Col>{getBankDetail(employee, ['accountHolderName', 'account_holder_name', 'accountHolder', 'account_holder']) || employee.name}</Col>
              </Row>
            </Card>
          </div>
          
          <Divider />
          
          <div style={{ textAlign: 'center', fontSize: 12, color: '#888' }}>
            <p>This is a computer-generated payslip and does not require a signature.</p>
            <p>{companyName} - {new Date().getFullYear()}</p>
          </div>
        </Card>
      </div>
    </Modal>
  );
};

export default PayslipModal;