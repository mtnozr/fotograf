import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Wand2, Loader2, Share2 } from 'lucide-react';
import { Photo } from '../types';
import { generatePhotoDescription } from '../services/geminiService';

interface PhotoModalProps {
  photo: Photo | null;
  onClose: () => void;
}

const PhotoModal: React.FC<PhotoModalProps> = ({ photo, onClose }) => {
  const [description, setDescription] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Reset state when photo changes
  useEffect(() => {
    setDescription('');
    setLoading(false);
  }, [photo]);

  const handleGenerateStory = async () => {
    if (!photo) return;
    setLoading(true);
    const story = await generatePhotoDescription(photo.title, photo.category);
    setDescription(story);
    setLoading(false);
  };

  if (!photo) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
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
          >
            <X size={20} />
          </button>

          {/* Image Section */}
          <div className="w-full md:w-2/3 bg-gray-100 flex items-center justify-center relative overflow-hidden group">
            <img
              src={photo.url}
              alt={photo.title}
              className="w-full h-full object-cover max-h-[50vh] md:max-h-[90vh]"
            />
          </div>

          {/* Details Section */}
          <div className="w-full md:w-1/3 p-8 flex flex-col justify-between bg-white">
            <div>
              <div className="mb-2">
                <span className="text-xs font-bold tracking-widest uppercase text-gray-500">{photo.category}</span>
              </div>
              <h2 className="text-3xl font-serif font-light text-gray-900 mb-6">{photo.title}</h2>

              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 min-h-[120px]">
                  {loading ? (
                    <div className="flex items-center justify-center h-full text-gray-400 gap-2">
                      <Loader2 className="animate-spin" size={18} />
                      <span className="text-sm">Yapay zeka düşünüyor...</span>
                    </div>
                  ) : description ? (
                    <motion.p 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-gray-600 font-serif italic leading-relaxed text-sm"
                    >
                      "{description}"
                    </motion.p>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <p className="text-gray-400 text-sm mb-3">Bu fotoğrafın hikayesini henüz keşfetmediniz.</p>
                      <button
                        onClick={handleGenerateStory}
                        className="flex items-center gap-2 px-4 py-2 bg-black text-white text-sm rounded-full hover:bg-gray-800 transition-colors"
                      >
                        <Wand2 size={14} />
                        <span>AI ile Yorumla</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100 flex justify-between items-center text-gray-400 text-sm">
              <span>{photo.width} x {photo.height}px</span>
              <button className="hover:text-black transition-colors">
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