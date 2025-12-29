import React, { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Share2 } from 'lucide-react';
import { Photo } from '../types';

interface PhotoModalProps {
  photo: Photo | null;
  onClose: () => void;
}

// Category ID to Turkish name mapping
const categoryNames: Record<string, string> = {
  'all': 'Tümü',
  'landscape': 'Manzara',
  'portrait': 'Portre',
  'urban': 'Şehir',
  'minimal': 'Minimal'
};

// Image optimization helper for Cloudinary URLs
const getOptimizedUrl = (url: string, width: number): string => {
  if (url.includes('cloudinary.com') && url.includes('/upload/')) {
    return url.replace('/upload/', `/upload/w_${width},f_auto,q_auto/`);
  }
  return url;
};

const PhotoModal: React.FC<PhotoModalProps> = ({ photo, onClose }) => {
  // ESC key handler
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (photo) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [photo, handleKeyDown]);

  if (!photo) return null;

  const getCategoryName = (categoryId: string): string => {
    return categoryNames[categoryId.toLowerCase()] || categoryId;
  };

  const handleShare = async () => {
    const siteUrl = 'https://mtnozr.vercel.app/';
    const shareText = `${getCategoryName(photo.category)} kategorisinden bir fotoğraf`;

    const shareData = {
      title: 'mtnozr Fotoğraf',
      text: shareText,
      url: siteUrl
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback: copy URL to clipboard
        await navigator.clipboard.writeText(siteUrl);
        alert('Site linki panoya kopyalandı!');
      }
    } catch (error) {
      // User cancelled or error
      console.log('Share cancelled or failed');
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="photo-modal-title"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-lg overflow-hidden max-w-5xl w-full max-h-[90vh] flex flex-col md:flex-row shadow-2xl relative"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
            aria-label="Kapat (ESC)"
          >
            <X size={20} />
          </button>

          {/* Image Section */}
          <div className="w-full md:w-2/3 bg-gray-100 flex items-center justify-center relative overflow-hidden group">
            <img
              src={getOptimizedUrl(photo.url, 1200)}
              srcSet={`
                ${getOptimizedUrl(photo.url, 600)} 600w,
                ${getOptimizedUrl(photo.url, 900)} 900w,
                ${getOptimizedUrl(photo.url, 1200)} 1200w
              `}
              sizes="(max-width: 768px) 100vw, 66vw"
              alt={getCategoryName(photo.category)}
              className="w-full h-full object-cover max-h-[50vh] md:max-h-[90vh]"
              loading="eager"
            />
          </div>

          {/* Details Section */}
          <div className="w-full md:w-1/3 p-8 flex flex-col justify-between bg-white">
            <div>
              <div className="mb-2">
                <span id="photo-modal-title" className="text-xs font-bold tracking-widest uppercase text-gray-500">
                  {getCategoryName(photo.category)}
                </span>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100 flex justify-between items-center text-gray-400 text-sm">
              <span>{photo.width} x {photo.height}px</span>
              <button
                onClick={handleShare}
                className="hover:text-black transition-colors p-2 -m-2 rounded-lg hover:bg-gray-100"
                title="Paylaş"
                aria-label="Fotoğrafı paylaş"
              >
                <Share2 size={18} />
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PhotoModal;