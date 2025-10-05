
import React, { useCallback, useState } from 'react';
import type { ImageData } from '../types';

interface UploadAreaProps {
  id: string;
  onImageUpload: (imageData: ImageData | null) => void;
  title: string;
  className?: string;
}

const UploadArea: React.FC<UploadAreaProps> = ({ id, onImageUpload, title, className }) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleFileChange = (file: File | null) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        setImagePreview(reader.result as string);
        onImageUpload({
          base64: base64String,
          mimeType: file.type,
        });
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
      onImageUpload(null);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileChange(e.target.files ? e.target.files[0] : null);
  };
  
  const onDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.currentTarget.classList.remove('border-indigo-500');
    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      handleFileChange(event.dataTransfer.files[0]);
    }
  }, []);

  const onDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.currentTarget.classList.add('border-indigo-500');
  };

  const onDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.currentTarget.classList.remove('border-indigo-500');
  }

  return (
    <div
      className={`upload-area-dual relative flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-600 rounded-lg text-center text-gray-400 cursor-pointer hover:border-gray-500 transition-colors duration-200 ${className}`}
      onClick={() => document.getElementById(id)?.click()}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
    >
      {imagePreview ? (
        <img id={`${id}Preview`} src={imagePreview} alt="Preview" className="image-preview absolute inset-0 w-full h-full object-cover rounded-lg" />
      ) : (
        <>
          <div className="text-3xl mb-2">📁</div>
          <span className="font-semibold text-gray-300">{title}</span>
          <span className="upload-text text-xs">Clique ou arraste</span>
        </>
      )}
      <input
        type="file"
        id={id}
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
      />
    </div>
  );
};

export default UploadArea;
