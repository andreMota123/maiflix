import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ImageUpload } from '../../components/ui/ImageUpload';
import { PhotoIcon, EditIcon, TrashIcon } from '../../components/Icons';

const AdminBannersPage = () => {
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBanner, setEditingBanner] = useState(null);

    const fetchBanners = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const { data } = await api.get('/banners');
            setBanners(data);
        } catch (err) {
            setError(err.response?.data?.message || 'Falha ao carregar banners.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchBanners();
    }, [fetchBanners]);

    const handleDelete = async (bannerId) => {
        if (window.confirm('Tem certeza que deseja excluir este banner?')) {
            try {
                await api.delete(`/banners/${bannerId}`);
                setBanners(banners.filter(b => b._id !== bannerId));
            } catch (err) {
                alert(err.response?.data?.message || 'Falha ao excluir banner.');
            }
        }
    };
    
    const openModal = (banner = null) => {
        setEditingBanner(banner);
        setIsModalOpen(true);
    };

    const BannerFormModal = () => {
        const [title, setTitle] = useState(editingBanner?.title || '');
        const [subtitle, setSubtitle] = useState(editingBanner?.subtitle || '');
        const [imageUrl, setImageUrl] = useState(editingBanner?.imageUrl || '');
        const [linkUrl, setLinkUrl] = useState(editingBanner?.linkUrl || '');
        
        const handleSubmit = async (e) => {
            e.preventDefault();
            const bannerData = { title, subtitle, imageUrl, linkUrl };
            try {
                if (editingBanner) {
                    const { data } = await api.put(`/banners/${editingBanner._id}`, bannerData);
                    setBanners(banners.map(b => b._id === editingBanner._id ? data : b));
                } else {
                    const { data } = await api.post('/banners', bannerData);
                    setBanners([data, ...banners]);
                }
                setIsModalOpen(false);
            } catch (err) {
                alert(err.response?.data?.message || 'Falha ao salvar banner.');
            }
        };

        return (
             <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setIsModalOpen(false)}>
                <div className="bg-gray-800 rounded-xl p-6 w-full max-w-lg shadow-lg" onClick={(e) => e.stopPropagation()}>
                    <h2 className="text-2xl font-bold text-white mb-4">{editingBanner ? 'Editar Banner' : 'Adicionar Banner'}</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input label="Título" id="banner-title" type="text" value={title} onChange={e => setTitle(e.target.value)} required />
                        <Input label="Subtítulo" id="banner-subtitle" type="text" value={subtitle} onChange={e => setSubtitle(e.target.value)} required />
                        
                        <ImageUpload 
                            label="Imagem do Banner" 
                            value={imageUrl} 
                            onChange={setImageUrl} 
                            folder="banners"
                        />

                        <Input label="URL do Link (opcional)" id="banner-link" type="text" value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="https://exemplo.com/pagina" />
                        <div className="flex justify-end space-x-2 pt-4">
                            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                            <Button type="submit">{editingBanner ? 'Salvar' : 'Adicionar'}</Button>
                        </div>
                    </form>
                </div>
            </div>
        );
    };

    if (loading) return <div className="p-6 text-center">Carregando banners...</div>;
    if (error) return <div className="p-6 text-center text-red-400">{error}</div>;

    return (
        <div className="p-4 sm:p-6 space-y-6">
            {isModalOpen && <BannerFormModal />}
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">Gerenciamento de Banners</h2>
                <Button onClick={() => openModal()} className="flex items-center space-x-2">
                    <PhotoIcon className="w-5 h-5" />
                    <span>Adicionar Banner</span>
                </Button>
            </div>
            <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                <ul className="divide-y divide-gray-700">
                    {banners.map(banner => (
                        <li key={banner._id} className="p-4 flex items-center justify-between space-x-4">
                            <div className="flex items-center space-x-4 flex-1 min-w-0">
                                <img src={banner.imageUrl} alt={banner.title} className="w-24 h-12 rounded-md object-cover flex-shrink-0 bg-gray-700" />
                                <div className="min-w-0">
                                    <p className="font-semibold text-white truncate">{banner.title}</p>
                                    <p className="text-sm text-gray-400 truncate">{banner.subtitle}</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2 flex-shrink-0">
                                <button onClick={() => openModal(banner)} className="p-2 text-gray-400 hover:text-white" aria-label="Editar banner">
                                    <EditIcon className="w-5 h-5" />
                                </button>
                                <button onClick={() => handleDelete(banner._id)} className="p-2 text-gray-400 hover:text-pink-500" aria-label="Excluir banner">
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

export default AdminBannersPage;