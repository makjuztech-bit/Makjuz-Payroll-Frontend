import React, { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  Button,
  Table,
  Space,
  Select,
  Tabs,
  Tag,
  message,
  Modal,
  Form,
  Input,
  DatePicker,
  InputNumber,
  Descriptions,
  Divider
} from 'antd';
import {
  DownloadOutlined,
  PlusOutlined
} from '@ant-design/icons';
import { useCompany } from '../../context/CompanyContext';
import * as XLSX from 'xlsx';
import MyCharts from '../../components/Charts/MyChart';
import expenseService, { Expense } from '../../services/expenseService';
import incomeService, { Income } from '../../services/incomeService';
import payrunService from '../../services/payrunService';
import dayjs from 'dayjs';
import { Statistic, Row, Col } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const ReportsPage: React.FC = () => {
  const { selectedCompany } = useCompany();
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toLocaleString('default', { month: 'long' }));
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (user.role !== 'md') {
    return (
      <div style={{ padding: 24, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Card style={{ textAlign: 'center', maxWidth: 400 }}>
          <Title level={3} type="danger">Access Denied</Title>
          <Text>You do not have permission to view this page. This section is restricted to MD users only.</Text>
        </Card>
      </div>
    );
  }

  // Expenses State
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isExpenseModalVisible, setIsExpenseModalVisible] = useState(false);
  const [isDetailVisible, setIsDetailVisible] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [form] = Form.useForm();

  // Profit & Loss State
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [profitSummary, setProfitSummary] = useState({
    income: 0,
    expenses: 0,
    payroll: 0,
    netProfit: 0
  });
  const [isIncomeModalVisible, setIsIncomeModalVisible] = useState(false);
  const [incomeForm] = Form.useForm();

  const fetchProfitData = async () => {
    if (!selectedCompany?._id) return;
    try {
      const incomeData = await incomeService.getIncomes(selectedCompany._id);
      setIncomes(incomeData);

      const expenseData = await expenseService.getExpenses(selectedCompany._id); // Refresh expenses

      // Get Payroll Cost
      const payrunSummary = await payrunService.getPayrunSummary(selectedCompany._id, selectedMonth, selectedYear.toString());
      const monthlyPayrollCost = payrunSummary?.totalGrandTotal || 0;

      // Filter Incomes by Month/Year
      const currentMonthIncomes = incomeData.filter((i: any) => {
        const d = new Date(i.date);
        return d.toLocaleString('default', { month: 'long' }) === selectedMonth && d.getFullYear() === selectedYear;
      });

      // Filter Expenses by Month/Year
      const currentMonthExpenses = expenseData.filter((e: any) => {
        const d = new Date(e.date);
        return d.toLocaleString('default', { month: 'long' }) === selectedMonth && d.getFullYear() === selectedYear;
      });

      const totalIncome = currentMonthIncomes.reduce((acc: number, curr: any) => acc + curr.amount, 0);
      const totalExpenses = currentMonthExpenses.reduce((acc: number, curr: any) => acc + curr.amount, 0);

      setProfitSummary({
        income: totalIncome,
        expenses: totalExpenses,
        payroll: monthlyPayrollCost,
        netProfit: totalIncome - totalExpenses - monthlyPayrollCost
      });

    } catch (error) {
      console.error('Error fetching profit data', error);
    }
  };

  useEffect(() => {
    if (selectedCompany) {
      fetchProfitData();
    }
  }, [selectedCompany, selectedMonth, selectedYear, isExpenseModalVisible, isIncomeModalVisible]);

  const handleAddIncome = async (values: any) => {
    if (!selectedCompany?._id) return;
    try {
      await incomeService.addIncome({
        ...values,
        company: selectedCompany?._id,
        date: values.date.format('YYYY-MM-DD'),
      });
      message.success('Income recorded');
      setIsIncomeModalVisible(false);
      incomeForm.resetFields();
      fetchProfitData();
    } catch (error) {
      message.error('Failed to add income');
    }
  };

  const incomeColumns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (t: string) => dayjs(t).format('DD MMM YYYY')
    },
    {
      title: 'Source',
      dataIndex: 'source',
      key: 'source'
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (v: number) => <span style={{ color: '#3f8600', fontWeight: 'bold' }}>₹{v.toFixed(2)}</span>
    },
    {
      title: 'Reference',
      dataIndex: 'referenceParams',
      key: 'referenceParams'
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: Income) => (
        <Button type="link" danger onClick={async () => {
          if (record._id) {
            await incomeService.deleteIncome(record._id);
            message.success('Income deleted');
            fetchProfitData();
          }
        }}>Delete</Button>
      )
    }
  ];

  // Existing Monthly Columns...
  const monthlyColumns = [
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
      title: 'OT Hours',
      dataIndex: 'otHours',
      key: 'otHours',
    },
    {
      title: 'Total Earnings',
      dataIndex: 'totalEarning',
      key: 'totalEarning',
      render: (value: number) => `₹${value?.toFixed(2) || '0.00'}`,
    },
    {
      title: 'Total Deductions',
      dataIndex: 'totalDeductions',
      key: 'totalDeductions',
      render: (value: number) => `₹${value?.toFixed(2) || '0.00'}`,
    },
    {
      title: 'Net Pay',
      dataIndex: 'finalNetpay',
      key: 'finalNetpay',
      render: (value: number) => <span style={{ color: '#52c41a', fontWeight: 'bold' }}>₹{value?.toFixed(2) || '0.00'}</span>,
    }
  ];

  // Existing Annual Columns...
  const annualColumns = [
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
      title: 'Total Working Days',
      dataIndex: 'totalWorkingDays',
      key: 'totalWorkingDays',
    },
    {
      title: 'Total OT Hours',
      dataIndex: 'totalOTHours',
      key: 'totalOTHours',
    },
    {
      title: 'Yearly Earnings',
      dataIndex: 'yearlyEarnings',
      key: 'yearlyEarnings',
      render: (value: number) => `₹${value?.toFixed(2) || '0.00'}`,
    },
    {
      title: 'Yearly Deductions',
      dataIndex: 'yearlyDeductions',
      key: 'yearlyDeductions',
      render: (value: number) => `₹${value?.toFixed(2) || '0.00'}`,
    },
    {
      title: 'Net Annual Pay',
      dataIndex: 'netAnnualPay',
      key: 'netAnnualPay',
      render: (value: number) => <span style={{ color: '#52c41a', fontWeight: 'bold' }}>₹{value?.toFixed(2) || '0.00'}</span>,
    }
  ];

  const expenseColumns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (text: string) => dayjs(text).format('DD MMM YYYY')
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (text: string) => <Tag color="geekblue">{text}</Tag>
    },
    {
      title: 'Merchant',
      dataIndex: 'merchant',
      key: 'merchant',
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (value: number) => <span style={{ fontWeight: 500 }}>₹{value?.toFixed(2)}</span>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (text: string) => (
        <Tag color={text === 'Approved' ? 'success' : text === 'Rejected' ? 'error' : 'warning'}>
          {text}
        </Tag>
      )
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: Expense) => (
        <Button type="link" size="small" onClick={() => {
          setSelectedExpense(record);
          setIsDetailVisible(true);
        }}>
          View Details
        </Button>
      )
    }
  ];

  const fetchExpenses = async () => {
    if (selectedCompany?._id) {
      try {
        const data = await expenseService.getExpenses(selectedCompany._id);
        setExpenses(data);
      } catch (error) {
        console.error('Failed to fetch expenses');
      }
    }
  };

  // Keep this useEffect for expenses specifically if needed, but fetchProfitData covers it. 
  // We can remove duplicate call or keep it for safety if tabs switch.
  useEffect(() => {
    fetchExpenses();
  }, [selectedCompany]);

  const handleAddExpense = async (values: any) => {
    if (!selectedCompany?._id) return;

    try {
      await expenseService.addExpense({
        ...values,
        company: selectedCompany?._id,
        date: values.date.format('YYYY-MM-DD'),
      });
      message.success('Expense added successfully');
      setIsExpenseModalVisible(false);
      form.resetFields();
      fetchExpenses(); // Update expense list
      fetchProfitData(); // Update profit stats
    } catch (error) {
      message.error('Failed to add expense');
    }
  };

  // Calculate annual data (existing logic filtered out for brevity but kept existing structure)
  const getAnnualData = () => {
    if (!selectedCompany?.employees) return [];
    return selectedCompany.employees.map(emp => ({
      key: emp.id,
      name: emp.name,
      department: emp.department,
      totalWorkingDays: emp.presentDays * 12, // Simplified
      totalOTHours: emp.otHours * 12, // Simplified
      yearlyEarnings: ((emp as any).totalEarning || 0) * 12,
      yearlyDeductions: ((emp as any).totalDeductions || 0) * 12,
      netAnnualPay: ((emp as any).finalNetpay || 0) * 12
    }));
  };

  const downloadReport = (type: 'monthly' | 'annual') => {
    // (Existing download logic)
    if (!selectedCompany?.employees.length) {
      message.error('No data available to download');
      return;
    }

    const data = type === 'monthly' ? selectedCompany.employees : getAnnualData();
    const columns = type === 'monthly' ? monthlyColumns : annualColumns;
    const fileName = type === 'monthly'
      ? `${selectedCompany.name}-${selectedMonth}-${selectedYear}-Report.xlsx`
      : `${selectedCompany.name}-Annual-Report-${selectedYear}.xlsx`;

    const excelData = [
      columns.map(col => col.title),
      ...data.map(item =>
        columns.map(col => {
          const key = col.dataIndex as keyof typeof item;
          const value = item[key];
          if (value !== null && value !== undefined && !isNaN(Number(value))) {
            return Number(value).toFixed(2);
          }
          return String(value || '');
        })
      )
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(excelData);
    XLSX.utils.book_append_sheet(wb, ws, type === 'monthly' ? 'Monthly Report' : 'Annual Report');
    XLSX.writeFile(wb, fileName);
    message.success(`${type === 'monthly' ? 'Monthly' : 'Annual'} report downloaded successfully!`);
  };

  return (
    <div style={{ padding: 24 }}>
      <Title level={3} style={{ marginBottom: 24 }}>Reports & Analytics</Title>
      <div style={{}}>
        <MyCharts />
      </div>
      {selectedCompany ? (
        <>
          <Card variant="outlined" style={{ marginBottom: 24, borderRadius: '8px' }}>
            <Tabs defaultActiveKey="monthly">
              <Tabs.TabPane tab="Monthly Report" key="monthly">
                <Space style={{ marginBottom: 16 }}>
                  <Select
                    value={selectedMonth}
                    style={{ width: 120 }}
                    onChange={setSelectedMonth}
                  >
                    {Array.from({ length: 12 }, (_, i) => new Date(0, i).toLocaleString('default', { month: 'long' }))
                      .map(month => (
                        <Option key={month} value={month}>{month}</Option>
                      ))
                    }
                  </Select>
                  <Select
                    value={selectedYear}
                    style={{ width: 100 }}
                    onChange={setSelectedYear}
                  >
                    {[2023, 2024, 2025].map(year => (
                      <Option key={year} value={year}>{year}</Option>
                    ))}
                  </Select>
                  <Button
                    type="primary"
                    icon={<DownloadOutlined />}
                    onClick={() => downloadReport('monthly')}
                  >
                    Download Report
                  </Button>
                </Space>
                <Table
                  columns={monthlyColumns}
                  dataSource={selectedCompany.employees}
                  rowKey="id"
                  pagination={false}
                />
              </Tabs.TabPane>

              <Tabs.TabPane tab="Annual Report" key="annual">
                <Space style={{ marginBottom: 16 }}>
                  <Select
                    value={selectedYear}
                    style={{ width: 100 }}
                    onChange={setSelectedYear}
                  >
                    {[2023, 2024, 2025].map(year => (
                      <Option key={year} value={year}>{year}</Option>
                    ))}
                  </Select>
                  <Button
                    type="primary"
                    icon={<DownloadOutlined />}
                    onClick={() => downloadReport('annual')}
                  >
                    Download Report
                  </Button>
                </Space>
                <Table
                  columns={annualColumns}
                  dataSource={getAnnualData()}
                  rowKey="key"
                  pagination={false}
                />
              </Tabs.TabPane>

              <Tabs.TabPane tab="Expense Reports" key="expenses">
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                  <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsExpenseModalVisible(true)}>
                    Add Expense
                  </Button>
                </div>
                <Table
                  columns={expenseColumns}
                  dataSource={expenses}
                  rowKey="_id"
                />
              </Tabs.TabPane>

              <Tabs.TabPane tab="Profit Report" key="profit">
                <Space style={{ marginBottom: 16 }}>
                  <Select value={selectedMonth} style={{ width: 120 }} onChange={setSelectedMonth}>
                    {Array.from({ length: 12 }, (_, i) => new Date(0, i).toLocaleString('default', { month: 'long' })).map(m => (<Option key={m} value={m}>{m}</Option>))}
                  </Select>
                  <Select value={selectedYear} style={{ width: 100 }} onChange={setSelectedYear}>
                    {[2023, 2024, 2025].map(y => (<Option key={y} value={y}>{y}</Option>))}
                  </Select>
                </Space>

                <div style={{ padding: 20, background: '#f9f9f9', borderRadius: 8, marginBottom: 24, border: '1px solid #eee' }}>
                  <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12} md={6}>
                      <Card bordered={false}>
                        <Statistic
                          title="Total Income"
                          value={profitSummary.income}
                          precision={2}
                          valueStyle={{ color: '#3f8600' }}
                          prefix={<><ArrowUpOutlined /> ₹</>}
                        />
                      </Card>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                      <Card bordered={false}>
                        <Statistic
                          title="Expenses"
                          value={profitSummary.expenses}
                          precision={2}
                          valueStyle={{ color: '#cf1322' }}
                          prefix={<><ArrowDownOutlined /> ₹</>}
                        />
                      </Card>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                      <Card bordered={false}>
                        <Statistic
                          title="Payroll Cost"
                          value={profitSummary.payroll}
                          precision={2}
                          valueStyle={{ color: '#cf1322' }}
                          prefix={<><ArrowDownOutlined /> ₹</>}
                        />
                      </Card>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                      <Card bordered={false} style={{ background: profitSummary.netProfit >= 0 ? '#f6ffed' : '#fff1f0' }}>
                        <Statistic
                          title="Net Profit"
                          value={profitSummary.netProfit}
                          precision={2}
                          prefix="₹"
                          valueStyle={{ color: profitSummary.netProfit >= 0 ? '#3f8600' : '#cf1322' }}
                        />
                      </Card>
                    </Col>
                  </Row>
                </div>

                <Divider orientation="left">Income Management</Divider>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                  <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsIncomeModalVisible(true)}>
                    Add Income
                  </Button>
                </div>
                <Table dataSource={incomes} columns={incomeColumns} rowKey="_id" />
              </Tabs.TabPane>
            </Tabs>
          </Card>
        </>
      ) : (
        <Card variant="outlined" style={{ borderRadius: '8px' }}>
          <div style={{ textAlign: 'center', padding: '24px' }}>
            Please select a company to view reports
          </div>
        </Card>
      )}

      {/* Add Expense Modal */}
      <Modal
        title="Add New Expense"
        open={isExpenseModalVisible}
        onCancel={() => setIsExpenseModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleAddExpense}>
          <Form.Item name="amount" label="Amount" rules={[{ required: true, message: 'Please enter amount' }]}>
            <InputNumber
              style={{ width: '100%' }}
              formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value!.replace(/\₹\s?|(,*)/g, '')}
            />
          </Form.Item>
          <Form.Item name="date" label="Date" rules={[{ required: true, message: 'Please select date' }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="category" label="Category" rules={[{ required: true }]}>
            <Select placeholder="Select Category">
              <Option value="Travel">Travel</Option>
              <Option value="Food">Food & Dining</Option>
              <Option value="Office Supplies">Office Supplies</Option>
              <Option value="Software">Software & Tools</Option>
              <Option value="Other">Other</Option>
            </Select>
          </Form.Item>
          <Form.Item name="merchant" label="Merchant/Vendor">
            <Input placeholder="e.g. Uber, Amazon, Restaurant" />
          </Form.Item>
          <Form.Item name="paymentMethod" label="Payment Method">
            <Select placeholder="Select Method">
              <Option value="Credit Card">Credit Card</Option>
              <Option value="Debit Card">Debit Card</Option>
              <Option value="Cash">Cash</Option>
              <Option value="Bank Transfer">Bank Transfer</Option>
              <Option value="Reimbursement">Reimbursement</Option>
            </Select>
          </Form.Item>
          <Form.Item name="description" label="Description / Notes">
            <TextArea rows={3} />
          </Form.Item>
          <Button type="primary" htmlType="submit" block>Submit Expense</Button>
        </Form>
      </Modal>

      {/* Add Income Modal */}
      <Modal
        title="Add Income"
        open={isIncomeModalVisible}
        onCancel={() => setIsIncomeModalVisible(false)}
        footer={null}
      >
        <Form form={incomeForm} layout="vertical" onFinish={handleAddIncome}>
          <Form.Item name="amount" label="Amount" rules={[{ required: true }]}>
            <InputNumber
              style={{ width: '100%' }}
              formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value!.replace(/\₹\s?|(,*)/g, '')}
            />
          </Form.Item>
          <Form.Item name="date" label="Date" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="source" label="Source" rules={[{ required: true }]}>
            <Select>
              <Option value="Client Payment">Client Payment</Option>
              <Option value="Service Revenue">Service Revenue</Option>
              <Option value="Refund">Refund</Option>
              <Option value="Other">Other</Option>
            </Select>
          </Form.Item>
          <Form.Item name="referenceParams" label="Reference (Invoice #)">
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description / Notes">
            <TextArea rows={2} />
          </Form.Item>
          <Button type="primary" htmlType="submit" block>Record Income</Button>
        </Form>
      </Modal>

      {/* Expense Detail Modal */}
      <Modal
        title="Expense Details"
        open={isDetailVisible}
        onCancel={() => setIsDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsDetailVisible(false)}>Close</Button>
        ]}
      >
        {selectedExpense && (
          <Descriptions bordered column={1}>
            <Descriptions.Item label="Amount">
              <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#1890ff' }}>
                ₹{selectedExpense.amount?.toFixed(2)}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="Date">{dayjs(selectedExpense.date).format('DD MMMM YYYY')}</Descriptions.Item>
            <Descriptions.Item label="Category">
              <Tag color="geekblue">{selectedExpense.category}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Merchant">{selectedExpense.merchant || '-'}</Descriptions.Item>
            <Descriptions.Item label="Payment Method">{selectedExpense.paymentMethod || '-'}</Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={selectedExpense.status === 'Approved' ? 'success' : 'warning'}>
                {selectedExpense.status}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Description">{selectedExpense.description || 'No description provided.'}</Descriptions.Item>
            <Descriptions.Item label="Record ID">
              <Text type="secondary" copyable>{selectedExpense._id}</Text>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default ReportsPage;