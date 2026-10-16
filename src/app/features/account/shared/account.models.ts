export interface LoyaltyTier {
  key: string;
  label: string;
  next: { key: string; label: string; min: number; missing: number } | null;
  progress: number;
}

export interface FavoriteProduct {
  productId: number;
  name: string;
  slug: string;
  price: number;
  promoPrice: number | null;
  stock: number;
  brandName: string | null;
  image: string | null;
  addedAt: string;
}

export interface Address {
  id: number;
  label: string | null;
  firstName: string;
  lastName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  isDefault: boolean;
  updatedAt: string;
}

export interface AccountOverview {
  user: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    memberSince: string;
    city: string | null;
  };
  orders: { total: number; inProgress: number; delivered: number; cancelled: number; spent: number };
  lastOrder: {
    id: string;
    orderNumber: string;
    createdAt: string;
    status: string;
    total: number;
    items: number;
    images: string[];
  } | null;
  activeOrders: { id: string; orderNumber: string; status: string; updatedAt: string }[];
  favorites: { count: number; items: FavoriteProduct[] };
  address: Address | null;
  addressesCount: number;
  reviewsCount: number;
  loyalty: { points: number; value: number; lifetime: number; tier: LoyaltyTier };
}

export interface LoyaltyVoucher {
  code: string;
  value: number;
  points: number;
  validTo: string | null;
  createdAt: string;
  state: 'active' | 'used' | 'expired' | 'disabled';
}

export interface LoyaltyDetails {
  points: number;
  value: number;
  lifetime: number;
  tier: LoyaltyTier;
  tiers: { key: string; label: string; min: number }[];
  rules: { amountPerPoint: number; pointValue: number; minRedeem: number; redeemStep: number; voucherValidityDays: number };
  history: { orderId: string; orderNumber: string; date: string; amount: number; points: number }[];
  vouchers: LoyaltyVoucher[];
}

export interface MyReview {
  id: number;
  rating: number;
  title: string | null;
  comment: string | null;
  isApproved: boolean;
  createdAt: string;
  product: { id: number; name: string; slug: string; image: string | null };
}

export interface ProductToReview {
  productId: number;
  name: string;
  slug: string;
  image: string | null;
  deliveredAt: string;
}

export function effectivePrice(p: { price: number; promoPrice: number | null }): number {
  return p.promoPrice != null && p.promoPrice > 0 ? p.promoPrice : p.price;
}
