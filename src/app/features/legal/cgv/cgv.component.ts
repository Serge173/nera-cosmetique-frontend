import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cgv',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="legal">
      <div class="container">
        <h1>Conditions générales de vente</h1>
        <div class="legal-content">
          <p>Contenu des CGV...</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .legal {
      padding: 60px 0;
    }
    .legal-content {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      padding: 32px;
      border-radius: 8px;
    }
  `]
})
export class CgvComponent {}
