import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Calendar, X } from 'lucide-react';
import { BlogPost as BlogPostType } from '../types';

interface BlogPostProps {
    post: BlogPostType;
    onBack: () => void;
}

const BlogPost: React.FC<BlogPostProps> = ({ post, onBack }) => {
    const [imageModalOpen, setImageModalOpen] = useState(false);

    // ESC key handler
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            setImageModalOpen(false);
        }
    }, []);

    useEffect(() => {
        if (imageModalOpen) {
            document.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'unset';
        };
    }, [imageModalOpen, handleKeyDown]);

    return (
        <>
            <motion.article
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="max-w-3xl mx-auto"
            >
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors mb-8"
                >
                    <ArrowLeft size={20} />
                    <span>Geri Dön</span>
                </button>

                {post.coverImage && (
                    <div
                        className="aspect-video w-full rounded-2xl overflow-hidden mb-8 cursor-zoom-in"
                        onClick={() => setImageModalOpen(true)}
                    >
                        <img
                            src={post.coverImage}
                            alt={post.title}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                    </div>
                )}

                <div className="flex items-center gap-2 text-gray-400 text-sm mb-4">
                    <Calendar size={14} />
                    <span>{new Date(post.date).toLocaleDateString('tr-TR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })}</span>
                </div>

                <h1 className="text-4xl md:text-5xl font-serif font-light text-gray-900 mb-8">
                    {post.title}
                </h1>

                <div
                    className="prose prose-lg max-w-none text-gray-600 font-light leading-relaxed"
                    style={{ whiteSpace: 'pre-wrap' }}
                >
                    {post.content}
                </div>
            </motion.article>

            {/* Image Lightbox Modal */}
            <AnimatePresence>
                {imageModalOpen && post.coverImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setImageModalOpen(false)}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 cursor-zoom-out"
                        role="dialog"
                        aria-modal="true"
                    >
                        <button
                            onClick={() => setImageModalOpen(false)}
                            className="absolute top-4 right-4 z-10 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
                            aria-label="Kapat (ESC)"
                        >
                            <X size={24} />
                        </button>

                        <motion.img
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            src={post.coverImage}
                            alt={post.title}
                            className="max-w-full max-h-[90vh] object-contain rounded-lg"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default BlogPost;
