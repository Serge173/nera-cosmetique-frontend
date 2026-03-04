import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { checkoutGuard } from './core/guards/checkout.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'boutique',
    loadComponent: () => import('./features/shop/shop.component').then(m => m.ShopComponent)
  },
  {
    path: 'boutique/:categorySlug',
    loadComponent: () => import('./features/shop/shop.component').then(m => m.ShopComponent)
  },
  {
    path: 'produit/:slug',
    loadComponent: () => import('./features/product/product-detail/product-detail.component').then(m => m.ProductDetailComponent)
  },
  {
    path: 'panier',
    loadComponent: () => import('./features/cart/cart.component').then(m => m.CartComponent)
  },
  {
    path: 'commander',
    canActivate: [checkoutGuard],
    loadComponent: () => import('./features/checkout/checkout.component').then(m => m.CheckoutComponent)
  },
  {
    path: 'compte',
    canActivate: [authGuard],
    loadComponent: () => import('./features/account/profile/profile.component').then(m => m.ProfileComponent)
  },
  {
    path: 'compte/connexion',
    loadComponent: () => import('./features/account/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'compte/inscription',
    loadComponent: () => import('./features/account/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'compte/mot-de-passe-oublie',
    loadComponent: () => import('./features/account/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
  },
  {
    path: 'compte/reinitialiser-mot-de-passe',
    loadComponent: () => import('./features/account/reset-password/reset-password.component').then(m => m.ResetPasswordComponent)
  },
  {
    path: 'compte/commandes',
    canActivate: [authGuard],
    loadComponent: () => import('./features/account/orders-history/orders-history.component').then(m => m.OrdersHistoryComponent)
  },
  {
    path: 'compte/commandes/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./features/account/order-detail/order-detail.component').then(m => m.OrderDetailComponent)
  },
  {
    path: 'a-propos',
    loadComponent: () => import('./features/about/about.component').then(m => m.AboutComponent)
  },
  {
    path: 'contact',
    loadComponent: () => import('./features/contact/contact.component').then(m => m.ContactComponent)
  },
  {
    path: 'politique-confidentialite',
    loadComponent: () => import('./features/legal/privacy/privacy.component').then(m => m.PrivacyComponent)
  },
  {
    path: 'cgv',
    loadComponent: () => import('./features/legal/cgv/cgv.component').then(m => m.CgvComponent)
  },
  {
    path: 'retours',
    loadComponent: () => import('./features/legal/returns/returns.component').then(m => m.ReturnsComponent)
  },
  {
    path: 'mentions-legales',
    loadComponent: () => import('./features/legal/mentions/mentions.component').then(m => m.MentionsComponent)
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadChildren: () => import('./features/admin/admin.routes').then(m => m.adminRoutes)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
