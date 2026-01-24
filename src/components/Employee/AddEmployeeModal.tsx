import React, { useState } from 'react';
import { Modal, Button, Form, Input, Select, InputNumber, Row, Col } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { FieldConfig } from './FormCustomizationModal';

export interface EmployeeFormValues {
  empIdNo: string;
  name: string;
  dateOfJoining: string;
  department: string;
  designation: string;
  gender: string;
  fixedStipend: number;
  fatherName: string;
  permanentAddress: string;
  communicationAddress: string;
  contactNumber: string;
  emergencyContactNumber: string;
  qualification: string;
  qualificationTrade?: string;
  bloodGroup: string;
  adharNumber: string;
  panNumber: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  branch: string;
  photo?: string;
  experience?: string;
  uan?: string;
  esiNumber?: string;
  insuranceNumber?: string;
  category: string;
  status: string;
  dateOfBirth: string;
  salaryType: 'Wages' | 'Salary';
  employeeCategory: 'NAPS' | 'NON-NAPS' | 'NATS' | 'NON-NATS';
  customFields?: Record<string, string>;
  [key: string]: any; // Allow dynamic keys for form implementation convenience
}

export interface AddEmployeeModalProps {
  onAdd: (values: EmployeeFormValues) => void;
  departments?: string[];
  designations?: string[];
  companyName?: string;
  fieldConfig?: FieldConfig[];
}

