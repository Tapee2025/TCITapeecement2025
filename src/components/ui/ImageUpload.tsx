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
    tr
