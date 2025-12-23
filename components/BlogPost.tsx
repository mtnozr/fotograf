import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar } from 'lucide-react';
import { BlogPost as BlogPostType } from '../types';

interface BlogPostProps {
    post: BlogPostType;
    onBack: () => void;
}

const BlogPost: React.FC<BlogPostProps> = ({ post, onBack }) => {
    return (
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
                <div className="aspect-video w-full rounded-2xl overflow-hidden mb-8">
                    <img
                        src={post.coverImage}
                        alt={post.title}
                        className="w-full h-full object-cover"
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
    );
};

export default BlogPost;
