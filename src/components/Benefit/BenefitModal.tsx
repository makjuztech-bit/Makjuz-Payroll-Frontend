import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, InputNumber, Switch, Button, Popconfirm } from 'antd';
import { Benefit } from '../../services/benefitService';
import employeeService from '../../services/employeeService';
import { Employee } from '../../context/CompanyContext';

interface BenefitModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (values: Omit<Benefit, '_id' | 'createdAt'>) => void;
  onDelete?: (id: string) => void;
  initialValues?: Partial<Benefit>;
  title?: string;
  companyId?: string;
}

const BenefitModal: React.FC<BenefitModalProps> = ({
  visible,
  onClose,
  onSubmit,
  onDelete,
  initialValues,
  title = 'Add Benefit',
  companyId
}) => {
  const [form] = Form.useForm();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  useEffect(() => {
    if (visible && companyId) {
      fetchEmployees();
    }
  }, [visible, companyId]);

  const fetchEmployees = async () => {
    if (!companyId) return;
    setLoadingEmployees(true);
    try {
      const data = await employeeService.getAllEmployees(companyId);
      setEmployees(data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoadingEmployees(false);
    }
  };

  useEffect(() => {
    if (initialValues) {
      // Handle employee field which might be an object or string
      const values = { ...initialValues };
      if (values.employee && typeof values.employee === 'object') {
        values.employee = (values.employee as any)._id || (values.employee as any).id;
      }
      form.setFieldsValue(values);
    } else {
      form.resetFields();
    }
  }, [initialValues, form]);

  const handleSubmit = () => {
    form.validateFields().then(values => {
      onSubmit(values);
      form.resetFields();
      onClose();
    });
  };

  const handleDelete = () => {
    if (initialValues?._id && onDelete) {
      onDelete(initialValues._id);
      onClose();
    }
  };

  return (
    <Modal
      title={title}
      open={visible}
      onCancel={onClose}
      footer={
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between', // Changed to space-between to accommodate delete button
            alignItems: 'center',
            backgroundColor: '#fafafa',
          }}
        >
          {initialValues?._id && onDelete ? (
            <Popconfirm
              title="Delete Benefit"
              description="Are you sure to delete this benefit?"
              onConfirm={handleDelete}
              okText="Yes"
              cancelText="No"
            >
              <Button danger>Delete</Button>
            </Popconfirm>
          ) : (
            <div /> // Spacer if no delete button
          )}
          <div style={{ display: 'flex', gap: '12px' }}>
            <Button onClick={onClose}>Cancel</Button>
            <Button type="primary" onClick={handleSubmit}>OK</Button>
          </div>
        </div>
      }
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={initialValues}
      >
        <Form.Item
          name="title"
          label="Title"
          rules={[{ required: true, message: 'Please input benefit title!' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="description"
          label="Description"
          rules={[{ required: true, message: 'Please input benefit description!' }]}
        >
          <Input.TextArea rows={4} />
        </Form.Item>

        <Form.Item
          name="type"
          label="Type"
          rules={[{ required: true, message: 'Please select benefit type!' }]}
        >
          <Select>
            <Select.Option value="WC">WC</Select.Option>
            <Select.Option value="Transportation">Transportation</Select.Option>
            <Select.Option value="Housing">Housing</Select.Option>
            <Select.Option value="Canteen">Canteen</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="employee"
          label="Employee (Optional)"
        >
          <Select
            showSearch
            placeholder="Select an employee"
            optionFilterProp="children"
            loading={loadingEmployees}
            allowClear
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={employees.map(emp => ({
              value: (emp as any)._id || emp.id, // Handle both id formats
              label: `${emp.name} (${emp.empIdNo})`,
            }))}
          />
        </Form.Item>

        <Form.Item
          name="amount"
          label="Amount"
          rules={[{ required: true, message: 'Please input benefit amount!' }]}
        >
          <InputNumber
            style={{ width: '100%' }}
            formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={value => value!.replace(/₹\s?|(,*)/g, '')}
          />
        </Form.Item>

        <Form.Item
          label="Status"
          shouldUpdate={(prevValues, currentValues) => prevValues.active !== currentValues.active}
          style={{ marginBottom: 0 }}
        >
          {({ getFieldValue }) => {
            const isActive = getFieldValue('active');
            return (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '8px 12px',
                  borderRadius: 6,
                  userSelect: 'none',
                }}
              >
                <span
                  style={{
                    fontWeight: 600,
                    fontSize: 14,
                    color: isActive ? '#52c41a' : '#434343',
                  }}
                >
                  {isActive ? 'Active' : 'Inactive'}
                </span>
                <Form.Item
                  name="active"
                  valuePropName="checked"
                  noStyle
                  initialValue={true}
                >
                  <Switch
                    checkedChildren=""
                    unCheckedChildren=""
                    style={{
                      width: 48,
                      height: 24,
                      backgroundColor: isActive ? '#52c41a' : undefined,
                      boxShadow: 'none',
                    }}
                  />
                </Form.Item>
              </div>
            );
          }}
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default BenefitModal;