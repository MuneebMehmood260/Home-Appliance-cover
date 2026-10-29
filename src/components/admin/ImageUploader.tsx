import React, { useState } from 'react';
import { UploadCloud, X, Star, Link as LinkIcon, Loader2 } from 'lucide-react';
import { dbService } from '../../lib/supabase';
import { ProductImage } from '../../types';
import toast from 'react-hot-toast';

interface ImageUploaderProps {
  images: ProductImage[];
  onChange: (images: ProductImage[]) => void;
  productId?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ images, onChange, productId = 'temp' }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newImages: ProductImage[] = [...images];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const uploadedUrl = await dbService.uploadImage(file);
        newImages.push({
          id: `img-${Date.now()}-${i}`,
          product_id: productId,
          image_url: uploadedUrl,
          alt_text: file.name.split('.')[0],
          display_order: newImages.length + 1,
          is_primary: newImages.length === 0,
        });
      }
      onChange(newImages);
      toast.success(`${files.length} image(s) processed`);
    } catch (err) {
      console.error('Image upload error', err);
      toast.error('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleAddUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    const newImage: ProductImage = {
      id: `img-${Date.now()}`,
      product_id: productId,
      image_url: urlInput.trim(),
      alt_text: 'Product Image',
      display_order: images.length + 1,
      is_primary: images.length === 0,
    };

    onChange([...images, newImage]);
    setUrlInput('');
    setShowUrlInput(false);
    toast.success('Image link added!');
  };

  const handleRemove = (id: string) => {
    const remaining = images.filter((img) => img.id !== id);
    // Ensure one image is primary if any exist
    if (remaining.length > 0 && !remaining.some((img) => img.is_primary)) {
      remaining[0].is_primary = true;
    }
    onChange(remaining);
  };

  const handleSetPrimary = (id: string) => {
    const updated = images.map((img) => ({
      ...img,
      is_primary: img.id === id,
    }));
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      {/* Upload action bar */}
      <div className="flex flex-wrap items-center gap-3">
        <label className="inline-flex items-center gap-2 px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors shadow-xs">
          {isUploading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Uploading to Storage...</span>
            </>
          ) : (
            <>
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Upload from Device</span>
            </>
          )}
          <input
            type="file"
            multiple
            accept="image/*"
            disabled={isUploading}
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>

        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-neutral-300 hover:bg-neutral-50 text-neutral-700 rounded-lg text-xs font-semibold transition-colors"
        >
          <LinkIcon className="w-3.5 h-3.5" />
          <span>Add Image via URL</span>
        </button>
      </div>

      {/* URL Input Row */}
      {showUrlInput && (
        <form onSubmit={handleAddUrl} className="flex gap-2">
          <input
            type="url"
            placeholder="Paste image URL (https://...)"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            className="flex-1 px-3 py-2 bg-white border border-neutral-300 rounded-lg text-xs focus:outline-hidden focus:border-neutral-900"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-neutral-900 text-white rounded-lg text-xs font-semibold"
          >
            Add
          </button>
        </form>
      )}

      {/* Thumbnails Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {images.map((img) => (
            <div
              key={img.id}
              className={`relative group rounded-xl overflow-hidden border-2 bg-neutral-100 aspect-4/3 ${
                img.is_primary ? 'border-neutral-900 ring-2 ring-neutral-900/10' : 'border-neutral-200'
              }`}
            >
              <img
                src={img.image_url}
                alt={img.alt_text || 'Product thumbnail'}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />

              {/* Primary tag */}
              {img.is_primary && (
                <span className="absolute top-1.5 left-1.5 bg-neutral-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-xs">
                  Primary
                </span>
              )}

              {/* Actions Overlay */}
              <div className="absolute inset-0 bg-neutral-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {!img.is_primary && (
                  <button
                    type="button"
                    onClick={() => handleSetPrimary(img.id)}
                    className="p-1.5 rounded-full bg-white text-neutral-800 hover:text-amber-600 transition-colors"
                    title="Set as Primary cover image"
                  >
                    <Star className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleRemove(img.id)}
                  className="p-1.5 rounded-full bg-rose-600 text-white hover:bg-rose-700 transition-colors"
                  title="Delete image"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
