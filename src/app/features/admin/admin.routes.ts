import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './admin-layout/admin-layout.component';

export const adminRoutes: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    children: [
      {
        path: '',
        title: 'Tableau de bord — Nera Admin',
        loadComponent: () => import('./admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent)
      },
      {
        path: 'orders',
        title: 'Commandes — Nera Admin',
        loadComponent: () => import('./admin-orders/admin-orders.component').then(m => m.AdminOrdersComponent)
      },
      {
        path: 'products',
        title: 'Produits — Nera Admin',
        loadComponent: () => import('./admin-products/admin-products.component').then(m => m.AdminProductsComponent)
      },
      {
        path: 'clients',
        title: 'Clients — Nera Admin',
        loadComponent: () => import('./admin-customers/admin-customers.component').then(m => m.AdminCustomersComponent)
      },
      {
        path: 'avis',
        title: 'Avis & Notations — Nera Admin',
        loadComponent: () => import('./admin-reviews/admin-reviews.component').then(m => m.AdminReviewsComponent)
      },
      {
        path: 'promotions',
        title: 'Promotions — Nera Admin',
        loadComponent: () => import('./admin-promotions/admin-promotions.component').then(m => m.AdminPromotionsComponent)
      },
      {
        path: 'stock',
        title: 'Gestion des stocks — Nera Admin',
        loadComponent: () => import('./admin-stock/admin-stock.component').then(m => m.AdminStockComponent)
      },
      {
        path: 'categories',
        title: 'Catégories — Nera Admin',
        loadComponent: () => import('./admin-categories/admin-categories.component').then(m => m.AdminCategoriesComponent)
      },
      {
        path: 'brands',
        title: 'Marques — Nera Admin',
        loadComponent: () => import('./admin-brands/admin-brands.component').then(m => m.AdminBrandsComponent)
      },
      {
        path: 'rapports',
        title: 'Rapports & Analyses — Nera Admin',
        loadComponent: () => import('./admin-reports/admin-reports.component').then(m => m.AdminReportsComponent)
      },
      {
        path: 'marketing',
        title: 'Marketing — Nera Admin',
        loadComponent: () => import('./admin-marketing/admin-marketing.component').then(m => m.AdminMarketingComponent)
      },
      {
        path: 'slides',
        title: 'Slides d’accueil — Nera Admin',
        loadComponent: () => import('./admin-slides/admin-slides.component').then(m => m.AdminSlidesComponent)
      },
      {
        path: 'parametres',
        title: 'Paramètres — Nera Admin',
        loadComponent: () => import('./admin-settings/admin-settings.component').then(m => m.AdminSettingsComponent)
      },
      {
        path: 'users',
        title: 'Utilisateurs — Nera Admin',
        loadComponent: () => import('./admin-users/admin-users.component').then(m => m.AdminUsersComponent)
      },
      {
        path: 'messages',
        title: 'Support — Nera Admin',
        loadComponent: () => import('./admin-messages/admin-messages.component').then(m => m.AdminMessagesComponent)
      },
      {
        path: 'aide',
        title: 'Aide — Nera Admin',
        loadComponent: () => import('./admin-help/admin-help.component').then(m => m.AdminHelpComponent)
      },
      { path: '**', redirectTo: '' }
    ]
  }
];
