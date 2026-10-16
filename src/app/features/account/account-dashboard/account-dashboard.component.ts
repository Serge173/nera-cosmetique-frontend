import { Component, OnInit, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { FavoritesService } from '../../../core/services/favorites.service';
import { UserAvatarComponent } from '../../../shared/components/user-avatar/user-avatar.component';
import { safeProductImageUrl } from '../../../shared/utils/placeholder-image';
import { formatDate, formatNumber, formatPrice, statusLabel, statusTone } from '../../admin/shared/admin-format';
import { AccountOverviewService } from '../shared/account-overview.service';
import { effectivePrice } from '../shared/account.models';

const monthYear = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' });

@Component({
  selector: 'app-account-dashboard',
  standalone: true,
  imports: [RouterLink, UserAvatarComponent],
  templateUrl: './account-dashboard.component.html',
  styleUrl: './account-dashboard.component.css',
})
export class AccountDashboardComponent implements OnInit {
  private overviewService = inject(AccountOverviewService);
  readonly favorites = inject(FavoritesService);

  readonly data = this.overviewService.overview;
  readonly error = this.overviewService.error;

  readonly fullName = computed(() => {
    const u = this.data()?.user;
    return `${u?.firstName ?? ''} ${u?.lastName ?? ''}`.trim() || 'Mon compte';
  });
  private readonly user = toSignal(inject(AuthService).currentUser$, { initialValue: null });
  readonly avatarUrl = computed(() => this.user()?.avatarUrl ?? null);
  readonly memberSince = computed(() => {
    const d = this.data()?.user.memberSince;
    return d ? monthYear.format(new Date(d)) : '';
  });
  readonly favoriteItems = computed(() => {
    const items = this.data()?.favorites.items ?? [];
    if (!this.favorites.loaded()) return items;
    return items.filter((p) => this.favorites.isFavorite(p.productId));
  });

  readonly formatPrice = formatPrice;
  readonly formatNumber = formatNumber;
  readonly formatDate = formatDate;
  readonly statusLabel = statusLabel;
  readonly statusTone = statusTone;
  readonly effectivePrice = effectivePrice;
  readonly image = safeProductImageUrl;

  ngOnInit(): void {
    this.overviewService.refresh();
  }

  retry(): void {
    this.overviewService.refresh();
  }
}
