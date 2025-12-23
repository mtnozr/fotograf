import React, { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { uploadPhotos, getCategories, createCategory, logout, getPhotos, deletePhoto, getPosts, createPost, updatePost, deletePost, getAbout, saveAbout } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { LogOut, Upload, Plus, Trash2, Image as ImageIcon, FolderPlus, FileText, PenTool, User, Save, Edit, X } from 'lucide-react';
import { Photo, PhotoCategory, BlogPost } from '../../types';

interface AboutContent {
  imageUrl: string;
  paragraph1: string;
  paragraph2: string;
  paragraph3: string;
  experience: string;
  projects: string;
  awards: string;
}

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'photos' | 'blog' | 'about'>('photos');
  const [categories, setCategories] = useState<{ id: string, name: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploading, setUploading] = useState(false);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [posts, setPosts] = useState<BlogPost[]>([]);

  // Blog form state
  const [blogTitle, setBlogTitle] = useState('');
  const [blogContent, setBlogContent] = useState('');
  const [blogCoverImage, setBlogCoverImage] = useState<File | null>(null);
  const [blogSubmitting, setBlogSubmitting] = useState(false);

  // Edit blog form state
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editCoverImage, setEditCoverImage] = useState<File | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);

  // About form state
  const [aboutContent, setAboutContent] = useState<AboutContent>({
    imageUrl: '',
    paragraph1: '',
    paragraph2: '',
    paragraph3: '',
    experience: '',
    projects: '',
    awards: ''
  });
  const [aboutImage, setAboutImage] = useState<File | null>(null);
  const [aboutSaving, setAboutSaving] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [cats, fetchedPhotos, fetchedPosts, aboutData] = await Promise.all([
        getCategories(),
        getPhotos(),
        getPosts(),
        getAbout()
      ]);
      setCategories(cats);
      if (cats.length > 0 && !selectedCategory) setSelectedCategory(cats[0].id);
      setPhotos(fetchedPhotos);
      setPosts(fetchedPosts);
      setAboutContent(aboutData);
    } catch (e) {
      console.error("Failed to fetch data", e);
      navigate('/admin/login');
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!selectedCategory) return alert('Lütfen bir kategori seçin');

    setUploading(true);
    const formData = new FormData();
    formData.append('category', selectedCategory);
    acceptedFiles.forEach(file => {
      formData.append('photos', file);
    });

    try {
      await uploadPhotos(formData, (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
        setUploadProgress(percentCompleted);
      });
      alert('Yükleme başarılı!');
      setUploadProgress(0);
      fetchData();
    } catch (error: any) {
      console.error(error);
      const errorMessage = error.response?.data?.message || error.message || 'Yükleme başarısız.';
      alert(`Yükleme hatası: ${errorMessage}`);
    } finally {
      setUploading(false);
    }
  }, [selectedCategory]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    }
  } as any);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName) return;
    try {
      await createCategory(newCategoryName);
      setNewCategoryName('');
      fetchData();
    } catch (error) {
      alert('Kategori oluşturulamadı');
    }
  };

  const handleDeletePhoto = async (id: string) => {
    if (!confirm("Bu fotoğrafı silmek istediğinize emin misiniz?")) return;
    try {
      await deletePhoto(id);
      fetchData();
    } catch (e) {
      alert("Silme başarısız");
    }
  }

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blogTitle || !blogContent) {
      alert('Başlık ve içerik gereklidir');
      return;
    }

    setBlogSubmitting(true);
    const formData = new FormData();
    formData.append('title', blogTitle);
    formData.append('content', blogContent);
    if (blogCoverImage) {
      formData.append('coverImage', blogCoverImage);
    }

    try {
      await createPost(formData, () => { });
      alert('Blog yazısı oluşturuldu!');
      setBlogTitle('');
      setBlogContent('');
      setBlogCoverImage(null);
      fetchData();
    } catch (error: any) {
      console.error(error);
      alert('Blog yazısı oluşturulamadı: ' + (error.response?.data?.message || error.message));
    } finally {
      setBlogSubmitting(false);
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!confirm("Bu blog yazısını silmek istediğinize emin misiniz?")) return;
    try {
      await deletePost(id);
      fetchData();
    } catch (e) {
      alert("Silme başarısız");
    }
  };

  const handleEditPost = (post: BlogPost) => {
    setEditingPost(post);
    setEditTitle(post.title);
    setEditContent(post.content);
    setEditCoverImage(null);
  };

  const handleUpdatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPost || !editTitle || !editContent) {
      alert('Başlık ve içerik gereklidir');
      return;
    }

    setEditSubmitting(true);
    const formData = new FormData();
    formData.append('title', editTitle);
    formData.append('content', editContent);
    if (editCoverImage) {
      formData.append('coverImage', editCoverImage);
    }

    try {
      await updatePost(editingPost.id, formData, () => { });
      alert('Blog yazısı güncellendi!');
      setEditingPost(null);
      setEditTitle('');
      setEditContent('');
      setEditCoverImage(null);
      fetchData();
    } catch (error: any) {
      console.error(error);
      alert('Blog yazısı güncellenemedi: ' + (error.response?.data?.message || error.message));
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleCloseEditModal = () => {
    setEditingPost(null);
    setEditTitle('');
    setEditContent('');
    setEditCoverImage(null);
  };

  const handleSaveAbout = async (e: React.FormEvent) => {
    e.preventDefault();
    setAboutSaving(true);

    const formData = new FormData();
    formData.append('paragraph1', aboutContent.paragraph1);
    formData.append('paragraph2', aboutContent.paragraph2);
    formData.append('paragraph3', aboutContent.paragraph3);
    formData.append('experience', aboutContent.experience);
    formData.append('projects', aboutContent.projects);
    formData.append('awards', aboutContent.awards);
    formData.append('imageUrl', aboutContent.imageUrl);

    if (aboutImage) {
      formData.append('image', aboutImage);
    }

    try {
      const savedData = await saveAbout(formData);
      setAboutContent(savedData);
      setAboutImage(null);
      alert('Hakkımda sayfası güncellendi!');
    } catch (error: any) {
      console.error(error);
      alert('Kaydetme hatası: ' + (error.response?.data?.message || error.message));
    } finally {
      setAboutSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <meta name="robots" content="noindex" />
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold font-serif">Yönetici Paneli</h1>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-gray-600 hover:text-red-600 transition-colors"
          >
            <LogOut size={18} />
            <span>Çıkış</span>
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-6 pt-6">
        <div className="flex gap-4 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('photos')}
            className={`flex items-center gap-2 pb-3 px-1 border-b-2 transition-colors ${activeTab === 'photos'
              ? 'border-black text-black'
              : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
          >
            <ImageIcon size={18} />
            Fotoğraflar
          </button>
          <button
            onClick={() => setActiveTab('blog')}
            className={`flex items-center gap-2 pb-3 px-1 border-b-2 transition-colors ${activeTab === 'blog'
              ? 'border-black text-black'
              : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
          >
            <PenTool size={18} />
            Blog Yazıları
          </button>
          <button
            onClick={() => setActiveTab('about')}
            className={`flex items-center gap-2 pb-3 px-1 border-b-2 transition-colors ${activeTab === 'about'
              ? 'border-black text-black'
              : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
          >
            <User size={18} />
            Hakkımda
          </button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-8">

        {/* Photos Tab */}
        {activeTab === 'photos' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Left Column: Controls */}
            <div className="space-y-8">
              {/* Category Management */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <FolderPlus size={20} />
                  Kategoriler
                </h2>

                <form onSubmit={handleCreateCategory} className="flex gap-2 mb-6">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Yeni Kategori Adı"
                    className="flex-1 px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-black"
                  />
                  <button type="submit" className="bg-black text-white p-2 rounded hover:bg-gray-800">
                    <Plus size={18} />
                  </button>
                </form>

                <div className="space-y-2">
                  <label className="text-sm text-gray-500 block mb-1">Aktif Kategori (Yükleme İçin)</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded focus:outline-none focus:border-black"
                  >
                    <option value="" disabled>Seçiniz...</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Upload Area */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Upload size={20} />
                  Fotoğraf Yükle
                </h2>

                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${isDragActive ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-400'
                    }`}
                >
                  <input {...getInputProps()} />
                  <div className="flex flex-col items-center gap-2 text-gray-500">
                    <ImageIcon size={32} />
                    {isDragActive ? (
                      <p>Dosyaları buraya bırakın...</p>
                    ) : (
                      <p>Dosyaları sürükleyin veya seçmek için tıklayın</p>
                    )}
                    <span className="text-xs text-gray-400">JPG, PNG, WEBP (Max 10MB)</span>
                  </div>
                </div>

                {uploading && (
                  <div className="mt-4">
                    <div className="flex justify-between text-xs mb-1">
                      <span>Yükleniyor...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-black h-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Gallery Preview */}
            <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold mb-6">Son Yüklenenler</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {photos.slice().reverse().map(photo => (
                  <div key={photo.id} className="relative group aspect-square bg-gray-100 rounded overflow-hidden">
                    <img src={photo.url} alt={photo.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        onClick={() => handleDeletePhoto(photo.id)}
                        className="bg-white text-red-600 p-2 rounded-full hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                      {photo.title}
                    </div>
                  </div>
                ))}
                {photos.length === 0 && (
                  <div className="col-span-full py-12 text-center text-gray-400">
                    Henüz fotoğraf yüklenmemiş.
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* Blog Tab */}
        {activeTab === 'blog' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Left Column: Create Post Form */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText size={20} />
                Yeni Blog Yazısı
              </h2>

              <form onSubmit={handleCreatePost} className="space-y-4">
                <div>
                  <label className="text-sm text-gray-500 block mb-1">Başlık</label>
                  <input
                    type="text"
                    value={blogTitle}
                    onChange={(e) => setBlogTitle(e.target.value)}
                    placeholder="Blog yazısı başlığı"
                    className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-500 block mb-1">Kapak Görseli (Opsiyonel)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setBlogCoverImage(e.target.files?.[0] || null)}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-500 block mb-1">İçerik</label>
                  <textarea
                    value={blogContent}
                    onChange={(e) => setBlogContent(e.target.value)}
                    placeholder="Blog yazısı içeriği..."
                    rows={10}
                    className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-black resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={blogSubmitting}
                  className="w-full bg-black text-white py-3 rounded font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  {blogSubmitting ? 'Yayınlanıyor...' : 'Yayınla'}
                </button>
              </form>
            </div>

            {/* Right Column: Posts List */}
            <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold mb-6">Blog Yazıları</h2>
              <div className="space-y-4">
                {posts.map(post => (
                  <div key={post.id} className="flex gap-4 p-4 border border-gray-100 rounded-lg hover:border-gray-200 transition-colors">
                    {post.coverImage && (
                      <img src={post.coverImage} alt={post.title} className="w-24 h-24 object-cover rounded" />
                    )}
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 mb-1">{post.title}</h3>
                      <p className="text-sm text-gray-500 mb-2 line-clamp-2">{post.excerpt}</p>
                      <span className="text-xs text-gray-400">
                        {new Date(post.date).toLocaleDateString('tr-TR')}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditPost(post)}
                        className="text-gray-400 hover:text-blue-600 transition-colors p-2"
                        title="Düzenle"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="text-gray-400 hover:text-red-600 transition-colors p-2"
                        title="Sil"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
                {posts.length === 0 && (
                  <div className="py-12 text-center text-gray-400">
                    Henüz blog yazısı yok.
                  </div>
                )}
              </div>
            </div>

            {/* Edit Modal */}
            {editingPost && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold">Blog Yazısını Düzenle</h3>
                    <button
                      onClick={handleCloseEditModal}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <form onSubmit={handleUpdatePost} className="p-6 space-y-4">
                    <div>
                      <label className="text-sm text-gray-500 block mb-1">Başlık</label>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="Blog yazısı başlığı"
                        className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-black"
                      />
                    </div>

                    <div>
                      <label className="text-sm text-gray-500 block mb-1">Mevcut Kapak Görseli</label>
                      {editingPost.coverImage && (
                        <img src={editingPost.coverImage} alt="Cover" className="w-full h-32 object-cover rounded mb-2" />
                      )}
                      <label className="text-sm text-gray-500 block mb-1">Yeni Kapak Görseli (Opsiyonel)</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setEditCoverImage(e.target.files?.[0] || null)}
                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                      />
                    </div>

                    <div>
                      <label className="text-sm text-gray-500 block mb-1">İçerik</label>
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        placeholder="Blog yazısı içeriği..."
                        rows={10}
                        className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-black resize-none"
                      />
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={handleCloseEditModal}
                        className="flex-1 bg-gray-100 text-gray-700 py-3 rounded font-medium hover:bg-gray-200 transition-colors"
                      >
                        İptal
                      </button>
                      <button
                        type="submit"
                        disabled={editSubmitting}
                        className="flex-1 bg-black text-white py-3 rounded font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <Save size={18} />
                        {editSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

          </div>
        )}

        {/* About Tab */}
        {activeTab === 'about' && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <User size={20} />
                Hakkımda Sayfasını Düzenle
              </h2>

              <form onSubmit={handleSaveAbout} className="space-y-6">
                {/* Image */}
                <div>
                  <label className="text-sm text-gray-500 block mb-2">Kapak Görseli</label>
                  {aboutContent.imageUrl && (
                    <img src={aboutContent.imageUrl} alt="Current" className="w-full h-48 object-cover rounded-lg mb-3" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setAboutImage(e.target.files?.[0] || null)}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                  />
                </div>

                {/* Paragraphs */}
                <div>
                  <label className="text-sm text-gray-500 block mb-1">1. Paragraf</label>
                  <textarea
                    value={aboutContent.paragraph1}
                    onChange={(e) => setAboutContent({ ...aboutContent, paragraph1: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-500 block mb-1">2. Paragraf</label>
                  <textarea
                    value={aboutContent.paragraph2}
                    onChange={(e) => setAboutContent({ ...aboutContent, paragraph2: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-500 block mb-1">3. Paragraf</label>
                  <textarea
                    value={aboutContent.paragraph3}
                    onChange={(e) => setAboutContent({ ...aboutContent, paragraph3: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-black"
                  />
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm text-gray-500 block mb-1">Deneyim</label>
                    <input
                      type="text"
                      value={aboutContent.experience}
                      onChange={(e) => setAboutContent({ ...aboutContent, experience: e.target.value })}
                      placeholder="8+ Yıl"
                      className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-black"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 block mb-1">Projeler</label>
                    <input
                      type="text"
                      value={aboutContent.projects}
                      onChange={(e) => setAboutContent({ ...aboutContent, projects: e.target.value })}
                      placeholder="150+ Tamamlanan"
                      className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-black"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 block mb-1">Ödüller</label>
                    <input
                      type="text"
                      value={aboutContent.awards}
                      onChange={(e) => setAboutContent({ ...aboutContent, awards: e.target.value })}
                      placeholder="12 Ulusal"
                      className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-black"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={aboutSaving}
                  className="w-full bg-black text-white py-3 rounded font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Save size={18} />
                  {aboutSaving ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default Dashboard;
