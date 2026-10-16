import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ResolveEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { HeaderComponent } from './shared/components/header/header.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { ToastComponent } from './shared/components/toast/toast.component';

const isAdminUrl = (url: string) =>
  /^\/admin(\/|\?|#|$)/.test(url) ||
  /^\/compte(?!\/(connexion|inscription|mot-de-passe-oublie|reinitialiser-mot-de-passe)(\/|\?|#|$))(\/|\?|#|$)/.test(url);

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent, ToastComponent],
  template: `
    @if (!isAdmin()) {
      <app-header></app-header>
    }
    <main [class.is-admin]="isAdmin()">
      <router-outlet></router-outlet>
    </main>
    @if (!isAdmin()) {
      <app-footer></app-footer>
    }
    <app-toast></app-toast>
  `,
  styles: [`
    main {
      min-height: calc(100vh - 180px);
      min-width: 0;
    }
    main.is-admin {
      min-height: 100vh;
    }
    @media (max-width: 768px) {
      main:not(.is-admin) {
        min-height: calc(100vh - 140px);
      }
    }
  `]
})
export class AppComponent {
  title = 'Nera Cosmétique';
  private router = inject(Router);

  readonly isAdmin = toSignal(
    this.router.events.pipe(
      filter((e): e is ResolveEnd => e instanceof ResolveEnd),
      map((e) => isAdminUrl(e.urlAfterRedirects)),
    ),
    { initialValue: isAdminUrl(location.pathname) },
  );
}
