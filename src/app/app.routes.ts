import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { checkoutGuard } from './core/guards/checkout.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  {
    path: '',
    title: 'Nera Cosmétique - Produits cosmétiques importés de France',
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'boutique',
    title: 'Boutique — Nera Cosmétique',
    loadComponent: () => import('./features/shop/shop.component').then(m => m.ShopComponent)
  },
  {
    path: 'boutique/:categorySlug',
    title: 'Boutique — Nera Cosmétique',
    loadComponent: () => import('./features/shop/shop.component').then(m => m.ShopComponent)
  },
  {
    path: 'produit/:slug',
    title: 'Produit — Nera Cosmétique',
    loadComponent: () => import('./features/product/product-detail/product-detail.component').then(m => m.ProductDetailComponent)
  },
  {
    path: 'panier',
    title: 'Mon panier — Nera Cosmétique',
    loadComponent: () => import('./features/cart/cart.component').then(m => m.CartComponent)
  },
  {
    path: 'commander',
    title: 'Finaliser ma commande — Nera Cosmétique',
    canActivate: [checkoutGuard],
    loadComponent: () => import('./features/checkout/checkout.component').then(m => m.CheckoutComponent)
  },
  {
    path: 'compte/connexion',
    title: 'Connexion — Nera Cosmétique',
    loadComponent: () => import('./features/account/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'compte/inscription',
    title: 'Créer un compte — Nera Cosmétique',
    loadComponent: () => import('./features/account/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'compte/mot-de-passe-oublie',
    title: 'Mot de passe oublié — Nera Cosmétique',
    loadComponent: () => import('./features/account/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
  },
  {
    path: 'compte/reinitialiser-mot-de-passe',
    title: 'Nouveau mot de passe — Nera Cosmétique',
    loadComponent: () => import('./features/account/reset-password/reset-password.component').then(m => m.ResetPasswordComponent)
  },
  {
    path: 'compte',
    canActivate: [authGuard],
    loadChildren: () => import('./features/account/account.routes').then(m => m.accountRoutes)
  },
  {
    path: 'a-propos',
    title: 'À propos — Nera Cosmétique',
    loadComponent: () => import('./features/about/about.component').then(m => m.AboutComponent)
  },
  {
    path: 'contact',
    title: 'Contact — Nera Cosmétique',
    loadComponent: () => import('./features/contact/contact.component').then(m => m.ContactComponent)
  },
  {
    path: 'politique-confidentialite',
    title: 'Politique de confidentialité — Nera Cosmétique',
    data: { slug: 'politique-confidentialite', label: 'Politique de confidentialité' },
    loadComponent: () => import('./features/legal/legal-page.component').then(m => m.LegalPageComponent)
  },
  {
    path: 'cgv',
    title: 'Conditions générales de vente — Nera Cosmétique',
    data: { slug: 'cgv', label: 'Conditions générales de vente' },
    loadComponent: () => import('./features/legal/legal-page.component').then(m => m.LegalPageComponent)
  },
  {
    path: 'retours',
    title: 'Politique de retour — Nera Cosmétique',
    data: { slug: 'retours', label: 'Politique de retour' },
    loadComponent: () => import('./features/legal/legal-page.component').then(m => m.LegalPageComponent)
  },
  {
    path: 'mentions-legales',
    title: 'Mentions légales — Nera Cosmétique',
    data: { slug: 'mentions-legales', label: 'Mentions légales' },
    loadComponent: () => import('./features/legal/legal-page.component').then(m => m.LegalPageComponent)
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
