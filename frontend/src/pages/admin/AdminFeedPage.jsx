import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { EditIcon, TrashIcon, PhotoIcon } from '../../components/Icons';

const AdminFeedPage = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPost, setEditingPost] = useState(null);

    const fetchPosts = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const { data } = await api.get('/admin-posts');
            setPosts(data);
        } catch (err) {
            setError(err.response?.data?.message || 'Falha ao carregar avisos.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPosts();
    }, [fetchPosts]);

    const handleDelete = async (postId) => {
        if (window.confirm('Tem certeza que deseja excluir este aviso?')) {
            try {
                await api.delete(`/admin-posts/${postId}`);
                setPosts(posts.filter(p => p._id !== postId));
            } catch (err) {
                alert(err.response?.data?.message || 'Falha ao excluir aviso.');
            }
        }
    };

    const openEditModal = (post) => {
        setEditingPost(post);
        setIsModalOpen(true);
    };
    
    const openAddModal = () => {
        setEditingPost(null);
        setIsModalOpen(true);
    };

    const PostFormModal = () => {
        const [title, setTitle] = useState(editingPost?.title || '');
        const [content, setContent] = useState(editingPost?.content || '');
        const [imageUrl, setImageUrl] = useState(editingPost?.imageUrl || '');
        const [videoUrl, setVideoUrl] = useState(editingPost?.videoUrl || '');

        const handleSubmit = async (e) => {
            e.preventDefault();
            const payload = { title, content, imageUrl, videoUrl };
            try {
                if (editingPost) {
                    const { data } = await api.put(`/admin-posts/${editingPost._id}`, payload);
                    setPosts(posts.map(p => (p._id === editingPost._id ? data : p)));
                } else {
                    const { data } = await api.post('/admin-posts', payload);
                    setPosts([data, ...posts]);
                }
                setIsModalOpen(false);
                setEditingPost(null);
            } catch (err) {
                alert(err.response?.data?.message || 'Falha ao salvar aviso.');
            }
        };

        return (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setIsModalOpen(false)}>
                <div className="bg-gray-800 rounded-xl p-6 w-full max-w-lg shadow-lg" onClick={(e) => e.stopPropagation()}>
                    <h2 className="text-2xl font-bold text-white mb-4">{editingPost ? 'Editar Aviso' : 'Criar Novo Aviso'}</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input label="Título" id="post-title" type="text" value={title} onChange={e => setTitle(e.target.value)} required />
                        <div>
                            <label htmlFor="post-content" className="block text-sm font-medium text-gray-300 mb-1">Conteúdo</label>
                            <textarea id="post-content" value={content} onChange={e => setContent(e.target.value)} rows={5} className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500" required />
                        </div>
                        <Input label="URL da Imagem (opcional)" id="post-image" type="text" value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://exemplo.com/imagem.jpg" />
                        <Input label="URL do Vídeo (opcional)" id="post-video" type="text" value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="https://exemplo.com/video.mp4" />
                        <div className="flex justify-end space-x-2 pt-4">
                            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                            <Button type="submit">{editingPost ? 'Salvar Alterações' : 'Publicar'}</Button>
                        </div>
                    </form>
                </div>
            </div>
        );
    };

    if (loading) return <div className="p-6 text-center">Carregando avisos...</div>;
    if (error) return <div className="p-6 text-center text-red-400">{error}</div>;

    return (
        <div className="p-4 sm:p-6 space-y-6">
            {isModalOpen && <PostFormModal />}
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">Gerenciamento de Avisos</h2>
                <Button onClick={openAddModal} className="flex items-center space-x-2">
                    <PhotoIcon className="w-5 h-5" />
                    <span>Criar Aviso</span>
                </Button>
            </div>
            <div className="space-y-6">
                {posts.length > 0 ? posts.map(post => (
                    <div key={post._id} className="bg-gray-800 rounded-xl p-5 shadow-lg">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-xl font-bold text-pink-500">{post.title}</h3>
                                <p className="text-xs text-gray-400 mb-3">{new Date(post.createdAt).toLocaleString('pt-BR')}</p>
                            </div>
                            <div className="flex items-center space-x-2">
                                <button onClick={() => openEditModal(post)} className="p-2 text-gray-400 hover:text-white" aria-label="Editar aviso">
                                    <EditIcon className="w-5 h-5" />
                                </button>
                                <button onClick={() => handleDelete(post._id)} className="p-2 text-gray-400 hover:text-pink-500" aria-label="Excluir aviso">
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        {post.imageUrl && <img src={post.imageUrl} alt={post.title} className="rounded-lg w-full max-h-[400px] object-cover my-4" />}
                        {post.videoUrl && <video controls src={post.videoUrl} className="rounded-lg w-full max-h-[400px] object-cover my-4 bg-black" />}
                        <p className="text-gray-200 whitespace-pre-wrap">{post.content}</p>
                    </div>
                )) : (
                     <div className="text-center py-12 bg-gray-800 rounded-xl">
                        <h3 className="text-xl font-semibold">Nenhum aviso encontrado</h3>
                        <p className="mt-1 text-gray-400">Clique em "Criar Aviso" para adicionar o primeiro.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminFeedPage;
