import { CreateFunction, EditFunction, FunctionDef, ColorPalette } from './types';

export const CREATE_FUNCTIONS: FunctionDef[] = [
  { id: CreateFunction.Free, icon: '✨', name: 'Prompt' },
  { id: CreateFunction.Sticker, icon: '🏷️', name: 'Adesivos' },
  { id: CreateFunction.Text, icon: '📝', name: 'Logo' },
  { id: CreateFunction.Comic, icon: '💭', name: 'HQ' },
  { id: CreateFunction.Pixar, icon: '🧸', name: 'Pixar' },
  { id: CreateFunction.VectorCartoon, icon: '✏️', name: 'Cartoon Vetorial' },
];

export const EDIT_FUNCTIONS: FunctionDef[] = [
  { id: EditFunction.AddRemove, icon: '➕', name: 'Adicionar' },
  { id: EditFunction.Retouch, icon: '🎯', name: 'Retoque' },
  { id: EditFunction.Style, icon: '🎨', name: 'Estilo' },
  { id: EditFunction.Compose, icon: '🖼️', name: 'Unir', requiresTwo: true },
];

export const COLOR_PALETTES: ColorPalette[] = [
  { id: 'none', name: 'Automático', colors: [] },
  { id: 'vibrant', name: 'Vibrante', colors: ['#FF1493', '#00BFFF', '#32CD32', '#FFD700'] },
  { id: 'pastel', name: 'Pastel', colors: ['#A0C4FF', '#BDB2FF', '#FFADAD', '#FFD6A5'] },
  { id: 'monochrome', name: 'Monocromático', colors: ['#2E2E2E', '#616161', '#9E9E9E', '#E0E0E0'] },
  { id: 'earthy', name: 'Terroso', colors: ['#A47C48', '#5D4037', '#795548', '#8D6E63'] },
  { id: 'neon', name: 'Neon', colors: ['#39FF14', '#FF073A', '#00FFFF', '#FDFD96'] },
  { id: 'church', name: 'Igreja', colors: ['#EFE6DA', '#163951', '#416B72', '#BF6647', '#D3A879'] },
];