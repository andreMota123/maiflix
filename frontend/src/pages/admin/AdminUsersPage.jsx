import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { UserPlusIcon, EditIcon, TrashIcon, LockClosedIcon, LockOpenIcon } from '../../components/Icons';

const AdminUsersPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const { data } = await api.get('/users');
            setUsers(data);
        } catch (err) {
            setError(err.response?.data?.message || 'Falha ao carregar usuários.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);
    
    const handleDelete = async (userId) => {
        if (window.confirm('Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.')) {
            try {
                await api.delete(`/users/${userId}`);
                setUsers(users.filter(u => u._id !== userId));
            } catch (err) {
                alert(err.response?.data?.message || 'Falha ao excluir usuário.');
            }
        }
    }

    const handleUpdateUserStatus = async (userId, status) => {
        try {
            const { data } = await api.put(`/users/${userId}/status`, { status });
            setUsers(users.map(u => u._id === userId ? data : u));
        } catch (err) {
            alert(err.response?.data?.message || 'Falha ao atualizar status do usuário.');
        }
    };

    const openEditModal = (user) => {
        setEditingUser(user);
        setIsEditModalOpen(true);
    };

    const AddUserModal = () => {
        const [name, setName] = useState('');
        const [email, setEmail] = useState('');
        const [password, setPassword] = useState('');

        const handleSubmit = async (e) => {
            e.preventDefault();
            try {
                const { data } = await api.post('/users', { name, email, password });
                setUsers([data, ...users]);
                setIsAddModalOpen(false);
            } catch (err) {
                alert(err.response?.data?.message || 'Falha ao adicionar usuário.');
            }
        };

        return (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setIsAddModalOpen(false)}>
                <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-lg" onClick={(e) => e.stopPropagation()}>
                    <h2 className="text-2xl font-bold text-white mb-4">Adicionar Novo Usuário</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input label="Nome Completo" id="new-user-name" value={name} onChange={e => setName(e.target.value)} required />
                        <Input label="Email" id="new-user-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                        <Input label="Senha" id="new-user-password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                        <div className="flex justify-end space-x-2 pt-4">
                            <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)}>Cancelar</Button>
                            <Button type="submit">Adicionar</Button>
                        </div>
                    </form>
                </div>
            </div>
        );
    };

    const EditUserModal = () => {
        if (!editingUser) return null;
        
        const [name, setName] = useState(editingUser.name);
        const [password, setPassword] = useState('');
        
        const handleSubmit = async (e) => {
            e.preventDefault();
            try {
                const payload = { name };
                if (password) {
                    payload.password = password;
                }
                const { data } = await api.put(`/users/${editingUser._id}`, payload);
                setUsers(users.map(u => u._id === editingUser._id ? data : u));
                setIsEditModalOpen(false);
                setEditingUser(null);
            } catch (err) {
                 alert(err.response?.data?.message || 'Falha ao editar usuário.');
            }
        };

        return (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setIsEditModalOpen(false)}>
                <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-lg" onClick={(e) => e.stopPropagation()}>
                    <h2 className="text-2xl font-bold text-white mb-4">Editar Usuário</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input label="Nome Completo" id="edit-user-name" value={name} onChange={e => setName(e.target.value)} required />
                        <Input label="Nova Senha (opcional)" id="edit-user-password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Deixe em branco para não alterar" />
                        <div className="flex justify-end space-x-2 pt-4">
                            <Button type="button" variant="ghost" onClick={() => setIsEditModalOpen(false)}>Cancelar</Button>
                            <Button type="submit">Salvar</Button>
                        </div>
                    </form>
                </div>
            </div>
        )
    }

    if (loading) return <div className="p-6 text-center">Carregando usuários...</div>;
    if (error) return <div className="p-6 text-center text-red-400">{error}</div>;

    return (
        <div className="p-4 sm:p-6 space-y-6">
            {isAddModalOpen && <AddUserModal />}
            {isEditModalOpen && <EditUserModal />}
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">Gerenciamento de Usuários</h2>
                <Button onClick={() => setIsAddModalOpen(true)} className="flex items-center space-x-2">
                    <UserPlusIcon className="w-5 h-5" />
                    <span>Adicionar Usuário</span>
                </Button>
            </div>
            <div className="bg-gray-800 rounded-xl shadow-lg overflow-x-auto">
                <ul className="divide-y divide-gray-700 min-w-full">
                    {users.map(user => (
                        <li key={user._id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0 sm:space-x-4">
                            <div className="flex items-center space-x-4">
                                <img src={user.avatarUrl} alt={user.name} className="w-12 h-12 rounded-full" />
                                <div>
                                    <p className="font-semibold text-white">{user.name}</p>
                                    {/* Fix: Use the correct property `email` from the user object. */}
                                    <p className="text-sm text-gray-400">{user.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2 self-end sm:self-center">
                                {/* Fix: Use the correct property `subscriptionStatus` from the user object. */}
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${user.subscriptionStatus === 'active' ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'}`}>
                                    {user.subscriptionStatus === 'active' ? 'Ativo' : 'Inativo'}
                                </span>
                                {/* Fix: Use the correct property `subscriptionStatus` from the user object. */}
                                {user.subscriptionStatus === 'active' ? (
                                    <button onClick={() => handleUpdateUserStatus(user._id, 'inactive')} className="p-2 text-gray-400 hover:text-yellow-400" aria-label="Desativar assinatura">
                                        <LockClosedIcon className="w-5 h-5" />
                                    </button>
                                ) : (
                                    <button onClick={() => handleUpdateUserStatus(user._id, 'active')} className="p-2 text-gray-400 hover:text-green-400" aria-label="Ativar assinatura">
                                        <LockOpenIcon className="w-5 h-5" />
                                    </button>
                                )}
                                <button onClick={() => openEditModal(user)} className="p-2 text-gray-400 hover:text-white" aria-label="Editar usuário">
                                    <EditIcon className="w-5 h-5" />
                                </button>
                                <button onClick={() => handleDelete(user._id)} className="p-2 text-gray-400 hover:text-pink-500" aria-label="Excluir usuário">
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default AdminUsersPage;