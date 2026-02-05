import React, { useState, useEffect } from 'react';
import {
  Card, Table, Button, Typography, Space, Tag, message, Row, Col,
  Statistic, Modal, Alert, Select, Dropdown
} from 'antd';
import {
  DollarOutlined, CheckCircleOutlined, ClockCircleOutlined,
  TeamOutlined, BankOutlined, CalendarOutlined, UploadOutlined,
  DownloadOutlined, FileWordOutlined, FileExcelOutlined, DownOutlined
} from '@ant-design/icons';
import { useCompany, Employee } from '../../context/CompanyContext';
import employeeService from '../../services/employeeService';
import payrunService from '../../services/payrunService';
import benefitService, { Benefit } from '../../services/benefitService';
import PayslipModal from '../../components/Payment/PayslipModal';
import PayrunUploadModal from '../../components/Payment/PayrunUploadModal';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;

interface PaymentStatus {
  [key: number]: 'paid' | 'pending';
}

interface PayrunEmployee extends Omit<Employee, 'presentDays'> {
  paymentStatus?: 'paid' | 'pending';
  finalNetpay?: number;
  totalEarning?: number;
  totalDeductions?: number;
  presentDays?: number;
  // Add calculated fields for benefits
  calculatedTotalDeductions?: number;
  calculatedFinalNetPay?: number;
}

