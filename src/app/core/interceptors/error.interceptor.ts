import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, finalize, map, shareReplay, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { StorageService } from '../services/storage.service';
import { ToastService } from '../services/toast.service';

const NO_REFRESH = /\/auth\/(login|register|refresh|forgot-password|reset-password|dev-reset-password)$/;
const PROTECTED_PAGE = /^\/(admin|commander)(\/|\?|#|$)|^\/compte(?!\/(connexion|inscription|mot-de-passe-oublie|reinitialiser-mot-de-passe)(\/|\?|#|$))(\/|\?|#|$)/;

let refresh$: Observable<string> | null = null;

function refreshAccessToken(auth: AuthService): Observable<string> {
  if (!refresh$) {
    refresh$ = auth.refreshToken().pipe(
      map((res) => res.accessToken),
      finalize(() => (refresh$ = null)),
      shareReplay(1),
    );
  }
  return refresh$;
}

function toError(error: HttpErrorResponse, req: HttpRequest<unknown>): Error {
  let message = 'Une erreur est survenue';
  if (error.error?.message && typeof error.error.message === 'string') {
    message = error.error.message;
  } else if (error.status === 401) {
    message = /\/auth\/(login|register)$/.test(req.url) ? 'Email ou mot de passe incorrect' : 'Non autorisé. Veuillez vous connecter.';
  } else if (error.status === 403) {
    message = 'Accès refusé';
  } else if (error.status === 404) {
    message = 'Ressource non trouvée';
  } else if (error.status >= 500) {
    message = 'Erreur serveur. Veuillez réessayer plus tard.';
  } else if (error.status === 0) {
    message = 'Serveur inaccessible. Vérifiez votre connexion internet.';
  }
  return new Error(message);
}

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const auth = inject(AuthService);
  const storage = inject(StorageService);
  const toast = inject(ToastService);

  const sessionExpired = () => {
    if (!auth.isAuthenticated()) return;
    auth.logout();
    const current = router.url;
    if (PROTECTED_PAGE.test(current)) {
      toast.info('Votre session a expiré. Merci de vous reconnecter.');
      router.navigate(['/compte/connexion'], { queryParams: { returnUrl: current } });
    }
  };

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const sentWithToken = req.headers.has('Authorization');
      const canRefresh = error.status === 401 && sentWithToken && !NO_REFRESH.test(req.url) && !!storage.get<string>('refreshToken');

      if (canRefresh) {
        return refreshAccessToken(auth).pipe(
          catchError(() => {
            sessionExpired();
            return throwError(() => new Error('Votre session a expiré. Merci de vous reconnecter.'));
          }),
          switchMap((token) => next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })).pipe(
            catchError((retryError: HttpErrorResponse) => {
              if (retryError.status === 401) sessionExpired();
              return throwError(() => toError(retryError, req));
            }),
          )),
        );
      }

      if (error.status === 401 && sentWithToken && !NO_REFRESH.test(req.url)) sessionExpired();
      if (error.status !== 401) console.error('HTTP Error:', error.status, req.url);
      return throwError(() => toError(error, req));
    }),
  );
};
