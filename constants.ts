import { Photo, PhotoCategory } from './types';

export const PHOTOS: Photo[] = [
  {
    id: '1',
    url: 'https://picsum.photos/800/1200?random=1',
    category: PhotoCategory.PORTRAIT,
    title: 'Sessiz Bakış',
    width: 800,
    height: 1200,
  },
  {
    id: '2',
    url: 'https://picsum.photos/1200/800?random=2',
    category: PhotoCategory.LANDSCAPE,
    title: 'Sisli Dağlar',
    width: 1200,
    height: 800,
  },
  {
    id: '3',
    url: 'https://picsum.photos/800/800?random=3',
    category: PhotoCategory.MINIMAL,
    title: 'Beyaz Denge',
    width: 800,
    height: 800,
  },
  {
    id: '4',
    url: 'https://picsum.photos/900/1400?random=4',
    category: PhotoCategory.URBAN,
    title: 'Gece Işıkları',
    width: 900,
    height: 1400,
  },
  {
    id: '5',
    url: 'https://picsum.photos/1200/900?random=5',
    category: PhotoCategory.LANDSCAPE,
    title: 'Sonbahar Yolu',
    width: 1200,
    height: 900,
  },
  {
    id: '6',
    url: 'https://picsum.photos/800/1100?random=6',
    category: PhotoCategory.PORTRAIT,
    title: 'Gölge Oyunu',
    width: 800,
    height: 1100,
  },
  {
    id: '7',
    url: 'https://picsum.photos/1000/1000?random=7',
    category: PhotoCategory.MINIMAL,
    title: 'Geometrik',
    width: 1000,
    height: 1000,
  },
  {
    id: '8',
    url: 'https://picsum.photos/1100/700?random=8',
    category: PhotoCategory.URBAN,
    title: 'Metro İstasyonu',
    width: 1100,
    height: 700,
  },
  {
    id: '9',
    url: 'https://picsum.photos/800/1200?random=9',
    category: PhotoCategory.LANDSCAPE,
    title: 'Okyanus Kenarı',
    width: 800,
    height: 1200,
  },
];

export const NAV_ITEMS = [
  { label: 'Portfolyo', id: 'portfolio' },
  { label: 'Hakkımda', id: 'about' },
  { label: 'İletişim', id: 'contact' },
];