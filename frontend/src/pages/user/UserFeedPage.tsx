import React, { useState, useEffect, FC } from 'react';
import { AdminPost } from '../../types';
import api from '../../services/api';

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
        return <div className="p-6 text-center">Carregando avisos...</div>;
    }

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <h2 className="text-2xl font-bold text-white">Avisos Importantes</h2>
            {posts.length === 0 ? (
                <div className="bg-brand-surface rounded-xl p-8 text-center">
                    <p className="text-brand-text-light">Nenhum aviso no momento.</p>
                </div>
            ) : (
                posts.map(post => (
                    <div key={post.id} className="bg-brand-surface rounded-xl p-5 shadow-lg">
                        <h3 className="text-xl font-bold text-brand-primary">{post.title}</h3>
                        <p className="text-xs text-brand-text-light mb-3">{new Date(post.createdAt).toLocaleString('pt-BR')}</p>
                        {post.imageUrl && <img src={post.imageUrl} alt={post.title} className="rounded-lg w-full max-h-[400px] object-cover my-4" />}
                        {post.videoUrl && <video controls src={post.videoUrl} className="rounded-lg w-full max-h-[400px] bg-black my-4" />}
                        <p className="text-brand-text whitespace-pre-wrap">{post.content}</p>
                    </div>
                ))
            )}
        </div>
    );
};

export default UserFeedPage;