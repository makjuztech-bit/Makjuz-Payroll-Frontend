import React, { useState, useEffect } from 'react';
import {
  Card, Row, Col, Typography, Statistic, Progress, List, Avatar, Spin,
  Select, Space, Table, Tag, Tooltip, Divider
} from 'antd';
import {
  TeamOutlined,
  BankOutlined,
  ApartmentOutlined,
  CalendarOutlined,
  LineChartOutlined,
  RiseOutlined,
  BarChartOutlined,
  InfoCircleOutlined,
  UserOutlined
} from '@ant-design/icons';
import { useCompany } from '../../context/CompanyContext';
import employeeService from '../../services/employeeService';
import payrunService from '../../services/payrunService';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

const DashboardPage: React.FC = () => {
  const { companies, selectedCompany, loading, error } = useCompany();
  const [selectedMonth, setSelectedMonth] = useState<string>(dayjs().format('MMMM'));
  const [selectedYear, setSelectedYear] = useState<string>(dayjs().year().toString());
  const [payrunSummary, setPayrunSummary] = useState<any>(null);
  const [summaryLoading, setSummaryLoading] = useState<boolean>(false);
  const [companiesStats, setCompaniesStats] = useState<any[]>([]);
  const [statsLoading, setStatsLoading] = useState<boolean>(false);
  const [totalGlobalStats, setTotalGlobalStats] = useState<{ employees: number; companies: number }>({
    employees: 0,
    companies: 0
  });

  // Fetch payrun summary when month, year, or company changes
  useEffect(() => {
    const fetchPayrunSummary = async () => {
      if (!selectedCompany) return;

      setSummaryLoading(true);
      try {
        const summary = await payrunService.getPayrunSummary(
          selectedCompany._id,
          selectedMonth,
          selectedYear
        );
        setPayrunSummary(summary);
      } catch (error) {
        console.error('Error fetching payrun summary:', error);
        setPayrunSummary(null);
      } finally {
        setSummaryLoading(false);
      }
    };

    fetchPayrunSummary();
  }, [selectedCompany, selectedMonth, selectedYear]);

  // Calculate employee stats for all companies
  useEffect(() => {
    const calculateCompanyStats = async () => {
      if (!companies || companies.length === 0) return;

      setStatsLoading(true);
      try {
        // Create stats for all companies
        const stats = await Promise.all(
          companies.map(async (company) => {
            try {
              const employeeCount = await employeeService.getEmployeeCount(company._id);

              // Get unique departments
              const departmentsSet = new Set(
                (company.employees || [])
                  .map((emp: any) => emp?.department)
                  .filter(Boolean)
              );

              return {
                id: company._id,
                name: company.name,
                employeeCount,
                departmentCount: departmentsSet.size,
                // Add more stats as needed
              };
            } catch (error) {
              console.error(`Error fetching stats for company ${company.name}:`, error);
              return {
                id: company._id,
                name: company.name,
                employeeCount: 0,
                departmentCount: 0
              };
            }
          })
        );

        // Sort by employee count in descending order
        stats.sort((a, b) => b.employeeCount - a.employeeCount);
        setCompaniesStats(stats);
      } catch (error) {
        console.error('Error calculating company stats:', error);
      } finally {
        setStatsLoading(false);
      }
    };

    calculateCompanyStats();

    // Fetch global stats
    const fetchGlobalStats = async () => {
      try {
        const globalEmployeeCount = await employeeService.getEmployeeCount();
        setTotalGlobalStats({
          employees: globalEmployeeCount,
          companies: companies?.length || 0
        });
      } catch (error) {
        console.error('Error fetching global stats:', error);
      }
    };

    fetchGlobalStats();
  }, [companies]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '50px', color: 'red' }}>
        {error}
      </div>
    );
  }

  // Calculate statistics for the Selected Company
  const currentCompanyEmployees = selectedCompany?.employees || [];
  const currentEmployeeCount = currentCompanyEmployees.length;

  const currentDepartments = new Set(
    currentCompanyEmployees.map((emp: any) => emp?.department).filter(Boolean)
  ).size;

  const currentDesignations = new Set(
    currentCompanyEmployees.map((emp: any) => emp?.designation).filter(Boolean)
  ).size;

  const departmentStats = currentCompanyEmployees.reduce((acc: any, emp: any) => {
    if (emp?.department) {
      acc[emp.department] = (acc[emp.department] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>) || {};

  // Create columns for the company stats table
  const columns = [
    {
      title: 'Company Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: any) => (
        <Space>
          <Avatar
            shape="square" // Make it look a bit more distinct
            style={{
              backgroundColor: record.id === selectedCompany?._id ? '#1890ff' : '#f0f0f0',
              color: record.id === selectedCompany?._id ? 'white' : '#666'
            }}
          >
            {text[0] || '?'}
          </Avatar>
          <Text strong={record.id === selectedCompany?._id}>{text}</Text>
        </Space>
      ),
    },
    {
      title: 'Employees',
      dataIndex: 'employeeCount',
      key: 'employeeCount',
      render: (count: number) => (
        <Tag color="blue" icon={<TeamOutlined />}>{count}</Tag>
      )
    },
    {
      title: 'Departments',
      dataIndex: 'departmentCount',
      key: 'departmentCount',
      render: (count: number) => (
        <Tag color="green" icon={<ApartmentOutlined />}>{count}</Tag>
      )
    },
    {
      title: 'Distribution',
      key: 'distribution',
      render: (_: any, record: any) => {
        // Calculate percentage relative to the largest company for visualization context
        const maxEmployees = Math.max(...companiesStats.map((c: any) => c.employeeCount), 1);
        return (
          <Progress
            percent={Math.round((record.employeeCount / maxEmployees) * 100)}
            steps={5}
            size="small"
            strokeColor="#1890ff"
          />
        )
      }
    }
  ];

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={3}>Dashboard Overview</Title>
          <Text type="secondary">
            Snapshot for {selectedCompany?.name || 'Selected Company'}
          </Text>
        </Col>
        <Col>
          <Space>
            <Select
              style={{ width: 120 }}
              value={selectedMonth}
              onChange={setSelectedMonth}
              placeholder="Select Month"
              suffixIcon={<CalendarOutlined />}
            >
              {[
                'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'
              ].map(month => (
                <Option key={month} value={month}>{month}</Option>
              ))}
            </Select>

            <Select
              style={{ width: 100 }}
              value={selectedYear}
              onChange={setSelectedYear}
              placeholder="Select Year"
            >
              {[...Array(5)].map((_, i) => {
                const year = dayjs().year() - 2 + i;
                return <Option key={year} value={year.toString()}>{year}</Option>;
              })}
            </Select>
          </Space>
        </Col>
      </Row>

      {/* Global Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card
            variant="outlined"
            style={{
              height: '100%',
              background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
              borderColor: 'transparent'
            }}
          >
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>Global Total Employees</span>}
              value={totalGlobalStats.employees}
              prefix={<TeamOutlined style={{ color: 'white' }} />}
              valueStyle={{ color: 'white', fontWeight: 'bold' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            variant="outlined"
            style={{
              height: '100%',
              background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
              borderColor: 'transparent'
            }}
          >
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>Total Companies</span>}
              value={totalGlobalStats.companies}
              prefix={<BankOutlined style={{ color: 'white' }} />}
              valueStyle={{ color: 'white', fontWeight: 'bold' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card variant="outlined" style={{ height: '100%' }}>
            <Statistic
              title="Global Monthly Cost"
              value={companiesStats.reduce((acc: number, curr: any) => acc + (curr.monthlyCost || 0), 0)}
              prefix={<LineChartOutlined style={{ color: '#fa8c16' }} />}
              suffix="₹"
              precision={2}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            variant="outlined"
            style={{
              height: '100%',
              background: '#fafafa',
              borderStyle: 'dashed'
            }}
          >
            <Statistic
              title="Active Departments"
              value={companiesStats.reduce((acc: number, curr: any) => acc + (curr.departmentCount || 0), 0)}
              prefix={<ApartmentOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Divider orientation="left">Selected Company Analysis</Divider>

      {/* Main Statistics Cards - All Scoped to Selected Company */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card variant="outlined" style={{ height: '100%' }}>
            <Statistic
              title="Company Employees"
              value={currentEmployeeCount}
              prefix={<TeamOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card variant="outlined" style={{ height: '100%' }}>
            <Statistic
              title="Departments"
              value={currentDepartments}
              prefix={<ApartmentOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card variant="outlined" style={{ height: '100%' }}>
            <Statistic
              title="Designations"
              value={currentDesignations}
              prefix={<UserOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card variant="outlined" style={{ height: '100%' }}>
            <Statistic
              title="Monthly Cost"
              value={payrunSummary?.totalGrandTotal || 0}
              prefix={<LineChartOutlined style={{ color: '#fa8c16' }} />}
              suffix="₹"
              precision={2}
              valueStyle={{ color: '#fa8c16' }}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {selectedMonth} {selectedYear}
            </Text>
          </Card>
        </Col>
      </Row>

      {/* Payrun and Company Overview */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <BarChartOutlined />
                <span>Payrun Statistics</span>
                <Tooltip title={`Payrun data for ${selectedMonth} ${selectedYear}`}>
                  <InfoCircleOutlined style={{ color: '#1890ff' }} />
                </Tooltip>
              </Space>
            }
            variant="outlined"
            style={{ height: '100%' }}
            loading={summaryLoading}
          >
            {payrunSummary && payrunSummary.totalEmployees > 0 ? (
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Statistic
                    title="Processed Employees"
                    value={payrunSummary.totalEmployees}
                    prefix={<UserOutlined />}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Total Salary"
                    value={payrunSummary.totalSalary}
                    prefix="₹"
                    precision={2}
                  />
                </Col>
                <Divider style={{ margin: '12px 0' }} />
                <Col span={12}>
                  <Statistic
                    title="Billable Total"
                    value={payrunSummary.totalBillable}
                    prefix="₹"
                    precision={2}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="GST Amount"
                    value={payrunSummary.totalGST}
                    prefix="₹"
                    precision={2}
                  />
                </Col>
                <Col span={24}>
                  <Statistic
                    title="Grand Total"
                    value={payrunSummary.totalGrandTotal}
                    prefix="₹"
                    precision={2}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Col>
              </Row>
            ) : (
              <div style={{ textAlign: 'center', padding: '30px 0', color: '#999' }}>
                <Text type="secondary">
                  No payrun data available for {selectedMonth} {selectedYear}
                </Text>
                <div style={{ marginTop: 8 }}>
                  <Text type="secondary">Import payrun data to view statistics</Text>
                </div>
              </div>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <RiseOutlined />
                <span>Category Distribution</span>
              </Space>
            }
            variant="outlined"
            style={{ height: '100%' }}
          >
            {selectedCompany && Object.keys(departmentStats).length > 0 ? (
              <List
                size="small"
                dataSource={Object.entries(departmentStats || {}).sort((a: any, b: any) => b[1] - a[1])}
                renderItem={([department, count]: [string, any]) => (
                  <List.Item>
                    <List.Item.Meta
                      title={department}
                      description={`${count} employee${count > 1 ? 's' : ''}`}
                    />
                    <Progress
                      percent={Math.round((count / (selectedCompany.employees?.length || 1)) * 100)}
                      size="small"
                    />
                  </List.Item>
                )}
              />
            ) : (
              <div style={{ textAlign: 'center', color: '#999', padding: '30px 0' }}>
                <Text type="secondary">No department data available</Text>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Company Comparison Table */}
      <Row style={{ marginTop: 24 }}>
        <Col span={24}>
          <Card
            title={
              <Space>
                <BankOutlined />
                <span>Company Overview</span>
              </Space>
            }
            variant="outlined"
          >
            <Table
              dataSource={companiesStats}
              columns={columns}
              rowKey="id"
              pagination={false}
              loading={statsLoading}
              onRow={(record) => ({
                style: {
                  background: record.id === selectedCompany?._id ? '#f0f8ff' : 'inherit',
                  fontWeight: record.id === selectedCompany?._id ? 'bold' : 'normal'
                }
              })}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardPage;