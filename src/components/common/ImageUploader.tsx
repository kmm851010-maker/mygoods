'use client';

import { useState, useRef, ChangeEvent } from 'react';
import Image from 'next/image';
import { Plus, X } from 'lucide-react';

interface ImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
}

export default function ImageUploader({ images, onChange, maxImages = 5 }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    const remaining = maxImages - images.length;
    const filesToUpload = Array.from(files).slice(0, remaining);

    setUploading(true);
    try {
      const formData = new FormData();
      filesToUpload.forEach((f) => formData.append('files', f));

      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || '업로드 실패');
        return;
      }
      const { urls } = await res.json();
      onChange([...images, ...urls]);
    } catch {
      alert('업로드 중 오류가 발생했습니다');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  return (
    <div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {/* Add button */}
        {images.length < maxImages && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex-shrink-0 w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-orange-400 hover:text-orange-400 transition-colors disabled:opacity-50"
          >
            {uploading ? (
              <span className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Plus size={20} />
                <span className="text-[10px] mt-0.5">{images.length}/{maxImages}</span>
              </>
            )}
          </button>
        )}

        {/* Preview images */}
        {images.map((url, i) => (
          <div key={url} className="flex-shrink-0 relative w-20 h-20">
            <Image
              src={url}
              alt={`이미지 ${i + 1}`}
              fill
              className="object-cover rounded-xl"
              sizes="80px"
            />
            <button
              type="button"
              onClick={() => removeImage(i)}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-700 text-white rounded-full flex items-center justify-center"
              aria-label="이미지 삭제"
            >
              <X size={11} />
            </button>
            {i === 0 && (
              <span className="absolute bottom-1 left-1 text-[9px] bg-gray-800/70 text-white px-1 rounded">
                대표
              </span>
            )}
          </div>
        ))}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
