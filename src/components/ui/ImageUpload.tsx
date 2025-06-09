import { useCallback, useState } from 'react';
import { X, Image as ImageIcon } from 'lucide-react';
import { resizeImage, isValidImageFile, formatFileSize } from '../../utils/imageProcessing';
import LoadingSpinner from './LoadingSpinner';

interface ImageUploadProps {
  onImageSelect: (file: File, preview: string) => void;
  maxSize?: number; // in bytes
  className?: string;
}

export default function ImageUpload({ 
  onImageSelect, 
  maxSize = 5 * 1024 * 1024, // 5MB default
  className = ''
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    try {
      setError(null);
      setIsProcessing(true);

      if (!isValidImageFile(file)) {
        throw new Error('Please upload a valid image file (JPEG, PNG, or WebP)');
      }

      if (file.size > maxSize) {
        throw new Error(`File size must be less than ${formatFileSize(maxSize)}`);
      }

      const resizedBlob = await resizeImage(file);
      const resizedFile = new File([resizedBlob], file.name, { type: resizedBlob.type });
      const previewUrl = URL.createObjectURL(resizedBlob);

      setPreview(previewUrl);
      onImageSelect(resizedFile, previewUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process image');
    } finally {
      setIsProcessing(false);
    }
  }, [maxSize, onImageSelect]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const removeImage = useCallback(() => {
    setPreview(null);
    setError(null);
  }, []);

  return (
    <div className={`relative ${className}`}>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileInput}
        className="hidden"
        id="image-upload"
      />

      <div
        className={`relative border-2 border-dashed rounded-lg p-4 text-center transition-colors
          ${isDragging ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-500'}
          ${error ? 'border-error-500 bg-error-50' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {isProcessing ? (
          <div className="py-8">
            <LoadingSpinner size="lg" />
            <p className="mt-2 text-sm text-gray-600">Processing image...</p>
          </div>
        ) : preview ? (
          <div className="relative">
            <img
              src={preview}
              alt="Preview"
              className="max-h-48 mx-auto rounded"
            />
            <button
              onClick={removeImage}
              className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-md hover:bg-gray-100"
              type="button"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <label htmlFor="image-upload" className="cursor-pointer block py-8">
            <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
              <span className="text-primary-600 hover:text-primary-500">
                Upload an image
              </span>
              <span className="text-gray-500"> or drag and drop</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              JPEG, PNG, WebP up to {formatFileSize(maxSize)}
            </p>
          </label>
        )}
      </div>

      {error && (
        <p className="mt-2 text-sm text-error-600">{error}</p>
      )}
    </div>
  );
}
