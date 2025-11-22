
import React, { useState, useEffect, FC } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { User, Post, Class } from '../../types';
import api from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ImageUpload } from '../../components/ui/ImageUpload';
import { EditIcon, LogoutIcon, PhotoIcon, BookmarkIcon, HeartIcon, CommentIcon, UserCircleIcon } from '../../components/Icons';

// Mocked classes for now, as there's no backend endpoint for them
const MOCK_CLASSES: Class[] = [
    { id: 'class1', title: 'Montagem de Camadas em SVG', description: 'Aprenda a montar arquivos de corte com múltiplas camadas de forma perfeita.', thumbnailUrl: 'https://picsum.photos/seed/class1/400/225', videoUrl: '#' },
    { id: 'class2', title: 'Personalizando Arquivos no Studio', description: 'Dicas e truques para editar e personalizar seus arquivos no Silhouette Studio.', thumbnailUrl: 'https://picsum.photos/seed/class2/400/225', videoUrl: '#' },
];

const EditProfileModal: FC<{ user: User; onClose: () => void; onSave: (updates: { name: string; avatarUrl: string }) => void; }> = ({ user, onClose, onSave }) => {
    const [name, setName] = useState(user.name);
    const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onSave({ name, avatarUrl });
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-brand-surface rounded-xl p-6 w-full max-w-md shadow-lg" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-white mb-6">Editar Perfil</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex justify-center mb-4">
                        <img src={avatarUrl} alt="Avatar Preview" className="w-24 h-24 rounded-full object-cover ring-2 ring-brand-primary" />
                    </div>
                    <Input label="Nome Completo" id="profile-name" type="text" value={name} onChange={e => setName(e.target.value)} required className="" />
                    
                    <ImageUpload 
                        label="Foto de Perfil" 
                        value={avatarUrl} 
                        onChange={setAvatarUrl} 
                        folder="profiles"
                        className="mb-4"
                    />

                    <div className="flex justify-end space-x-2 pt-4">
                        <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
                        <Button type="submit">Salvar</Button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const ProfilePage: FC = () => {
    const { auth, logout, verifyUserSubscription } = useAuth();
    const currentUser = auth.user!;
    const [userPosts, setUserPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'posts' | 'classes'>('posts');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    useEffect(() => {
        const fetchUserPosts = async () => {
            setLoading(true);
            try {
                const { data } = await api.get('/posts');
                setUserPosts(data.filter((p: any) => p.author._id === currentUser._id).map((p: any) => ({ ...p, id: p._id })));
            } catch (error) {
                console.error("Failed to fetch user posts:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchUserPosts();
    }, [currentUser._id]);

    const handleSaveProfile = async (updates: { name: string; avatarUrl: string }) => {
        try {
            // In a real app, user update should be a dedicated endpoint
            // Here we use the admin one for simplicity as it's not specified
            await api.put(`/users/${currentUser._id}`, updates);
            // Re-verify user to update context
            await verifyUserSubscription();
        } catch (error) {
            console.error("Failed to update profile:", error);
            alert("Não foi possível atualizar o perfil.");
        }
    };

    return (
        <>
            {isEditModalOpen && <EditProfileModal user={currentUser} onClose={() => setIsEditModalOpen(false)} onSave={handleSaveProfile} />}
            <div className="p-4 sm:p-6">
                <header className="bg-brand-surface rounded-xl p-6 flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 mb-6">
                    <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-24 h-24 rounded-full ring-4 ring-brand-primary" />
                    <div className="text-center sm:text-left flex-grow">
                        <h2 className="text-3xl font-bold text-white">{currentUser.name}</h2>
                        <p className="text-brand-text-light">{currentUser.email}</p>
                        <span className="mt-2 inline-block px-3 py-1 text-sm font-semibold rounded-full bg-green-500/20 text-green-300">
                            Assinatura Ativa
                        </span>
                    </div>
                    <div className="flex space-x-2">
                         <Button variant="secondary" onClick={() => setIsEditModalOpen(true)} className="flex items-center space-x-2"><EditIcon className="w-5 h-5" /><span>Editar</span></Button>
                         <Button variant="ghost" onClick={logout} className="flex items-center space-x-2"><LogoutIcon className="w-5 h-5" /><span>Sair</span></Button>
                    </div>
                </header>

                <div className="border-b border-brand-secondary mb-6">
                    <nav className="flex space-x-4">
                        <button onClick={() => setActiveTab('posts')} className={`px-4 py-2 font-semibold transition-colors flex items-center space-x-2 ${activeTab === 'posts' ? 'text-brand-primary border-b-2 border-brand-primary' : 'text-brand-text-light hover:text-white'}`}>
                            <PhotoIcon className="w-5 h-5" /><span>Minhas Publicações ({userPosts.length})</span>
                        </button>
                        <button onClick={() => setActiveTab('classes')} className={`px-4 py-2 font-semibold transition-colors flex items-center space-x-2 ${activeTab === 'classes' ? 'text-brand-primary border-b-2 border-brand-primary' : 'text-brand-text-light hover:text-white'}`}>
                            <BookmarkIcon className="w-5 h-5" /><span>Aulas</span>
                        </button>
                    </nav>
                </div>

                <main>
                    {activeTab === 'posts' && (
                        <div className="space-y-6">
                            {loading ? <p>Carregando publicações...</p> : userPosts.length > 0 ? userPosts.map(post => (
                                <div key={post.id} className="bg-brand-surface rounded-xl p-4 sm:p-5 shadow-lg">
                                    <p className="text-xs text-brand-text-light mb-2">{new Date(post.createdAt).toLocaleString('pt-BR')}</p>
                                    <p className="my-2 text-brand-text whitespace-pre-wrap">{post.text}</p>
                                    <div className="my-3">
                                        {post.imageUrl && <img src={post.imageUrl} alt="Post content" className="rounded-lg w-full max-h-[500px] object-cover" />}
                                        {post.videoUrl && <video controls src={post.videoUrl} className="rounded-lg w-full max-h-[500px] bg-black" />}
                                    </div>
                                    <div className="flex items-center space-x-6 text-brand-text-light border-t border-brand-secondary mt-4 pt-3">
                                        <div className="flex items-center space-x-2"><HeartIcon filled={post.likes.length > 0} className={`w-5 h-5 ${post.likes.length > 0 ? 'text-brand-primary' : ''}`}/><span>{post.likes.length}</span></div>
                                        <div className="flex items-center space-x-2"><CommentIcon className="w-5 h-5" /><span>{post.comments.length}</span></div>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-12 bg-brand-surface rounded-xl">
                                    <UserCircleIcon className="w-16 h-16 mx-auto text-brand-secondary" />
                                    <h3 className="mt-4 text-xl font-semibold">Nenhuma publicação encontrada</h3>
                                    <p className="mt-1 text-brand-text-light">Comece a compartilhar na Comunidade!</p>
                                </div>
                            )}
                        </div>
                    )}
                    {activeTab === 'classes' && (
                         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {MOCK_CLASSES.map(cls => (
                                <div key={cls.id} className="bg-brand-surface rounded-xl shadow-lg overflow-hidden flex flex-col group">
                                    <div className="relative">
                                        <img src={cls.thumbnailUrl} alt={cls.title} className="w-full h-40 object-cover" />
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-16 h-16 text-white/80"><path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm14.024-.983a1.125 1.125 0 010 1.966l-5.603 3.113A1.125 1.125 0 019 15.113V8.887c0-.857.921-1.4 1.671-.983l5.603 3.113z" clipRule="evenodd" /></svg>
                                        </div>
                                    </div>
                                    <div className="p-4 flex flex-col flex-grow">
                                        <h3 className="text-lg font-bold text-white flex-grow mb-2">{cls.title}</h3>
                                        <p className="text-sm text-brand-text-light mb-4 line-clamp-2">{cls.description}</p>
                                        <Button onClick={() => alert('Indo para a aula...')} className="mt-auto w-full">Assistir Aula</Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </main>
            </div>
        </>
    );
};

export default ProfilePage;