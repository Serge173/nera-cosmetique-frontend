import { Routes } from '@angular/router';
import { AccountLayoutComponent } from './account-layout/account-layout.component';

export const accountRoutes: Routes = [
  {
    path: '',
    component: AccountLayoutComponent,
    children: [
      {
        path: '',
        title: 'Mon tableau de bord — Nera Cosmétique',
        loadComponent: () => import('./account-dashboard/account-dashboard.component').then((m) => m.AccountDashboardComponent),
      },
      {
        path: 'profil',
        title: 'Mon profil — Nera Cosmétique',
        loadComponent: () => import('./profile/profile.component').then((m) => m.ProfileComponent),
      },
      {
        path: 'commandes',
        title: 'Mes commandes — Nera Cosmétique',
        loadComponent: () => import('./orders-history/orders-history.component').then((m) => m.OrdersHistoryComponent),
      },
      {
        path: 'commandes/:id',
        title: 'Détail de commande — Nera Cosmétique',
        loadComponent: () => import('./order-detail/order-detail.component').then((m) => m.OrderDetailComponent),
      },
      {
        path: 'favoris',
        title: 'Mes favoris — Nera Cosmétique',
        loadComponent: () => import('./account-favorites/account-favorites.component').then((m) => m.AccountFavoritesComponent),
      },
      {
        path: 'avis',
        title: 'Mes avis — Nera Cosmétique',
        loadComponent: () => import('./account-reviews/account-reviews.component').then((m) => m.AccountReviewsComponent),
      },
      {
        path: 'adresses',
        title: 'Mes adresses — Nera Cosmétique',
        loadComponent: () => import('./account-addresses/account-addresses.component').then((m) => m.AccountAddressesComponent),
      },
      {
        path: 'fidelite',
        title: 'Mes points fidélité — Nera Cosmétique',
        loadComponent: () => import('./account-loyalty/account-loyalty.component').then((m) => m.AccountLoyaltyComponent),
      },
      {
        path: 'support',
        title: 'Service client — Nera Cosmétique',
        loadComponent: () => import('./account-support/account-support.component').then((m) => m.AccountSupportComponent),
      },
      { path: '**', redirectTo: '' },
    ],
  },
];
