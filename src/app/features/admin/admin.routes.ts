import { Routes } from '@angular/router';
import { adminGuard } from '../../core/guards/admin.guard';

export const adminRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent)
  },
  {
    path: 'categories',
    loadComponent: () => import('./admin-categories/admin-categories.component').then(m => m.AdminCategoriesComponent)
  },
  {
    path: 'brands',
    loadComponent: () => import('./admin-brands/admin-brands.component').then(m => m.AdminBrandsComponent)
  },
  {
    path: 'products',
    loadComponent: () => import('./admin-products/admin-products.component').then(m => m.AdminProductsComponent)
  },
  {
    path: 'slides',
    loadComponent: () => import('./admin-slides/admin-slides.component').then(m => m.AdminSlidesComponent)
  },
  {
    path: 'messages',
    loadComponent: () => import('./admin-messages/admin-messages.component').then(m => m.AdminMessagesComponent)
  },
  {
    path: 'users',
    loadComponent: () => import('./admin-users/admin-users.component').then(m => m.AdminUsersComponent)
  },
  {
    path: 'stock',
    loadComponent: () => import('./admin-stock/admin-stock.component').then(m => m.AdminStockComponent)
  },
  {
    path: 'orders',
    loadComponent: () => import('./admin-orders/admin-orders.component').then(m => m.AdminOrdersComponent)
  }
];
