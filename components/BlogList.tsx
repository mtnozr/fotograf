import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, ArrowRight } from 'lucide-react';
import { BlogPost } from '../types';

interface BlogListProps {
    posts: BlogPost[];
    onPostClick: (post: BlogPost) => void;
}

const BlogList: React.FC<BlogListProps> = ({ posts, onPostClick }) => {
    if (posts.length === 0) {
        return (
            <div className="text-center py-20 text-gray-400">
                <p>Henüz blog yazısı bulunmuyor.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post, index) => (
                <motion.article
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => onPostClick(post)}
                    className="group cursor-pointer bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300"
                >
                    {post.coverImage && (
                        <div className="aspect-video overflow-hidden">
                            <img
                                src={post.coverImage}
                                alt={post.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                        </div>
                    )}
                    <div className="p-6">
                        <div className="flex items-center gap-2 text-gray-400 text-sm mb-3">
                            <Calendar size={14} />
                            <span>{new Date(post.date).toLocaleDateString('tr-TR', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}</span>
                        </div>
                        <h3 className="text-xl font-serif font-medium text-gray-900 mb-3 group-hover:text-gray-600 transition-colors">
                            {post.title}
                        </h3>
                        <p className="text-gray-500 text-sm leading-relaxed mb-4">
                            {post.excerpt}
                        </p>
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-900 group-hover:gap-3 transition-all">
                            <span>Devamını Oku</span>
                            <ArrowRight size={16} />
                        </div>
                    </div>
                </motion.article>
            ))}
        </div>
    );
};

export default BlogList;
