export interface Order {
  id: string;
  orderNumber: string;
  status: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  subtotal: number;
  shippingAmount: number;
  discountAmount: number;
  total: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  postalCode?: string;
  deliveryMethod?: string;
  paymentMethod: string;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  productSlug: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  productImageUrl?: string;
}

/** Données du formulaire de commande (livraison / paiement) */
export interface CheckoutFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  postalCode?: string;
  deliveryMethod: string;
  paymentMethod: string;
}

export interface CreateOrderDto extends CheckoutFormData {
  deliveryZoneId?: number;
  couponCode?: string;
  subtotal: number;
  shippingAmount: number;
  discountAmount: number;
  total: number;
  items: { productId: number; productName: string; productSlug: string; quantity: number; unitPrice: number; productImageUrl?: string }[];
}
