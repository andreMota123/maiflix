import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { InfoIcon, UsersIcon, BoxIcon, PhotoIcon, Cog6ToothIcon, LogoutIcon, ClipboardDocumentListIcon } from '../components/Icons';

// FIX: Using full, absolute paths for nested routing within /admin to be explicit.
const navItems = [
    { label: "Avisos", icon: InfoIcon, path: "/admin" },
    { label: "Usuários", icon: UsersIcon, path: "/admin/users" },
    { label: "Produtos", icon: BoxIcon, path: "/admin/products" },
    { label: "Banners", icon: PhotoIcon, path: "/admin/banners" },
    { label: "Geral", icon: Cog6ToothIcon, path: "/admin/settings" },
    { label: "Logs de Eventos", icon: ClipboardDocumentListIcon, path: "/admin/logs" },
];

// FIX: Removed children prop and JSDoc, as this is now a layout route component using an Outlet.
const AdminLayout = ({ children }) => {
    const { auth, logout } = useAuth();

    const SideNav = () => (
        <aside className="hidden md:block w-64 bg-gray-800 p-4 flex-shrink-0">
            <nav className="flex flex-col space-y-2">
                {navItems.map((item) => (
                    <NavLink
                        key={item.label}
                        to={item.path}
                        end={item.path === '/admin'}
                        className={({ isActive }) =>
                            `flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                                isActive
                                    ? 'bg-pink-600 text-white'
                                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                            }`
                        }
                    >
                        <item.icon className="w-6 h-6" />
                        <span className="font-semibold">{item.label}</span>
                    </NavLink>
                ))}
            </nav>
        </aside>
    );

    const Header = () => (
        <header className="bg-gray-800 sticky top-0 z-40 shadow-md flex items-center justify-between p-4 h-16">
            <h1 className="text-2xl font-bold text-pink-500">Maiflix Admin</h1>
            <div className="flex items-center space-x-4">
                <button onClick={logout} className="text-gray-300 hover:text-white" aria-label="Sair">
                    <LogoutIcon className="w-6 h-6" />
                </button>
                <div className="flex items-center space-x-3">
                    <img src={auth.user?.avatarUrl} alt={auth.user?.name} className="w-9 h-9 rounded-full" />
                    <span className="hidden sm:inline font-semibold">{auth.user?.name}</span>
                </div>
            </div>
        </header>
    );

    return (
        <div className="h-screen flex flex-col bg-gray-900 text-white">
            <Header />
            <div className="flex flex-1 overflow-hidden">
                <SideNav />
                <main className="flex-1 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;