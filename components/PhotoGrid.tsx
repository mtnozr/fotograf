import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Photo } from '../types';

interface PhotoGridProps {
  photos: Photo[];
  onPhotoClick: (photo: Photo) => void;
}

// Category ID to Turkish name mapping
const categoryNames: Record<string, string> = {
  'all': 'Tümü',
  'landscape': 'Manzara',
  'portrait': 'Portre',
  'urban': 'Şehir',
  'minimal': 'Minimal'
};

const getCategoryName = (categoryId: string): string => {
  return categoryNames[categoryId.toLowerCase()] || categoryId;
};

// Image optimization helper for Cloudinary URLs
const getOptimizedUrl = (url: string, width: number): string => {
  if (url.includes('cloudinary.com') && url.includes('/upload/')) {
    return url.replace('/upload/', `/upload/w_${width},f_auto,q_auto/`);
  }
  return url;
};

const PhotoGrid: React.FC<PhotoGridProps> = ({ photos, onPhotoClick }) => {
  return (
    <motion.div
      layout
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
    >
      <AnimatePresence>
        {photos.map((photo) => (
          <motion.div
            layout
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.4 }}
            key={photo.id}
            className="group cursor-pointer relative overflow-hidden rounded-lg shadow-sm hover:shadow-xl transition-shadow duration-300"
            onClick={() => onPhotoClick(photo)}
          >
            <div className="aspect-[4/5] overflow-hidden bg-gray-200">
              <img
                src={getOptimizedUrl(photo.url, 400)}
                srcSet={`
                  ${getOptimizedUrl(photo.url, 300)} 300w,
                  ${getOptimizedUrl(photo.url, 400)} 400w,
                  ${getOptimizedUrl(photo.url, 600)} 600w
                `}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                alt={getCategoryName(photo.category)}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale group-hover:grayscale-0"
                loading="lazy"
              />
            </div>

            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
              <span className="text-xs font-bold text-white/80 uppercase tracking-wider">
                {getCategoryName(photo.category)}
              </span>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
};

export default PhotoGrid;