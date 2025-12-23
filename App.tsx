import React, { useState, useMemo, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Camera, Mail, Instagram, PenTool } from 'lucide-react';

import PhotoGrid from './components/PhotoGrid';
import PhotoModal from './components/PhotoModal';
import BlogList from './components/BlogList';
import BlogPostView from './components/BlogPost';
import Login from './components/admin/Login';
import Dashboard from './components/admin/Dashboard';
import { NAV_ITEMS } from './constants';
import { Photo, PhotoCategory, BlogPost } from './types';
import { getPhotos, getCategories, getPosts, getAbout } from './services/api';

const Portfolio: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [activeSection, setActiveSection] = useState<string>('blog');
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [categories, setCategories] = useState<{ id: string, name: string }[]>([]);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [aboutContent, setAboutContent] = useState<{
    imageUrl: string;
    paragraph1: string;
    paragraph2: string;
    paragraph3: string;
    experience: string;
    projects: string;
    awards: string;
  } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fetchedPhotos, fetchedCategories, fetchedPosts, aboutData] = await Promise.all([
          getPhotos(),
          getCategories(),
          getPosts(),
          getAbout()
        ]);
        setPhotos(fetchedPhotos);
        setCategories([{ id: 'all', name: 'Tümü' }, ...fetchedCategories]);
        setPosts(fetchedPosts);
        setAboutContent(aboutData);
      } catch (error) {
        console.error("Could not fetch data, using static fallback if available", error);
      }
    };
    fetchData();
  }, []);

  const filteredPhotos = useMemo(() => {
    if (activeCategory === 'all') {
      return photos;
    }
    return photos.filter((photo) => photo.category === activeCategory);
  }, [activeCategory, photos]);

  return (
    <div className="min-h-screen bg-[#fafafa] text-gray-900 selection:bg-black selection:text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveSection('blog')}>
            <div className="w-10 h-8 bg-black text-white flex items-center justify-center rounded-full gap-1">
              <Camera size={14} />
              <PenTool size={12} />
            </div>
            <span className="font-serif text-xl font-bold tracking-tight">mtnozr</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`text-sm font-medium tracking-wide transition-colors ${activeSection === item.id ? 'text-black' : 'text-gray-400 hover:text-gray-600'
                  }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="pt-32 pb-20 px-6 max-w-7xl mx-auto min-h-screen">

        {/* Portfolio Section */}
        {activeSection === 'portfolio' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <header className="mb-16 text-center max-w-2xl mx-auto">
              <h1 className="text-5xl md:text-6xl font-serif mb-6 text-gray-900">
                mtnozr fotoğraf portföyü
              </h1>
              <p className="text-gray-500 leading-relaxed">
                Dünyayı ışık ve gölgeyle yakalamak. Her karede sessiz bir hikaye, her açıda yeni bir perspektif.
              </p>
            </header>

            {/* Filters */}
            <div className="flex flex-wrap justify-center gap-4 mb-12">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`px-5 py-2 rounded-full text-sm transition-all duration-300 ${activeCategory === category.id
                    ? 'bg-black text-white shadow-lg'
                    : 'bg-white text-gray-500 hover:bg-gray-100 border border-transparent hover:border-gray-200'
                    }`}
                >
                  {category.name}
                </button>
              ))}
            </div>

            <PhotoGrid photos={filteredPhotos} onPhotoClick={setSelectedPhoto} />
          </motion.div>
        )}

        {/* Blog Section */}
        {activeSection === 'blog' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            {selectedPost ? (
              <BlogPostView post={selectedPost} onBack={() => setSelectedPost(null)} />
            ) : (
              <>
                <header className="mb-16 text-center max-w-2xl mx-auto">
                  <h1 className="text-5xl md:text-6xl font-serif mb-6 text-gray-900">
                    Blog
                  </h1>
                  <p className="text-gray-500 leading-relaxed">
                    Fotoğrafçılık, teknoloji ve yaratıcılık üzerine düşüncelerim.
                  </p>
                </header>
                <BlogList posts={posts} onPostClick={setSelectedPost} />
              </>
            )}
          </motion.div>
        )}

        {/* About Section */}
        {activeSection === 'about' && aboutContent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-3xl mx-auto pt-10"
          >
            <div className="aspect-video w-full bg-gray-200 rounded-xl overflow-hidden mb-12">
              <img src={aboutContent.imageUrl} className="w-full h-full object-cover" alt="Photographer working" />
            </div>
            <h2 className="text-4xl font-serif mb-8">Hakkımda</h2>
            <div className="prose prose-lg text-gray-600 font-light">
              {aboutContent.paragraph1 && <p className="mb-6">{aboutContent.paragraph1}</p>}
              {aboutContent.paragraph2 && <p className="mb-6">{aboutContent.paragraph2}</p>}
              {aboutContent.paragraph3 && <p>{aboutContent.paragraph3}</p>}
            </div>

            <div className="mt-12 pt-12 border-t border-gray-200 flex gap-8">
              {aboutContent.experience && (
                <div className="flex flex-col">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Deneyim</span>
                  <span className="text-xl font-serif">{aboutContent.experience}</span>
                </div>
              )}
              {aboutContent.projects && (
                <div className="flex flex-col">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Projeler</span>
                  <span className="text-xl font-serif">{aboutContent.projects}</span>
                </div>
              )}
              {aboutContent.awards && (
                <div className="flex flex-col">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Ödüller</span>
                  <span className="text-xl font-serif">{aboutContent.awards}</span>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Contact Section */}
        {activeSection === 'contact' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-2xl mx-auto pt-10 text-center"
          >
            <h2 className="text-4xl font-serif mb-6">Merhaba! 👋</h2>
            <p className="text-gray-500 mb-12 text-lg">
              Yeni bir proje için fikirleriniz mi var? Yoksa sadece merhaba demek mi istiyorsunuz?
            </p>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-left mb-12">
              <form
                className="space-y-6"
                action="https://formspree.io/f/mtnozr@gmail.com"
                method="POST"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  const submitBtn = form.querySelector('button[type="submit"]') as HTMLButtonElement;
                  const originalText = submitBtn.innerText;

                  submitBtn.disabled = true;
                  submitBtn.innerText = 'Gönderiliyor...';

                  try {
                    const formData = new FormData(form);
                    const response = await fetch('https://formspree.io/f/mtnozr@gmail.com', {
                      method: 'POST',
                      body: formData,
                      headers: {
                        'Accept': 'application/json'
                      }
                    });

                    if (response.ok) {
                      alert('Mesajınız başarıyla gönderildi! En kısa sürede size dönüş yapacağım.');
                      form.reset();
                    } else {
                      throw new Error('Gönderim başarısız');
                    }
                  } catch (error) {
                    alert('Mesaj gönderilemedi. Lütfen doğrudan email ile iletişime geçin: mtnozr@gmail.com');
                  } finally {
                    submitBtn.disabled = false;
                    submitBtn.innerText = originalText;
                  }
                }}
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">İsim</label>
                  <input type="text" name="name" required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none transition-all" placeholder="Adınız Soyadınız" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">E-posta</label>
                  <input type="email" name="email" required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none transition-all" placeholder="ornek@email.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mesaj</label>
                  <textarea name="message" rows={4} required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none transition-all" placeholder="Projenizden bahsedin..."></textarea>
                </div>
                <button type="submit" className="w-full bg-black text-white py-4 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  Gönder
                </button>
              </form>
            </div>

            <div className="flex justify-center gap-8">
              <a href="mailto:mtnozr@gmail.com" className="flex flex-col items-center gap-2 group">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
                  <Mail size={20} />
                </div>
                <span className="text-sm font-medium">mtnozr@gmail.com</span>
              </a>
              <a href="https://instagram.com/mtnozrr" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 group">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
                  <Instagram size={20} />
                </div>
                <span className="text-sm font-medium">@mtnozrr</span>
              </a>
            </div>
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-12 text-center text-gray-400 text-sm">
        <p>&copy; {new Date().getFullYear()} mtnozr Photography. Tüm hakları saklıdır.</p>
      </footer>

      {/* Modal */}
      {selectedPhoto && (
        <PhotoModal
          photo={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
        />
      )}
    </div>
  );
};

const ProtectedRoute = ({ children }: { children: React.ReactElement }) => {
  const token = localStorage.getItem('token');
  const location = useLocation();

  if (!token) {
    return <Login />;
  }

  return children;
};

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Portfolio />} />
        <Route path="/admin/login" element={<Login />} />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;