export const AddEmployeeModal: React.FC<AddEmployeeModalProps> = ({
  onAdd,
  companyName,
  fieldConfig = []
}) => {
  const [visible, setVisible] = useState(false);
  const [form] = Form.useForm<EmployeeFormValues>();

  const open = () => setVisible(true);
  const close = () => {
    setVisible(false);
    form.resetFields();
  };

  // Helper to check field status
  const getFieldStatus = (key: string) => {
    const field = fieldConfig.find(f => f.key === key);
    // If no config provided (e.g. first load), default to true/required for safety relative to mandatory fields
    if (!field) return { visible: true, required: true, label: key };
    return { visible: field.visible, required: field.required, label: field.label };
  };

  const getCustomFields = () => {
    return fieldConfig.filter(f => f.isCustom);
  };

  const handleFinish = (values: EmployeeFormValues) => {
    let dobValue = values.dateOfBirth;
    if (!dobValue || dobValue === "") dobValue = '';
    else dobValue = new Date(dobValue).toISOString();

    // Extract custom fields
    const customFieldConfigs = getCustomFields();
    const customFieldsData: Record<string, string> = {};

    customFieldConfigs.forEach(field => {
      if (values[field.key]) {
        customFieldsData[field.key] = values[field.key];
        delete values[field.key]; // Remove from root if we want it clean, but arguably keeping it is fine too.
        // But we need to structure it for the backend.
      }
    });

    const processedValues = {
      ...values,
      dateOfBirth: dobValue,
      customFields: customFieldsData
    };
    console.log('Processed values:', processedValues);

    // Only send if dateOfBirth is not empty
    if (processedValues.dateOfBirth) {
      onAdd(processedValues);
      close();
    } else {
      console.error('Date of Birth is required but not provided');
    }
  };

  return (
    <>
      <Button type="primary" icon={<PlusOutlined />} onClick={open}>
        Add Employee
      </Button>
      <Modal
        title="Add New Employee"
        open={visible}
        onCancel={close}
        onOk={() => form.submit()}
        width={1200}
        destroyOnHidden
      >
        <Form<EmployeeFormValues>
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          initialValues={{
            status: 'Active',
            salaryType: 'Salary',
            employeeCategory: 'NAPS',
          }}
        >
          {/* Basic Information */}
          <Row gutter={16}>
            {getFieldStatus('empIdNo').visible && (
              <Col span={8}>
                <Form.Item name="empIdNo" label={getFieldStatus('empIdNo').label} rules={[{ required: getFieldStatus('empIdNo').required }]}>
                  <Input />
                </Form.Item>
              </Col>
            )}
            {getFieldStatus('name').visible && (
              <Col span={8}>
                <Form.Item name="name" label={getFieldStatus('name').label} rules={[{ required: getFieldStatus('name').required }]}>
                  <Input />
                </Form.Item>
              </Col>
            )}
            {getFieldStatus('dateOfJoining').visible && (
              <Col span={8}>
                <Form.Item name="dateOfJoining" label={getFieldStatus('dateOfJoining').label} rules={[{ required: getFieldStatus('dateOfJoining').required }]}>
                  <Input type="date" />
                </Form.Item>
              </Col>
            )}
          </Row>

          <Row gutter={16}>
            {getFieldStatus('dateOfBirth').visible && (
              <Col span={8}>
                <Form.Item
                  name="dateOfBirth"
                  label={getFieldStatus('dateOfBirth').label}
                  rules={[
                    { required: getFieldStatus('dateOfBirth').required, message: 'Please select date of birth' },
                    {
                      validator: (_, value) => {
                        // If not required and no value, pass
                        if (!value && !getFieldStatus('dateOfBirth').required) return Promise.resolve();

                        // If required and no value, handled by 'required' rule but safe to check
                        if (!value) return Promise.reject(new Error('Date of birth is required'));

                        const dob = new Date(value);
                        const today = new Date();

                        // Check if date is valid
                        if (isNaN(dob.getTime())) {
                          return Promise.reject(new Error('Please enter a valid date'));
                        }

                        const age = today.getFullYear() - dob.getFullYear();
                        const monthDiff = today.getMonth() - dob.getMonth();

                        let actualAge = age;
                        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
                          actualAge = age - 1;
                        }

                        if (actualAge < 18) {
                          return Promise.reject(new Error('Employee must be at least 18 years old'));
                        }
                        return Promise.resolve();
                      }
                    }
                  ]}
                >
                  <Input type="date" />
                </Form.Item>
              </Col>
            )}
            {getFieldStatus('department').visible && (
              <Col span={8}>
                <Form.Item name="department" label={getFieldStatus('department').label} rules={[{ required: getFieldStatus('department').required }]}>
                  <Input />
                </Form.Item>
              </Col>
            )}
            {getFieldStatus('designation').visible && (
              <Col span={8}>
                <Form.Item name="designation" label={getFieldStatus('designation').label} rules={[{ required: getFieldStatus('designation').required }]}>
                  <Input />
                </Form.Item>
              </Col>
            )}
          </Row>

          <Row gutter={16}>
            {getFieldStatus('gender').visible && (
              <Col span={8}>
                <Form.Item name="gender" label={getFieldStatus('gender').label} rules={[{ required: getFieldStatus('gender').required }]}>
                  <Select>
                    <Select.Option value="Male">Male</Select.Option>
                    <Select.Option value="Female">Female</Select.Option>
                    <Select.Option value="Other">Other</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
            )}
            {getFieldStatus('fatherName').visible && (
              <Col span={8}>
                <Form.Item name="fatherName" label={getFieldStatus('fatherName').label} rules={[{ required: getFieldStatus('fatherName').required }]}>
                  <Input />
                </Form.Item>
              </Col>
            )}
            <Col span={8}>
              <Form.Item label="Company">
                <Input value={companyName} disabled placeholder="Selected Company" />
              </Form.Item>
            </Col>
          </Row>

          {/* Salary Information */}
          <Row gutter={16}>
            {getFieldStatus('fixedStipend').visible && (
              <Col span={8}>
                <Form.Item name="fixedStipend" label={getFieldStatus('fixedStipend').label} rules={[{ required: getFieldStatus('fixedStipend').required }]}>
                  <InputNumber style={{ width: '100%' }} min={0} />
                </Form.Item>
              </Col>
            )}
            {getFieldStatus('salaryType').visible && (
              <Col span={8}>
                <Form.Item name="salaryType" label={getFieldStatus('salaryType').label} rules={[{ required: getFieldStatus('salaryType').required }]}>
                  <Select>
                    <Select.Option value="Wages">Wages</Select.Option>
                    <Select.Option value="Salary">Salary</Select.Option>
                    <Select.Option value="Stipend">Stipend</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
            )}
            {getFieldStatus('category').visible && (
              <Col span={8}>
                <Form.Item name="category" label={getFieldStatus('category').label} rules={[{ required: getFieldStatus('category').required }]}>
                  <Select>
                    <Select.Option value="Regular">Regular</Select.Option>
                    <Select.Option value="Contract">Contract</Select.Option>
                    <Select.Option value="Temporary">Temporary</Select.Option>
                    <Select.Option value="Intern">Intern</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
            )}
          </Row>

          <Row gutter={16}>
            {getFieldStatus('employeeCategory').visible && (
              <Col span={8}>
                <Form.Item name="employeeCategory" label={getFieldStatus('employeeCategory').label} rules={[{ required: getFieldStatus('employeeCategory').required }]}>
                  <Select>
                    <Select.Option value="NAPS">NAPS</Select.Option>
                    <Select.Option value="NON-NAPS">NON-NAPS</Select.Option>
                    <Select.Option value="NATS">NATS</Select.Option>
                    <Select.Option value="NON-NATS">NON-NATS</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
            )}
            {getFieldStatus('status').visible && (
              <Col span={8}>
                <Form.Item name="status" label={getFieldStatus('status').label} rules={[{ required: getFieldStatus('status').required }]}>
                  <Select>
                    <Select.Option value="Active">Active</Select.Option>
                    <Select.Option value="Inactive">Inactive</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
            )}
          </Row>

          {/* Address Information */}
          <Row gutter={16}>
            {getFieldStatus('permanentAddress').visible && (
              <Col span={12}>
                <Form.Item name="permanentAddress" label={getFieldStatus('permanentAddress').label} rules={[{ required: getFieldStatus('permanentAddress').required }]}>
                  <Input.TextArea rows={3} />
                </Form.Item>
              </Col>
            )}
            {getFieldStatus('communicationAddress').visible && (
              <Col span={12}>
                <Form.Item name="communicationAddress" label={getFieldStatus('communicationAddress').label} rules={[{ required: getFieldStatus('communicationAddress').required }]}>
                  <Input.TextArea rows={3} />
                </Form.Item>
              </Col>
            )}
          </Row>

          {/* Contact Information */}
          <Row gutter={16}>
            {getFieldStatus('contactNumber').visible && (
              <Col span={12}>
                <Form.Item name="contactNumber" label={getFieldStatus('contactNumber').label} rules={[{ required: getFieldStatus('contactNumber').required }]}>
                  <Input />
                </Form.Item>
              </Col>
            )}
            {getFieldStatus('emergencyContactNumber').visible && (
              <Col span={12}>
                <Form.Item
                  name="emergencyContactNumber"
                  label={getFieldStatus('emergencyContactNumber').label}
                  dependencies={['contactNumber']}
                  rules={[
                    { required: getFieldStatus('emergencyContactNumber').required },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('contactNumber') !== value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error('Emergency contact cannot be same as contact number'));
                      },
                    }),
                  ]}
                >
                  <Input />
                </Form.Item>
              </Col>
            )}
          </Row>

          {/* Qualification Information */}
          <Row gutter={16}>
            {getFieldStatus('qualification').visible && (
              <Col span={8}>
                <Form.Item name="qualification" label={getFieldStatus('qualification').label} rules={[{ required: getFieldStatus('qualification').required }]}>
                  <Input />
                </Form.Item>
              </Col>
            )}
            {getFieldStatus('qualificationTrade').visible && (
              <Col span={8}>
                <Form.Item name="qualificationTrade" label={getFieldStatus('qualificationTrade').label} rules={[{ required: getFieldStatus('qualificationTrade').required }]}>
                  <Input />
                </Form.Item>
              </Col>
            )}
            {getFieldStatus('bloodGroup').visible && (
              <Col span={8}>
                <Form.Item name="bloodGroup" label={getFieldStatus('bloodGroup').label} rules={[{ required: getFieldStatus('bloodGroup').required }]}>
                  <Select>
                    <Select.Option value="A+">A+</Select.Option>
                    <Select.Option value="A-">A-</Select.Option>
                    <Select.Option value="B+">B+</Select.Option>
                    <Select.Option value="B-">B-</Select.Option>
                    <Select.Option value="O+">O+</Select.Option>
                    <Select.Option value="O-">O-</Select.Option>
                    <Select.Option value="AB+">AB+</Select.Option>
                    <Select.Option value="AB-">AB-</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
            )}
          </Row>

          {/* Document Information */}
          <Row gutter={16}>
            {getFieldStatus('adharNumber').visible && (
              <Col span={12}>
                <Form.Item name="adharNumber" label={getFieldStatus('adharNumber').label} rules={[
                  { required: getFieldStatus('adharNumber').required },
                  { pattern: /^\d{12}$/, message: 'Aadhar number must be 12 digits' }
                ]}>
                  <Input maxLength={12} />
                </Form.Item>
              </Col>
            )}
            {getFieldStatus('panNumber').visible && (
              <Col span={12}>
                <Form.Item
                  name="panNumber"
                  label={getFieldStatus('panNumber').label}
                  normalize={(value) => (value || '').toUpperCase().trim()}
                  rules={[
                    { required: getFieldStatus('panNumber').required },
                    { pattern: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, message: 'Invalid PAN format' }
                  ]}>
                  <Input maxLength={10} />
                </Form.Item>
              </Col>
            )}
          </Row>

          {/* Bank Information */}
          <Row gutter={16}>
            {getFieldStatus('bankName').visible && (
              <Col span={6}>
                <Form.Item name="bankName" label={getFieldStatus('bankName').label} rules={[{ required: getFieldStatus('bankName').required }]}>
                  <Input />
                </Form.Item>
              </Col>
            )}
            {getFieldStatus('accountNumber').visible && (
              <Col span={6}>
                <Form.Item name="accountNumber" label={getFieldStatus('accountNumber').label} rules={[{ required: getFieldStatus('accountNumber').required }]}>
                  <Input />
                </Form.Item>
              </Col>
            )}
            {getFieldStatus('ifscCode').visible && (
              <Col span={6}>
                <Form.Item
                  name="ifscCode"
                  label={getFieldStatus('ifscCode').label}
                  normalize={(value) => (value || '').toUpperCase().trim()}
                  rules={[
                    { required: getFieldStatus('ifscCode').required },
                    { pattern: /^[A-Z]{4}0[A-Z0-9]{6}$/, message: 'Invalid IFSC format' }
                  ]}>
                  <Input maxLength={11} />
                </Form.Item>
              </Col>
            )}
            {getFieldStatus('branch').visible && (
              <Col span={6}>
                <Form.Item name="branch" label={getFieldStatus('branch').label} rules={[{ required: getFieldStatus('branch').required }]}>
                  <Input />
                </Form.Item>
              </Col>
            )}
          </Row>

          {/* Additional Information */}
          <Row gutter={16}>
            {getFieldStatus('photo').visible && (
              <Col span={6}>
                <Form.Item name="photo" label={getFieldStatus('photo').label} rules={[{ required: getFieldStatus('photo').required }]}>
                  <Input type="file" accept="image/*" />
                </Form.Item>
              </Col>
            )}
            {getFieldStatus('experience').visible && (
              <Col span={6}>
                <Form.Item name="experience" label={getFieldStatus('experience').label} rules={[{ required: getFieldStatus('experience').required }]}>
                  <Input placeholder="e.g., 2 years" />
                </Form.Item>
              </Col>
            )}
            {getFieldStatus('uan').visible && (
              <Col span={6}>
                <Form.Item name="uan" label={getFieldStatus('uan').label} rules={[{ required: getFieldStatus('uan').required }]}>
                  <Input maxLength={12} />
                </Form.Item>
              </Col>
            )}
            {getFieldStatus('esiNumber').visible && (
              <Col span={6}>
                <Form.Item name="esiNumber" label={getFieldStatus('esiNumber').label} rules={[{ required: getFieldStatus('esiNumber').required }]}>
                  <Input />
                </Form.Item>
              </Col>
            )}
          </Row>

          <Row gutter={16}>
            {getFieldStatus('insuranceNumber').visible && (
              <Col span={12}>
                <Form.Item name="insuranceNumber" label={getFieldStatus('insuranceNumber').label} rules={[{ required: getFieldStatus('insuranceNumber').required }]}>
                  <Input />
                </Form.Item>
              </Col>
            )}
          </Row>

          {/* Custom Fields - Rendered at the end for simplicity */}
          {getCustomFields().length > 0 && (
            <>
              <Row gutter={16}>
                <Col span={24}>
                  <h3 style={{ marginTop: 16 }}>Additional Information</h3>
                </Col>
              </Row>
              <Row gutter={16}>
                {getCustomFields().map(field => (
                  field.visible && (
                    <Col span={8} key={field.key}>
                      <Form.Item name={field.key} label={field.label} rules={[{ required: field.required }]}>
                        <Input />
                      </Form.Item>
                    </Col>
                  )
                ))}
              </Row>
            </>
          )}

        </Form>
      </Modal>
    </>
  );
};

export default AddEmployeeModal;