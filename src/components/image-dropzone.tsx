'use client';

import { useCallback, useRef, useState } from 'react';
import { Upload, ImagePlus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageDropzoneProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  label?: string;
  className?: string;
}

export function ImageDropzone({
  onFilesSelected,
  accept = 'image/*',
  multiple = true,
  disabled = false,
  label = '拖拽图片到此处或点击上传',
  className,
}: ImageDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) setIsDragging(true);
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (disabled) return;
      const files = Array.from(e.dataTransfer.files).filter((f) =>
        f.type.startsWith('image/')
      );
      if (files.length > 0) {
        onFilesSelected(multiple ? files : [files[0]]);
      }
    },
    [onFilesSelected, multiple, disabled]
  );

  const handleClick = useCallback(() => {
    if (!disabled) inputRef.current?.click();
  }, [disabled]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      if (files.length > 0) {
        onFilesSelected(multiple ? files : [files[0]]);
      }
      if (inputRef.current) inputRef.current.value = '';
    },
    [onFilesSelected, multiple]
  );

  return (
    <div
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        'relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-6 transition-all cursor-pointer select-none',
        isDragging
          ? 'border-rose-400 bg-rose-50 scale-[1.02]'
          : 'border-gray-300 bg-gray-50/50 hover:border-rose-300 hover:bg-rose-50/30',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
        className="hidden"
        disabled={disabled}
      />
      <div
        className={cn(
          'rounded-full p-3 transition-colors',
          isDragging ? 'bg-rose-100 text-rose-600' : 'bg-gray-100 text-gray-400'
        )}
      >
        {isDragging ? (
          <ImagePlus className="size-6" />
        ) : (
          <Upload className="size-6" />
        )}
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-gray-600">{label}</p>
        <p className="text-xs text-gray-400 mt-1">支持 JPG、PNG、WEBP 格式</p>
      </div>
    </div>
  );
}
