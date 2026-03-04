export interface Product {
  id: number;
  name: string;
  slug: string;
  shortDescription?: string;
  description?: string;
  ingredients?: string;
  usageInstructions?: string;
  price: number;
  promoPrice?: number;
  promoStartsAt?: string;
  promoEndsAt?: string;
  stockQuantity: number;
  skinType?: string;
  isFeatured: boolean;
  isNew: boolean;
  isActive: boolean;
  categoryId: number;
  category?: { id: number; name: string };
  categoryName?: string;
  brandId?: number;
  brand?: { id: number; name: string };
  brandName?: string;
  images?: ProductImage[];
  averageRating?: number;
  reviewCount?: number;
}

export interface ProductImage {
  id: number;
  url: string;
  alt?: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  parentId?: number;
  children?: Category[];
}

/** Catégorie avec le nombre de produits (actifs) pour la boutique. */
export interface CategoryWithCount extends Category {
  productCount: number;
}

export interface Brand {
  id: number;
  name: string;
  slug: string;
  logoUrl?: string;
}

export interface ProductFilter {
  category?: number;
  brand?: number;
  skinType?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
  sort?: 'price_asc' | 'price_desc' | 'popularity' | 'newest';
  q?: string;
}

export interface ProductListResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
