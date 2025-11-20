
import React, { useState, useEffect, FC } from 'react';
import { Link, NavLink, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Page } from '../types';
import { HomeIcon, InfoIcon, UserGroupIcon, UserCircleIcon, BellIcon, LogoutIcon, WhatsappIcon } from '../components/Icons';
import api from '../services/api';

type NavItem = {
    page: Page;
    icon: FC<{ className?: string }>;
    label?: string;
    path: string;
};

const navItemsUser: NavItem[] = [
    { page: Page.Inicio, icon: HomeIcon, path: '/' },
    { page: Page.Feed, icon: InfoIcon, path: '/feed' },
    { page: Page.Comunidade, icon: UserGroupIcon, path: '/comunidade' },
    { page: Page.Perfil, icon: UserCircleIcon, path: '/perfil' },
];

const UserLayout: FC = () => {
    const { auth, logout } = useAuth();
    const navigate = useNavigate();

    // State for real-time notification
    const [latestPostTimestamp, setLatestPostTimestamp] = useState(new Date().toISOString());
    const [newPostCount, setNewPostCount] = useState(0);

    // Polling effect to check for new posts
    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                // We don't update the timestamp here, so we keep getting notified
                // until the user visits the community page.
                const { data } = await api.get(`/posts/check-new?since=${latestPostTimestamp}`);
                if (data.count > 0) {
                    setNewPostCount(current => current + data.count);
                    // Update timestamp to only get newer posts next time
                    setLatestPostTimestamp(new Date().toISOString());
                }
            } catch (error) {
                console.error("Failed to check for new posts:", error);
            }
        }, 30000); // Poll every 30 seconds

        return () => clearInterval(interval);
    }, [latestPostTimestamp]);


    const handleNotificationClick = () => {
        setNewPostCount(0);
        setLatestPostTimestamp(new Date().toISOString());
        navigate('/comunidade');
    };

    const Header: FC = () => {
        // Mock notifications for now as they are not part of the scope
        const [notifications] = useState<{ id: string, message: string, read: boolean }[]>([]);
        const [notificationsOpen, setNotificationsOpen] = useState(false);
        const unreadCount = notifications.filter(n => !n.read).length;

        return (
            <header className="bg-brand-surface sticky top-0 z-40 shadow-md flex items-center justify-between p-4 h-16">
                <Link to="/" className="text-2xl font-bold text-brand-primary">Maiflix</Link>
                <div className="flex items-center space-x-4">
                    <div className="relative">
                        <button onClick={() => setNotificationsOpen(!notificationsOpen)} className="text-brand-text-light hover:text-white relative">
                            <BellIcon className="w-6 h-6" />
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-primary text-xs font-bold text-white">{unreadCount}</span>
                            )}
                        </button>
                        {notificationsOpen && (
                            <div className="absolute right-0 mt-2 w-72 bg-brand-bg border border-brand-secondary rounded-lg shadow-lg">
                                <div className="p-3 font-semibold border-b border-brand-secondary">Notificações</div>
                                <p className="p-4 text-sm text-brand-text-light">Nenhuma notificação nova.</p>
                            </div>
                        )}
                    </div>
                    <button onClick={logout} className="text-brand-text-light hover:text-white"><LogoutIcon className="w-6 h-6" /></button>
                    <Link to="/perfil" className="flex items-center space-x-3">
                        <img src={auth.user?.avatarUrl} alt={auth.user?.name} className="w-9 h-9 rounded-full" />
                        <span className="hidden sm:inline font-semibold">{auth.user?.name}</span>
                    </Link>
                </div>
            </header>
        );
    };

    const BottomNav: FC = () => (
        <nav className="fixed bottom-0 left-0 right-0 bg-brand-surface shadow-[0_-2px_10px_rgba(0,0,0,0.3)] z-40 md:hidden">
            <div className="flex justify-around">
                {navItemsUser.map((item) => (
                    <NavLink
                        key={item.page}
                        to={item.path}
                        end={item.path === '/'}
                        className={({ isActive }) => `flex flex-col items-center justify-center w-full pt-2 pb-1 transition-colors ${isActive ? 'text-brand-primary' : 'text-brand-text-light hover:text-white'}`}
                    >
                        <item.icon className="w-6 h-6" />
                        <span className="text-xs mt-1">{item.label || item.page}</span>
                    </NavLink>
                ))}
            </div>
        </nav>
    );

    const SideNav: FC = () => (
        <aside className="hidden md:block w-64 bg-brand-surface p-4 flex-shrink-0 overflow-y-auto">
            <nav className="flex flex-col space-y-2">
                {navItemsUser.map((item) => (
                    <NavLink
                        key={item.page}
                        to={item.path}
                        end={item.path === '/'}
                        className={({ isActive }) => `flex items-center space-x-3 p-3 rounded-lg transition-colors ${isActive ? 'bg-brand-primary text-white' : 'text-brand-text-light hover:bg-brand-secondary hover:text-white'}`}
                    >
                        <item.icon className="w-6 h-6" />
                        <span className="font-semibold">{item.label || item.page}</span>
                    </NavLink>
                ))}
            </nav>
        </aside>
    );

    // Mock whatsapp link for now - could be fetched from settings
    const whatsappLink = "https://wa.me/5511999999999";

    return (
        <div className="h-screen flex flex-col">
            <Header />
            <div className="flex flex-1 overflow-hidden">
                <SideNav />
                <main className="flex-1 pb-20 md:pb-0 overflow-y-auto relative">
                    {/* Real-time notification toast */}
                    {newPostCount > 0 && (
                        <div 
                            onClick={handleNotificationClick}
                            className="absolute top-4 left-1/2 -translate-x-1/2 bg-brand-primary text-white px-6 py-3 rounded-full shadow-lg cursor-pointer z-50 animate-bounce"
                        >
                           {newPostCount} nov{newPostCount > 1 ? 'as' : 'a'} publicaç{newPostCount > 1 ? 'ões' : 'ão'}! Clique para ver.
                        </div>
                    )}
                    {/* AQUI ESTAVA O ERRO: Substituído 'children' por 'Outlet' */}
                    <Outlet />
                </main>
            </div>
            <BottomNav />
            <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="fixed bottom-20 right-4 md:bottom-6 md:right-6 bg-green-500 text-white rounded-full p-3.5 shadow-lg z-30 transform transition-transform hover:scale-110">
                <WhatsappIcon className="w-8 h-8" />
            </a>
        </div>
    );
};

export default UserLayout;
