import React, { useState, FC, useRef, useEffect } from 'react';
import { Page, User, Post, Product, Class, AdminPost, Comment, Notification, Banner } from './types';
import { HomeIcon, UsersIcon, InfoIcon, FileIcon, UserCircleIcon, HeartIcon, CommentIcon, TrashIcon, BellIcon, WhatsappIcon, PhotoIcon, VideoIcon, LogoutIcon, EditIcon, UserPlusIcon, LockClosedIcon, LockOpenIcon, UserGroupIcon, BoxIcon, ChevronLeftIcon, ChevronRightIcon, Cog6ToothIcon, BookmarkIcon, EyeIcon, EyeSlashIcon } from './components/Icons';
import { GoogleGenAI, Type } from "@google/genai";

// Importação das Rotas e Layouts
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './layouts/AdminLayout';
import UserLayout from './layouts/UserLayout';
import LoginPage from './pages/LoginPage';
import BlockedPage from './pages/BlockedPage';
import HomePage from './pages/user/HomePage';
import UserFeedPage from './pages/user/UserFeedPage';
import CommunityPage from './pages/user/CommunityPage';
import ProfilePage from './pages/user/ProfilePage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';
import AdminWebhookLogsPage from './pages/admin/AdminWebhookLogsPage';
import api, { uploadImage } from './services/api'; // Importa a função de upload

