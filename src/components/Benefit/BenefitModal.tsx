import React, { useEffect } from 'react';
import { Modal, Form, Input, Select, InputNumber, Switch, Button, Radio } from 'antd';
import { Benefit } from '../../services/benefitService';

interface BenefitModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (values: Omit<Benefit, '_id' | 'createdAt'>) => void;
  initialValues?: Partial<Benefit>;
  title?: string;
}

const BenefitModal: React.FC<BenefitModalProps> = ({
  visible,
  onClose,
  onSubmit,
  initialValues,
  title = 'Add Benefit'
}) => {
  const [form] = Form.useForm();



  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue(initialValues);
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

  return (
    <Modal
      title={title}
      open={visible}
      onCancel={onClose}

      footer={
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            backgroundColor: '#fafafa',
          }}
        >
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" onClick={handleSubmit}>OK</Button>
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