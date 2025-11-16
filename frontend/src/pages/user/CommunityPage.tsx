import React, { useState, useEffect, useRef, FC, useCallback } from 'react';
import { Post, Comment } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { Button } from '../../components/ui/Button';
import { HeartIcon, CommentIcon, TrashIcon, PhotoIcon, VideoIcon } from '../../components/Icons';

const CommunityPage: FC = () => {
    const { auth } = useAuth();
    const currentUser = auth.user;
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [newPostText, setNewPostText] = useState('');
    const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
    const [justLikedPostId, setJustLikedPostId] = useState<string | null>(null);

    const [newPostMedia, setNewPostMedia] = useState<{ type: 'image' | 'video' | null, url: string | null }>({ type: null, url: null });
    const imageInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);
    
    const MAX_IMAGE_SIZE_MB = 10;
    const MAX_VIDEO_SIZE_MB = 50;
    const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;
    const MAX_VIDEO_SIZE_BYTES = MAX_VIDEO_SIZE_MB * 1024 * 1024;

    const fetchPosts = useCallback(async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/posts');
            setPosts(data.map((p: any) => ({ ...p, id: p._id }))); // Map _id to id
        } catch (error) {
            console.error("Failed to fetch posts:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPosts();
    }, [fetchPosts]);
    
    useEffect(() => {
        if (justLikedPostId) {
            const timer = setTimeout(() => setJustLikedPostId(null), 300);
            return () => clearTimeout(timer);
        }
    }, [justLikedPostId]);

    const handleLike = async (postId: string) => {
        const post = posts.find(p => p.id === postId);
        if (!post || !currentUser) return;

        const isCurrentlyLiked = post.likes.includes(currentUser._id);
        if (!isCurrentlyLiked) {
            setJustLikedPostId(postId);
        }

        // Optimistic update
        const originalLikes = post.likes;
        const newLikes = isCurrentlyLiked
            ? post.likes.filter(id => id !== currentUser._id)
            : [...post.likes, currentUser._id];
        
        setPosts(posts.map(p => p.id === postId ? { ...p, likes: newLikes } : p));
        
        try {
            await api.put(`/posts/${postId}/like`);
        } catch (error) {
            console.error("Failed to update like status:", error);
            // Revert on error
            setPosts(posts.map(p => p.id === postId ? { ...p, likes: originalLikes } : p));
        }
    };
    
    const handleDeletePost = async (postId: string) => {
        if (window.confirm("Tem certeza que deseja excluir esta publicação?")) {
            try {
                await api.delete(`/posts/${postId}`);
                setPosts(posts.filter(p => p.id !== postId));
            } catch (error) {
                console.error("Failed to delete post:", error);
                alert("Não foi possível excluir o post.");
            }
        }
    }
    
    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
        // This is a simplification. In a real app, you would upload the file to a service
        // like S3/Cloudinary and get a URL back to store in the database.
        // For this demo, we'll use local object URLs.
        const file = event.target.files?.[0];
        if (file) {
            if (type === 'image' && file.size > MAX_IMAGE_SIZE_BYTES) {
                alert(`O arquivo de imagem excede o limite de ${MAX_IMAGE_SIZE_MB}MB.`);
                event.target.value = '';
                return;
            }
            if (type === 'video' && file.size > MAX_VIDEO_SIZE_BYTES) {
                alert(`O arquivo de vídeo excede o limite de ${MAX_VIDEO_SIZE_MB}MB.`);
                event.target.value = '';
                return;
            }
            const localUrl = URL.createObjectURL(file);
            setNewPostMedia({ type, url: localUrl });
        }
    };
    
    const cancelMedia = () => {
        setNewPostMedia({ type: null, url: null });
        if (imageInputRef.current) imageInputRef.current.value = '';
        if (videoInputRef.current) videoInputRef.current.value = '';
    }

    const handleAddPost = async () => {
        if (!newPostText.trim() && !newPostMedia.url) return;
        try {
            const payload = {
                text: newPostText,
                imageUrl: newPostMedia.type === 'image' ? newPostMedia.url! : undefined,
                videoUrl: newPostMedia.type === 'video' ? newPostMedia.url! : undefined,
            }
            const { data } = await api.post('/posts', payload);
            setPosts([{...data, id: data._id }, ...posts]);
            setNewPostText('');
            cancelMedia();
        } catch (error) {
            console.error("Failed to add post:", error);
            alert("Não foi possível publicar o post.");
        }
    };

    const handleAddComment = async (postId: string) => {
        const commentText = commentInputs[postId];
        if (!commentText || !commentText.trim()) return;
        try {
            const { data } = await api.post(`/posts/${postId}/comment`, { text: commentText });
            const newComment = { ...data, id: data._id, createdAt: 'Agora mesmo' };
            setPosts(posts.map(p => 
                p.id === postId 
                ? { ...p, comments: [...p.comments, newComment] }
                : p
            ));
            setCommentInputs(prev => ({...prev, [postId]: ''}));
        } catch (error) {
            console.error("Failed to add comment:", error);
            alert("Não foi possível adicionar o comentário.");
        }
    };

    if (loading) {
        return <div className="p-6 text-center">Carregando comunidade...</div>;
    }
    
    if (!currentUser) return null;

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <div className="bg-brand-surface rounded-xl p-4">
                <textarea
                    value={newPostText}
                    onChange={(e) => setNewPostText(e.target.value)}
                    placeholder={`No que você está trabalhando, ${currentUser.name}?`}
                    className="w-full bg-brand-bg border border-brand-secondary rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-brand-primary resize-none"
                    rows={3}
                />

                {newPostMedia.url && (
                    <div className="mt-4 relative group">
                        {newPostMedia.type === 'image' && <img src={newPostMedia.url} alt="Pré-visualização" className="rounded-lg w-full max-h-60 object-contain" />}
                        {newPostMedia.type === 'video' && <video controls src={newPostMedia.url} className="rounded-lg w-full max-h-60 bg-black" />}
                        <button onClick={cancelMedia} className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1.5 hover:bg-black/70 opacity-50 group-hover:opacity-100 transition-opacity">
                             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                )}

                <div className="flex justify-between items-center mt-3">
                    <div className="flex items-center space-x-1 text-brand-text-light">
                        <input type="file" accept="image/*" ref={imageInputRef} onChange={(e) => handleFileSelect(e, 'image')} className="hidden" />
                        <input type="file" accept="video/*" ref={videoInputRef} onChange={(e) => handleFileSelect(e, 'video')} className="hidden" />

                        <button onClick={() => imageInputRef.current?.click()} aria-label="Adicionar foto" className="p-2 hover:bg-brand-secondary/30 rounded-full"><PhotoIcon className="w-6 h-6" /></button>
                        <button onClick={() => videoInputRef.current?.click()} aria-label="Adicionar vídeo" className="p-2 hover:bg-brand-secondary/30 rounded-full"><VideoIcon className="w-6 h-6" /></button>
                    </div>
                    <Button onClick={handleAddPost}>Publicar</Button>
                </div>
            </div>

            <div className="space-y-6">
                {posts.map(post => (
                    <div key={post.id} className="bg-brand-surface rounded-xl p-4 sm:p-5 shadow-lg">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-3">
                                <img src={post.author.avatarUrl} alt={post.author.name} className="w-12 h-12 rounded-full" />
                                <div>
                                    <p className="font-semibold text-brand-text">{post.author.name}</p>
                                    <p className="text-xs text-brand-text-light">{new Date(post.createdAt).toLocaleString('pt-BR')}</p>
                                </div>
                            </div>
                            {(post.author._id === currentUser._id || currentUser.role === 'admin') && (
                                <button onClick={() => handleDeletePost(post.id)} className="text-brand-text-light hover:text-brand-primary">
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            )}
                        </div>

                        <p className="my-4 text-brand-text">{post.text}</p>
                        
                        <div className="my-3">
                            {post.imageUrl && <img src={post.imageUrl} alt="Post content" className="rounded-lg w-full max-h-[500px] object-cover" />}
                            {post.videoUrl && <video controls src={post.videoUrl} className="rounded-lg w-full max-h-[500px] bg-black" />}
                        </div>

                        <div className="flex items-center space-x-6 text-brand-text-light border-t border-brand-secondary mt-4 pt-3">
                            <button onClick={() => handleLike(post.id)} className="flex items-center space-x-2 hover:text-brand-primary group transition-transform active:scale-95">
                                <HeartIcon
                                    filled={post.likes.includes(currentUser._id)}
                                    className={`w-5 h-5 transition-all duration-200 ease-in-out ${post.likes.includes(currentUser._id) ? 'text-brand-primary scale-110' : 'text-brand-text-light'} ${justLikedPostId === post.id ? 'animate-like-pop' : ''}`}
                                />
                                <span>{post.likes.length} Curtidas</span>
                            </button>
                            <div className="flex items-center space-x-2">
                                <CommentIcon className="w-5 h-5" />
                                <span>{post.comments.length} Comentários</span>
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-brand-secondary space-y-3">
                            {post.comments.map((comment, index) => (
                                <div
                                    key={comment._id}
                                    className={`flex items-start space-x-3 animate-comment-fade-in`}
                                >
                                    <img src={comment.author.avatarUrl} alt={comment.author.name} className="w-8 h-8 rounded-full" />
                                    <div className="bg-brand-bg/50 px-3 py-2 rounded-lg flex-1">
                                        <div className="flex items-baseline justify-between">
                                          <p className="font-semibold text-sm text-brand-text">{comment.author.name}</p>
                                          <p className="text-xs text-brand-text-light">{comment.createdAt === 'Agora mesmo' ? 'Agora mesmo' : new Date(comment.createdAt).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}</p>
                                        </div>
                                        <p className="text-sm text-brand-text-light mt-1">{comment.text}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-4 flex items-center space-x-2">
                            <img src={currentUser.avatarUrl} alt="Seu avatar" className="w-8 h-8 rounded-full"/>
                            <form onSubmit={(e) => { e.preventDefault(); handleAddComment(post.id); }} className="flex-1 flex space-x-2">
                                <input
                                    type="text"
                                    placeholder="Adicione um comentário..."
                                    value={commentInputs[post.id] || ''}
                                    onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                                    className="w-full bg-brand-bg border border-brand-secondary rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
                                />
                                <Button type="submit" variant="secondary" className="!px-3 !py-2 rounded-full">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                        <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086L2.279 16.76a.75.75 0 00.95.826l16-5.333a.75.75 0 000-1.418l-16-5.333z" />
                                    </svg>
                                </Button>
                            </form>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CommunityPage;