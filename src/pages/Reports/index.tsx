import React, { useState } from 'react';
import {
  Card,
  Typography,
  Button,
  Table,
  Space,
  Select,
  Tabs,
  Tag,
  message
} from 'antd';
import {
  DownloadOutlined
} from '@ant-design/icons';
import { useCompany } from '../../context/CompanyContext';
import * as XLSX from 'xlsx';
import MyCharts from '../../components/Charts/MyChart';
const { Title } = Typography;
const { Option } = Select;

const ReportsPage: React.FC = () => {
  const { selectedCompany } = useCompany();
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toLocaleString('default', { month: 'long' }));
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  // Monthly report columns
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

  // Annual report columns
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

  // Calculate annual data for each employee
  const getAnnualData = () => {
    if (!selectedCompany?.employees) return [];

    return selectedCompany.employees.map(emp => ({
      key: emp.id,
      name: emp.name,
      department: emp.department,
      totalWorkingDays: emp.presentDays * 12, // Simplified calculation
      totalOTHours: emp.otHours * 12, // Simplified calculation
      yearlyEarnings: ((emp as any).totalEarning || 0) * 12,
      yearlyDeductions: ((emp as any).totalDeductions || 0) * 12,
      netAnnualPay: ((emp as any).finalNetpay || 0) * 12
    }));
  };

  const downloadReport = (type: 'monthly' | 'annual') => {
    if (!selectedCompany?.employees.length) {
      message.error('No data available to download');
      return;
    }

    const data = type === 'monthly' ? selectedCompany.employees : getAnnualData();
    const columns = type === 'monthly' ? monthlyColumns : annualColumns;
    const fileName = type === 'monthly'
      ? `${selectedCompany.name}-${selectedMonth}-${selectedYear}-Report.xlsx`
      : `${selectedCompany.name}-Annual-Report-${selectedYear}.xlsx`;

    // Prepare the data for Excel with proper type checking
    const excelData = [
      columns.map(col => col.title), // Headers
      ...data.map(item =>
        columns.map(col => {
          const key = col.dataIndex as keyof typeof item;
          const value = item[key];
          // Explicitly check if the value is a number before calling toFixed
          if (value !== null && value !== undefined && !isNaN(Number(value))) {
            return Number(value).toFixed(2);
          }
          return String(value || ''); // Convert any other type to string, handle null/undefined
        })
      )
    ];

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(excelData);

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, type === 'monthly' ? 'Monthly Report' : 'Annual Report');

    // Save workbook
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
    </div>
  );
};

export default ReportsPage;