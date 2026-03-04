import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const isAdminRequest = req.url.includes('/admin/');

      if (error.status === 401 && isAdminRequest) {
        authService.logout();
        router.navigate(['/compte/connexion'], { queryParams: { returnUrl: req.url.includes('/admin') ? '/admin' : undefined } });
        return throwError(() => new Error('Session expirée ou non autorisée. Veuillez vous reconnecter.'));
      }

      let errorMessage = 'Une erreur est survenue';
      if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.status === 401) {
        const isAuthEndpoint = /\/auth\/(login|register)$/.test(req.url);
        errorMessage = isAuthEndpoint ? 'Email ou mot de passe incorrect' : 'Non autorisé. Veuillez vous connecter.';
      } else if (error.status === 403) {
        errorMessage = 'Accès refusé';
      } else if (error.status === 404) {
        errorMessage = 'Ressource non trouvée';
      } else if (error.status >= 500) {
        errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
      } else if (error.status === 0) {
        errorMessage = 'Serveur inaccessible. Vérifiez que le backend est démarré (port 5000).';
      }

      if (error.status !== 401 || !isAdminRequest) {
        console.error('HTTP Error:', error.status, errorMessage, req.url);
      }
      return throwError(() => new Error(errorMessage));
    })
  );
};
