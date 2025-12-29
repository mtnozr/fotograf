import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Calendar, X, Share2 } from 'lucide-react';
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

                <div className="prose prose-lg max-w-none text-gray-600 font-light leading-relaxed">
                    {/* Parse content and render images */}
                    {post.content.split(/(\!\[.*?\]\(.*?\))/).map((part, index) => {
                        // Check if this part is an image markdown
                        const imageMatch = part.match(/\!\[(.*?)\]\((.*?)\)/);
                        if (imageMatch) {
                            const [, alt, url] = imageMatch;
                            return (
                                <div
                                    key={index}
                                    className="my-6 cursor-zoom-in"
                                    onClick={() => {
                                        // Open image in modal - we'll use a simple approach
                                        const modal = document.createElement('div');
                                        modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 cursor-zoom-out';
                                        modal.onclick = () => {
                                            document.body.removeChild(modal);
                                            document.body.style.overflow = 'unset';
                                        };
                                        modal.innerHTML = `
                                            <button class="absolute top-4 right-4 z-10 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors" aria-label="Kapat">
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                                </svg>
                                            </button>
                                            <img src="${url}" alt="${alt}" class="max-w-full max-h-[90vh] object-contain rounded-lg" />
                                        `;
                                        document.body.appendChild(modal);
                                        document.body.style.overflow = 'hidden';

                                        // ESC key handler
                                        const handleEsc = (e: KeyboardEvent) => {
                                            if (e.key === 'Escape') {
                                                document.body.removeChild(modal);
                                                document.body.style.overflow = 'unset';
                                                document.removeEventListener('keydown', handleEsc as EventListener);
                                            }
                                        };
                                        document.addEventListener('keydown', handleEsc as EventListener);
                                    }}
                                >
                                    <img
                                        src={url}
                                        alt={alt || 'Blog görseli'}
                                        className="w-full rounded-lg hover:shadow-lg transition-shadow duration-300"
                                    />
                                </div>
                            );
                        }
                        // Regular text - preserve whitespace
                        return part ? <span key={index} style={{ whiteSpace: 'pre-wrap' }}>{part}</span> : null;
                    })}
                </div>

                {/* Share Button */}
                <div className="mt-12 pt-8 border-t border-gray-200">
                    <button
                        onClick={async () => {
                            // Clean markdown image links from excerpt
                            const cleanText = (post.excerpt || post.title)
                                .replace(/!\[.*?\]\(.*?\)/g, '')
                                .trim();

                            // Generate proper blog URL with slug
                            const blogUrl = `${window.location.origin}/blog/${post.slug}`;

                            const shareData = {
                                title: post.title,
                                text: cleanText,
                                url: blogUrl
                            };

                            try {
                                if (navigator.share) {
                                    await navigator.share(shareData);
                                } else {
                                    await navigator.clipboard.writeText(blogUrl);
                                    alert('Yazı linki panoya kopyalandı!');
                                }
                            } catch (error) {
                                console.log('Share cancelled or failed');
                            }
                        }}
                        className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-full hover:bg-gray-800 transition-colors font-medium"
                    >
                        <Share2 size={18} />
                        <span>Bu yazıyı paylaş</span>
                    </button>
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
