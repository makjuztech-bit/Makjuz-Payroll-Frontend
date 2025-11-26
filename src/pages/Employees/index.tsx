import React, { useState, useEffect } from 'react';
import { Typography, Select, Empty, Space, Table, Button, Tag, Input, message, Tooltip } from 'antd';
import { SearchOutlined, EyeOutlined, DeleteOutlined } from '@ant-design/icons';
import { useCompany, Employee } from '../../context/CompanyContext';
import AddEmployeeModal from '../../components/Employee/AddEmployeeModal';
import ImportExcel from '../../components/Employee/ImportExcel';
import PayslipModal from '../../components/Payment/PayslipModal';
import employeeService from '../../services/employeeService';
import EmployeeDetailModal from '../../components/Employee/EmployeeDetailModal';

const { Title } = Typography;

const EmployeesPage: React.FC = () => {
  const { selectedCompany } = useCompany();
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [payslipEmp, setPayslipEmp] = useState<Employee | null>(null);
  const [filteredDepartment, setFilteredDepartment] = useState<string | null>(null);
  const [filteredCategory, setFilteredCategory] = useState<string | null>(null);
  const [filteredSalaryType, setFilteredSalaryType] = useState<string | null>(null);
  const [filteredEmployeeCategory, setFilteredEmployeeCategory] = useState<string | null>(null);
  const [searchText, setSearchText] = useState<string>('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch employees when company changes
  useEffect(() => {
    const fetchEmployees = async () => {
      if (!selectedCompany) {
        setEmployees([]);
        return;
      }

      setLoading(true);
      try {
        const data = await employeeService.getAllEmployees(selectedCompany._id);
        setEmployees(data);
      } catch (error) {
        console.error('Error fetching employees:', error);
        message.error('Failed to fetch employees');
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, [selectedCompany]);
  useEffect(() => {
    console.log("Selected Employee: ", selectedEmployee);
  }, [selectedEmployee]);


  // open/close for payslip modal
  const openPayslip = (emp: Employee) => setPayslipEmp(emp);
  const closePayslip = () => setPayslipEmp(null);

  const handleAdd = async (values: any) => {
    if (!selectedCompany) {
      message.warning('Please select a company first');
      return;
    }

    try {
      const newEmployee = await employeeService.createEmployee({
        ...values,
        company: selectedCompany._id,
        status: values.status || 'Active',
      });
      setEmployees(prev => [...prev, newEmployee]);
      message.success('Employee added successfully');
    } catch (error: any) {
      console.error('Error adding employee:', error);
      message.error(error.response?.data?.message || 'Failed to add employee');
    }
  };

  // Filter employees based on selected filters and search text
  const filteredEmployees = employees.filter(emp => {
    if (!emp) return false;

    const matchesDepartment = !filteredDepartment || emp.department === filteredDepartment;
    const matchesCategory = !filteredCategory || emp.category === filteredCategory;
    const matchesSalaryType = !filteredSalaryType || emp.salaryType === filteredSalaryType;
    const matchesEmployeeCategory = !filteredEmployeeCategory || emp.employeeCategory === filteredEmployeeCategory;
    const matchesSearch = !searchText ||
      emp.name.toLowerCase().includes(searchText.toLowerCase()) ||
      emp.empIdNo.toLowerCase().includes(searchText.toLowerCase());

    return matchesDepartment && matchesCategory && matchesSalaryType && matchesEmployeeCategory && matchesSearch;
  });

  // Get unique values for filters
  const departments = [...new Set(employees.map(emp => emp.department))].filter(Boolean);
  const categories = [...new Set(employees.map(emp => emp.category))].filter(Boolean);
  const salaryTypes = [...new Set(employees.map(emp => emp.salaryType))].filter(Boolean);
  const employeeCategories = [...new Set(employees.map(emp => emp.employeeCategory))].filter(Boolean);

  // Helper function to format date
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  // Helper function to calculate age
  const calculateAge = (dateOfBirth: string) => {
    if (!dateOfBirth) return '-';
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  };

  const columns = [
    {
      title: 'S.NO',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      render: (_: any, __: any, index: number) => index + 1
    },
    {
      title: 'EMP ID NO',
      dataIndex: 'empIdNo',
      key: 'empIdNo',
      width: 120,
      fixed: 'left' as const
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: 150,
      fixed: 'left' as const
    },
    {
      title: 'Date of Joining',
      dataIndex: 'dateOfJoining',
      key: 'dateOfJoining',
      width: 120,
      render: formatDate
    },

    {
      title: 'Date of Birth',
      dataIndex: 'DOB', // Changed from 'dateOfBirth' to match your data
      key: 'DOB',
      width: 120,
      render: (DOB: string) => (
        <Tooltip title={`Age: ${calculateAge(DOB)} years`}>
          {formatDate(DOB)}
        </Tooltip>
      )
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
      width: 120
    },
    {
      title: 'Designation',
      dataIndex: 'designation',
      key: 'designation',
      width: 120
    },
    {
      title: 'Gender',
      dataIndex: 'gender',
      key: 'gender',
      width: 80
    },
    {
      title: 'Salary Type',
      dataIndex: 'salaryType',
      key: 'salaryType',
      width: 100,
      render: (salaryType: string) => (
        <Tag color={salaryType === 'Salary' ? 'blue' : 'green'}>
          {salaryType}
        </Tag>
      )
    },
    {
      title: 'Employee Category',
      dataIndex: 'employeeCategory',
      key: 'employeeCategory',
      width: 120,
      render: (employeeCategory: string) => {
        const colorMap = {
          'NAPS': 'purple',
          'NON-NAPS': 'orange',
          'NATS': 'cyan',
          'NON-NATS': 'magenta'
        };
        return (
          <Tag color={colorMap[employeeCategory as keyof typeof colorMap] || 'default'}>
            {employeeCategory}
          </Tag>
        );
      }
    },
    {
      title: 'Fixed Stipend',
      dataIndex: 'fixedStipend',
      key: 'fixedStipend',
      width: 120,
      render: (amount: number) => `₹${amount?.toLocaleString('en-IN') || 0}`
    },
    {
      title: "Father's Name",
      dataIndex: 'fatherName',
      key: 'fatherName',
      width: 150
    },
    {
      title: 'Contact Number',
      dataIndex: 'contactNumber',
      key: 'contactNumber',
      width: 130
    },
    {
      title: 'Emergency Contact',
      dataIndex: 'emergencyContactNumber',
      key: 'emergencyContactNumber',
      width: 130
    },
    {
      title: 'Blood Group',
      dataIndex: 'bloodGroup',
      key: 'bloodGroup',
      width: 100,
      render: (bloodGroup: string) => (
        <Tag color="red">{bloodGroup}</Tag>
      )
    },
    {
      title: 'Qualification',
      dataIndex: 'qualification',
      key: 'qualification',
      width: 120
    },
    {
      title: 'Qualification Trade',
      dataIndex: 'qualificationTrade',
      key: 'qualificationTrade',
      width: 150,
      render: (text: string) => text || '-'
    },
    {
      title: 'Aadhar Number',
      dataIndex: 'adharNumber',
      key: 'adharNumber',
      width: 130,
      render: (aadhar: string) => aadhar ? `****-****-${aadhar.slice(-4)}` : '-'
    },
    {
      title: 'PAN Number',
      dataIndex: 'panNumber',
      key: 'panNumber',
      width: 120,
      render: (pan: string) => pan ? `${pan.slice(0, 3)}****${pan.slice(-1)}` : '-'
    },
    {
      title: 'Bank Details',
      key: 'bankDetails',
      width: 200,
      render: (_: any, record: Employee) => (
        <div>
          <div><strong>{record.bankName}</strong></div>
          <div>A/C: ****{record.accountNumber?.slice(-4)}</div>
          <div>IFSC: {record.ifscCode}</div>
          <div>Branch: {record.branch}</div>
        </div>
      )
    },
    {
      title: 'UAN',
      dataIndex: 'uan',
      key: 'uan',
      width: 120,
      render: (text: string) => text || '-'
    },
    {
      title: 'ESI Number',
      dataIndex: 'esiNumber',
      key: 'esiNumber',
      width: 120,
      render: (text: string) => text || '-'
    },
    {
      title: 'Insurance Number',
      dataIndex: 'insuranceNumber',
      key: 'insuranceNumber',
      width: 130,
      render: (text: string) => text || '-'
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (category: string) => (
        <Tag color={category === 'Regular' ? 'green' : category === 'Contract' ? 'orange' : 'blue'}>
          {category}
        </Tag>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={status === 'Active' ? 'success' : 'error'}>
          {status}
        </Tag>
      )
    },
    {
      title: 'Action',
      key: 'action',
      width: 150,
      fixed: 'right' as const,
      render: (_: any, record: Employee) => (
        <Space>
          <Tooltip title="View Details">
            {/* <Button 
              type="link" 
              icon={<EyeOutlined />}
              onClick={() => openPayslip(record)}
            >
              View
            </Button> */}
            <Button
              type="link"
              icon={<EyeOutlined />}
              // 
              onClick={() => {
                console.log("Selected Employee:", record);
                setSelectedEmployee(record);
                setIsModalOpen(true);
              }}

            >
              View
            </Button>

          </Tooltip>
          <Tooltip title="Delete Employee">
            <Button
              type="link"
              icon={<DeleteOutlined />}
              danger
              onClick={async () => {
                try {
                  await employeeService.deleteEmployee(record.id);
                  setEmployees(prev => prev.filter(emp => emp.id !== record.id));
                  message.success('Employee deleted successfully');
                } catch (error) {
                  console.error('Error deleting employee:', error);
                  message.error('Failed to delete employee');
                }
              }}
            >
              Delete
            </Button>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      {/* Top bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <Title level={4} style={{ margin: 0 }}>
          {selectedCompany
            ? `${selectedCompany.name} - Employees (${filteredEmployees.length})`
            : 'Employees'}
        </Title>
        <Space size="middle">
          <AddEmployeeModal onAdd={handleAdd} />
          <ImportExcel />
        </Space>
      </div>

      {selectedCompany ? (
        <>
          {/* Filters */}
          <div
            style={{
              display: 'flex',
              gap: 16,
              marginBottom: 24,
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <span style={{ fontWeight: 'bold' }}>FILTER BY:</span>
            <Input
              placeholder="Search by name or ID"
              prefix={<SearchOutlined />}
              style={{ width: 200 }}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
            <Select
              placeholder="Select Department"
              style={{ width: 180 }}
              allowClear
              value={filteredDepartment}
              onChange={setFilteredDepartment}
              options={departments.map(dept => ({ value: dept, label: dept }))}
            />
            <Select
              placeholder="Select Category"
              style={{ width: 150 }}
              allowClear
              value={filteredCategory}
              onChange={setFilteredCategory}
              options={categories.map(cat => ({ value: cat, label: cat }))}
            />
            <Select
              placeholder="Salary Type"
              style={{ width: 130 }}
              allowClear
              value={filteredSalaryType}
              onChange={setFilteredSalaryType}
              options={salaryTypes.map(type => ({ value: type, label: type }))}
            />
            <Select
              placeholder="Employee Category"
              style={{ width: 150 }}
              allowClear
              value={filteredEmployeeCategory}
              onChange={setFilteredEmployeeCategory}
              options={employeeCategories.map(cat => ({ value: cat, label: cat }))}
            />
          </div>

          {/* Statistics */}
          <div style={{
            display: 'flex',
            gap: 16,
            marginBottom: 16,
            padding: '16px 0',
            borderBottom: '1px solid #f0f0f0'
          }}>
            <div style={{ padding: '8px 16px', backgroundColor: '#f6ffed', borderRadius: '6px' }}>
              <span style={{ color: '#52c41a', fontWeight: 'bold' }}>Total: {filteredEmployees.length}</span>
            </div>
            <div style={{ padding: '8px 16px', backgroundColor: '#e6f7ff', borderRadius: '6px' }}>
              <span style={{ color: '#1890ff', fontWeight: 'bold' }}>
                Active: {filteredEmployees.filter(emp => emp.status === 'Active').length}
              </span>
            </div>
            <div style={{ padding: '8px 16px', backgroundColor: '#fff2e8', borderRadius: '6px' }}>
              <span style={{ color: '#fa8c16', fontWeight: 'bold' }}>
                Inactive: {filteredEmployees.filter(emp => emp.status !== 'Active').length}
              </span>
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto', width: '100%' }}>
            <Table
              dataSource={filteredEmployees}
              columns={columns}
              rowKey="id"
              pagination={{
                total: filteredEmployees.length,
                pageSize: 50,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${total} employees`,
              }}
              scroll={{ x: 2800, y: 600 }}
              loading={loading}
              size="small"
              bordered
            />
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <Empty
            description={
              <div>
                <h3>Please select a company first</h3>
                <p style={{ color: '#666' }}>
                  Choose a company from the dropdown above to manage employees.
                </p>
              </div>
            }
          />
        </div>
      )}
      {
        selectedEmployee && (
          <EmployeeDetailModal
            visible={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            employee={selectedEmployee}
          />
        )
      }
      {/* Payslip Modal */}
      {payslipEmp && (
        <PayslipModal
          visible={true}
          employee={payslipEmp}
          companyName={selectedCompany?.name || 'Payroll System'}
          onClose={closePayslip}
          companyId={selectedCompany?._id || ''}
        />
      )}
    </div>
  );
};


export default EmployeesPage;