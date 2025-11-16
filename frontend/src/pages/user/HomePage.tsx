import React, { useState, useEffect, FC } from 'react';
import { Product, Banner } from '../../types';
import api from '../../services/api';
import { Button } from '../../components/ui/Button';
import { ChevronLeftIcon, ChevronRightIcon } from '../../components/Icons';

// --- Helper Functions ---
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
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
};

// --- Components ---
const Carousel: FC<{ banners: Banner[] }> = ({ banners }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    // Hardcoded duration for now, can be fetched from settings later
    const duration = 5000;

    useEffect(() => {
        if (banners.length > 1) {
            const timer = setTimeout(() => {
                setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length);
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [currentIndex, banners.length, duration]);

    const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % banners.length);
    const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);

    if (!banners || banners.length === 0) {
        return <div className="aspect-[2/1] sm:aspect-[3/1] bg-brand-surface rounded-lg flex items-center justify-center"><p>Nenhum banner para exibir.</p></div>
    }

    return (
        <div className="relative w-full aspect-[2/1] sm:aspect-[3/1] overflow-hidden rounded-lg shadow-lg group">
            <div className="flex transition-transform duration-700 ease-in-out h-full" style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
                {banners.map((banner) => (
                    <a href={banner.linkUrl || '#'} key={banner.id} target="_blank" rel="noopener noreferrer" className="w-full flex-shrink-0 h-full relative">
                        <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent p-4 sm:p-6 flex flex-col justify-end">
                            <h2 className="text-xl sm:text-3xl font-bold text-white drop-shadow-md">{banner.title}</h2>
                            <p className="text-sm sm:text-lg text-white/90 drop-shadow-md">{banner.subtitle}</p>
                        </div>
                    </a>
                ))}
            </div>
            {banners.length > 1 && (
                <>
                    <button onClick={prevSlide} className="absolute top-1/2 left-2 -translate-y-1/2 bg-black/30 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"><ChevronLeftIcon className="w-6 h-6" /></button>
                    <button onClick={nextSlide} className="absolute top-1/2 right-2 -translate-y-1/2 bg-black/30 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"><ChevronRightIcon className="w-6 h-6" /></button>
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
                        {banners.map((_, index) => (
                            <button key={index} onClick={() => setCurrentIndex(index)} className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-colors ${currentIndex === index ? 'bg-white' : 'bg-white/50'}`} />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

const ProductDetailPage: FC<{ product: Product; onClose: () => void }> = ({ product, onClose }) => {
    const embedUrl = product.youtubeUrl ? getYoutubeEmbedUrl(product.youtubeUrl) : null;
    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-brand-surface rounded-xl p-6 sm:p-8 w-full max-w-3xl shadow-lg relative transform transition-all overflow-y-auto max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-3 right-3 text-brand-text-light hover:text-white z-10" aria-label="Fechar">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                <div className="flex flex-col gap-8">
                    <div className="grid sm:grid-cols-2 gap-6">
                        <img src={product.thumbnailUrl} alt={product.name} className="w-full h-auto object-cover rounded-lg aspect-square" />
                        <div className="flex flex-col">
                            <h2 className="text-2xl sm:text-3xl font-bold text-brand-primary mb-2">{product.name}</h2>
                            <span className={`text-sm font-bold py-1 px-3 rounded-full self-start mb-4 inline-block ${product.fileType === 'SVG' ? 'bg-green-500/20 text-green-300' : product.fileType === 'PDF' ? 'bg-red-500/20 text-red-300' : 'bg-blue-500/20 text-blue-300'}`}>{product.fileType}</span>
                            <p className="text-brand-text-light mb-6 flex-grow">{product.description}</p>
                            <Button onClick={() => window.open(product.downloadUrl, '_blank')} className="w-full !py-3 mt-auto">Baixar Arquivo</Button>
                        </div>
                    </div>
                    {embedUrl && (
                         <div className="border-t border-brand-secondary pt-6">
                            <h3 className="text-xl sm:text-2xl font-bold text-white mb-4">Vídeo Tutorial</h3>
                            <div className="aspect-video w-full">
                                <iframe className="w-full h-full rounded-lg" src={embedUrl} title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen></iframe>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const HomePage: FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [banners, setBanners] = useState<Banner[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [productsRes, bannersRes] = await Promise.all([
                    api.get('/products'),
                    api.get('/banners'),
                ]);
                setProducts(productsRes.data.map((p: any) => ({ ...p, id: p._id })));
                setBanners(bannersRes.data.map((b: any) => ({ ...b, id: b._id })));
            } catch (error) {
                console.error("Failed to fetch home page data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return <div className="p-6 text-center">Carregando conteúdo...</div>;
    }

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <Carousel banners={banners} />
            <div>
                <h2 className="text-2xl font-bold text-white mb-4">Produtos em Destaque</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {products.map(product => (
                        <div key={product.id} className="bg-brand-surface rounded-xl shadow-lg overflow-hidden flex flex-col">
                            <img src={product.thumbnailUrl} alt={product.name} className="w-full h-48 object-cover" />
                            <div className="p-4 flex flex-col flex-grow">
                                <span className={`text-xs font-bold py-1 px-2 rounded-full self-start mb-2 ${product.fileType === 'SVG' ? 'bg-green-500/20 text-green-300' : product.fileType === 'PDF' ? 'bg-red-500/20 text-red-300' : 'bg-blue-500/20 text-blue-300'}`}>{product.fileType}</span>
                                <h3 className="text-lg font-bold text-white flex-grow">{product.name}</h3>
                                <p className="text-sm text-brand-text-light mt-1 mb-4">{product.description}</p>
                                <Button onClick={() => setSelectedProduct(product)} className="mt-auto w-full">
                                    Ver Detalhes
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            {selectedProduct && <ProductDetailPage product={selectedProduct} onClose={() => setSelectedProduct(null)} />}
        </div>
    );
};

export default HomePage;