
import React, { useState, useEffect, useCallback } from 'react';
import api, { getSignedUrl } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ImageUpload } from '../../components/ui/ImageUpload';
import { BoxIcon, EditIcon, TrashIcon } from '../../components/Icons';

const AdminProductsPage = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);

    const fetchProducts = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const { data } = await api.get('/products');
            
            // Resolve URLs assinadas para exibição
            const resolvedProducts = await Promise.all(data.map(async (p) => {
                const url = await getSignedUrl(p.thumbnailUrl);
                return { ...p, resolvedThumbnailUrl: url || p.thumbnailUrl };
            }));

            setProducts(resolvedProducts);
        } catch (err) {
            setError(err.response?.data?.message || 'Falha ao carregar produtos.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const handleDelete = async (productId) => {
        if (window.confirm('Tem certeza que deseja excluir este produto?')) {
            try {
                await api.delete(`/products/${productId}`);
                setProducts(products.filter(p => p._id !== productId));
            } catch (err) {
                alert(err.response?.data?.message || 'Falha ao excluir produto.');
            }
        }
    };

    const openModal = (product = null) => {
        setEditingProduct(product);
        setIsModalOpen(true);
    };

    const ProductFormModal = () => {
        const [name, setName] = useState(editingProduct?.name || '');
        const [description, setDescription] = useState(editingProduct?.description || '');
        // Inicializa com a URL resolvida (assinada) para preview
        const [thumbnailUrl, setThumbnailUrl] = useState(editingProduct?.resolvedThumbnailUrl || editingProduct?.thumbnailUrl || '');
        const [fileType, setFileType] = useState(editingProduct?.fileType || 'SVG');
        const [downloadUrl, setDownloadUrl] = useState(editingProduct?.downloadUrl || '');
        const [youtubeUrl, setYoutubeUrl] = useState(editingProduct?.youtubeUrl || '');
        
        const handleSubmit = async (e) => {
            e.preventDefault();
            
            // Lógica de Proteção:
            // Se 'thumbnailUrl' for uma URL assinada (http...), usa o valor original do banco.
            let finalThumbnailUrl = thumbnailUrl;
            if (thumbnailUrl.startsWith('http') && editingProduct) {
                finalThumbnailUrl = editingProduct.thumbnailUrl;
            }

            const productData = { name, description, thumbnailUrl: finalThumbnailUrl, fileType, downloadUrl, youtubeUrl };
            
            try {
                if (editingProduct) {
                    await api.put(`/products/${editingProduct._id}`, productData);
                } else {
                    await api.post('/products', productData);
                }
                fetchProducts(); // Recarrega lista
                setIsModalOpen(false);
            } catch (err) {
                alert(err.response?.data?.message || 'Falha ao salvar produto.');
            }
        };

        return (
             <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setIsModalOpen(false)}>
                <div className="bg-gray-800 rounded-xl p-6 w-full max-w-lg shadow-lg" onClick={(e) => e.stopPropagation()}>
                    <h2 className="text-2xl font-bold text-white mb-4">{editingProduct ? 'Editar Produto' : 'Adicionar Produto'}</h2>
                    <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto pr-2">
                        <Input label="Nome do Produto" id="prod-name" type="text" value={name} onChange={e => setName(e.target.value)} required />
                        
                        <ImageUpload 
                            label="Capa / Miniatura" 
                            value={thumbnailUrl} 
                            onChange={setThumbnailUrl} 
                            folder="products"
                        />

                        <div>
                            <label htmlFor="prod-desc" className="block text-sm font-medium text-gray-300 mb-1">Descrição</label>
                            <textarea id="prod-desc" value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-white" required />
                        </div>
                        <div>
                            <label htmlFor="prod-type" className="block text-sm font-medium text-gray-300 mb-1">Tipo de Arquivo</label>
                            <select id="prod-type" value={fileType} onChange={e => setFileType(e.target.value)} className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-white">
                                <option value="SVG">SVG</option>
                                <option value="PDF">PDF</option>
                                <option value="STUDIO">STUDIO</option>
                            </select>
                        </div>
                        <Input label="URL para Download (Drive/Dropbox)" id="prod-download" type="text" value={downloadUrl} onChange={e => setDownloadUrl(e.target.value)} required />
                        <Input label="URL do Vídeo do YouTube (opcional)" id="prod-youtube" type="text" value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)} />
                        <div className="flex justify-end space-x-2 pt-4">
                            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                            <Button type="submit">{editingProduct ? 'Salvar' : 'Adicionar'}</Button>
                        </div>
                    </form>
                </div>
            </div>
        );
    };

    if (loading) return <div className="p-6 text-center">Carregando produtos...</div>;
    if (error) return <div className="p-6 text-center text-red-400">{error}</div>;

    return (
        <div className="p-4 sm:p-6 space-y-6">
            {isModalOpen && <ProductFormModal />}
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">Gerenciamento de Produtos</h2>
                <Button onClick={() => openModal()} className="flex items-center space-x-2">
                    <BoxIcon className="w-5 h-5" />
                    <span>Adicionar Produto</span>
                </Button>
            </div>
            <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                <ul className="divide-y divide-gray-700">
                    {products.map(product => (
                        <li key={product._id} className="p-4 flex items-center justify-between space-x-4">
                            <div className="flex items-center space-x-4 flex-1 min-w-0">
                                <img src={product.resolvedThumbnailUrl} alt={product.name} className="w-16 h-16 rounded-md object-cover flex-shrink-0 bg-gray-700" />
                                <div className="min-w-0">
                                    <p className="font-semibold text-white truncate">{product.name}</p>
                                    <p className="text-sm text-gray-400 truncate">{product.description}</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2 flex-shrink-0">
                                <button onClick={() => openModal(product)} className="p-2 text-gray-400 hover:text-white" aria-label="Editar produto">
                                    <EditIcon className="w-5 h-5" />
                                </button>
                                <button onClick={() => handleDelete(product._id)} className="p-2 text-gray-400 hover:text-pink-500" aria-label="Excluir produto">
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

export default AdminProductsPage;
