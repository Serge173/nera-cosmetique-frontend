import { Injectable, inject, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { AccountOverview } from './account.models';

@Injectable({ providedIn: 'root' })
export class AccountOverviewService {
  private api = inject(ApiService);
  private request?: Subscription;

  readonly overview = signal<AccountOverview | null>(null);
  readonly loading = signal(false);
  readonly error = signal(false);

  refresh(): void {
    this.request?.unsubscribe();
    this.loading.set(true);
    this.request = this.api.get<AccountOverview>('/account/overview').subscribe({
      next: (data) => {
        this.overview.set(data);
        this.error.set(false);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  clear(): void {
    this.request?.unsubscribe();
    this.overview.set(null);
  }
}
