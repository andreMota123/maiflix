import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { UserPlusIcon, EditIcon, TrashIcon, LockClosedIcon, LockOpenIcon } from '../../components/Icons';

// MOCK DATA - Replace with API calls
const MOCK_USERS_DATA = [
    { _id: 'u1', name: 'Ana Silva', email: 'ana.silva@example.com', avatarUrl: 'https://i.pravatar.cc/150?u=ana.silva@example.com', subscriptionStatus: 'active' },
    { _id: 'u2', name: 'Beatriz Costa', email: 'bia.costa@example.com', avatarUrl: 'https://i.pravatar.cc/150?u=bia.costa@example.com', subscriptionStatus: 'inactive' },
];

const AdminUsersPage = () => {
    const [users, setUsers] = useState(MOCK_USERS_DATA);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    
    // TODO: Implement API calls for all handler functions

    const handleAddUserSubmit = (e) => {
        e.preventDefault();
        const newUser = {
            _id: `u${Date.now()}`,
            name,
            email,
            avatarUrl: `https://i.pravatar.cc/150?u=${email}`,
            subscriptionStatus: 'active'
        };
        setUsers([newUser, ...users]);
        setIsAddModalOpen(false);
        setName('');
        setEmail('');
    };
    
    const handleDelete = (userId) => {
        if (window.confirm('Tem certeza que deseja excluir este usuário?')) {
            setUsers(users.filter(u => u._id !== userId));
        }
    }

    const handleUpdateUserStatus = (userId, status) => {
        setUsers(users.map(u => u._id === userId ? { ...u, subscriptionStatus: status } : u));
    };

    const AddUserModal = () => (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setIsAddModalOpen(false)}>
            <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-lg" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-white mb-4">Adicionar Novo Usuário</h2>
                <form onSubmit={handleAddUserSubmit} className="space-y-4">
                    <Input label="Nome Completo" id="new-user-name" value={name} onChange={e => setName(e.target.value)} required />
                    <Input label="Email" id="new-user-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                    <div className="flex justify-end space-x-2 pt-4">
                        <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)}>Cancelar</Button>
                        <Button type="submit">Adicionar</Button>
                    </div>
                </form>
            </div>
        </div>
    );

    return (
        <div className="p-4 sm:p-6 space-y-6">
            {isAddModalOpen && <AddUserModal />}
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">Gerenciamento de Usuários</h2>
                <Button onClick={() => setIsAddModalOpen(true)} className="flex items-center space-x-2">
                    <UserPlusIcon className="w-5 h-5" />
                    <span>Adicionar Usuário</span>
                </Button>
            </div>
            <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                <ul className="divide-y divide-gray-700">
                    {users.map(user => (
                        <li key={user._id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0 sm:space-x-4">
                            <div className="flex items-center space-x-4">
                                <img src={user.avatarUrl} alt={user.name} className="w-12 h-12 rounded-full" />
                                <div>
                                    <p className="font-semibold text-white">{user.name}</p>
                                    <p className="text-sm text-gray-400">{user.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2 self-end sm:self-center">
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${user.subscriptionStatus === 'active' ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'}`}>
                                    {user.subscriptionStatus === 'active' ? 'Ativo' : 'Inativo'}
                                </span>
                                {user.subscriptionStatus === 'active' ? (
                                    <button onClick={() => handleUpdateUserStatus(user._id, 'inactive')} className="p-2 text-gray-400 hover:text-yellow-400" aria-label="Bloquear usuário">
                                        <LockClosedIcon className="w-5 h-5" />
                                    </button>
                                ) : (
                                    <button onClick={() => handleUpdateUserStatus(user._id, 'active')} className="p-2 text-gray-400 hover:text-green-400" aria-label="Desbloquear usuário">
                                        <LockOpenIcon className="w-5 h-5" />
                                    </button>
                                )}
                                <button onClick={() => alert('Funcionalidade de edição a ser implementada.')} className="p-2 text-gray-400 hover:text-white" aria-label="Editar usuário">
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