// --- ERROR BOUNDARY (para produção) ---
interface ErrorBoundaryProps { children?: React.ReactNode; }
interface ErrorBoundaryState { hasError: boolean; }
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { hasError: false };
  readonly props: Readonly<ErrorBoundaryProps>;
  constructor(props: ErrorBoundaryProps) { super(props); this.props = props; }
  static getDerivedStateFromError(_error: Error): ErrorBoundaryState { return { hasError: true }; }
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) { console.error("Erro não capturado:", error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 text-center text-brand-text-light flex flex-col items-center justify-center h-full">
          <h2 className="text-2xl font-bold text-brand-primary mb-4">Oops! Algo deu errado.</h2>
          <p className="mb-6 max-w-md">Um erro inesperado ocorreu. Tente recarregar a página.</p>
          <Button onClick={() => window.location.reload()}>Recarregar Página</Button>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- HELPERS ---
const getYoutubeEmbedUrl = (url: string): string | null => {
    if (!url) return null;
    let videoId;
    try {
        const urlObj = new URL(url);
        if (urlObj.hostname === 'youtu.be') {
            videoId = urlObj.pathname.slice(1);
        } else if (urlObj.hostname.includes('youtube.com')) {
            videoId = urlObj.searchParams.get('v');
        }
    } catch (e) {
        console.error("Invalid YouTube URL", e);
        return null;
    }
    if (videoId) return `https://www.youtube.com/embed/${videoId}`;
    return null;
};

const isValidYoutubeUrl = (url: string): boolean => {
    if (!url) return true;
    const youtubeRegex = /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    return youtubeRegex.test(url);
};

// --- CONFIGS ---
const DEFAULT_COLORS: Record<string, string> = {
  'brand-bg': '#1a1a2e',
  'brand-surface': '#16213e',
  'brand-primary': '#e94560',
  'brand-secondary': '#0f3460',
  'brand-text': '#dcdcdc',
  'brand-text-light': '#a7a9be',
};
const COLOR_VAR_MAP: Record<string, string> = {
  'brand-bg': '--color-brand-bg',
  'brand-surface': '--color-brand-surface',
  'brand-primary': '--color-brand-primary',
  'brand-secondary': '--color-brand-secondary',
  'brand-text': '--color-brand-text',
  'brand-text-light': '--color-brand-text-light',
};

// --- REUSABLE UI COMPONENTS ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> { variant?: 'primary' | 'secondary' | 'ghost'; }
const Button: FC<ButtonProps> = ({ children, className, variant = 'primary', ...props }) => {
  const baseClasses = 'px-4 py-2 rounded-lg font-semibold transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-surface disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100';
  const variantClasses = {
    primary: 'bg-brand-primary text-white hover:bg-red-500',
    secondary: 'bg-brand-secondary text-white hover:bg-blue-800',
    ghost: 'bg-transparent text-brand-text-light hover:bg-brand-surface hover:text-white',
  };
  return <button className={`${baseClasses} ${variantClasses[variant]} ${className}`} {...props}>{children}</button>;
};

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> { label: string; }
const Input: FC<InputProps> = ({ label, id, type, className, ...props }) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    return (
        <div className="w-full">
            <label htmlFor={id} className="block text-sm font-medium text-brand-text-light mb-1">{label}</label>
            <div className="relative">
                <input id={id} type={isPassword ? (showPassword ? 'text' : 'password') : type} className={`w-full pl-3 pr-10 py-2 bg-brand-bg border border-brand-secondary rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary text-brand-text ${className}`} {...props} />
                {isPassword && (
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-brand-text-light hover:text-white focus:outline-none">
                        {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                    </button>
                )}
            </div>
        </div>
    );
};

// --- WRAPPERS AND ADMIN PAGES (Updated with Upload Logic) ---

const AdminFeedPage: FC<{
    posts: AdminPost[];
    onAddPost: (post: Omit<AdminPost, 'id' | 'createdAt'>) => void;
    onUpdatePost: (post: AdminPost) => void;
    onDeletePost: (postId: string) => void;
}> = ({ posts, onAddPost, onUpdatePost, onDeletePost }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [media, setMedia] = useState<{ type: 'image' | 'video' | null; url: string | null }>({ type: null, url: null });
    const [editingPost, setEditingPost] = useState<AdminPost | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [uploading, setUploading] = useState(false);

    const imageInputRef = useRef<HTMLInputElement>(null);

    const resetForm = () => {
        setTitle('');
        setContent('');
        setMedia({ type: null, url: null });
        setEditingPost(null);
        setIsFormOpen(false);
        if (imageInputRef.current) imageInputRef.current.value = '';
    };

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            try {
                setUploading(true);
                // UPLOAD REAL para o servidor
                const publicUrl = await uploadImage(file, 'banners') as string; // Usa pasta banners para avisos também ou cria uma 'feed'
                setMedia({ type: 'image', url: publicUrl });
            } catch (error) {
                console.error("Erro ao processar arquivo", error);
                alert("Erro ao fazer upload da imagem. Tente novamente.");
            } finally {
                setUploading(false);
            }
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !content.trim()) {
            alert('Título e conteúdo são obrigatórios.');
            return;
        }

        const postData = {
            title,
            content,
            imageUrl: media.type === 'image' ? media.url! : undefined,
            videoUrl: media.type === 'video' ? media.url! : undefined,
        };

        if (editingPost) {
            onUpdatePost({ ...editingPost, ...postData });
        } else {
            onAddPost(postData);
        }
        resetForm();
    };

    const handleEdit = (post: AdminPost) => {
        setEditingPost(post);
        setTitle(post.title);
        setContent(post.content);
        if (post.imageUrl) {
            setMedia({ type: 'image', url: post.imageUrl });
        } else if (post.videoUrl) {
            setMedia({ type: 'video', url: post.videoUrl });
        } else {
            setMedia({ type: null, url: null });
        }
        setIsFormOpen(true);
    };

    const openAddModal = () => { resetForm(); setIsFormOpen(true); };

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">Gerenciamento de Avisos</h2>
                <Button onClick={openAddModal} className="flex items-center space-x-2"><PhotoIcon className="w-5 h-5" /><span>Criar Aviso</span></Button>
            </div>
            {isFormOpen && (
                 <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={resetForm}>
                    <div className="bg-brand-surface rounded-xl p-6 w-full max-w-lg shadow-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-2xl font-bold text-white mb-4">{editingPost ? 'Editar Aviso' : 'Criar Novo Aviso'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Input label="Título" id="admin-post-title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
                            <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Escreva o conteúdo do aviso aqui..." className="w-full bg-brand-bg border border-brand-secondary rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-brand-primary resize-none text-white" rows={5} required />
                            {media.url && (
                                <div className="mt-4 relative group">
                                    {media.type === 'image' && <img src={media.url} alt="Pré-visualização" className="rounded-lg w-full max-h-60 object-contain bg-black" />}
                                    <button type="button" onClick={() => setMedia({type: null, url: null})} className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1.5 hover:bg-black/70 opacity-50 group-hover:opacity-100 transition-opacity">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>
                            )}
                            <div className="flex justify-between items-center mt-3">
                                <div className="flex items-center space-x-2 text-brand-text-light">
                                    <input type="file" accept="image/*" ref={imageInputRef} onChange={handleFileSelect} className="hidden" />
                                    <Button type="button" variant="secondary" onClick={() => imageInputRef.current?.click()} disabled={uploading}>
                                        {uploading ? 'Enviando...' : <><PhotoIcon className="w-5 h-5 mr-1 inline" /> Add Foto</>}
                                    </Button>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Button type="button" variant="ghost" onClick={resetForm}>Cancelar</Button>
                                    <Button type="submit" disabled={uploading}>{editingPost ? 'Salvar' : 'Publicar'}</Button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            <div className="space-y-6">
                {posts.map(post => (
                    <div key={post.id} className="bg-brand-surface rounded-xl p-5 shadow-lg">
                        <div className="flex justify-between items-start">
                            <div><h3 className="text-xl font-bold text-brand-primary">{post.title}</h3><p className="text-xs text-brand-text-light mb-3">{new Date(post.createdAt).toLocaleString('pt-BR')}</p></div>
                            <div className="flex items-center space-x-2">
                                <button onClick={() => handleEdit(post)} className="p-2 text-brand-text-light hover:text-white"><EditIcon className="w-5 h-5" /></button>
                                <button onClick={() => onDeletePost(post.id)} className="p-2 text-brand-text-light hover:text-brand-primary"><TrashIcon className="w-5 h-5" /></button>
                            </div>
                        </div>
                        {post.imageUrl && <img src={post.imageUrl} alt={post.title} className="rounded-lg w-full max-h-[400px] object-cover my-4 shadow-md" />}
                        <p className="text-brand-text whitespace-pre-wrap">{post.content}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

const AdminProductsPage: FC<{
    products: Product[];
    onAddProduct: (productData: Omit<Product, 'id'>) => void;
    onUpdateProduct: (product: Product) => void;
    onDeleteProduct: (productId: string) => void;
}> = ({ products, onAddProduct, onUpdateProduct, onDeleteProduct }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    const openAddModal = () => { setEditingProduct(null); setIsModalOpen(true); };
    const openEditModal = (product: Product) => { setEditingProduct(product); setIsModalOpen(true); };
    const handleDelete = (productId: string) => { if (window.confirm('Tem certeza que deseja excluir este produto?')) { onDeleteProduct(productId); } };

    const ProductFormModal: FC<{ isOpen: boolean; onClose: () => void; product: Product | null; }> = ({ isOpen, onClose, product }) => {
        const [name, setName] = useState('');
        const [description, setDescription] = useState('');
        const [thumbnailUrl, setThumbnailUrl] = useState('');
        const [fileType, setFileType] = useState<'SVG' | 'PDF' | 'STUDIO'>('SVG');
        const [downloadUrl, setDownloadUrl] = useState('');
        const [youtubeUrl, setYoutubeUrl] = useState('');
        const [uploading, setUploading] = useState(false);
        const fileInputRef = useRef<HTMLInputElement>(null);

        useEffect(() => {
            if (product) {
                setName(product.name); setDescription(product.description); setThumbnailUrl(product.thumbnailUrl);
                setFileType(product.fileType); setDownloadUrl(product.downloadUrl); setYoutubeUrl(product.youtubeUrl || '');
            } else {
                setName(''); setDescription(''); setThumbnailUrl(''); setFileType('SVG'); setDownloadUrl(''); setYoutubeUrl('');
            }
        }, [product, isOpen]);

        const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file) {
                try {
                    setUploading(true);
                    // UPLOAD REAL
                    const publicUrl = await uploadImage(file, 'products') as string;
                    setThumbnailUrl(publicUrl);
                } catch (error) {
                    alert("Erro ao carregar imagem");
                } finally {
                    setUploading(false);
                }
            }
        };

        const handleSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            if (youtubeUrl.trim() && !isValidYoutubeUrl(youtubeUrl)) { alert('Por favor, insira uma URL do YouTube válida.'); return; }
            const productData = { name, description, thumbnailUrl, fileType, downloadUrl, youtubeUrl: youtubeUrl || undefined };
            try {
                if (product) { onUpdateProduct({ ...product, ...productData }); } else { onAddProduct(productData); }
                onClose();
            } catch (err) {
                alert((err as any).response?.data?.message || 'Falha ao salvar produto.');
            }
        };

        if (!isOpen) return null;

        return (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
                <div className="bg-brand-surface rounded-xl p-6 w-full max-w-lg shadow-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                    <h2 className="text-2xl font-bold text-white mb-4">{product ? 'Editar Produto' : 'Adicionar Novo Produto'}</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input label="Nome do Produto" id="prod-name" type="text" value={name} onChange={e => setName(e.target.value)} required />
                        <div>
                            <label htmlFor="prod-thumb" className="block text-sm font-medium text-brand-text-light mb-1">Imagem do Produto</label>
                            <div className="flex gap-2">
                                <Input id="prod-thumb" type="text" value={thumbnailUrl} onChange={e => setThumbnailUrl(e.target.value)} placeholder="URL da imagem ou Upload" required className="flex-1" />
                                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
                                <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()} className="whitespace-nowrap" disabled={uploading}>
                                    {uploading ? '...' : <><PhotoIcon className="w-5 h-5 mr-1 inline" /> Upload</>}
                                </Button>
                            </div>
                            {thumbnailUrl && <img src={thumbnailUrl} alt="Preview" className="mt-2 h-20 w-20 object-cover rounded-md border border-brand-secondary" />}
                        </div>
                        <div><label htmlFor="prod-desc" className="block text-sm font-medium text-brand-text-light mb-1">Descrição</label><textarea id="prod-desc" value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full px-3 py-2 bg-brand-bg border border-brand-secondary rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary text-white" required /></div>
                        <div><label htmlFor="prod-type" className="block text-sm font-medium text-brand-text-light mb-1">Tipo de Arquivo</label><select id="prod-type" value={fileType} onChange={e => setFileType(e.target.value as any)} className="w-full px-3 py-2 bg-brand-bg border border-brand-secondary rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary text-white"><option value="SVG">SVG</option><option value="PDF">PDF</option><option value="STUDIO">STUDIO</option></select></div>
                        <Input label="URL para Download" id="prod-download" type="text" value={downloadUrl} onChange={e => setDownloadUrl(e.target.value)} required />
                        <Input label="URL do Vídeo do YouTube (opcional)" id="prod-youtube" type="text" value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} />
                        <div className="flex justify-end space-x-2 pt-4"><Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button><Button type="submit" disabled={uploading}>{product ? 'Salvar Alterações' : 'Adicionar'}</Button></div>
                    </form>
                </div>
            </div>
        );
    };

    return (
        <div className="p-4 sm:p-6 space-y-6">
            {isModalOpen && <ProductFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} product={editingProduct} />}
            <div className="flex justify-between items-center"><h2 className="text-2xl font-bold text-white">Gerenciamento de Produtos</h2><Button onClick={openAddModal} className="flex items-center space-x-2"><BoxIcon className="w-5 h-5" /><span>Adicionar Produto</span></Button></div>
            <div className="bg-brand-surface rounded-xl shadow-lg overflow-hidden">
                <ul className="divide-y divide-brand-secondary">
                    {products.map(product => (
                        <li key={product.id} className="p-4 flex items-center justify-between space-x-4">
                            <div className="flex items-center space-x-4 flex-1 min-w-0"><img src={product.thumbnailUrl} alt={product.name} className="w-16 h-16 rounded-md object-cover flex-shrink-0 bg-black" /><div className="min-w-0"><p className="font-semibold text-brand-text truncate">{product.name}</p><p className="text-sm text-brand-text-light truncate">{product.description}</p></div></div>
                            <div className="flex items-center space-x-2 flex-shrink-0"><button onClick={() => openEditModal(product)} className="p-2 text-brand-text-light hover:text-white"><EditIcon className="w-5 h-5" /></button><button onClick={() => handleDelete(product.id)} className="p-2 text-brand-text-light hover:text-brand-primary"><TrashIcon className="w-5 h-5" /></button></div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

const AdminBannersPage: FC<{
    banners: Banner[];
    carouselDuration: number;
    onAddBanner: (bannerData: Omit<Banner, 'id'>) => void;
    onUpdateBanner: (banner: Banner) => void;
    onDeleteBanner: (bannerId: string) => void;
    onUpdateCarouselDuration: (duration: number) => void;
}> = ({ banners, carouselDuration, onAddBanner, onUpdateBanner, onDeleteBanner, onUpdateCarouselDuration }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
    const [duration, setDuration] = useState(carouselDuration / 1000);

    const openAddModal = () => { setEditingBanner(null); setIsModalOpen(true); };
    const openEditModal = (banner: Banner) => { setEditingBanner(banner); setIsModalOpen(true); };
    const handleDelete = (bannerId: string) => { if (window.confirm('Tem certeza que deseja excluir este banner?')) { onDeleteBanner(bannerId); } };
    const handleDurationSave = () => { onUpdateCarouselDuration(duration * 1000); alert('Tempo de exibição atualizado!'); }

    const BannerFormModal: FC<{ isOpen: boolean; onClose: () => void; banner: Banner | null; }> = ({ isOpen, onClose, banner }) => {
        const [title, setTitle] = useState('');
        const [subtitle, setSubtitle] = useState('');
        const [imageUrl, setImageUrl] = useState('');
        const [linkUrl, setLinkUrl] = useState('');
        const [uploading, setUploading] = useState(false);
        const fileInputRef = useRef<HTMLInputElement>(null);

        useEffect(() => {
            if (banner) {
                setTitle(banner.title); setSubtitle(banner.subtitle); setImageUrl(banner.imageUrl); setLinkUrl(banner.linkUrl || '');
            } else {
                setTitle(''); setSubtitle(''); setImageUrl(''); setLinkUrl('');
            }
        }, [banner, isOpen]);

        const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file) {
                try {
                    setUploading(true);
                    // UPLOAD REAL
                    const publicUrl = await uploadImage(file, 'banners') as string;
                    setImageUrl(publicUrl);
                } catch (error) {
                    alert("Erro ao carregar imagem");
                } finally {
                    setUploading(false);
                }
            }
        };

        const handleSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            const bannerData = { title, subtitle, imageUrl, linkUrl: linkUrl || undefined };
            try {
                if (banner) { onUpdateBanner({ ...banner, ...bannerData }); } else { onAddBanner(bannerData); }
                onClose();
            } catch (err) {
                alert((err as any).response?.data?.message || 'Falha ao salvar banner.');
            }
        };

        if (!isOpen) return null;

        return (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
                <div className="bg-brand-surface rounded-xl p-6 w-full max-w-lg shadow-lg" onClick={(e) => e.stopPropagation()}>
                    <h2 className="text-2xl font-bold text-white mb-4">{banner ? 'Editar Banner' : 'Adicionar Novo Banner'}</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input label="Título" id="banner-title" type="text" value={title} onChange={e => setTitle(e.target.value)} required />
                        <Input label="Subtítulo" id="banner-subtitle" type="text" value={subtitle} onChange={e => setSubtitle(e.target.value)} required />
                        <div>
                            <label htmlFor="banner-image" className="block text-sm font-medium text-brand-text-light mb-1">Imagem do Banner</label>
                            <div className="flex gap-2">
                                <Input id="banner-image" type="text" value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="URL da imagem ou Upload" required className="flex-1" />
                                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
                                <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()} className="whitespace-nowrap" disabled={uploading}>
                                    {uploading ? '...' : <><PhotoIcon className="w-5 h-5 mr-1 inline" /> Upload</>}
                                </Button>
                            </div>
                            {imageUrl && <img src={imageUrl} alt="Preview" className="mt-2 h-24 w-full object-cover rounded-md border border-brand-secondary" />}
                        </div>
                        <Input label="URL do Link (opcional)" id="banner-link" type="text" value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="https://exemplo.com/pagina" />
                        <div className="flex justify-end space-x-2 pt-4"><Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button><Button type="submit" disabled={uploading}>{banner ? 'Salvar Alterações' : 'Adicionar'}</Button></div>
                    </form>
                </div>
            </div>
        );
    };

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <BannerFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} banner={editingBanner} />
            <div className="flex justify-between items-center"><h2 className="text-2xl font-bold text-white">Gerenciamento de Banners</h2><Button onClick={openAddModal} className="flex items-center space-x-2"><PhotoIcon className="w-5 h-5" /><span>Adicionar Banner</span></Button></div>
            <div className="bg-brand-surface rounded-xl p-4"><h3 className="text-xl font-bold text-white mb-3">Configurações do Carrossel</h3><div className="flex items-center space-x-4"><div className="flex-grow"><label htmlFor="carousel-duration" className="block text-sm font-medium text-brand-text-light mb-1">Tempo de exibição (segundos)</label><input id="carousel-duration" type="number" min="1" value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="w-full max-w-xs px-3 py-2 bg-brand-bg border border-brand-secondary rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-primary" /></div><Button onClick={handleDurationSave} className="self-end">Salvar</Button></div></div>
            <div className="bg-brand-surface rounded-xl shadow-lg overflow-hidden">
                <ul className="divide-y divide-brand-secondary">
                    {banners.map(banner => (
                        <li key={banner.id} className="p-4 flex items-center justify-between space-x-4">
                            <div className="flex items-center space-x-4 flex-1 min-w-0"><img src={banner.imageUrl} alt={banner.title} className="w-24 h-12 rounded-md object-cover flex-shrink-0 bg-brand-bg" /><div className="min-w-0"><p className="font-semibold text-brand-text truncate">{banner.title}</p><p className="text-sm text-brand-text-light truncate">{banner.subtitle}</p></div></div>
                            <div className="flex items-center space-x-2 flex-shrink-0"><button onClick={() => openEditModal(banner)} className="p-2 text-brand-text-light hover:text-white"><EditIcon className="w-5 h-5" /></button><button onClick={() => handleDelete(banner.id)} className="p-2 text-brand-text-light hover:text-brand-primary"><TrashIcon className="w-5 h-5" /></button></div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

// --- WRAPPERS (Para conectar com API) ---
const AdminFeedPageWrapper = () => {
    const [posts, setPosts] = useState<AdminPost[]>([]);
    useEffect(() => { api.get('/admin-posts').then(res => setPosts(res.data.map((p: any) => ({ ...p, id: p._id })))); }, []);
    const handleAdd = async (p: any) => { const res = await api.post('/admin-posts', p); setPosts(prev => [ {...res.data, id: res.data._id}, ...prev]); };
    const handleUpdate = async (p: any) => { const res = await api.put(`/admin-posts/${p.id}`, p); setPosts(prev => prev.map(x => x.id === p.id ? {...res.data, id: res.data._id} : x)); };
    const handleDelete = async (id: string) => { await api.delete(`/admin-posts/${id}`); setPosts(prev => prev.filter(x => x.id !== id)); };
    return <AdminFeedPage posts={posts} onAddPost={handleAdd} onUpdatePost={handleUpdate} onDeletePost={handleDelete} />;
};

const AdminProductsPageWrapper = () => {
    const [products, setProducts] = useState<Product[]>([]);
    useEffect(() => { api.get('/products').then(res => setProducts(res.data.map((p: any) => ({ ...p, id: p._id })))); }, []);
    const handleAdd = async (p: any) => { const res = await api.post('/products', p); setProducts(prev => [ {...res.data, id: res.data._id}, ...prev]); };
    const handleUpdate = async (p: any) => { const res = await api.put(`/products/${p.id}`, p); setProducts(prev => prev.map(x => x.id === p.id ? {...res.data, id: res.data._id} : x)); };
    const handleDelete = async (id: string) => { await api.delete(`/products/${id}`); setProducts(prev => prev.filter(x => x.id !== id)); };
    return <AdminProductsPage products={products} onAddProduct={handleAdd} onUpdateProduct={handleUpdate} onDeleteProduct={handleDelete} />;
};

const AdminBannersPageWrapper = () => {
    const [banners, setBanners] = useState<Banner[]>([]);
    const [duration, setDuration] = useState(5000);
    useEffect(() => { api.get('/banners').then(res => setBanners(res.data.map((b: any) => ({ ...b, id: b._id })))); }, []);
    const handleAdd = async (b: any) => { const res = await api.post('/banners', b); setBanners(prev => [ {...res.data, id: res.data._id}, ...prev]); };
    const handleUpdate = async (b: any) => { const res = await api.put(`/banners/${b.id}`, b); setBanners(prev => prev.map(x => x.id === b.id ? {...res.data, id: res.data._id} : x)); };
    const handleDelete = async (id: string) => { await api.delete(`/banners/${id}`); setBanners(prev => prev.filter(x => x.id !== id)); };
    const handleDuration = (d: number) => { setDuration(d); };
    return <AdminBannersPage banners={banners} carouselDuration={duration} onAddBanner={handleAdd} onUpdateBanner={handleUpdate} onDeleteBanner={handleDelete} onUpdateCarouselDuration={handleDuration} />;
};

// --- MAIN APP COMPONENT ---
const App: React.FC = () => {
    const [colors, setColors] = useState<Record<string, string>>(() => {
        const savedColors = localStorage.getItem('maiflix-colors');
        if (savedColors) {
            try {
                const parsed: unknown = JSON.parse(savedColors);
                if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
                    const allValuesAreStrings = Object.values(parsed as Record<string, unknown>).every((value) => typeof value === 'string');
                    if (allValuesAreStrings) return parsed as Record<string, string>;
                }
            } catch (e) { console.error('Could not parse colors:', e); }
        }
        return DEFAULT_COLORS;
    });

    useEffect(() => {
        Object.entries(colors).forEach(([key, value]) => { document.documentElement.style.setProperty(COLOR_VAR_MAP[key], value as string); });
        localStorage.setItem('maiflix-colors', JSON.stringify(colors));
    }, [colors]);

    return (
    <ErrorBoundary>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/blocked" element={<BlockedPage />} />
        <Route path="/admin" element={<ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>}>
          <Route index element={<AdminFeedPageWrapper />} /> 
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="products" element={<AdminProductsPageWrapper />} />
          <Route path="banners" element={<AdminBannersPageWrapper />} />
          <Route path="settings" element={<AdminSettingsPage />} />
          <Route path="logs" element={<AdminWebhookLogsPage />} />
        </Route>
        <Route path="/" element={<ProtectedRoute role="user"><UserLayout /></ProtectedRoute>}>
          <Route index element={<HomePage />} />
          <Route path="feed" element={<UserFeedPage />} />
          <Route path="comunidade" element={<CommunityPage />} />
          <Route path="perfil" element={<ProfilePage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ErrorBoundary>
  );
};

export default App;