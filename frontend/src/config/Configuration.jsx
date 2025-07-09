import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, message, Space, Card } from 'antd';
import { 
    UserAddOutlined, 
    EditOutlined, 
    DeleteOutlined,
    LockOutlined,
    TeamOutlined
} from '@ant-design/icons';
import axios from 'axios';

const { Option } = Select;

const Configuration = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [visible, setVisible] = useState(false);
    const [form] = Form.useForm();
    const [selectedUser, setSelectedUser] = useState(null);
    const [resetModalVisible, setResetModalVisible] = useState(false);

    const ROLES = [
        { value: 'admin', label: 'Administrateur' },
        { value: 'gestionnaire', label: 'Gestionnaire' },
        { value: 'vendeur', label: 'Vendeur' }
    ];

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get('/users/');
            setUsers(data);
        } catch (error) {
            message.error('Erreur lors du chargement des utilisateurs');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            if (selectedUser) {
                await axios.put(`/users/${selectedUser.id}/`, values);
                message.success('Utilisateur mis à jour');
            } else {
                await axios.post('/users/', values);
                message.success('Utilisateur créé');
            }
            setVisible(false);
            fetchUsers();
        } catch (error) {
            message.error('Erreur lors de la sauvegarde');
        }
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`/users/${id}/`);
            message.success('Utilisateur supprimé');
            fetchUsers();
        } catch (error) {
            message.error('Erreur lors de la suppression');
        }
    };

    const handleResetPassword = async (values) => {
        try {
            await axios.post(`/users/${selectedUser.id}/reset_password/`, {
                new_password: values.new_password
            });
            message.success('Mot de passe réinitialisé');
            setResetModalVisible(false);
        } catch (error) {
            message.error('Erreur lors de la réinitialisation');
        }
    };

    const columns = [
        {
            title: 'Nom',
            dataIndex: 'first_name',
            key: 'name',
            render: (_, record) => `${record.first_name} ${record.last_name}`
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email'
        },
        {
            title: 'Rôle',
            dataIndex: 'role',
            key: 'role',
            render: (role) => ROLES.find(r => r.value === role)?.label || role
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Button 
                        icon={<EditOutlined />} 
                        onClick={() => {
                            setSelectedUser(record);
                            form.setFieldsValue(record);
                            setVisible(true);
                        }}
                    />
                    <Button 
                        icon={<LockOutlined />}
                        onClick={() => {
                            setSelectedUser(record);
                            setResetModalVisible(true);
                        }}
                    />
                    <Button 
                        danger 
                        icon={<DeleteOutlined />} 
                        onClick={() => handleDelete(record.id)}
                    />
                </Space>
            )
        }
    ];

    return (
        <Card 
            title={
                <Space>
                    <TeamOutlined />
                    <span>Gestion des Utilisateurs</span>
                </Space>
            }
            extra={
                <Button 
                    type="primary" 
                    icon={<UserAddOutlined />}
                    onClick={() => {
                        setSelectedUser(null);
                        form.resetFields();
                        setVisible(true);
                    }}
                >
                    Ajouter
                </Button>
            }
        >
            <Table 
                columns={columns} 
                dataSource={users} 
                loading={loading}
                rowKey="id"
            />

            <Modal
                title={selectedUser ? "Modifier l'utilisateur" : "Créer un utilisateur"}
                visible={visible}
                onOk={handleSubmit}
                onCancel={() => setVisible(false)}
            >
                <Form form={form} layout="vertical">
                    <Form.Item
                        name="username"
                        label="Nom d'utilisateur"
                        rules={[{ required: true }]}
                    >
                        <Input />
                    </Form.Item>
                    {!selectedUser && (
                        <Form.Item
                            name="password"
                            label="Mot de passe"
                            rules={[{ required: true }]}
                        >
                            <Input.Password />
                        </Form.Item>
                    )}
                    <Form.Item
                        name="first_name"
                        label="Prénom"
                        rules={[{ required: true }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="last_name"
                        label="Nom"
                        rules={[{ required: true }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="email"
                        label="Email"
                        rules={[{ type: 'email', required: true }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="role"
                        label="Rôle"
                        rules={[{ required: true }]}
                    >
                        <Select>
                            {ROLES.map(role => (
                                <Option key={role.value} value={role.value}>
                                    {role.label}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title="Réinitialiser le mot de passe"
                visible={resetModalVisible}
                onCancel={() => setResetModalVisible(false)}
                footer={null}
            >
                <Form onFinish={handleResetPassword}>
                    <Form.Item
                        name="new_password"
                        label="Nouveau mot de passe"
                        rules={[{ required: true }]}
                    >
                        <Input.Password />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit">
                            Enregistrer
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
        </Card>
    );
};

export default Configuration;