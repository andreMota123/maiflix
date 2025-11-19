
import React, { useState, FC, useRef, useEffect } from 'react';
import { Page, User, Post, Product, Class, AdminPost, Comment, Notification, Banner } from './types';
import { HomeIcon, UsersIcon, InfoIcon, FileIcon, UserCircleIcon, HeartIcon, CommentIcon, TrashIcon, BellIcon, WhatsappIcon, PhotoIcon, VideoIcon, LogoutIcon, EditIcon, UserPlusIcon, LockClosedIcon, LockOpenIcon, UserGroupIcon, BoxIcon, ChevronLeftIcon, ChevronRightIcon, Cog6ToothIcon, BookmarkIcon, EyeIcon, EyeSlashIcon } from './components/Icons';
import { GoogleGenAI, Type } from "@google/genai";


// --- ERROR BOUNDARY (para produção) ---

interface ErrorBoundaryProps {
  children?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { hasError: false };

  constructor(props: ErrorBoundaryProps) {
    super(props);
  }

  static getDerivedStateFromError(_error: Error): ErrorBoundaryState {
    // Atualiza o estado para que a próxima renderização mostre a UI de fallback.
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Você pode logar o erro em um serviço de relatórios de erro
    console.error("Erro não capturado:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // UI de fallback personalizada
      return (
        <div className="p-6 text-center text-brand-text-light flex flex-col items-center justify-center h-full">
          <h2 className="text-2xl font-bold text-brand-primary mb-4">Oops! Algo deu errado.</h2>
          <p className="mb-6 max-w-md">Um erro inesperado ocorreu. Nossa equipe foi notificada. Por favor, tente recarregar a página.</p>
          <Button onClick={() => window.location.reload()}>
            Recarregar Página
          </Button>
        </div>
      );
    }

    return (this as any).props.children;
  }
}


// --- MOCK DATA ---
const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Ana Silva', email: 'levitamota@gmail.com', avatarUrl: 'https://picsum.photos/seed/u1/100/100', role: 'user', status: 'active' } as any,
  { id: 'u2', name: 'Beatriz Costa', email: 'bia.costa@example.com', avatarUrl: 'https://picsum.photos/seed/u2/100/100', role: 'user', status: 'active' } as any,
];

const MOCK_ADMIN: User = { id: 'admin1', name: 'Admin', email: 'levitamota@gmail.com', avatarUrl: 'https://picsum.photos/seed/admin1/100/100', role: 'admin', status: 'active' } as any;

const MOCK_POSTS: Post[] = [
  {
    id: 'p1',
    author: MOCK_USERS[1],
    imageUrl: 'https://picsum.photos/seed/p1/600/400',
    text: 'Amei o novo kit de arquivos de corte! Olhem o que eu fiz com ele. ❤️',
    likes: ['u1'],
    comments: [
      { id: 'c1', author: MOCK_USERS[0], text: 'Ficou incrível! Parabéns!', createdAt: '2 horas atrás' } as any
    ],
    createdAt: '1 dia atrás',
  } as any,
  {
    id: 'p2',
    author: MOCK_USERS[0],
    text: 'Adorei essa paisagem!',
    imageUrl: 'https://picsum.photos/seed/p2-new/600/400',
    likes: ['u2'],
    comments: [],
    createdAt: '2 dias atrás',
  } as any,
  {
    id: 'p3',
    author: MOCK_USERS[1],
    text: 'Um videozinho rápido mostrando o resultado da live de ontem! ✨',
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    likes: [],
    comments: [],
    createdAt: '3 dias atrás',
  } as any
];

const MOCK_ADMIN_POSTS: AdminPost[] = [
    { id: 'a1', title: '🎉 Novos Arquivos Disponíveis!', content: 'Olá pessoal! Já estão disponíveis os novos arquivos de corte do mês. Corram para baixar e comecem a criar!', imageUrl: 'https://picsum.photos/seed/a1-img/600/300', createdAt: '2 dias atrás' },
    { id: 'a2', title: 'Manutenção Agendada', content: 'Informamos que o app passará por uma breve manutenção na madrugada de sábado para melhorias de performance.', createdAt: '5 dias atrás' }
];

const MOCK_PRODUCTS: Product[] = [
    { id: 'prod1', name: 'Kit Floral', description: 'Um kit completo com elementos florais para caixas e topos de bolo.', thumbnailUrl: 'https://picsum.photos/seed/prod1/300/300', fileType: 'SVG', downloadUrl: '#', youtubeUrl: 'https://www.youtube.com/watch?v=LXb3EKWsInQ' },
    { id: 'prod2', name: 'Caixa Coração', description: 'Molde de caixa em formato de coração, perfeito para presentes.', thumbnailUrl: 'https://picsum.photos/seed/prod2/300/300', fileType: 'PDF', downloadUrl: '#' },
    { id: 'prod3', name: 'Topo Sereia', description: 'Lindo topo de bolo no tema Sereia para festas infantis.', thumbnailUrl: 'https://picsum.photos/seed/prod3/300/300', fileType: 'STUDIO', downloadUrl: '#' },
    { id: 'prod4', name: 'Kit Páscoa', description: 'Arquivos temáticos para a Páscoa.', thumbnailUrl: 'https://picsum.photos/seed/prod4/300/300', fileType: 'SVG', downloadUrl: '#' },
];

const MOCK_CLASSES: Class[] = [
    { id: 'class1', title: 'Montagem de Camadas em SVG', description: 'Aprenda a montar arquivos de corte com múltiplas camadas de forma perfeita.', thumbnailUrl: 'https://picsum.photos/seed/class1/400/225', videoUrl: '#' },
    { id: 'class2', title: 'Personalizando Arquivos no Studio', description: 'Dicas e truques para editar e personalizar seus arquivos no Silhouette Studio.', thumbnailUrl: 'https://picsum.photos/seed/class2/400/225', videoUrl: '#' },
];

const MOCK_BANNERS: Banner[] = [
  { id: 'b1', imageUrl: 'https://picsum.photos/seed/banner1/800/400', title: 'Novidades de Verão', subtitle: 'Confira os novos kits de corte!', linkUrl: '#' },
  { id: 'b2', imageUrl: 'https://picsum.photos/seed/banner2/800/400', title: 'Aulas Ao Vivo', subtitle: 'Toda terça-feira às 20h.', linkUrl: '#' },
  { id: 'b3', imageUrl: 'https://picsum.photos/seed/banner3/800/400', title: 'Promoção Imperdível', subtitle: 'Descontos de até 30%.', linkUrl: '#' },
];


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

    if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
    }
    return null;
};

const isValidYoutubeUrl = (url: string): boolean => {
    if (!url) return true; // Optional field is valid if empty
    // Regex to match standard YouTube watch URLs and short youtu.be URLs
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

const COLOR_LABELS: Record<string, string> = {
  'brand-bg': 'Fundo Principal',
  'brand-surface': 'Superfície (Cards)',
  'brand-primary': 'Cor Primária (Destaques)',
  'brand-secondary': 'Cor Secundária (Controles)',
  'brand-text': 'Texto Principal',
  'brand-text-light': 'Texto Secundário',
};


// --- REUSABLE UI COMPONENTS ---

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
}

