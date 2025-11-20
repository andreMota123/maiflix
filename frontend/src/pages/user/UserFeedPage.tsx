
import React, { useState, useEffect, FC } from 'react';
import { AdminPost } from '../../types';
import api from '../../services/api';
import { InfoIcon } from '../../components/Icons';

const UserFeedPage: FC = () => {
    const [posts, setPosts] = useState<AdminPost[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                setLoading(true);
                const { data } = await api.get('/admin-posts');
                setPosts(data.map((p: any) => ({ ...p, id: p._id })));
            } catch (error) {
                console.error("Failed to fetch admin posts:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchPosts();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[50vh]">
                <div className="text-brand-primary text-xl animate-pulse">Carregando avisos...</div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <h2 className="text-2xl font-bold text-white border-l-4 border-brand-primary pl-3">Avisos Importantes</h2>
            {posts.length === 0 ? (
                <div className="bg-brand-surface rounded-xl p-12 text-center flex flex-col items-center shadow-lg">
                    <InfoIcon className="w-16 h-16 text-brand-text-light mb-4 opacity-50" />
                    <h3 className="text-xl font-semibold text-white">Tudo tranquilo por aqui</h3>
                    <p className="text-brand-text-light mt-2">Nenhum aviso novo dos administradores no momento.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {posts.map(post => (
                        <div key={post.id} className="bg-brand-surface rounded-xl p-6 shadow-lg border border-brand-secondary/50">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
                                <h3 className="text-xl font-bold text-brand-primary">{post.title}</h3>
                                <span className="text-xs text-brand-text-light bg-brand-bg px-2 py-1 rounded mt-2 sm:mt-0 self-start sm:self-auto">
                                    {new Date(post.createdAt).toLocaleDateString('pt-BR')} às {new Date(post.createdAt).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                                </span>
                            </div>
                            
                            {post.imageUrl && <img src={post.imageUrl} alt={post.title} className="rounded-lg w-full max-h-[400px] object-cover mb-4 shadow-md" />}
                            {post.videoUrl && <video controls src={post.videoUrl} className="rounded-lg w-full max-h-[400px] bg-black mb-4 shadow-md" />}
                            
                            <div className="prose prose-invert max-w-none">
                                <p className="text-brand-text whitespace-pre-wrap leading-relaxed">{post.content}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default UserFeedPage;