const PayRunsPage: React.FC = () => {
  const { selectedCompany } = useCompany();
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>({});
  const [loading, setLoading] = useState<{ [key: number]: boolean }>({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(dayjs().format('MMMM'));
  const [selectedYear, setSelectedYear] = useState(dayjs().year().toString());
  const [employeeDetails, setEmployeeDetails] = useState<PayrunEmployee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<PayrunEmployee | null>(null);
  const [showPayslip, setShowPayslip] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [benefits, setBenefits] = useState<Benefit[]>([]);

  // Calculate total benefits amount
  const totalBenefitsAmount = benefits.reduce((sum, benefit) => sum + (benefit.active ? benefit.amount : 0), 0);

  // Calculate statistics with benefits included
  const totalEmployees = employeeDetails.length;
  const paidEmployees = Object.values(paymentStatus).filter(status => status === 'paid').length;
  const pendingEmployees = totalEmployees - paidEmployees;
  const totalSalary = employeeDetails.reduce((sum, emp) => sum + (emp.calculatedFinalNetPay || 0), 0);

  useEffect(() => {
    fetchBenefits();
  }, [selectedCompany]);

  useEffect(() => {
    fetchEmployeeDetails();
  }, [selectedCompany, selectedMonth, selectedYear, benefits]);

  const fetchBenefits = async () => {
    if (!selectedCompany?._id) return;

    try {
      const companyBenefits = await benefitService.getBenefits(selectedCompany._id);
      setBenefits(companyBenefits || []);
    } catch (error) {
      console.error('Error fetching benefits:', error);
      setBenefits([]);
    }
  };

  const fetchEmployeeDetails = async () => {
    if (!selectedCompany?._id) return;

    setIsLoading(true);
    try {
      // First check if there's payrun data for this month/year
      // const payrunSummary = await payrunService.getPayrunSummary(selectedCompany._id, selectedMonth, selectedYear);

      // If no payrun data exists, we still fetch employees. 
      // The backend's getPayrunDetails will generate default/demo data if missing.
      /* 
      if (!payrunSummary || payrunSummary.totalEmployees === 0) {
        setEmployeeDetails([]);
        setIsLoading(false);
        return;
      }
      */

      // Fetch all employees for the company
      const employees = await employeeService.getAllEmployees(selectedCompany._id);

      // Then get payrun details for each employee
      const details = await Promise.all(
        employees.map(async (emp) => {
          try {
            const payrunDetails = await employeeService.getPayrunDetails(emp.id, selectedMonth, selectedYear);

            // Calculate benefits-adjusted values
            const originalTotalDeductions = payrunDetails.totalDeductions || 0;
            const originalFinalNetPay = payrunDetails.finalNetpay || 0;

            const calculatedTotalDeductions = originalTotalDeductions + totalBenefitsAmount;
            const calculatedFinalNetPay = originalFinalNetPay - totalBenefitsAmount;

            return {
              ...emp,
              ...payrunDetails,
              paymentStatus: paymentStatus[emp.id] || 'pending',
              calculatedTotalDeductions,
              calculatedFinalNetPay
            } as PayrunEmployee;
          } catch (error) {
            console.error(`Error fetching payrun details for employee ${emp.id}:`, error);
            // Return basic employee info if payrun details fail
            return {
              ...emp,
              paymentStatus: paymentStatus[emp.id] || 'pending',
              presentDays: emp.presentDays,
              calculatedTotalDeductions: totalBenefitsAmount,
              calculatedFinalNetPay: 0 - totalBenefitsAmount
            } as PayrunEmployee;
          }
        })
      );
      setEmployeeDetails(details);
    } catch (error) {
      console.error('Error fetching employee details:', error);
      message.error('Failed to fetch employee payrun details');
      setEmployeeDetails([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayEmployee = async (employeeId: number) => {
    setLoading(prev => ({ ...prev, [employeeId]: true }));

    try {
      // In a real app, you would make an API call to process the payment
      await new Promise(resolve => setTimeout(resolve, 1500));

      setPaymentStatus(prev => ({ ...prev, [employeeId]: 'paid' }));
      message.success('Payment processed successfully!');
    } catch (error) {
      message.error('Failed to process payment');
    } finally {
      setLoading(prev => ({ ...prev, [employeeId]: false }));
    }
  };

  const handlePayAll = async () => {
    setShowConfirmModal(false);
    const unpaidEmployees = employeeDetails.filter(
      emp => paymentStatus[emp.id] !== 'paid'
    );

    for (const employee of unpaidEmployees) {
      await handlePayEmployee(employee.id);
    }
    message.success('All payments processed successfully!');
  };

  const handleDownloadPaysheet = async () => {
    if (!selectedCompany?._id) {
      message.error('Please select a company first');
      return;
    }

    if (totalEmployees === 0) {
      message.error('No employee data available for the selected month and year');
      return;
    }

    try {
      setDownloading(true);
      message.loading({ content: 'Generating paysheet...', key: 'download' });

      console.log(`Downloading paysheet for ${selectedCompany.name}, ${selectedMonth} ${selectedYear}`);

      const blob = await payrunService.downloadPaysheet(
        selectedCompany._id,
        selectedMonth,
        selectedYear
      );

      // Validate that we have a proper blob
      if (!(blob instanceof Blob)) {
        throw new Error('Invalid response format');
      }

      // Create a download link with explicit type
      const url = window.URL.createObjectURL(
        new Blob([blob], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      );

      // Create and use a download link
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedCompany.name}_paysheet_${selectedMonth}_${selectedYear}.xlsx`;
      document.body.appendChild(a);
      a.click();

      // Clean up
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);

      message.success({ content: 'Paysheet downloaded successfully', key: 'download' });
      console.log('Paysheet downloaded successfully');
    } catch (error) {
      console.error('Error downloading paysheet:', error);
      message.error({
        content: error instanceof Error
          ? `Failed to download paysheet: ${error.message}`
          : 'Failed to download paysheet',
        key: 'download'
      });
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadPFReport = async (format: 'xlsx' | 'txt' = 'xlsx') => {
    if (!selectedCompany?._id) {
      message.error('Please select a company first');
      return;
    }

    if (totalEmployees === 0) {
      message.error('No employee data for selected period');
      return;
    }

    try {
      setDownloading(true);
      message.loading({ content: `Generating PF ${format.toUpperCase()} report...`, key: 'download' });

      const blob = await payrunService.downloadPFReport(
        selectedCompany._id,
        selectedMonth,
        selectedYear,
        format
      );

      const mimeType = format === 'xlsx'
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'text/plain';

      const url = window.URL.createObjectURL(
        new Blob([blob], { type: mimeType })
      );

      const a = document.createElement('a');
      a.href = url;
      a.download = `PF_Report_${selectedMonth}_${selectedYear}.${format}`;
      document.body.appendChild(a);
      a.click();

      setTimeout(() => window.URL.revokeObjectURL(url), 100);
      message.success({ content: `PF ${format.toUpperCase()} Report downloaded`, key: 'download' });
    } catch (error: any) {
      console.error(error);
      const errorMessage = error.response?.data?.message || `Failed to download PF ${format.toUpperCase()} Report`;
      message.error({ content: errorMessage, key: 'download' });
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadESIReport = async (format: 'xlsx' | 'txt' = 'xlsx') => {
    if (!selectedCompany?._id) {
      message.error('Please select a company first');
      return;
    }

    if (totalEmployees === 0) {
      message.error('No employee data for selected period');
      return;
    }

    try {
      setDownloading(true);
      message.loading({ content: `Generating ESI ${format.toUpperCase()} report...`, key: 'download' });

      const blob = await payrunService.downloadESIReport(
        selectedCompany._id,
        selectedMonth,
        selectedYear,
        format
      );

      const mimeType = format === 'xlsx'
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'text/plain';

      const url = window.URL.createObjectURL(
        new Blob([blob], { type: mimeType })
      );

      const a = document.createElement('a');
      a.href = url;
      a.download = `ESI_Report_${selectedMonth}_${selectedYear}.${format}`;
      document.body.appendChild(a);
      a.click();

      setTimeout(() => window.URL.revokeObjectURL(url), 100);
      message.success({ content: `ESI ${format.toUpperCase()} Report downloaded`, key: 'download' });
    } catch (error: any) {
      console.error(error);
      const errorMessage = error.response?.data?.message || `Failed to download ESI ${format.toUpperCase()} Report`;
      message.error({ content: errorMessage, key: 'download' });
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadInvoice = async () => {
    if (!selectedCompany?._id) return;
    try {
      if (totalEmployees === 0) {
        message.error('No employee data available for the selected month to generate invoice.');
        return;
      }
      setDownloading(true);
      message.loading({ content: 'Generating Invoice...', key: 'download' });

      // Assuming downloadInvoice service method exists (we added it to service file)
      const blob = await payrunService.downloadInvoice(
        selectedCompany._id,
        selectedMonth,
        selectedYear
      );

      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `Invoice_${selectedCompany.name}_${selectedMonth}_${selectedYear}.docx`;
      document.body.appendChild(a);
      a.click();

      setTimeout(() => window.URL.revokeObjectURL(url), 100);
      message.success({ content: 'Invoice downloaded', key: 'download' });
    } catch (error) {
      console.error('Error downloading invoice:', error);
      message.error({ content: 'Failed to download Invoice', key: 'download' });
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadBankReport = async (type: 'iob' | 'non-iob', format: 'xlsx' | 'txt') => {
    if (!selectedCompany?._id) return;
    try {
      if (totalEmployees === 0) {
        message.error(`No employee data available to generate ${type.toUpperCase()} report.`);
        return;
      }
      setDownloading(true);
      message.loading({ content: `Generating ${type.toUpperCase()} ${format.toUpperCase()} Report...`, key: 'download' });

      const blob = await payrunService.downloadBankReport(
        selectedCompany._id,
        selectedMonth,
        selectedYear,
        type,
        format
      );

      const mimeType = format === 'xlsx'
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'text/plain';

      const url = window.URL.createObjectURL(new Blob([blob], { type: mimeType }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type.toUpperCase()}_Report_${selectedMonth}_${selectedYear}.${format}`;
      document.body.appendChild(a);
      a.click();

      setTimeout(() => window.URL.revokeObjectURL(url), 100);
      message.success({ content: `${type.toUpperCase()} ${format.toUpperCase()} Report downloaded`, key: 'download' });
    } catch (error: any) {
      console.error(`Error downloading ${type} report:`, error);
      const errorMessage = error.response?.data?.message || `Failed to download ${type.toUpperCase()} Report`;
      message.error({ content: errorMessage, key: 'download' });
    } finally {
      setDownloading(false);
    }
  };

  const handleUploadSuccess = () => {
    message.success(`Payrun data for ${selectedMonth} ${selectedYear} has been successfully imported!`);
    fetchEmployeeDetails();
  };

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
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: 'Present Days',
      dataIndex: 'presentDays',
      key: 'presentDays',
    },
    {
      title: 'Base Salary',
      dataIndex: 'fixedStipend',
      key: 'fixedStipend',
      render: (value: number | undefined) => `₹${value?.toFixed(2) || '0.00'}`,
    },
    {
      title: 'Total Earnings',
      dataIndex: 'totalEarning',
      key: 'totalEarning',
      render: (value: number | undefined) => `₹${value?.toFixed(2) || '0.00'}`,
    },
    {
      title: 'Total Deductions',
      dataIndex: 'calculatedTotalDeductions',
      key: 'calculatedTotalDeductions',
      render: (value: number | undefined, _: PayrunEmployee) => (
        <div>
          <div>₹{value?.toFixed(2) || '0.00'}</div>
          {totalBenefitsAmount > 0 && (
            <div style={{ fontSize: '11px', color: '#666' }}>
              (incl. ₹{totalBenefitsAmount.toFixed(2)} benefits)
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'PF Amount',
      dataIndex: 'pfAmount',
      key: 'pfAmount',
      render: (value: number | undefined) => `₹${value?.toFixed(2) || '0.00'}`,
    },
    {
      title: 'ESI Amount',
      dataIndex: 'esiAmount',
      key: 'esiAmount',
      render: (value: number | undefined) => `₹${value?.toFixed(2) || '0.00'}`,
    },
    {
      title: 'GST (18%)',
      dataIndex: 'gst',
      key: 'gst',
      render: (value: number | undefined) => `₹${value?.toFixed(2) || '0.00'}`,
    },
    {
      title: 'Net Pay',
      dataIndex: 'calculatedFinalNetPay',
      key: 'calculatedFinalNetPay',
      render: (value: number | undefined, _: PayrunEmployee) => (
        <div>
          <span style={{ color: '#52c41a', fontWeight: 'bold' }}>
            ₹{value?.toFixed(2) || '0.00'}
          </span>
          {totalBenefitsAmount > 0 && (
            <div style={{ fontSize: '11px', color: '#666' }}>
              (after ₹{totalBenefitsAmount.toFixed(2)} benefits)
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: (_: any, record: any) => (
        <Tag color={paymentStatus[record.id] === 'paid' ? 'success' : 'gold'}>
          {paymentStatus[record.id] === 'paid' ? (
            <><CheckCircleOutlined /> Paid</>
          ) : (
            <><ClockCircleOutlined /> Pending</>
          )}
        </Tag>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="primary"
            icon={<DollarOutlined />}
            loading={loading[record.id]}
            disabled={paymentStatus[record.id] === 'paid'}
            onClick={() => handlePayEmployee(record.id)}
          >
            Pay Now
          </Button>
          <Button
            type="link"
            onClick={() => {
              setSelectedEmployee(record);
              setShowPayslip(true);
            }}
          >
            View Payslip
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Title level={3} style={{ marginBottom: 24 }}>Pay Runs</Title>

      {selectedCompany ? (
        <>
          {/* Benefits Summary */}
          {benefits.length > 0 && (
            <Row style={{ marginBottom: 16 }}>
              <Col span={24}>
                <Card variant="outlined" style={{ borderRadius: '8px', background: '#f0f9ff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <Title level={5} style={{ margin: 0, color: '#1890ff' }}>
                        Active Benefits ({benefits.filter(b => b.active).length})
                      </Title>
                      <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                        {benefits.filter(b => b.active).map(benefit => benefit.title).join(', ')}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 18, fontWeight: 'bold', color: '#1890ff' }}>
                        ₹{totalBenefitsAmount.toFixed(2)}
                      </div>
                      <div style={{ fontSize: 12, color: '#666' }}>
                        Total Benefits/Employee
                      </div>
                    </div>
                  </div>
                </Card>
              </Col>
            </Row>
          )}

          {/* Statistics */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} lg={6}>
              <Card variant="outlined" style={{ background: '#f9f0ff', borderRadius: '8px' }}>
                <Statistic
                  title={<span style={{ color: '#722ed1' }}>Total Employees</span>}
                  value={totalEmployees}
                  prefix={<TeamOutlined style={{ color: '#722ed1' }} />}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card variant="outlined" style={{ background: '#f6ffed', borderRadius: '8px' }}>
                <Statistic
                  title="Paid Employees"
                  value={paidEmployees}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card variant="outlined" style={{ background: '#fffbe6', borderRadius: '8px' }}>
                <Statistic
                  title="Pending Payments"
                  value={pendingEmployees}
                  prefix={<ClockCircleOutlined />}
                  valueStyle={{ color: pendingEmployees > 0 ? '#faad14' : '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card variant="outlined" style={{ background: '#f9f0ff', borderRadius: '8px' }}>
                <Statistic
                  title={<span style={{ color: '#722ed1' }}>Total Salary Amount</span>}
                  value={totalSalary}
                  prefix={<BankOutlined style={{ color: '#722ed1' }} />}
                  valueStyle={{ color: '#722ed1' }}
                  precision={2}
                />
              </Card>
            </Col>
          </Row>

          {/* Action Header */}
          <Row style={{ marginBottom: 16 }}>
            <Col span={24}>
              <Card variant="outlined" style={{ borderRadius: '8px' }}>
                <Row justify="space-between" align="middle" gutter={[16, 16]}>
                  <Col>
                    <Title level={5} style={{ margin: 0, color: '#722ed1', whiteSpace: 'nowrap' }}>
                      Payroll Management
                    </Title>
                  </Col>
                  <Col>
                    <Space wrap>
                      <Select
                        value={selectedMonth}
                        onChange={setSelectedMonth}
                        style={{ width: 120 }}
                        suffixIcon={<CalendarOutlined />}
                      >
                        {[
                          'January', 'February', 'March', 'April', 'May', 'June',
                          'July', 'August', 'September', 'October', 'November', 'December'
                        ].map((month: string) => (
                          <Option key={month} value={month}>{month}</Option>
                        ))}
                      </Select>
                      <Select
                        value={selectedYear}
                        onChange={setSelectedYear}
                        style={{ width: 100 }}
                      >
                        {[...Array(5)].map((_, i) => {
                          const year = dayjs().year() - 2 + i;
                          return <Option key={year} value={year.toString()}>{year}</Option>;
                        })}
                      </Select>
                      <Button
                        icon={<UploadOutlined />}
                        onClick={() => setShowUploadModal(true)}
                      >
                        Import Excel
                      </Button>
                      <Button
                        icon={<DownloadOutlined />}
                        onClick={handleDownloadPaysheet}
                        loading={downloading}
                        disabled={totalEmployees === 0}
                      >
                        Download Paysheet
                      </Button>
                      <Dropdown
                        menu={{
                          items: [
                            {
                              key: 'pf-excel',
                              icon: <FileExcelOutlined />,
                              label: 'PF Report (Excel)',
                              onClick: () => handleDownloadPFReport('xlsx')
                            },
                            {
                              key: 'pf-txt',
                              icon: <DownloadOutlined />,
                              label: 'PF Report (TXT)',
                              onClick: () => handleDownloadPFReport('txt')
                            }
                          ]
                        }}
                        trigger={['click']}
                      >
                        <Button
                          icon={<DownloadOutlined />}
                          disabled={totalEmployees === 0 || downloading}
                        >
                          PF Report <DownOutlined />
                        </Button>
                      </Dropdown>
                      <Button
                        icon={<FileWordOutlined />}
                        onClick={handleDownloadInvoice}
                        disabled={totalEmployees === 0 || downloading}
                      >
                        Invoice (Word)
                      </Button>
                      <Dropdown
                        menu={{
                          items: [
                            {
                              key: 'iob-excel',
                              icon: <FileExcelOutlined />,
                              label: 'IOB (Excel)',
                              onClick: () => handleDownloadBankReport('iob', 'xlsx')
                            },
                            {
                              key: 'iob-txt',
                              icon: <DownloadOutlined />,
                              label: 'IOB (TXT)',
                              onClick: () => handleDownloadBankReport('iob', 'txt')
                            },
                            {
                              type: 'divider'
                            },
                            {
                              key: 'non-iob-excel',
                              icon: <FileExcelOutlined />,
                              label: 'Non-IOB (Excel)',
                              onClick: () => handleDownloadBankReport('non-iob', 'xlsx')
                            },
                            {
                              key: 'non-iob-txt',
                              icon: <DownloadOutlined />,
                              label: 'Non-IOB (TXT)',
                              onClick: () => handleDownloadBankReport('non-iob', 'txt')
                            }
                          ]
                        }}
                        trigger={['click']}
                      >
                        <Button
                          icon={<BankOutlined />}
                          loading={downloading}
                          disabled={totalEmployees === 0}
                        >
                          Bank Reports <DownOutlined />
                        </Button>
                      </Dropdown>
                      <Dropdown
                        menu={{
                          items: [
                            {
                              key: 'esi-excel',
                              icon: <FileExcelOutlined />,
                              label: 'ESI Report (Excel)',
                              onClick: () => handleDownloadESIReport('xlsx')
                            },
                            {
                              key: 'esi-txt',
                              icon: <DownloadOutlined />,
                              label: 'ESI Report (TXT)',
                              onClick: () => handleDownloadESIReport('txt')
                            }
                          ]
                        }}
                        trigger={['click']}
                      >
                        <Button
                          icon={<DownloadOutlined />}
                          disabled={totalEmployees === 0 || downloading}
                        >
                          ESI Report <DownOutlined />
                        </Button>
                      </Dropdown>
                      <Button
                        type="primary"
                        onClick={() => setShowConfirmModal(true)}
                        disabled={pendingEmployees === 0}
                      >
                        Pay All ({pendingEmployees})
                      </Button>
                    </Space>
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>

          {/* Empty state or table */}
          {totalEmployees === 0 ? (
            <Card variant="outlined" style={{ borderRadius: '8px', textAlign: 'center', padding: '40px 0' }}>
              <FileExcelOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
              <Title level={4} style={{ marginTop: 16 }}>No payrun data available</Title>
              <p style={{ color: '#8c8c8c' }}>
                Import an Excel file with employee payrun data for {selectedMonth} {selectedYear}
              </p>
              <Button
                type="primary"
                icon={<UploadOutlined />}
                onClick={() => setShowUploadModal(true)}
                style={{ marginTop: 16 }}
              >
                Import Excel
              </Button>
            </Card>
          ) : (
            <Card variant="outlined" style={{ borderRadius: '8px' }}>
              <Table
                columns={columns}
                dataSource={employeeDetails}
                rowKey={(record) => `${record.empIdNo}-${record.id}`}
                pagination={false}
                loading={isLoading}
              />
            </Card>
          )}

          {/* Confirm Modal */}
          <Modal
            title={<span style={{ color: '#722ed1' }}>Confirm Bulk Payment</span>}
            open={showConfirmModal}
            onOk={handlePayAll}
            onCancel={() => setShowConfirmModal(false)}
            okText="Yes, Pay All"
            cancelText="Cancel"
          >
            <p>Are you sure you want to process payments for all pending employees?</p>
            <Alert
              message={`This will process payments for ${pendingEmployees} employee${pendingEmployees > 1 ? 's' : ''}`}
              type="info"
              showIcon
            />
          </Modal>

          {/* Payslip Modal */}
          {selectedEmployee && (
            <PayslipModal
              visible={showPayslip}
              employee={selectedEmployee}
              companyName={selectedCompany.name}
              companyId={selectedCompany._id}
              month={selectedMonth}
              year={selectedYear}
              onClose={() => {
                setShowPayslip(false);
                setSelectedEmployee(null);
              }}
            />
          )}

          {/* Payrun Upload Modal */}
          <PayrunUploadModal
            visible={showUploadModal}
            onClose={() => setShowUploadModal(false)}
            onSuccess={handleUploadSuccess}
            companyId={selectedCompany._id}
          />
        </>
      ) : (
        <Card variant="outlined" style={{ borderRadius: '8px' }}>
          <Alert
            message="Please select a company"
            description="Choose a company from the dropdown above to manage payroll."
            type="info"
            showIcon
          />
        </Card>
      )}
    </div>
  );
};

export default PayRunsPage;