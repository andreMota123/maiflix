
export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  role: 'user' | 'admin';
  status: 'active' | 'blocked';
}

export interface Comment {
  id: string;
  author: Pick<User, 'id' | 'name' | 'avatarUrl'>;
  text: string;
  createdAt: string;
}

export interface Post {
  id:string;
  author: Pick<User, 'id' | 'name' | 'avatarUrl'>;
  imageUrl?: string;
  videoUrl?: string;
  text: string;
  likes: string[]; // Array of user IDs
  comments: Comment[];
  createdAt: string;
}

export interface AdminPost {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  thumbnailUrl: string;
  fileType: 'SVG' | 'PDF' | 'STUDIO';
  downloadUrl: string; // Could be a direct link or a drive link
  youtubeUrl?: string;
}

export interface Class {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string;
}

export interface Banner {
  id: string;
  imageUrl: string;
  title: string;
  subtitle: string;
  linkUrl?: string;
}

export enum Page {
  Inicio = 'Início',
  Feed = 'Feed',
  Comunidade = 'Comunidade',
  Perfil = 'Perfil',
  Users = 'Usuários',
  Products = 'Produtos',
  Banners = 'Banners',
  Settings = 'Configurações',
}

export interface Notification {
  id: string;
  message: string;
  createdAt: string;
  read: boolean;
}