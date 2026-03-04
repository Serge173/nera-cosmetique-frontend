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
    path: 'users',
    loadComponent: () => import('./admin-users/admin-users.component').then(m => m.AdminUsersComponent)
  },
  {
    path: 'products',
    loadComponent: () => import('./admin-products/admin-products.component').then(m => m.AdminProductsComponent)
  },
  {
    path: 'orders',
    loadComponent: () => import('./admin-orders/admin-orders.component').then(m => m.AdminOrdersComponent)
  }
];
