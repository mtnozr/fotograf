import React, { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { uploadPhotos, getCategories, createCategory, logout, getPhotos, deletePhoto } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { LogOut, Upload, Plus, Trash2, Image as ImageIcon, FolderPlus } from 'lucide-react';
import { Photo, PhotoCategory } from '../../types';

const Dashboard: React.FC = () => {
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploading, setUploading] = useState(false);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
      try {
        const cats = await getCategories();
        setCategories(cats);
        if (cats.length > 0 && !selectedCategory) setSelectedCategory(cats[0].id);

        const fetchedPhotos = await getPhotos();
        setPhotos(fetchedPhotos);
      } catch (e) {
          console.error("Failed to fetch data", e);
          // Likely auth error
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
      fetchData(); // Refresh list
    } catch (error) {
      console.error(error);
      alert('Yükleme başarısız.');
    } finally {
      setUploading(false);
    }
  }, [selectedCategory]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    }
  });

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
      if(!confirm("Bu fotoğrafı silmek istediğinize emin misiniz?")) return;
      try {
          await deletePhoto(id);
          fetchData();
      } catch (e) {
          alert("Silme başarısız");
      }
  }

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

      <main className="max-w-7xl mx-auto px-6 py-8">
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
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-400'
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
      </main>
    </div>
  );
};

export default Dashboard;
