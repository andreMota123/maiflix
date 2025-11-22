import React, { useState, useRef } from 'react';
import { PhotoIcon } from '../Icons';
import { uploadImage } from '../../services/api';

export const ImageUpload = ({ label, value, onChange, folder = 'uploads', className }) => {
    const [loading, setLoading] = useState(false);
    const [preview, setPreview] = useState(value);
    const fileInputRef = useRef(null);

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validação básica de tamanho (10MB)
        if (file.size > 10 * 1024 * 1024) {
            alert('A imagem deve ter no máximo 10MB.');
            return;
        }

        setLoading(true);
        try {
            // Faz o upload e recebe { gcsPath, url }
            const { gcsPath, url } = await uploadImage(file, folder);
            
            // Atualiza o preview visualmente com a URL assinada temporária
            setPreview(url);
            
            // Passa o gcsPath (caminho interno) para o formulário pai salvar no banco
            onChange(gcsPath);
        } catch (error) {
            alert('Erro ao fazer upload da imagem.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`w-full ${className || ''}`}>
            <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
            
            <div 
                className={`relative w-full h-48 border-2 border-dashed border-gray-600 rounded-xl flex flex-col items-center justify-center bg-gray-800/50 hover:bg-gray-800 hover:border-pink-500 transition-colors cursor-pointer group overflow-hidden ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => !loading && fileInputRef.current?.click()}
            >
                {preview ? (
                    <>
                        <img src={preview} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <p className="text-white font-semibold">Trocar Imagem</p>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center text-gray-400">
                        <PhotoIcon className="w-10 h-10 mb-2" />
                        <p className="text-sm font-medium">Clique para enviar uma imagem</p>
                        <p className="text-xs text-gray-500 mt-1">PNG, JPG, WebP até 10MB</p>
                    </div>
                )}

                {loading && (
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-10">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pink-500"></div>
                    </div>
                )}
            </div>

            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                className="hidden" 
            />
        </div>
    );
};