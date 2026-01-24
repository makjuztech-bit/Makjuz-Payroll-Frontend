import React, { useState, useEffect } from 'react';
import { Modal, Checkbox, Row, Col, Typography, Divider, Button, Switch, Input, Space, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';

const { Text } = Typography;

export interface FieldConfig {
    key: string;
    label: string;
    visible: boolean;
    required: boolean;
    section: string;
    isCustom?: boolean;
}

export const DEFAULT_FIELD_CONFIG: FieldConfig[] = [
    // Basic Information
    { key: 'empIdNo', label: 'Employee ID', visible: true, required: true, section: 'Basic Information' },
    { key: 'name', label: 'Name', visible: true, required: true, section: 'Basic Information' },
    { key: 'dateOfJoining', label: 'Date of Joining', visible: true, required: true, section: 'Basic Information' },
    { key: 'dateOfBirth', label: 'Date of Birth', visible: true, required: true, section: 'Basic Information' },
    { key: 'department', label: 'Department', visible: true, required: true, section: 'Basic Information' },
    { key: 'designation', label: 'Designation', visible: true, required: true, section: 'Basic Information' },
    { key: 'gender', label: 'Gender', visible: true, required: true, section: 'Basic Information' },
    { key: 'fatherName', label: "Father's Name", visible: true, required: true, section: 'Basic Information' },

    // Salary Information
    { key: 'fixedStipend', label: 'Fixed Stipend', visible: true, required: true, section: 'Salary Information' },
    { key: 'salaryType', label: 'Salary Type', visible: true, required: true, section: 'Salary Information' },
    { key: 'category', label: 'Category', visible: true, required: true, section: 'Salary Information' },
    { key: 'employeeCategory', label: 'Employee Category', visible: true, required: true, section: 'Salary Information' },
    { key: 'status', label: 'Status', visible: true, required: true, section: 'Salary Information' },

    // Address Information
    { key: 'permanentAddress', label: 'Permanent Address', visible: true, required: true, section: 'Address Information' },
    { key: 'communicationAddress', label: 'Communication Address', visible: true, required: true, section: 'Address Information' },

    // Contact Information
    { key: 'contactNumber', label: 'Contact Number', visible: true, required: true, section: 'Contact Information' },
    { key: 'emergencyContactNumber', label: 'Emergency Contact', visible: true, required: true, section: 'Contact Information' },

    // Qualification
    { key: 'qualification', label: 'Qualification', visible: true, required: true, section: 'Qualification' },
    { key: 'qualificationTrade', label: 'Qualification Trade', visible: true, required: false, section: 'Qualification' },
    { key: 'bloodGroup', label: 'Blood Group', visible: true, required: true, section: 'Qualification' },

    // Documents
    { key: 'adharNumber', label: 'Aadhar Number', visible: true, required: true, section: 'Documents' },
    { key: 'panNumber', label: 'PAN Number', visible: true, required: true, section: 'Documents' },

    // Bank Information
    { key: 'bankName', label: 'Bank Name', visible: true, required: true, section: 'Bank Information' },
    { key: 'accountNumber', label: 'Account Number', visible: true, required: true, section: 'Bank Information' },
    { key: 'ifscCode', label: 'IFSC Code', visible: true, required: true, section: 'Bank Information' },
    { key: 'branch', label: 'Branch', visible: true, required: true, section: 'Bank Information' },

    // Additional
    { key: 'photo', label: 'Photo', visible: true, required: false, section: 'Additional' },
    { key: 'experience', label: 'Experience', visible: true, required: false, section: 'Additional' },
    { key: 'uan', label: 'UAN', visible: true, required: false, section: 'Additional' },
    { key: 'esiNumber', label: 'ESI Number', visible: true, required: false, section: 'Additional' },
    { key: 'insuranceNumber', label: 'Insurance Number', visible: true, required: false, section: 'Additional' },
];

interface FormCustomizationModalProps {
    visible: boolean;
    onCancel: () => void;
    onSave: (config: FieldConfig[]) => void;
    initialConfig: FieldConfig[];
}

const FormCustomizationModal: React.FC<FormCustomizationModalProps> = ({
    visible,
    onCancel,
    onSave,
    initialConfig,
}) => {
    const [config, setConfig] = useState<FieldConfig[]>(initialConfig);
    const [editingKey, setEditingKey] = useState<string | null>(null);
    const [tempLabel, setTempLabel] = useState('');

    const [isAddMode, setIsAddMode] = useState(false);
    const [newFieldLabel, setNewFieldLabel] = useState('');

    useEffect(() => {
        if (visible) {
            // Merge logic remains, but we also simply trust initialConfig if it has custom fields
            // that are not in DEFAULT.
            // The previous logic was: DEFAULT mapped, preserving initial. 
            // Now we need: initialConfig (which might have customs) + DEFAULT (if missing).
            // Actually, best to just use initialConfig if present, but ensure defaults are there.

            const existingKeys = new Set(initialConfig.map(c => c.key));
            const missingDefaults = DEFAULT_FIELD_CONFIG.filter(d => !existingKeys.has(d.key));

            setConfig([...initialConfig, ...missingDefaults]);
        }
    }, [visible, initialConfig]);

    const handleToggleVisible = (key: string, checked: boolean) => {
        setConfig(prev => prev.map(field =>
            field.key === key ? { ...field, visible: checked } : field
        ));
    };

    const handleToggleRequired = (key: string, checked: boolean) => {
        setConfig(prev => prev.map(field =>
            field.key === key ? { ...field, required: checked } : field
        ));
    };

    const startEditing = (field: FieldConfig) => {
        setEditingKey(field.key);
        setTempLabel(field.label);
    };

    const saveLabel = () => {
        if (editingKey && tempLabel.trim()) {
            setConfig(prev => prev.map(field =>
                field.key === editingKey ? { ...field, label: tempLabel.trim() } : field
            ));
            setEditingKey(null);
            setTempLabel('');
        }
    };

    const cancelEditing = () => {
        setEditingKey(null);
        setTempLabel('');
    };

    const handleAddField = () => {
        if (newFieldLabel.trim()) {
            const key = `custom_${Date.now()}`;
            const newField: FieldConfig = {
                key,
                label: newFieldLabel.trim(),
                visible: true,
                required: false,
                section: 'Additional',
                isCustom: true
            };
            setConfig(prev => [...prev, newField]);
            setNewFieldLabel('');
            setIsAddMode(false);
        }
    };

    const handleDeleteField = (key: string) => {
        setConfig(prev => prev.filter(f => f.key !== key));
    };

    const handleSave = () => {
        onSave(config);
        onCancel();
    };

    // Group fields by section
    const sections = Array.from(new Set(config.map(f => f.section)));
    // Ensure "Additional" is there for adding new fields
    const allSections = Array.from(new Set([...sections, 'Basic Information', 'Salary Information', 'Address Information', 'Contact Information', 'Qualification', 'Documents', 'Bank Information', 'Additional']));

    return (
        <Modal
            title="Customize Employee Form"
            open={visible}
            onCancel={onCancel}
            onOk={handleSave}
            width={900}
            okText="Save Configuration"
        >
            <div style={{ maxHeight: '60vh', overflowY: 'auto', padding: '0 16px' }}>
                <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
                    {!isAddMode ? (
                        <Button type="dashed" icon={<PlusOutlined />} onClick={() => setIsAddMode(true)}>
                            Add Custom Field
                        </Button>
                    ) : (
                        <Space>
                            <Input
                                placeholder="Field Label"
                                value={newFieldLabel}
                                onChange={e => setNewFieldLabel(e.target.value)}
                                style={{ width: 200 }}
                            />
                            <Button type="primary" onClick={handleAddField}>Add</Button>
                            <Button onClick={() => setIsAddMode(false)}>Cancel</Button>
                        </Space>
                    )}
                </div>

                <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                    <Col span={10}><Text strong>Field Name</Text></Col>
                    <Col span={6}><Text strong>Visibility</Text></Col>
                    <Col span={4}><Text strong>Required</Text></Col>
                    <Col span={4}><Text strong>Actions</Text></Col>
                </Row>

                {allSections.map(section => {
                    const sectionFields = config.filter(f => f.section === section);
                    if (sectionFields.length === 0) return null;

                    return (
                        <div key={section} style={{ marginBottom: 24 }}>
                            <Divider orientation="left" style={{ margin: '12px 0' }}>{section}</Divider>
                            {sectionFields.map(field => (
                                <Row key={field.key} gutter={[16, 16]} style={{ marginBottom: 8, alignItems: 'center' }}>
                                    <Col span={10}>
                                        {editingKey === field.key ? (
                                            <Space>
                                                <Input
                                                    value={tempLabel}
                                                    onChange={e => setTempLabel(e.target.value)}
                                                    size="small"
                                                />
                                                <Button size="small" type="primary" icon={<SaveOutlined />} onClick={saveLabel} />
                                                <Button size="small" icon={<CloseOutlined />} onClick={cancelEditing} />
                                            </Space>
                                        ) : (
                                            <Space>
                                                <span>{field.label}</span>
                                                <EditOutlined
                                                    style={{ color: '#1890ff', cursor: 'pointer', fontSize: '12px' }}
                                                    onClick={() => startEditing(field)}
                                                />
                                            </Space>
                                        )}
                                    </Col>
                                    <Col span={6}>
                                        <Checkbox
                                            checked={field.visible}
                                            onChange={e => handleToggleVisible(field.key, e.target.checked)}
                                            disabled={field.key === 'name' || field.key === 'empIdNo'}
                                        >
                                            Show
                                        </Checkbox>
                                    </Col>
                                    <Col span={4}>
                                        <Switch
                                            size="small"
                                            checked={field.required}
                                            onChange={checked => handleToggleRequired(field.key, checked)}
                                            disabled={!field.visible || field.key === 'name' || field.key === 'empIdNo'}
                                        />
                                    </Col>
                                    <Col span={4}>
                                        {field.isCustom && (
                                            <Popconfirm title="Delete this field?" onConfirm={() => handleDeleteField(field.key)}>
                                                <Button type="text" danger icon={<DeleteOutlined />} />
                                            </Popconfirm>
                                        )}
                                    </Col>
                                </Row>
                            ))}
                        </div>
                    );
                })}
            </div>
        </Modal>
    );
};

export default FormCustomizationModal;
