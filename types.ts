export enum Mode {
  Create = 'create',
  Edit = 'edit',
}

export enum CreateFunction {
  Free = 'free',
  Sticker = 'sticker',
  Text = 'text',
  Comic = 'comic',
  Pixar = 'pixar',
  VectorCartoon = 'vector-cartoon',
}

export enum EditFunction {
  AddRemove = 'add-remove',
  Retouch = 'retouch',
  Style = 'style',
  Compose = 'compose',
}

export interface FunctionDef {
  id: CreateFunction | EditFunction;
  icon: string;
  name: string;
  requiresTwo?: boolean;
}

export interface ImageData {
  base64: string;
  mimeType: string;
}

export interface ColorPalette {
  id: string;
  name: string;
  colors: string[];
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  imageUrl: string;
  prompt: string;
  mode: Mode;
  createFunction?: CreateFunction;
  editFunction?: EditFunction;
  aspectRatio?: string;
  paletteId?: string;
}
