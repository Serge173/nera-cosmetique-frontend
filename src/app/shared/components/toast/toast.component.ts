import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ToastService, Toast, ToastType } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container" role="region" aria-label="Notifications">
      @for (toast of toasts; track toast.id) {
        <div
          class="toast toast--{{ toast.type }}"
          [attr.role]="toast.type === 'error' ? 'alert' : 'status'"
          [attr.aria-live]="toast.type === 'error' ? 'assertive' : 'polite'"
        >
          <span class="toast-icon" aria-hidden="true">{{ iconFor(toast.type) }}</span>
          <p class="toast-message">{{ toast.message }}</p>
          <button
            type="button"
            class="toast-close"
            (click)="dismiss(toast.id)"
            aria-label="Fermer la notification"
          >
            &times;
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 16px;
      right: 16px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: min(400px, calc(100vw - 32px));
      pointer-events: none;
    }

    .toast-container > * {
      pointer-events: auto;
    }

    .toast {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 14px 16px;
      border-radius: 10px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      background: #fff;
      border-left: 4px solid var(--primary-color);
      animation: toast-in 0.3s ease;
    }

    @keyframes toast-in {
      from {
        opacity: 0;
        transform: translateX(100%);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    .toast--success {
      border-left-color: var(--success, #22c55e);
    }

    .toast--error {
      border-left-color: var(--error, #e53935);
    }

    .toast--info {
      border-left-color: var(--primary-color);
    }

    .toast-icon {
      flex-shrink: 0;
      font-size: 1.25rem;
      line-height: 1;
    }

    .toast--success .toast-icon { color: var(--success, #22c55e); }
    .toast--error .toast-icon { color: var(--error, #e53935); }
    .toast--info .toast-icon { color: var(--primary-color); }

    .toast-message {
      flex: 1;
      margin: 0;
      font-size: 0.9375rem;
      line-height: 1.4;
      color: var(--text-dark);
    }

    .toast-close {
      flex-shrink: 0;
      width: 28px;
      height: 28px;
      padding: 0;
      border: none;
      background: transparent;
      color: var(--text-light);
      font-size: 1.25rem;
      line-height: 1;
      cursor: pointer;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .toast-close:hover {
      background: rgba(0, 0, 0, 0.06);
      color: var(--text-dark);
    }

    @media (max-width: 480px) {
      .toast-container {
        left: 16px;
        right: 16px;
        max-width: none;
      }
    }
  `],
})
export class ToastComponent implements OnInit, OnDestroy {
  toasts: Toast[] = [];
  private sub?: Subscription;

  constructor(private toastService: ToastService) {}

  ngOnInit(): void {
    this.sub = this.toastService.list$.subscribe(list => (this.toasts = list));
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  iconFor(type: ToastType): string {
    switch (type) {
      case 'success': return '✓';
      case 'error': return '✕';
      default: return 'ℹ';
    }
  }

  dismiss(id: number): void {
    this.toastService.dismiss(id);
  }
}
