import React, { useState, useEffect } from 'react';
import { Modal, List, Button, Input, Space, Typography, Select, Divider, message } from 'antd';
import { DeleteOutlined, PlusOutlined, UnorderedListOutlined, SaveOutlined } from '@ant-design/icons';

const { Text } = Typography;
const { Option } = Select;

export interface TemplateColumn {
    key: string;
    name: string; // The header name in Excel
    required?: boolean;
    type?: string;
    systemLabel?: string; // The original system label
}

interface TemplateEditorProps {
    visible: boolean;
    onClose: () => void;
    onSave: (columns: TemplateColumn[]) => void;
    availableFields: { key: string; label: string; type?: string; required?: boolean }[];
    currentColumns: TemplateColumn[];
    title?: string;
    allowCustomFields?: boolean;
}

const TemplateEditor: React.FC<TemplateEditorProps> = ({
    visible,
    onClose,
    onSave,
    availableFields,
    currentColumns,
    title = "Edit Excel Template",
    allowCustomFields = false
}) => {
    const [columns, setColumns] = useState<TemplateColumn[]>([]);
    const [selectedField, setSelectedField] = useState<string | null>(null);
    const [customFieldName, setCustomFieldName] = useState('');

    useEffect(() => {
        if (visible) {
            // Deep copy to avoid mutating props
            setColumns(JSON.parse(JSON.stringify(currentColumns)));
        }
    }, [visible, currentColumns]);

    const handleAddField = () => {
        if (!selectedField && !customFieldName) return;

        if (allowCustomFields && selectedField === 'custom' && customFieldName) {
            // Add custom field
            const newCol: TemplateColumn = {
                key: `custom_${customFieldName.toLowerCase().replace(/\s+/g, '_')}`,
                name: customFieldName,
                required: false,
                type: 'string',
                systemLabel: 'Custom Field'
            };
            setColumns([...columns, newCol]);
            setCustomFieldName('');
            setSelectedField(null);
        } else if (selectedField && selectedField !== 'custom') {
            // Add system field
            const field = availableFields.find(f => f.key === selectedField);
            if (field) {
                // Check if already exists
                if (columns.some(c => c.key === field.key)) {
                    message.warning('Field already exists in template');
                    return;
                }
                setColumns([...columns, {
                    key: field.key,
                    name: field.label,
                    required: field.required,
                    type: field.type,
                    systemLabel: field.label
                }]);
                setSelectedField(null);
            }
        }
    };

    const handleRemoveColumn = (index: number) => {
        const col = columns[index];
        if (col.required) {
            message.warning('Cannot remove mandatory field');
            return;
        }
        const newCols = [...columns];
        newCols.splice(index, 1);
        setColumns(newCols);
    };

    const handleRename = (index: number, newName: string) => {
        const newCols = [...columns];
        newCols[index].name = newName;
        setColumns(newCols);
    };

    const handleSave = () => {
        onSave(columns);
        onClose();
        message.success('Template configuration saved');
    };

    // Filter out fields that are already in the template (except custom)
    const unusedFields = availableFields.filter(f => !columns.some(c => c.key === f.key));

    return (
        <Modal
            title={title}
            open={visible}
            onCancel={onClose}
            onOk={handleSave}
            width={700}
            okText="Save Template"
            okButtonProps={{ icon: <SaveOutlined /> }}
        >
            <div style={{ marginBottom: 16 }}>
                <Space>
                    <Select
                        style={{ width: 250 }}
                        placeholder="Select field to add"
                        value={selectedField}
                        onChange={setSelectedField}
                        showSearch
                        optionFilterProp="children"
                    >
                        {unusedFields.map(f => (
                            <Option key={f.key} value={f.key}>{f.label} {f.required ? '*' : ''}</Option>
                        ))}
                        {allowCustomFields && (
                            <Option key="custom" value="custom">+ Create Custom Field</Option>
                        )}
                    </Select>

                    {allowCustomFields && selectedField === 'custom' && (
                        <Input
                            placeholder="Enter Header Name"
                            value={customFieldName}
                            onChange={e => setCustomFieldName(e.target.value)}
                            style={{ width: 200 }}
                        />
                    )}

                    <Button type="primary" icon={<PlusOutlined />} onClick={handleAddField} disabled={!selectedField}>
                        Add Column
                    </Button>
                </Space>
            </div>

            <Divider>Current Columns</Divider>

            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <List
                    dataSource={columns}
                    renderItem={(item, index) => (
                        <List.Item
                            actions={[
                                (!item.required) && (
                                    <Button
                                        type="text"
                                        danger
                                        icon={<DeleteOutlined />}
                                        onClick={() => handleRemoveColumn(index)}
                                    />
                                )
                            ]}
                        >
                            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                                <Space>
                                    <UnorderedListOutlined style={{ color: '#bfbfbf', cursor: 'grab' }} />
                                    <div>
                                        <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                                            Maps to: {item.systemLabel || item.key} {item.required && <Text type="danger">*</Text>}
                                        </Text>
                                        <Input
                                            value={item.name}
                                            onChange={(e) => handleRename(index, e.target.value)}
                                            style={{ width: 250, marginTop: 4 }}
                                            placeholder="Enter header name"
                                            addonBefore="Header Name:"
                                        />
                                    </div>
                                </Space>
                            </Space>
                        </List.Item>
                    )}
                />
                {columns.length === 0 && <div style={{ textAlign: 'center', color: '#999' }}>No columns defined</div>}
            </div>

            <div style={{ marginTop: 16, background: '#e6f7ff', padding: 8, borderRadius: 4 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                    Note: Changing header names allows you to match the system to your existing Excel files.
                    Make sure the "Maps to" field is correct.
                </Text>
            </div>
        </Modal>
    );
};

export default TemplateEditor;