const Button: FC<ButtonProps> = ({ children, className, variant = 'primary', ...props }) => {
  const baseClasses = 'px-4 py-2 rounded-lg font-semibold transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-surface disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100';
  const variantClasses = {
    primary: 'bg-brand-primary text-white hover:bg-red-500',
    secondary: 'bg-brand-secondary text-white hover:bg-blue-800',
    ghost: 'bg-transparent text-brand-text-light hover:bg-brand-surface hover:text-white',
  };
  return (
    <button className={`${baseClasses} ${variantClasses[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

const Input: FC<InputProps> = ({ label, id, type, ...props }) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';

    return (
        <div className="w-full">
            <label htmlFor={id} className="block text-sm font-medium text-brand-text-light mb-1">{label}</label>
            <div className="relative">
                <input
                    id={id}
                    type={isPassword ? (showPassword ? 'text' : 'password') : type}
                    className="w-full pl-3 pr-10 py-2 bg-brand-bg border border-brand-secondary rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    {...props}
                />
                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-brand-text-light hover:text-white focus:outline-none"
                        aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    >
                        {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                    </button>
                )}
            </div>
        </div>
    );
};

// --- PAGE & LAYOUT COMPONENTS ---

const LoginPage: FC<{ onLogin: (user: User) => void }> = ({ onLogin }) => {
    const [mode, setMode] = useState<'user' | 'admin'>('user');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (mode === 'user') {
            onLogin(MOCK_USERS[0]);
        } else {
            onLogin(MOCK_ADMIN);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-brand-bg p-4">
            <div className="w-full max-w-md bg-brand-surface p-8 rounded-2xl shadow-lg">
                <h1 className="text-4xl font-bold text-center text-brand-primary mb-2">Maiflix</h1>
                <p className="text-center text-brand-text-light mb-8">
                    {mode === 'user' ? 'Login do Assinante' : 'Acesso Administrativo'}
                </p>

                <form onSubmit={handleLogin} className="space-y-6">
                    <Input label="Email" id="email" type="email" defaultValue={'levitamota@gmail.com'} key={mode} required />
                    <Input label="Senha" id="password" type="password" defaultValue="Andre9157$" required />
                    <Button type="submit" className="w-full !py-3 !text-lg">Entrar</Button>
                </form>
                
                <div className="text-center mt-6">
                    <button
                        onClick={() => setMode(prevMode => prevMode === 'user' ? 'admin' : 'user')}
                        className="bg-transparent border-none text-sm text-brand-text-light hover:text-brand-primary transition-colors cursor-pointer"
                    >
                        {mode === 'user' ? 'Acessar como Administrador' : 'Acessar como Assinante'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const Carousel: FC<{ banners: Banner[]; duration: number }> = ({ banners, duration }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const timerRef = useRef<number | null>(null);

    const resetTimer = () => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }
    };

    useEffect(() => {
        resetTimer();
        timerRef.current = window.setTimeout(() => {
            nextSlide();
        }, duration);

        return () => resetTimer();
    }, [currentIndex, banners.length, duration]);

    const nextSlide = () => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length);
    };

    const prevSlide = () => {
        setCurrentIndex((prevIndex) => (prevIndex - 1 + banners.length) % banners.length);
    };
    
    const CarouselSlide: FC<{ banner: Banner }> = ({ banner }) => {
        const slideInnerContent = (
            <>
                <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent p-4 sm:p-6 flex flex-col justify-end">
                    <h2 className="text-xl sm:text-3xl font-bold text-white drop-shadow-md">{banner.title}</h2>
                    <p className="text-sm sm:text-lg text-white/90 drop-shadow-md">{banner.subtitle}</p>
                </div>
            </>
        );
    
        const commonClasses = "w-full flex-shrink-0 h-full relative";
    
        if (banner.linkUrl) {
            return (
                <a href={banner.linkUrl} target="_blank" rel="noopener noreferrer" className={commonClasses}>
                    {slideInnerContent}
                </a>
            );
        }
    
        return (
            <div className={commonClasses}>
                {slideInnerContent}
            </div>
        );
    };


    if (!banners || banners.length === 0) {
        return <div className="aspect-[2/1] sm:aspect-[3/1] bg-brand-surface rounded-lg flex items-center justify-center"><p>Nenhum banner para exibir.</p></div>
    }

    return (
        <div className="relative w-full aspect-[2/1] sm:aspect-[3/1] overflow-hidden rounded-lg shadow-lg group">
            <div
                className="flex transition-transform duration-700 ease-in-out h-full"
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
                {banners.map((banner) => (
                    <CarouselSlide key={banner.id} banner={banner} />
                ))}
            </div>

            <button
                onClick={prevSlide}
                className="absolute top-1/2 left-2 -translate-y-1/2 bg-black/30 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 focus:outline-none z-10"
                aria-label="Slide anterior"
            >
                <ChevronLeftIcon className="w-6 h-6" />
            </button>
            <button
                onClick={nextSlide}
                className="absolute top-1/2 right-2 -translate-y-1/2 bg-black/30 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 focus:outline-none z-10"
                aria-label="Próximo slide"
            >
                <ChevronRightIcon className="w-6 h-6" />
            </button>

            <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
                {banners.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrentIndex(index)}
                        className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-colors ${
                            currentIndex === index ? 'bg-white' : 'bg-white/50'
                        }`}
                        aria-label={`Ir para o slide ${index + 1}`}
                    />
                ))}
            </div>
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
                            <span className={`text-sm font-bold py-1 px-3 rounded-full self-start mb-4 inline-block ${
                                product.fileType === 'SVG' ? 'bg-green-500/20 text-green-300' :
                                product.fileType === 'PDF' ? 'bg-red-500/20 text-red-300' :
                                'bg-blue-500/20 text-blue-300'
                            }`}>{product.fileType}</span>
                            <p className="text-brand-text-light mb-6 flex-grow">{product.description}</p>
                            <Button onClick={() => window.location.href = product.downloadUrl} className="w-full !py-3 mt-auto">Baixar Arquivo</Button>
                        </div>
                    </div>
                    {embedUrl && (
                         <div className="border-t border-brand-secondary pt-6">
                            <h3 className="text-xl sm:text-2xl font-bold text-white mb-4">Vídeo Tutorial</h3>
                            <div className="aspect-video w-full">
                                <iframe
                                    className="w-full h-full rounded-lg"
                                    src={embedUrl}
                                    title="YouTube video player"
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                    allowFullScreen>
                                </iframe>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const HomePage: FC<{ 
    products: Product[]; 
    onProductClick: (product: Product) => void;
    banners: Banner[];
    carouselDuration: number;
}> = ({ products, onProductClick, banners, carouselDuration }) => (
    <div className="p-4 sm:p-6 space-y-6">
        <Carousel banners={banners} duration={carouselDuration} />
        <div>
            <h2 className="text-2xl font-bold text-white mb-4">Produtos em Destaque</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map(product => (
                    <div key={product.id} className="bg-brand-surface rounded-xl shadow-lg overflow-hidden flex flex-col">
                        <img src={product.thumbnailUrl} alt={product.name} className="w-full h-48 object-cover" />
                        <div className="p-4 flex flex-col flex-grow">
                            <span className={`text-xs font-bold py-1 px-2 rounded-full self-start mb-2 ${
                                product.fileType === 'SVG' ? 'bg-green-500/20 text-green-300' :
                                product.fileType === 'PDF' ? 'bg-red-500/20 text-red-300' :
                                'bg-blue-500/20 text-blue-300'
                            }`}>{product.fileType}</span>
                            <h3 className="text-lg font-bold text-white flex-grow">{product.name}</h3>
                            <p className="text-sm text-brand-text-light mt-1 mb-4">{product.description}</p>
                            <Button onClick={() => onProductClick(product)} className="mt-auto w-full">
                                Ver Detalhes
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
);


const CommunityPage: FC<{ currentUser: User; onAddNotification: (message: string) => void; }> = ({ currentUser, onAddNotification }) => {
    const [posts, setPosts] = useState<Post[]>(MOCK_POSTS);
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

    useEffect(() => {
        if (justLikedPostId) {
            const timer = setTimeout(() => {
                setJustLikedPostId(null);
            }, 300); // Must match animation duration
            return () => clearTimeout(timer);
        }
    }, [justLikedPostId]);

    const handleLike = (postId: string) => {
        const post = posts.find(p => p.id === postId);
        if (!post) return;

        const isCurrentlyLiked = post.likes.includes(currentUser.id);

        if (!isCurrentlyLiked) {
            setJustLikedPostId(postId);
        }

        setPosts(posts.map(p => {
            if (p.id === postId) {
                const newLikes = isCurrentlyLiked
                    ? p.likes.filter(id => id !== currentUser.id)
                    : [...p.likes, currentUser.id];
                return { ...p, likes: newLikes };
            }
            return p;
        }));
    };
    
    const handleDeletePost = (postId: string) => {
      setPosts(posts.filter(p => p.id !== postId));
    }
    
    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
        const file = event.target.files?.[0];
        if (file) {
            if (type === 'image' && file.size > MAX_IMAGE_SIZE_BYTES) {
                alert(`O arquivo de imagem excede o limite de ${MAX_IMAGE_SIZE_MB}MB.`);
                event.target.value = ''; // Clear the input
                return;
            }
            if (type === 'video' && file.size > MAX_VIDEO_SIZE_BYTES) {
                alert(`O arquivo de vídeo excede o limite de ${MAX_VIDEO_SIZE_MB}MB.`);
                event.target.value = ''; // Clear the input
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

    const handleAddPost = () => {
        if (!newPostText.trim() && !newPostMedia.url) return;
        const newPost: Post = {
            id: `p${Date.now()}`,
            author: currentUser,
            text: newPostText,
            imageUrl: newPostMedia.type === 'image' ? newPostMedia.url! : undefined,
            videoUrl: newPostMedia.type === 'video' ? newPostMedia.url! : undefined,
            likes: [],
            comments: [],
            createdAt: 'Agora mesmo',
        };
        setPosts([newPost, ...posts]);
        onAddNotification(`${currentUser.name} criou um novo post.`);
        setNewPostText('');
        cancelMedia();
    };

    const handleAddComment = (postId: string) => {
        const commentText = commentInputs[postId];
        if (!commentText || !commentText.trim()) return;

        const newComment: Comment = {
            id: `c${Date.now()}`,
            author: currentUser,
            text: commentText,
            createdAt: 'Agora mesmo',
        };

        const postAuthor = posts.find(p => p.id === postId)?.author;

        setPosts(posts.map(p => 
            p.id === postId 
            ? { ...p, comments: [...p.comments, newComment] }
            : p
        ));
        
        if(postAuthor && postAuthor.id !== currentUser.id) {
            onAddNotification(`${currentUser.name} comentou no post de ${postAuthor.name}.`);
        }

        setCommentInputs(prev => ({...prev, [postId]: ''}));
    };

    const handleCommentInputChange = (postId: string, value: string) => {
        setCommentInputs(prev => ({ ...prev, [postId]: value }));
    };

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
                                    <p className="text-xs text-brand-text-light">{post.createdAt}</p>
                                </div>
                            </div>
                            {(post.author.id === currentUser.id || currentUser.role === 'admin') && (
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
                                    filled={post.likes.includes(currentUser.id)}
                                    className={`w-5 h-5 transition-all duration-200 ease-in-out ${post.likes.includes(currentUser.id) ? 'text-brand-primary scale-110' : 'text-brand-text-light'} ${justLikedPostId === post.id ? 'animate-like-pop' : ''}`}
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
                                    key={comment.id}
                                    className={`flex items-start space-x-3 ${
                                        index === post.comments.length - 1 && comment.createdAt === 'Agora mesmo'
                                        ? 'animate-comment-fade-in'
                                        : ''
                                    }`}
                                >
                                    <img src={comment.author.avatarUrl} alt={comment.author.name} className="w-8 h-8 rounded-full" />
                                    <div className="bg-brand-bg/50 px-3 py-2 rounded-lg flex-1">
                                        <div className="flex items-baseline justify-between">
                                          <p className="font-semibold text-sm text-brand-text">{comment.author.name}</p>
                                          <p className="text-xs text-brand-text-light">{comment.createdAt}</p>
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
                                    onChange={(e) => handleCommentInputChange(post.id, e.target.value)}
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

const AdminFeedPageReadOnly: FC<{ posts: AdminPost[] }> = ({ posts }) => (
    <div className="p-4 sm:p-6 space-y-6">
        {posts.map(post => (
            <div key={post.id} className="bg-brand-surface rounded-xl p-5 shadow-lg">
                <h3 className="text-xl font-bold text-brand-primary">{post.title}</h3>
                <p className="text-xs text-brand-text-light mb-3">{post.createdAt}</p>
                {post.imageUrl && <img src={post.imageUrl} alt={post.title} className="rounded-lg w-full max-h-[400px] object-cover my-4" />}
                {post.videoUrl && <video controls src={post.videoUrl} className="rounded-lg w-full max-h-[400px] bg-black my-4" />}
                <p className="text-brand-text whitespace-pre-wrap">{post.content}</p>
            </div>
        ))}
    </div>
);

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

    const imageInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);

    const resetForm = () => {
        setTitle('');
        setContent('');
        setMedia({ type: null, url: null });
        setEditingPost(null);
        if (imageInputRef.current) imageInputRef.current.value = '';
        if (videoInputRef.current) videoInputRef.current.value = '';
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
        const file = event.target.files?.[0];
        if (file) {
            const localUrl = URL.createObjectURL(file);
            setMedia({ type, url: localUrl });
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !content.trim()) {
            alert('Título e conteúdo são obrigatórios.');
            return;
        }

        if (editingPost) {
            onUpdatePost({
                ...editingPost,
                title,
                content,
                imageUrl: media.type === 'image' ? media.url! : editingPost.imageUrl,
                videoUrl: media.type === 'video' ? media.url! : editingPost.videoUrl,
            });
        } else {
            onAddPost({
                title,
                content,
                imageUrl: media.type === 'image' ? media.url! : undefined,
                videoUrl: media.type === 'video' ? media.url! : undefined,
            });
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
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = (postId: string) => {
        if (window.confirm('Tem certeza que deseja excluir este aviso?')) {
            onDeletePost(postId);
        }
    };

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <form onSubmit={handleSubmit} className="bg-brand-surface rounded-xl p-4 space-y-4">
                <h2 className="text-2xl font-bold text-white">{editingPost ? 'Editar Aviso' : 'Criar Novo Aviso'}</h2>
                <Input label="Título" id="admin-post-title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Escreva o conteúdo do aviso aqui..."
                    className="w-full bg-brand-bg border border-brand-secondary rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-brand-primary resize-none"
                    rows={5}
                    required
                />

                {media.url && (
                    <div className="mt-4 relative group">
                        {media.type === 'image' && <img src={media.url} alt="Pré-visualização" className="rounded-lg w-full max-h-60 object-contain" />}
                        {media.type === 'video' && <video controls src={media.url} className="rounded-lg w-full max-h-60 bg-black" />}
                        <button type="button" onClick={() => setMedia({type: null, url: null})} className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1.5 hover:bg-black/70 opacity-50 group-hover:opacity-100 transition-opacity">
                             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                )}
                
                <div className="flex justify-between items-center mt-3">
                    <div className="flex items-center space-x-1 text-brand-text-light">
                        <input type="file" accept="image/*" ref={imageInputRef} onChange={(e) => handleFileSelect(e, 'image')} className="hidden" />
                        <input type="file" accept="video/*" ref={videoInputRef} onChange={(e) => handleFileSelect(e, 'video')} className="hidden" />

                        <button type="button" onClick={() => imageInputRef.current?.click()} aria-label="Adicionar foto" className="p-2 hover:bg-brand-secondary/30 rounded-full"><PhotoIcon className="w-6 h-6" /></button>
                        <button type="button" onClick={() => videoInputRef.current?.click()} aria-label="Adicionar vídeo" className="p-2 hover:bg-brand-secondary/30 rounded-full"><VideoIcon className="w-6 h-6" /></button>
                    </div>
                    <div className="flex items-center space-x-2">
                        {editingPost && (
                            <Button type="button" variant="ghost" onClick={resetForm}>Cancelar</Button>
                        )}
                        <Button type="submit">{editingPost ? 'Salvar Alterações' : 'Publicar'}</Button>
                    </div>
                </div>
            </form>
            
            <div className="space-y-6">
                <h3 className="text-xl font-bold text-white border-t border-brand-secondary pt-6">Avisos Publicados</h3>
                {posts.map(post => (
                    <div key={post.id} className="bg-brand-surface rounded-xl p-5 shadow-lg">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-xl font-bold text-brand-primary">{post.title}</h3>
                                <p className="text-xs text-brand-text-light mb-3">{post.createdAt}</p>
                            </div>
                            <div className="flex items-center space-x-2">
                                <button onClick={() => handleEdit(post)} className="p-2 text-brand-text-light hover:text-white" aria-label="Editar post">
                                    <EditIcon className="w-5 h-5" />
                                </button>
                                <button onClick={() => handleDelete(post.id)} className="p-2 text-brand-text-light hover:text-brand-primary" aria-label="Excluir post">
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        {post.imageUrl && <img src={post.imageUrl} alt={post.title} className="rounded-lg w-full max-h-[400px] object-cover my-4" />}
                        {post.videoUrl && <video controls src={post.videoUrl} className="rounded-lg w-full max-h-[400px] bg-black my-4" />}
                        <p className="text-brand-text whitespace-pre-wrap">{post.content}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

const AdminUsersPage: FC<{
    users: User[];
    onAddUser: (user: Omit<User, 'id' | 'avatarUrl' | 'role' | 'status'>) => Promise<void>;
    onUpdateUser: (userId: string, updates: { name: string }) => Promise<void>;
    onUpdateUserStatus: (userId: string, status: 'active' | 'blocked') => Promise<void>;
    onDeleteUser: (userId: string) => Promise<void>;
}> = ({ users, onAddUser, onUpdateUser, onUpdateUserStatus, onDeleteUser }) => {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    
    const handleDelete = async (userId: string) => {
        if (window.confirm('Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.')) {
            await onDeleteUser(userId);
        }
    }

    const openEditModal = (user: User) => {
        setEditingUser(user);
        setIsEditModalOpen(true);
    };

    const AddUserModal = () => {
        const [name, setName] = useState('');
        const [email, setEmail] = useState('');
        const [submitting, setSubmitting] = useState(false);

        const handleAddUserSubmit = async (e: React.FormEvent) => {
            e.preventDefault();
            if (name.trim() && email.trim()) {
                setSubmitting(true);
                try {
                    await onAddUser({ name, email });
                    setIsAddModalOpen(false);
                    setName('');
                    setEmail('');
                } finally {
                    setSubmitting(false);
                }
            }
        };

        return (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setIsAddModalOpen(false)}>
                <div className="bg-brand-surface rounded-xl p-6 w-full max-w-md shadow-lg" onClick={(e) => e.stopPropagation()}>
                    <h2 className="text-2xl font-bold text-white mb-4">Adicionar Novo Usuário</h2>
                    <form onSubmit={handleAddUserSubmit} className="space-y-4">
                        <Input label="Nome Completo" id="new-user-name" type="text" value={name} onChange={e => setName(e.target.value)} required />
                        <Input label="Email" id="new-user-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                        <div className="flex justify-end space-x-2 pt-4">
                            <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)} disabled={submitting}>Cancelar</Button>
                            <Button type="submit" disabled={submitting}>{submitting ? 'Adicionando...' : 'Adicionar'}</Button>
                        </div>
                    </form>
                </div>
            </div>
        );
    };

    const EditUserModal = () => {
        if (!editingUser) return null;
        const [editName, setEditName] = useState(editingUser.name);
        const [submitting, setSubmitting] = useState(false);

        const handleUpdateUserSubmit = async (e: React.FormEvent) => {
            e.preventDefault();
            if (editingUser && editName.trim()) {
                setSubmitting(true);
                try {
                    await onUpdateUser(editingUser.id, { name: editName });
                    setIsEditModalOpen(false);
                    setEditingUser(null);
                } finally {
                    setSubmitting(false);
                }
            }
        };

        return (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setIsEditModalOpen(false)}>
                <div className="bg-brand-surface rounded-xl p-6 w-full max-w-md shadow-lg" onClick={(e) => e.stopPropagation()}>
                    <h2 className="text-2xl font-bold text-white mb-4">Editar Usuário</h2>
                    <form onSubmit={handleUpdateUserSubmit} className="space-y-4">
                        <Input label="Nome Completo" id="edit-user-name" type="text" value={editName} onChange={e => setEditName(e.target.value)} required />
                        <div>
                            <label className="block text-sm font-medium text-brand-text-light mb-1">Email</label>
                            <input value={editingUser.email} disabled className="w-full px-3 py-2 bg-brand-bg/50 border border-brand-secondary rounded-lg cursor-not-allowed"/>
                        </div>
                        <Input 
                            label="Nova Senha (opcional)" 
                            id="edit-user-password" 
                            type="password" 
                            placeholder="Deixe em branco para não alterar" 
                        />
                        <div className="flex justify-end space-x-2 pt-4">
                            <Button type="button" variant="ghost" onClick={() => setIsEditModalOpen(false)} disabled={submitting}>Cancelar</Button>
                            <Button type="submit" disabled={submitting}>{submitting ? 'Salvando...' : 'Salvar Alterações'}</Button>
                        </div>
                    </form>
                </div>
            </div>
        );
    };

    return (
        <div className="p-4 sm:p-6 space-y-6">
            {isAddModalOpen && <AddUserModal />}
            {isEditModalOpen && <EditUserModal />}
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">Gerenciamento de Usuários</h2>
                <Button onClick={() => setIsAddModalOpen(true)} className="flex items-center space-x-2">
                    <UserPlusIcon className="w-5 h-5" />
                    <span>Adicionar Usuário</span>
                </Button>
            </div>
            <div className="bg-brand-surface rounded-xl shadow-lg overflow-hidden">
                <ul className="divide-y divide-brand-secondary">
                    {users.map(user => (
                        <li key={user.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0 sm:space-x-4">
                            <div className="flex items-center space-x-4">
                                <img src={user.avatarUrl} alt={user.name} className="w-12 h-12 rounded-full" />
                                <div>
                                    <p className="font-semibold text-brand-text">{user.name}</p>
                                    <p className="text-sm text-brand-text-light">{user.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2 self-end sm:self-center">
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${user.status === 'active' ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'}`}>
                                    {user.status === 'active' ? 'Ativo' : 'Bloqueado'}
                                </span>
                                {user.status === 'active' ? (
                                    <button onClick={() => onUpdateUserStatus(user.id, 'blocked')} className="p-2 text-brand-text-light hover:text-yellow-400" aria-label="Bloquear usuário">
                                        <LockClosedIcon className="w-5 h-5" />
                                    </button>
                                ) : (
                                    <button onClick={() => onUpdateUserStatus(user.id, 'active')} className="p-2 text-brand-text-light hover:text-green-400" aria-label="Desbloquear usuário">
                                        <LockOpenIcon className="w-5 h-5" />
                                    </button>
                                )}
                                <button onClick={() => openEditModal(user)} className="p-2 text-brand-text-light hover:text-white" aria-label="Editar usuário">
                                    <EditIcon className="w-5 h-5" />
                                </button>
                                <button onClick={() => handleDelete(user.id)} className="p-2 text-brand-text-light hover:text-brand-primary" aria-label="Excluir usuário">
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

const AdminProductsPage: FC<{
    products: Product[];
    onAddProduct: (productData: Omit<Product, 'id'>) => void;
    onUpdateProduct: (product: Product) => void;
    onDeleteProduct: (productId: string) => void;
}> = ({ products, onAddProduct, onUpdateProduct, onDeleteProduct }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    const openAddModal = () => {
        setEditingProduct(null);
        setIsModalOpen(true);
    };

    const openEditModal = (product: Product) => {
        setEditingProduct(product);
        setIsModalOpen(true);
    };
    
    const handleDelete = (productId: string) => {
        if (window.confirm('Tem certeza que deseja excluir este produto?')) {
            onDeleteProduct(productId);
        }
    };
    
    const ProductFormModal: FC<{
        isOpen: boolean;
        onClose: () => void;
        product: Product | null;
    }> = ({ isOpen, onClose, product }) => {
        const [name, setName] = useState('');
        const [description, setDescription] = useState('');
        const [thumbnailUrl, setThumbnailUrl] = useState('');
        const [fileType, setFileType] = useState<'SVG' | 'PDF' | 'STUDIO'>('SVG');
        const [downloadUrl, setDownloadUrl] = useState('');
        const [youtubeUrl, setYoutubeUrl] = useState('');
        const [youtubeError, setYoutubeError] = useState('');

        useEffect(() => {
            if (product) {
                setName(product.name);
                setDescription(product.description);
                setThumbnailUrl(product.thumbnailUrl);
                setFileType(product.fileType);
                setDownloadUrl(product.downloadUrl);
                setYoutubeUrl(product.youtubeUrl || '');
            } else {
                setName('');
                setDescription('');
                setThumbnailUrl('');
                setFileType('SVG');
                setDownloadUrl('');
                setYoutubeUrl('');
            }
            setYoutubeError('');
        }, [product, isOpen]);

        const handleSubmit = (e: React.FormEvent) => {
            e.preventDefault();

            if (youtubeUrl.trim() && !isValidYoutubeUrl(youtubeUrl)) {
                setYoutubeError('Por favor, insira uma URL do YouTube válida.');
                return;
            }

            const productData = { name, description, thumbnailUrl, fileType, downloadUrl, youtubeUrl: youtubeUrl || undefined };
            if (product) {
                onUpdateProduct({ ...product, ...productData });
            } else {
                onAddProduct(productData);
            }
            onClose();
        };

        if (!isOpen) return null;

        return (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
                <div className="bg-brand-surface rounded-xl p-6 w-full max-w-lg shadow-lg" onClick={(e) => e.stopPropagation()}>
                    <h2 className="text-2xl font-bold text-white mb-4">{product ? 'Editar Produto' : 'Adicionar Novo Produto'}</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input label="Nome do Produto" id="prod-name" type="text" value={name} onChange={e => setName(e.target.value)} required />
                        <Input label="URL da Miniatura" id="prod-thumb" type="text" value={thumbnailUrl} onChange={e => setThumbnailUrl(e.target.value)} placeholder="https://exemplo.com/imagem.jpg" required />
                        <div>
                            <label htmlFor="prod-desc" className="block text-sm font-medium text-brand-text-light mb-1">Descrição</label>
                            <textarea id="prod-desc" value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full px-3 py-2 bg-brand-bg border border-brand-secondary rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary" required />
                        </div>
                        <div>
                            <label htmlFor="prod-type" className="block text-sm font-medium text-brand-text-light mb-1">Tipo de Arquivo</label>
                            <select id="prod-type" value={fileType} onChange={e => setFileType(e.target.value as 'SVG' | 'PDF' | 'STUDIO')} className="w-full px-3 py-2 bg-brand-bg border border-brand-secondary rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary">
                                <option value="SVG">SVG</option>
                                <option value="PDF">PDF</option>
                                <option value="STUDIO">STUDIO</option>
                            </select>
                        </div>
                        <Input label="URL para Download" id="prod-download" type="text" value={downloadUrl} onChange={e => setDownloadUrl(e.target.value)} required />
                        <div>
                            <Input 
                                label="URL do Vídeo do YouTube (opcional)" 
                                id="prod-youtube" 
                                type="text"
                                value={youtubeUrl} 
                                onChange={(e) => {
                                    setYoutubeUrl(e.target.value);
                                    if (youtubeError) setYoutubeError('');
                                }} 
                                placeholder="https://www.youtube.com/watch?v=..."
                            />
                            {youtubeError && <p className="text-sm text-red-400 mt-1">{youtubeError}</p>}
                        </div>
                        <div className="flex justify-end space-x-2 pt-4">
                            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
                            <Button type="submit">{product ? 'Salvar Alterações' : 'Adicionar'}</Button>
                        </div>
                    </form>
                </div>
            </div>
        );
    };

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <ProductFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} product={editingProduct} />
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">Gerenciamento de Produtos</h2>
                <Button onClick={openAddModal} className="flex items-center space-x-2">
                    <BoxIcon className="w-5 h-5" />
                    <span>Adicionar Produto</span>
                </Button>
            </div>
            <div className="bg-brand-surface rounded-xl shadow-lg overflow-hidden">
                <ul className="divide-y divide-brand-secondary">
                    {products.map(product => (
                        <li key={product.id} className="p-4 flex items-center justify-between space-x-4">
                            <div className="flex items-center space-x-4 flex-1 min-w-0">
                                <img src={product.thumbnailUrl} alt={product.name} className="w-16 h-16 rounded-md object-cover flex-shrink-0" />
                                <div className="min-w-0">
                                    <p className="font-semibold text-brand-text truncate">{product.name}</p>
                                    <p className="text-sm text-brand-text-light truncate">{product.description}</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2 flex-shrink-0">
                                <button onClick={() => openEditModal(product)} className="p-2 text-brand-text-light hover:text-white" aria-label="Editar produto">
                                    <EditIcon className="w-5 h-5" />
                                </button>
                                <button onClick={() => handleDelete(product.id)} className="p-2 text-brand-text-light hover:text-brand-primary" aria-label="Excluir produto">
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

    const openAddModal = () => {
        setEditingBanner(null);
        setIsModalOpen(true);
    };

    const openEditModal = (banner: Banner) => {
        setEditingBanner(banner);
        setIsModalOpen(true);
    };
    
    const handleDelete = (bannerId: string) => {
        if (window.confirm('Tem certeza que deseja excluir este banner?')) {
            onDeleteBanner(bannerId);
        }
    };

    const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const seconds = Math.max(1, Number(e.target.value));
        setDuration(seconds);
    };
    
    const handleDurationSave = () => {
        onUpdateCarouselDuration(duration * 1000);
        alert('Tempo de exibição atualizado!');
    }

    const BannerFormModal: FC<{
        isOpen: boolean;
        onClose: () => void;
        banner: Banner | null;
    }> = ({ isOpen, onClose, banner }) => {
        const [title, setTitle] = useState('');
        const [subtitle, setSubtitle] = useState('');
        const [imageUrl, setImageUrl] = useState('');
        const [linkUrl, setLinkUrl] = useState('');

        useEffect(() => {
            if (banner) {
                setTitle(banner.title);
                setSubtitle(banner.subtitle);
                setImageUrl(banner.imageUrl);
                setLinkUrl(banner.linkUrl || '');
            } else {
                setTitle('');
                setSubtitle('');
                setImageUrl('');
                setLinkUrl('');
            }
        }, [banner, isOpen]);

        const handleSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            const bannerData = { title, subtitle, imageUrl, linkUrl: linkUrl || undefined };
            if (banner) {
                onUpdateBanner({ ...banner, ...bannerData });
            } else {
                onAddBanner(bannerData);
            }
            onClose();
        };

        if (!isOpen) return null;

        return (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
                <div className="bg-brand-surface rounded-xl p-6 w-full max-w-lg shadow-lg" onClick={(e) => e.stopPropagation()}>
                    <h2 className="text-2xl font-bold text-white mb-4">{banner ? 'Editar Banner' : 'Adicionar Novo Banner'}</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input label="Título" id="banner-title" type="text" value={title} onChange={e => setTitle(e.target.value)} required />
                        <Input label="Subtítulo" id="banner-subtitle" type="text" value={subtitle} onChange={e => setSubtitle(e.target.value)} required />
                        <Input label="URL da Imagem" id="banner-image" type="text" value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://exemplo.com/imagem.jpg" required />
                        <Input label="URL do Link (opcional)" id="banner-link" type="text" value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="https://exemplo.com/pagina" />
                        <div className="flex justify-end space-x-2 pt-4">
                            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
                            <Button type="submit">{banner ? 'Salvar Alterações' : 'Adicionar'}</Button>
                        </div>
                    </form>
                </div>
            </div>
        );
    };

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <BannerFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} banner={editingBanner} />
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">Gerenciamento de Banners</h2>
                <Button onClick={openAddModal} className="flex items-center space-x-2">
                    <PhotoIcon className="w-5 h-5" />
                    <span>Adicionar Banner</span>
                </Button>
            </div>
            
            <div className="bg-brand-surface rounded-xl p-4">
                <h3 className="text-xl font-bold text-white mb-3">Configurações do Carrossel</h3>
                <div className="flex items-center space-x-4">
                    <div className="flex-grow">
                        <label htmlFor="carousel-duration" className="block text-sm font-medium text-brand-text-light mb-1">Tempo de exibição de cada slide (segundos)</label>
                        <input id="carousel-duration" type="number" min="1" value={duration} onChange={handleDurationChange} className="w-full max-w-xs px-3 py-2 bg-brand-bg border border-brand-secondary rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary" />
                    </div>
                    <Button onClick={handleDurationSave} className="self-end">Salvar</Button>
                </div>
            </div>

            <div className="bg-brand-surface rounded-xl shadow-lg overflow-hidden">
                <ul className="divide-y divide-brand-secondary">
                    {banners.map(banner => (
                        <li key={banner.id} className="p-4 flex items-center justify-between space-x-4">
                            <div className="flex items-center space-x-4 flex-1 min-w-0">
                                <img src={banner.imageUrl} alt={banner.title} className="w-24 h-12 rounded-md object-cover flex-shrink-0 bg-brand-bg" />
                                <div className="min-w-0">
                                    <p className="font-semibold text-brand-text truncate">{banner.title}</p>
                                    <p className="text-sm text-brand-text-light truncate">{banner.subtitle}</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2 flex-shrink-0">
                                <button onClick={() => openEditModal(banner)} className="p-2 text-brand-text-light hover:text-white" aria-label="Editar banner">
                                    <EditIcon className="w-5 h-5" />
                                </button>
                                <button onClick={() => handleDelete(banner.id)} className="p-2 text-brand-text-light hover:text-brand-primary" aria-label="Excluir banner">
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

const AdminSettingsPage: FC<{
    currentLink: string;
    onUpdateLink: (link: string) => void;
    colors: Record<string, string>;
    onUpdateColors: (newColors: Record<string, string>) => void;
    onResetColors: () => void;
}> = ({ currentLink, onUpdateLink, colors, onUpdateColors, onResetColors }) => {
    const [link, setLink] = useState(currentLink);
    const [localColors, setLocalColors] = useState(colors);

    useEffect(() => {
        setLocalColors(colors);
    }, [colors]);

    const handleLocalColorChange = (key: string, value: string) => {
        setLocalColors(prev => ({ ...prev, [key]: value }));
    };
    
    const handleWhatsappSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdateLink(link);
        alert('Link do WhatsApp atualizado com sucesso!');
    };

    const handleColorSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdateColors(localColors);
    };

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <h2 className="text-2xl font-bold text-white">Configurações Gerais</h2>

            <div className="bg-brand-surface rounded-xl p-6 max-w-2xl">
                <h3 className="text-xl font-bold text-white mb-4">Paleta de Cores</h3>
                <form onSubmit={handleColorSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {Object.entries(localColors).map(([key, value]) => (
                            <div key={key} className="flex items-center space-x-3">
                                <label htmlFor={`color-${key}`} className="flex-1 text-brand-text-light">{COLOR_LABELS[key]}</label>
                                <input
                                    id={`color-${key}`}
                                    type="color"
                                    value={value}
                                    onChange={(e) => handleLocalColorChange(key, e.target.value)}
                                    className="w-10 h-10 p-0 border-none rounded-md bg-transparent cursor-pointer"
                                    style={{ 'backgroundColor': value } as React.CSSProperties}
                                />
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-end space-x-2 pt-4">
                        <Button type="button" variant="ghost" onClick={onResetColors}>Restaurar Padrão</Button>
                        <Button type="submit">Salvar Cores</Button>
                    </div>
                </form>
            </div>

            <div className="bg-brand-surface rounded-xl p-6 max-w-2xl">
                <h3 className="text-xl font-bold text-white mb-4">Link do Suporte (WhatsApp)</h3>
                <form onSubmit={handleWhatsappSubmit} className="flex items-end space-x-2">
                    <div className="flex-grow">
                        <Input
                            label="URL Completa"
                            id="whatsapp-link"
                            type="text"
                            value={link}
                            onChange={(e) => setLink(e.target.value)}
                            placeholder="https://wa.me/..."
                            required
                        />
                    </div>
                    <Button type="submit">Salvar Link</Button>
                </form>
            </div>
        </div>
    );
};

const EditProfileModal: FC<{
    user: User;
    onClose: () => void;
    onSave: (userId: string, updates: { name: string; avatarUrl: string }) => void;
}> = ({ user, onClose, onSave }) => {
    const [name, setName] = useState(user.name);
    const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onSave(user.id, { name, avatarUrl });
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-brand-surface rounded-xl p-6 w-full max-w-md shadow-lg" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-white mb-6">Editar Perfil</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex justify-center mb-4">
                        <img src={avatarUrl || `https://picsum.photos/seed/${user.id}/100/100`} alt="Avatar Preview" className="w-24 h-24 rounded-full object-cover ring-2 ring-brand-primary" />
                    </div>
                    <Input label="Nome Completo" id="profile-name" type="text" value={name} onChange={e => setName(e.target.value)} required />
                    <Input label="URL do Avatar" id="profile-avatar" type="text" value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} required />
                    
                    <div className="flex justify-end space-x-2 pt-4">
                        <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
                        <Button type="submit">Salvar Alterações</Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const ProfilePage: FC<{
    currentUser: User;
    posts: Post[];
    classes: Class[];
    onLogout: () => void;
    onUpdateUser: (userId: string, updates: { name?: string, avatarUrl?: string }) => void;
}> = ({ currentUser, posts, classes, onLogout, onUpdateUser }) => {
    const [activeTab, setActiveTab] = useState<'posts' | 'classes'>('posts');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const userPosts = posts.filter(p => p.author.id === currentUser.id);

    return (
        <>
            {isEditModalOpen && <EditProfileModal user={currentUser} onClose={() => setIsEditModalOpen(false)} onSave={onUpdateUser as any} />}
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
                         <Button variant="secondary" onClick={() => setIsEditModalOpen(true)} className="flex items-center space-x-2"><EditIcon className="w-5 h-5" /><span>Editar Perfil</span></Button>
                         <Button variant="ghost" onClick={onLogout} className="flex items-center space-x-2"><LogoutIcon className="w-5 h-5" /><span>Sair</span></Button>
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
                            {userPosts.length > 0 ? userPosts.map(post => (
                                <div key={post.id} className="bg-brand-surface rounded-xl p-4 sm:p-5 shadow-lg">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center space-x-3">
                                            <img src={post.author.avatarUrl} alt={post.author.name} className="w-12 h-12 rounded-full" />
                                            <div>
                                                <p className="font-semibold text-brand-text">{post.author.name}</p>
                                                <p className="text-xs text-brand-text-light">{post.createdAt}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="my-4 text-brand-text whitespace-pre-wrap">{post.text}</p>
                                    <div className="my-3">
                                        {post.imageUrl && <img src={post.imageUrl} alt="Post content" className="rounded-lg w-full max-h-[500px] object-cover" />}
                                        {post.videoUrl && <video controls src={post.videoUrl} className="rounded-lg w-full max-h-[500px] bg-black" />}
                                    </div>
                                    <div className="flex items-center space-x-6 text-brand-text-light border-t border-brand-secondary mt-4 pt-3">
                                        <div className="flex items-center space-x-2"><HeartIcon filled={post.likes.length > 0} className={`w-5 h-5 ${post.likes.length > 0 ? 'text-brand-primary' : ''}`}/><span>{post.likes.length} Curtidas</span></div>
                                        <div className="flex items-center space-x-2"><CommentIcon className="w-5 h-5" /><span>{post.comments.length} Comentários</span></div>
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
                            {classes.map(cls => (
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


const App: FC = () => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [activePage, setActivePage] = useState<Page>(Page.Inicio);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [adminPosts, setAdminPosts] = useState<AdminPost[]>(MOCK_ADMIN_POSTS);
    const [users, setUsers] = useState<User[]>([...MOCK_USERS, MOCK_ADMIN]);
    const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
    const [classes] = useState<Class[]>(MOCK_CLASSES);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [whatsappLink, setWhatsappLink] = useState('https://wa.me/5511999999999');
    const [banners, setBanners] = useState<Banner[]>(MOCK_BANNERS);
    const [carouselDuration, setCarouselDuration] = useState(5000); // 5 seconds
    const [colors, setColors] = useState<Record<string, string>>(() => {
        const savedColors = localStorage.getItem('maiflix-colors');
        if (savedColors) {
            try {
                const parsed: unknown = JSON.parse(savedColors);
                if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
                    const allValuesAreStrings = Object.values(parsed as Record<string, unknown>).every(
                        (value) => typeof value === 'string'
                    );
                    if (allValuesAreStrings) {
                        return parsed as Record<string, string>;
                    }
                }
            } catch (e) {
                // FIX: Safely handle 'unknown' error type from catch block before logging.
                const message = e instanceof Error ? e.message : String(e as any);
                console.error('Could not parse colors from local storage:', message);
            }
        }
        return DEFAULT_COLORS;
    });

    const ai = new GoogleGenAI({ apiKey: (process.env.API_KEY as string) || '' });

    const updateUsersWithGemini = async (prompt: string, currentUsers: User[]): Promise<User[] | null> => {
        try {
            const fullPrompt = `${prompt}\n\nHere is the current list of users in JSON format. Please return the new, complete list of users in the same format.\n\n${JSON.stringify(currentUsers, null, 2)}`;
            
            const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: fullPrompt,
              config: {
                responseMimeType: "application/json",
                responseSchema: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      name: { type: Type.STRING },
                      email: { type: Type.STRING },
                      avatarUrl: { type: Type.STRING },
                      role: { type: Type.STRING },
                      status: { type: Type.STRING },
                    }
                  }
                }
              }
            });
        
            const text = response.text;
            if (!text) {
                throw new Error("Resposta vazia da IA.");
            }
            const jsonText = text.trim();
            
            const updatedUsers = JSON.parse(jsonText);
            // Basic validation
            if (Array.isArray(updatedUsers)) {
                return updatedUsers as User[];
            }
            throw new Error("AI response was not a valid user array.");

        } catch (error) {
            console.error("Error updating users with Gemini:", error);
            alert("Ocorreu um erro ao se comunicar com a IA. Por favor, tente novamente.");
            return null;
        }
    };

    useEffect(() => {
        Object.entries(colors).forEach(([key, value]) => {
            document.documentElement.style.setProperty(COLOR_VAR_MAP[key], value);
        });
        localStorage.setItem('maiflix-colors', JSON.stringify(colors));
    }, [colors]);


    const handleUpdateColors = (newColors: Record<string, string>) => {
        setColors(newColors);
    };

    const handleResetColors = () => {
        if (window.confirm('Tem certeza que deseja restaurar as cores padrão?')) {
            setColors(DEFAULT_COLORS);
        }
    };

    const handleLogout = () => {
        setCurrentUser(null);
        setActivePage(Page.Inicio);
    };
    
    const handleAddNotification = (message: string) => {
        const newNotification: Notification = {
            id: `notif-${Date.now()}`,
            message,
            createdAt: new Date().toISOString(),
            read: false,
        };
        setNotifications(prev => [newNotification, ...prev].slice(0, 10)); // Keep last 10
    };
    
    // Admin post handlers
    const handleAddAdminPost = (post: Omit<AdminPost, 'id'|'createdAt'>) => {
        const newPost: AdminPost = {
            ...post,
            id: `a${Date.now()}`,
            createdAt: 'Agora mesmo',
        };
        setAdminPosts([newPost, ...adminPosts]);
    };
    const handleUpdateAdminPost = (updatedPost: AdminPost) => {
        setAdminPosts(adminPosts.map(p => p.id === updatedPost.id ? updatedPost : p));
    };
    const handleDeleteAdminPost = (postId: string) => {
        setAdminPosts(adminPosts.filter(p => p.id !== postId));
    };

    // Admin user handlers
    const handleAddUser = async (userData: Omit<User, 'id' | 'avatarUrl' | 'role' | 'status'>) => {
        const prompt = `You are a user database API for the Maiflix app. A new user is being added with this data:
- Name: ${userData.name}
- Email: ${userData.email}

Please add this user to the list. You must:
1. Generate a new unique ID (e.g., 'u' followed by the current timestamp).
2. Generate a random avatar URL from 'https://picsum.photos/seed/UNIQUE_SEED/100/100'.
3. Set their 'role' to 'user'.
4. Set their 'status' to 'active'.
5. Return the COMPLETE, updated list of all users as a valid JSON array.`;
        
        const updatedUsers = await updateUsersWithGemini(prompt, users);
        if (updatedUsers) {
            setUsers(updatedUsers);
        }
    };
    const handleUpdateUser = async (userId: string, updates: { name?: string, avatarUrl?: string }) => {
        const prompt = `You are a user database API for the Maiflix app. Update the user with id '${userId}' with the following data: ${JSON.stringify(updates)}.
Do not change any other fields for this user. Return the COMPLETE, updated list of all users as a valid JSON array.`;

        const updatedUsers = await updateUsersWithGemini(prompt, users);
        if (updatedUsers) {
            setUsers(updatedUsers);
            if (currentUser && currentUser.id === userId) {
                const updatedCurrentUser = updatedUsers.find(u => u.id === userId);
                if (updatedCurrentUser) {
                    setCurrentUser(updatedCurrentUser);
                }
            }
        }
    };
    const handleUpdateUserStatus = async (userId: string, status: 'active' | 'blocked') => {
        const prompt = `You are a user database API for the Maiflix app. Update the status for the user with id '${userId}' to '${status}'.
Return the COMPLETE, updated list of all users as a valid JSON array.`;
        
        const updatedUsers = await updateUsersWithGemini(prompt, users);
        if (updatedUsers) {
            setUsers(updatedUsers);
        }
    };
    const handleDeleteUser = async (userId: string) => {
         const prompt = `You are a user database API for the Maiflix app. Delete the user with id '${userId}'.
Return the COMPLETE, updated list of all users without the deleted user as a valid JSON array.`;

        const updatedUsers = await updateUsersWithGemini(prompt, users);
        if (updatedUsers) {
            setUsers(updatedUsers);
        }
    };
    
    // Admin products handlers
    const handleAddProduct = (productData: Omit<Product, 'id'>) => {
        const newProduct: Product = { ...productData, id: `prod${Date.now()}` };
        setProducts([newProduct, ...products]);
    };
    const handleUpdateProduct = (updatedProduct: Product) => {
        setProducts(products.map(p => p.id === updatedProduct.id ? updatedProduct : p));
    };
    const handleDeleteProduct = (productId: string) => {
        setProducts(products.filter(p => p.id !== productId));
    };
    
    // Admin banners handlers
    const handleAddBanner = (bannerData: Omit<Banner, 'id'>) => {
        const newBanner: Banner = { ...bannerData, id: `b${Date.now()}` };
        setBanners([newBanner, ...banners]);
    };
    const handleUpdateBanner = (updatedBanner: Banner) => {
        setBanners(banners.map(b => b.id === updatedBanner.id ? updatedBanner : b));
    };
    const handleDeleteBanner = (bannerId: string) => {
        setBanners(banners.filter(b => b.id !== bannerId));
    };


    if (!currentUser) {
        return <LoginPage onLogin={setCurrentUser} />;
    }

    type NavItem = {
        page: Page;
        icon: typeof HomeIcon;
        label?: string;
    };

    const navItemsUser: NavItem[] = [
        { page: Page.Inicio, icon: HomeIcon },
        { page: Page.Feed, icon: InfoIcon },
        { page: Page.Comunidade, icon: UserGroupIcon },
        { page: Page.Perfil, icon: UserCircleIcon },
    ];
    
    const navItemsAdmin: NavItem[] = [
        { page: Page.Feed, icon: InfoIcon, label: "Avisos" },
        { page: Page.Users, icon: UsersIcon, label: "Usuários" },
        { page: Page.Products, icon: BoxIcon, label: "Produtos" },
        { page: Page.Banners, icon: PhotoIcon, label: "Banners" },
        { page: Page.Settings, icon: Cog6ToothIcon, label: "Geral" },
    ];

    const renderPage = () => {
        switch (activePage) {
            case Page.Inicio:
                return <HomePage products={products} onProductClick={setSelectedProduct} banners={banners} carouselDuration={carouselDuration}/>;
            case Page.Feed:
                 return currentUser.role === 'admin' 
                    ? <AdminFeedPage posts={adminPosts} onAddPost={handleAddAdminPost} onUpdatePost={handleUpdateAdminPost} onDeletePost={handleDeleteAdminPost} />
                    : <AdminFeedPageReadOnly posts={adminPosts} />;
            case Page.Comunidade:
                return <CommunityPage currentUser={currentUser} onAddNotification={handleAddNotification} />;
            case Page.Users:
                return currentUser.role === 'admin' ? <AdminUsersPage users={users.filter(u => u.role === 'user')} onAddUser={handleAddUser} onUpdateUser={handleUpdateUser as any} onUpdateUserStatus={handleUpdateUserStatus} onDeleteUser={handleDeleteUser} /> : null;
            case Page.Products:
                return currentUser.role === 'admin' ? <AdminProductsPage products={products} onAddProduct={handleAddProduct} onUpdateProduct={handleUpdateProduct} onDeleteProduct={handleDeleteProduct} /> : null;
            case Page.Banners:
                return currentUser.role === 'admin' ? <AdminBannersPage banners={banners} carouselDuration={carouselDuration} onAddBanner={handleAddBanner} onUpdateBanner={handleUpdateBanner} onDeleteBanner={handleDeleteBanner} onUpdateCarouselDuration={setCarouselDuration} /> : null;
            case Page.Settings:
                return currentUser.role === 'admin' ? <AdminSettingsPage currentLink={whatsappLink} onUpdateLink={setWhatsappLink} colors={colors} onUpdateColors={handleUpdateColors} onResetColors={handleResetColors} /> : null;
            case Page.Perfil:
                 return <ProfilePage currentUser={currentUser} posts={MOCK_POSTS} classes={classes} onLogout={handleLogout} onUpdateUser={handleUpdateUser} />;
            default:
                return (
                    <div className="p-6 text-center">
                        <h2 className="text-2xl font-bold">Página em Construção</h2>
                        <p className="text-brand-text-light mt-2">Volte em breve!</p>
                    </div>
                );
        }
    };

    const Header: FC = () => {
        const [notificationsOpen, setNotificationsOpen] = useState(false);
        const unreadCount = notifications.filter(n => !n.read).length;

        return (
            <header className="bg-brand-surface sticky top-0 z-40 shadow-md flex items-center justify-between p-4 h-16">
                <h1 className="text-2xl font-bold text-brand-primary">Maiflix</h1>
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
                                {notifications.length > 0 ? (
                                    <ul className="max-h-80 overflow-y-auto">
                                        {notifications.map(n => (
                                            <li key={n.id} className={`p-3 text-sm border-b border-brand-secondary/50 ${n.read ? 'opacity-60' : ''}`}>{n.message}</li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="p-4 text-sm text-brand-text-light">Nenhuma notificação nova.</p>
                                )}
                            </div>
                        )}
                    </div>
                    <button onClick={handleLogout} className="text-brand-text-light hover:text-white"><LogoutIcon className="w-6 h-6" /></button>
                    <div className="flex items-center space-x-3">
                        <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-9 h-9 rounded-full" />
                        <span className="hidden sm:inline font-semibold">{currentUser.name}</span>
                    </div>
                </div>
            </header>
        );
    };

    const BottomNav: FC = () => {
        const navItems: NavItem[] = currentUser.role === 'user' ? navItemsUser : navItemsAdmin;
        return (
            <nav className="fixed bottom-0 left-0 right-0 bg-brand-surface shadow-[0_-2px_10px_rgba(0,0,0,0.3)] z-40 md:hidden">
                <div className="flex justify-around">
                    {navItems.map((item) => (
                        <button
                            key={item.page}
                            onClick={() => setActivePage(item.page)}
                            className={`flex flex-col items-center justify-center w-full pt-2 pb-1 transition-colors ${activePage === item.page ? 'text-brand-primary' : 'text-brand-text-light hover:text-white'}`}
                        >
                            <item.icon className="w-6 h-6" />
                            <span className="text-xs mt-1">{item.label || item.page}</span>
                        </button>
                    ))}
                </div>
            </nav>
        );
    };

    const SideNav: FC = () => {
        const navItems: NavItem[] = currentUser.role === 'user' ? navItemsUser : navItemsAdmin;
        return (
            <aside className="hidden md:block w-64 bg-brand-surface p-4 flex-shrink-0 overflow-y-auto">
                <nav className="flex flex-col space-y-2">
                    {navItems.map((item) => (
                        <button
                            key={item.page}
                            onClick={() => setActivePage(item.page)}
                            className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${activePage === item.page ? 'bg-brand-primary text-white' : 'text-brand-text-light hover:bg-brand-secondary hover:text-white'}`}
                        >
                            <item.icon className="w-6 h-6" />
                            <span className="font-semibold">{item.label || item.page}</span>
                        </button>
                    ))}
                </nav>
            </aside>
        );
    };

    return (
        <div className="h-screen flex flex-col">
            <Header />
            <div className="flex flex-1 overflow-hidden">
                <SideNav />
                <main className="flex-1 pb-20 md:pb-0 overflow-y-auto">
                    <ErrorBoundary>
                        {renderPage()}
                    </ErrorBoundary>
                </main>
            </div>
            <BottomNav />
            {selectedProduct && <ProductDetailPage product={selectedProduct} onClose={() => setSelectedProduct(null)} />}
            <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="fixed bottom-20 right-4 md:bottom-6 md:right-6 bg-green-500 text-white rounded-full p-3.5 shadow-lg z-30 transform transition-transform hover:scale-110">
                <WhatsappIcon className="w-8 h-8"/>
            </a>
        </div>
    );
};

export default App;
