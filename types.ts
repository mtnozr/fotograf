export enum PhotoCategory {
  ALL = 'Tümü',
  LANDSCAPE = 'Manzara',
  PORTRAIT = 'Portre',
  URBAN = 'Şehir',
  MINIMAL = 'Minimal'
}

export interface Photo {
  id: string;
  url: string;
  category: PhotoCategory;
  title: string;
  width: number;
  height: number;
}

export interface NavItem {
  label: string;
  id: string;
}

export interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  coverImage: string;
  date: string;
  slug: string;
}