import { Injectable, OnDestroy, signal } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';

export interface AdminSummary {
  pendingOrders: number;
  unreadMessages: number;
  pendingReviews: number;
  lowStock: number;
}

const EMPTY: AdminSummary = { pendingOrders: 0, unreadMessages: 0, pendingReviews: 0, lowStock: 0 };
const REFRESH_MS = 60_000;

@Injectable({ providedIn: 'root' })
export class AdminSummaryService implements OnDestroy {
  readonly summary = signal<AdminSummary>(EMPTY);
  private timer: ReturnType<typeof setInterval> | null = null;
  private users = 0;

  constructor(private api: ApiService) {}

  start(): void {
    this.users++;
    if (this.timer) return;
    this.refresh();
    this.timer = setInterval(() => {
      if (document.visibilityState === 'visible') this.refresh();
    }, REFRESH_MS);
  }

  stop(): void {
    this.users = Math.max(0, this.users - 1);
    if (this.users === 0 && this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  refresh(): void {
    this.api.get<AdminSummary>('/admin/summary').subscribe({
      next: (s) => this.summary.set({ ...EMPTY, ...s }),
      error: () => {},
    });
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }
}
