import React, { useState } from 'react';
import { Modal, Button, Form, Input, Select, InputNumber, Row, Col, DatePicker } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

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
  company: string;
  uan?: string;
  esiNumber?: string;
  insuranceNumber?: string;
  category: string;
  status: string;
  dateOfBirth: string;
  salaryType: 'Wages' | 'Salary';
  employeeCategory: 'NAPS' | 'NON-NAPS' | 'NATS' | 'NON-NATS';
}

export interface AddEmployeeModalProps {
  onAdd: (values: EmployeeFormValues) => void;
  companies?: Array<{ _id: string; name: string }>;
}

export const AddEmployeeModal: React.FC<AddEmployeeModalProps> = ({ onAdd, companies = [] }) => {
  const [visible, setVisible] = useState(false);
  const [form] = Form.useForm<EmployeeFormValues>();

  const open = () => setVisible(true);
  const close = () => {
    setVisible(false);
    form.resetFields();
  };

  const handleFinish = (values: EmployeeFormValues) => {
    let dobValue = values.dateOfBirth;
    if (!dobValue || dobValue === "") dobValue = '';
    else dobValue = new Date(dobValue).toISOString();

    const processedValues = {
      ...values,
      dateOfBirth: dobValue
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
        destroyOnClose
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
            <Col span={8}>
              <Form.Item name="empIdNo" label="Employee ID" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="name" label="Name" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="dateOfJoining" label="Date of Joining" rules={[{ required: true }]}>
                <Input type="date" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="dateOfBirth"
                label="Date of Birth"
                rules={[
                  { required: true, message: 'Please select date of birth' },
                  {
                    validator: (_, value) => {
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
            <Col span={8}>
              <Form.Item name="department" label="Department" rules={[{ required: true }]}>
                <Input placeholder="Enter Department" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="designation" label="Designation" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="gender" label="Gender" rules={[{ required: true }]}>
                <Select>
                  <Select.Option value="Male">Male</Select.Option>
                  <Select.Option value="Female">Female</Select.Option>
                  <Select.Option value="Other">Other</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="fatherName" label="Father's Name" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="company" label="Company" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>

          {/* Salary Information */}
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="fixedStipend" label="Fixed Stipend" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="salaryType" label="Salary Type" rules={[{ required: true }]}>
                <Select>
                  <Select.Option value="Wages">Wages</Select.Option>
                  <Select.Option value="Salary">Salary</Select.Option>
                  <Select.Option value="Stipend">Stipend</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="category" label="Category" rules={[{ required: true }]}>
                <Select>
                  <Select.Option value="Regular">Regular</Select.Option>
                  <Select.Option value="Contract">Contract</Select.Option>
                  <Select.Option value="Temporary">Temporary</Select.Option>
                  <Select.Option value="Intern">Intern</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="employeeCategory" label="Employee Category" rules={[{ required: true }]}>
                <Select>
                  <Select.Option value="NAPS">NAPS</Select.Option>
                  <Select.Option value="NON-NAPS">NON-NAPS</Select.Option>
                  <Select.Option value="NATS">NATS</Select.Option>
                  <Select.Option value="NON-NATS">NON-NATS</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="status" label="Status" rules={[{ required: true }]}>
                <Select>
                  <Select.Option value="Active">Active</Select.Option>
                  <Select.Option value="Inactive">Inactive</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          {/* Address Information */}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="permanentAddress" label="Permanent Address" rules={[{ required: true }]}>
                <Input.TextArea rows={3} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="communicationAddress" label="Communication Address" rules={[{ required: true }]}>
                <Input.TextArea rows={3} />
              </Form.Item>
            </Col>
          </Row>

          {/* Contact Information */}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="contactNumber" label="Contact Number" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="emergencyContactNumber"
                label="Emergency Contact Number"
                dependencies={['contactNumber']}
                rules={[
                  { required: true },
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
          </Row>

          {/* Qualification Information */}
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="qualification" label="Qualification" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="qualificationTrade" label="Qualification (Trade)">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="bloodGroup" label="Blood Group" rules={[{ required: true }]}>
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
          </Row>

          {/* Document Information */}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="adharNumber" label="Aadhar Number" rules={[
                { required: true },
                { pattern: /^\d{12}$/, message: 'Aadhar number must be 12 digits' }
              ]}>
                <Input maxLength={12} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="panNumber" label="PAN Number" rules={[
                { required: true },
                { pattern: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, message: 'Invalid PAN format' }
              ]}>
                <Input maxLength={10} style={{ textTransform: 'uppercase' }} />
              </Form.Item>
            </Col>
          </Row>

          {/* Bank Information */}
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="bankName" label="Bank Name" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="accountNumber" label="Account Number" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="ifscCode" label="IFSC Code" rules={[
                { required: true },
                { pattern: /^[A-Z]{4}0[A-Z0-9]{6}$/, message: 'Invalid IFSC format' }
              ]}>
                <Input maxLength={11} style={{ textTransform: 'uppercase' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="branch" label="Branch" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>

          {/* Additional Information */}
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="photo" label="Photo">
                <Input type="file" accept="image/*" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="experience" label="Experience">
                <Input placeholder="e.g., 2 years" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="uan" label="UAN">
                <Input maxLength={12} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="esiNumber" label="ESI Number">
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="insuranceNumber" label="Insurance Number">
                <Input />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </>
  );
};

export default AddEmployeeModal;