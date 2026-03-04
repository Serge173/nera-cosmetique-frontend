import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './shared/components/header/header.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { ToastComponent } from './shared/components/toast/toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent, ToastComponent],
  template: `
    <app-header></app-header>
    <main>
      <router-outlet></router-outlet>
    </main>
    <app-footer></app-footer>
    <app-toast></app-toast>
  `,
  styles: [`
    main {
      min-height: calc(100vh - 180px);
      min-width: 0;
    }
    @media (max-width: 768px) {
      main {
        min-height: calc(100vh - 140px);
      }
    }
  `]
})
export class AppComponent {
  title = 'Nera Cosmétique';
}
