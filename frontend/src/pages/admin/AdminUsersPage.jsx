import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { UserPlusIcon, EditIcon, TrashIcon, LockClosedIcon, ArrowUturnLeftIcon } from '../../components/Icons';

const statusConfig = {
    active: { text: 'Ativo', color: 'bg-green-500/20 text-green-300' },
    inactive: { text: 'Inativo', color: 'bg-yellow-500/20 text-yellow-300' },
    blocked: { text: 'Bloqueado', color: 'bg-red-500/20 text-red-300' },
    deleted: { text: 'Removido', color: 'bg-gray-500/20 text-gray-300' },
};

const StatusBadge = ({ status }) => {
    // Garante que status desconhecidos tenham um fallback visual
    const safeStatus = statusConfig[status] ? status : 'inactive'; 
    const config = statusConfig[safeStatus];
    return (
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${config.color}`}>
            {config.text}
        </span>
    );
};

const RefreshIcon = ({ className = "w-5 h-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.664 0l3.181-3.183m-3.181-3.183l-3.181-3.183a8.25 8.25 0 00-11.664 0l-3.181 3.183" />
    </svg>
);

const AdminUsersPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState(null); 

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            // Busca TODOS os usuários, inclusive deletados/bloqueados
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
    
    const openFormModal = (user = null) => {
        setCurrentUser(user);
        setIsFormModalOpen(true);
    };

    const openPasswordModal = (user) => {
        setCurrentUser(user);
        setIsPasswordModalOpen(true);
    };
    
    const closeModal = () => {
        setIsFormModalOpen(false);
        setIsPasswordModalOpen(false);
        setCurrentUser(null);
    };
    
    const handleSoftDelete = async (userId) => {
        if (window.confirm('Tem certeza que deseja remover este usuário?')) {
            try {
                const { data } = await api.delete(`/users/${userId}`);
                setUsers(users.map(u => u._id === userId ? data.user : u));
            } catch (err) {
                alert(err.response?.data?.message || 'Falha ao remover usuário.');
            }
        }
    }

    const handleRestore = async (userId) => {
        if (window.confirm('Deseja restaurar este usuário? Ele voltará como Inativo.')) {
            try {
                const { data } = await api.patch(`/users/${userId}/restore`);
                setUsers(users.map(u => u._id === userId ? data.user : u));
            } catch (err) {
                alert(err.response?.data?.message || 'Falha ao restaurar usuário.');
            }
        }
    }

    const handleStatusChange = async (userId, newStatus) => {
        try {
            const { data } = await api.patch(`/users/${userId}/status`, { status: newStatus });
            setUsers(users.map(u => u._id === userId ? data : u));
        } catch (err) {
            alert(err.response?.data?.message || 'Falha ao atualizar status.');
        }
    };

    const UserFormModal = ({ user, onSave, onClose }) => {
        const [formData, setFormData] = useState({
            name: user?.name || '',
            email: user?.email || '',
            password: '',
            role: user?.role || 'user',
            subscriptionStatus: user?.subscriptionStatus || 'active'
        });

        const handleChange = (e) => {
            setFormData({ ...formData, [e.target.name]: e.target.value });
        };
        
        const handleSubmit = async (e) => {
            e.preventDefault();
            try {
                let response;
                if (user) { 
                    const { name, email, role, subscriptionStatus } = formData;
                    response = await api.patch(`/users/${user._id}`, { name, email, role, subscriptionStatus });
                } else { 
                    response = await api.post('/users', formData);
                }
                onSave(response.data);
                onClose();
            } catch (err) {
                alert(err.response?.data?.message || 'Falha ao salvar usuário.');
            }
        };

        return (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
                <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-lg" onClick={(e) => e.stopPropagation()}>
                    <h2 className="text-2xl font-bold text-white mb-4">{user ? 'Editar Usuário' : 'Adicionar Usuário'}</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input label="Nome Completo" name="name" type="text" value={formData.name} onChange={handleChange} required />
                        <Input label="Email" name="email" type="email" value={formData.email} onChange={handleChange} required />
                        {!user && <Input label="Senha" name="password" type="password" value={formData.password} onChange={handleChange} required />}
                        <Select label="Role" name="role" value={formData.role} onChange={handleChange}>
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                        </Select>
                        <Select label="Status Assinatura" name="subscriptionStatus" value={formData.subscriptionStatus} onChange={handleChange}>
                            <option value="active">Ativo</option>
                            <option value="inactive">Inativo</option>
                            <option value="blocked">Bloqueado</option>
                        </Select>
                        <div className="flex justify-end space-x-2 pt-4">
                            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
                            <Button type="submit">Salvar</Button>
                        </div>
                    </form>
                </div>
            </div>
        );
    };
    
    const ChangePasswordModal = ({ user, onClose, onSave }) => {
        const [newPassword, setNewPassword] = useState('');

        const handleSubmit = async (e) => {
            e.preventDefault();
            try {
                await api.patch(`/users/${user._id}/password`, { newPassword });
                onSave();
                onClose();
            } catch (err) {
                alert(err.response?.data?.message || 'Falha ao alterar senha.');
            }
        }

        return (
             <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
                <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-lg" onClick={(e) => e.stopPropagation()}>
                    <h2 className="text-2xl font-bold text-white mb-4">Alterar Senha</h2>
                    <p className="text-gray-400 mb-4">Usuário: <span className="font-semibold">{user.email}</span></p>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input label="Nova Senha" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
                        <div className="flex justify-end space-x-2 pt-4">
                            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
                            <Button type="submit">Confirmar</Button>
                        </div>
                    </form>
                </div>
            </div>
        )
    }

    const handleSave = (savedUser) => {
        if(users.find(u => u._id === savedUser._id)) {
            setUsers(users.map(u => u._id === savedUser._id ? savedUser : u));
        } else {
            setUsers([savedUser, ...users]);
        }
    };

    if (loading && users.length === 0) return <div className="p-6 text-center">Carregando usuários...</div>;
    if (error) return <div className="p-6 text-center text-red-400">{error}</div>;

    return (
        <div className="p-4 sm:p-6 space-y-6">
            {isFormModalOpen && <UserFormModal user={currentUser} onClose={closeModal} onSave={handleSave} />}
            {isPasswordModalOpen && <ChangePasswordModal user={currentUser} onClose={closeModal} onSave={() => alert('Senha alterada com sucesso!')} />}

            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">Usuários Cadastrados</h2>
                 <div className="flex items-center space-x-2">
                    <Button onClick={fetchUsers} variant="secondary" className="flex items-center space-x-2" disabled={loading}>
                        <RefreshIcon className={loading ? 'animate-spin' : ''} />
                        <span className="hidden sm:inline">{loading ? 'Atualizando...' : 'Atualizar Lista'}</span>
                    </Button>
                    <Button onClick={() => openFormModal()} className="flex items-center space-x-2">
                        <UserPlusIcon className="w-5 h-5" />
                        <span className="hidden sm:inline">Adicionar</span>
                    </Button>
                </div>
            </div>
            <div className="bg-gray-800 rounded-xl shadow-lg overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-800">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Usuário</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Data Cadastro</th>
                            <th scope="col" className="relative px-6 py-3"><span className="sr-only">Ações</span></th>
                        </tr>
                    </thead>
                    <tbody className="bg-gray-900/50 divide-y divide-gray-700">
                        {users.map(user => (
                            <tr key={user._id} className={user.subscriptionStatus === 'deleted' ? 'opacity-50 bg-red-900/10' : ''}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 h-10 w-10">
                                            <img className="h-10 w-10 rounded-full" src={user.avatarUrl} alt={user.name} />
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-white">{user.name}</div>
                                            <div className="text-sm text-gray-400">{user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <StatusBadge status={user.subscriptionStatus} />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR') : '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    {user.subscriptionStatus === 'deleted' ? (
                                        <div className="flex items-center justify-end">
                                            <Button onClick={() => handleRestore(user._id)} variant="ghost" className="flex items-center space-x-2 !text-green-400 hover:!bg-green-900/30">
                                                <ArrowUturnLeftIcon className="w-5 h-5" />
                                                <span>Restaurar</span>
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-end space-x-2">
                                            <button onClick={() => openFormModal(user)} className="p-2 text-gray-400 hover:text-white" aria-label="Editar"><EditIcon className="w-5 h-5" /></button>
                                            <button onClick={() => openPasswordModal(user)} className="p-2 text-gray-400 hover:text-white" aria-label="Mudar Senha"><LockClosedIcon className="w-5 h-5" /></button>
                                            <button onClick={() => handleSoftDelete(user._id)} className="p-2 text-gray-400 hover:text-pink-500" aria-label="Remover"><TrashIcon className="w-5 h-5" /></button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminUsersPage;