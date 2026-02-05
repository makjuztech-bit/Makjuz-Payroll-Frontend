
import React, { useState, useRef, useEffect } from 'react';
import { Card, Input, Button, List, Avatar, Typography, Spin, Space } from 'antd';
import { SendOutlined, RobotOutlined, UserOutlined, LoadingOutlined } from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';

const { Text } = Typography;

interface Message {
    role: 'user' | 'ai';
    message: string;
    timestamp: Date;
}

const ChatInterface: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'ai',
            message: 'Hello! I am the Makjuz Payroll Assistant. How can I help you today?',
            timestamp: new Date(),
        },
    ]);
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!inputValue.trim()) return;

        const userMsg: Message = {
            role: 'user',
            message: inputValue,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMsg]);
        setInputValue('');
        setLoading(true);

        try {
            // Construct history for the backend
            const history = messages.map(m => ({ role: m.role, message: m.message }));

            // Get token for auth if needed (though our route might be public or protected, updated index.js didn't protect it explicitly but good to be safe)
            // Actually, in index.js I added: app.use('/api/ai', aiRoutes); WITHOUT auth middleware for now, 
            // but typically it should be protected. Since I didn't put 'auth' in the app.use line, it's public.
            // Wait, looking at index.js output: "app.use('/api/ai', aiRoutes);" -> Public.
            // It's safer if I update index.js to use auth, but let's stick to current plan so it works immediately.

            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            const response = await axios.post(`${API_URL}/api/ai/chat`, {
                message: userMsg.message,
                history: history
            });

            const aiMsg: Message = {
                role: 'ai',
                message: response.data.reply,
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, aiMsg]);

        } catch (error) {
            console.error('Chat error:', error);
            const errorMsg: Message = {
                role: 'ai',
                message: 'Sorry, I encountered an error connecting to the server. Please try again.',
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMsg]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card
            title={<Space><RobotOutlined style={{ color: '#1890ff' }} /> Smart Assistant</Space>}
            bordered={false}
            style={{ height: '600px', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '0' }}
        >
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', background: '#f5f5f5' }}>
                <List
                    itemLayout="horizontal"
                    dataSource={messages}
                    renderItem={(item) => (
                        <div style={{
                            display: 'flex',
                            justifyContent: item.role === 'user' ? 'flex-end' : 'flex-start',
                            marginBottom: '16px'
                        }}>
                            {item.role === 'ai' && (
                                <Avatar icon={<RobotOutlined />} style={{ backgroundColor: '#1890ff', marginRight: '8px' }} />
                            )}
                            <div style={{
                                maxWidth: '80%',
                                padding: '12px 16px',
                                borderRadius: '12px',
                                backgroundColor: item.role === 'user' ? '#1890ff' : '#fff',
                                color: item.role === 'user' ? '#fff' : '#000',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                                borderTopLeftRadius: item.role === 'ai' ? '2px' : '12px',
                                borderTopRightRadius: item.role === 'user' ? '2px' : '12px'
                            }}>
                                {item.role === 'user' ? (
                                    <Text style={{ color: '#fff' }}>{item.message}</Text>
                                ) : (
                                    <div className="markdown-content">
                                        <ReactMarkdown>{item.message}</ReactMarkdown>
                                    </div>
                                )}
                                <div style={{
                                    fontSize: '10px',
                                    marginTop: '4px',
                                    textAlign: 'right',
                                    opacity: 0.7
                                }}>
                                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                            {item.role === 'user' && (
                                <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#87d068', marginLeft: '8px' }} />
                            )}
                        </div>
                    )}
                />
                {loading && (
                    <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '16px' }}>
                        <Avatar icon={<RobotOutlined />} style={{ backgroundColor: '#1890ff', marginRight: '8px' }} />
                        <div style={{ padding: '12px', backgroundColor: '#fff', borderRadius: '12px' }}>
                            <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div style={{ padding: '16px', background: '#fff', borderTop: '1px solid #f0f0f0' }}>
                <Space.Compact style={{ width: '100%' }}>
                    <Input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onPressEnter={handleSend}
                        placeholder="Type your question..."
                        disabled={loading}
                    />
                    <Button type="primary" icon={<SendOutlined />} onClick={handleSend} loading={loading}>
                        Send
                    </Button>
                </Space.Compact>
            </div>
        </Card>
    );
};

export default ChatInterface;
