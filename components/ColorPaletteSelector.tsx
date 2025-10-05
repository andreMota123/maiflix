import React from 'react';
import { ColorPalette } from '../types';

interface ColorPaletteSelectorProps {
  palettes: ColorPalette[];
  activePalette: string;
  onSelect: (id: string) => void;
}

const ColorPaletteSelector: React.FC<ColorPaletteSelectorProps> = ({ palettes, activePalette, onSelect }) => {
  return (
    <div className="grid grid-cols-3 gap-2">
      {palettes.map((palette) => (
        <button
          key={palette.id}
          onClick={() => onSelect(palette.id)}
          className={`palette-btn p-2 border rounded-md text-xs transition-colors duration-200 flex flex-col items-center justify-center h-16 ${
            activePalette === palette.id
              ? 'bg-indigo-600 border-indigo-500 text-white'
              : 'bg-gray-700 border-gray-600 hover:bg-gray-600'
          }`}
          title={palette.name}
        >
          <div className="flex space-x-1 mb-1">
            {palette.id === 'none' ? (
                 <span className="text-2xl">🪄</span>
            ) : (
                palette.colors.map((color, index) => (
                    <div
                        key={index}
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: color }}
                    ></div>
                ))
            )}
          </div>
          <span className="font-medium text-center">{palette.name}</span>
        </button>
      ))}
    </div>
  );
};

export default ColorPaletteSelector;
