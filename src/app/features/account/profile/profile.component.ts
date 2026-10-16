import { Component, OnDestroy, OnInit, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService, User } from '../../../core/services/auth.service';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { UserAvatarComponent } from '../../../shared/components/user-avatar/user-avatar.component';
import { prepareAvatar } from '../../../shared/utils/avatar-image';
import { formatPrice } from '../../admin/shared/admin-format';
import { AccountOverviewService } from '../shared/account-overview.service';

type PasswordField = 'current' | 'new' | 'confirm';

const monthYear = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' });

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [FormsModule, RouterLink, UserAvatarComponent],
  template: `
    <div class="adm-page-head">
      <div>
        <h1>Mon profil</h1>
        <p>Gérez vos informations personnelles et la sécurité de votre compte.</p>
      </div>
    </div>

    <div class="layout">
      <aside class="adm-card summary">
        <div class="avatar-wrap">
          <div class="avatar" [class.busy]="avatarBusy">
            <app-user-avatar [url]="user?.avatarUrl" [name]="fullName()" />
            @if (avatarBusy) { <span class="avatar-loader" aria-hidden="true"><span class="spinner"></span></span> }
          </div>
          <button type="button" class="avatar-cam" (click)="avatarInput.click()" [disabled]="avatarBusy"
            [attr.aria-label]="user?.avatarUrl ? 'Changer la photo de profil' : 'Ajouter une photo de profil'">
            <i class="fa-solid fa-camera"></i>
          </button>
          <input #avatarInput type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden (change)="onAvatarSelected($event)" />
        </div>
        <div class="avatar-actions">
          @if (confirmRemoveAvatar) {
            <span>Supprimer la photo ?</span>
            <button type="button" class="link-btn danger" (click)="removeAvatar()" [disabled]="avatarBusy">Oui</button>
            <span class="sep" aria-hidden="true">·</span>
            <button type="button" class="link-btn" (click)="confirmRemoveAvatar = false" [disabled]="avatarBusy">Non</button>
          } @else {
            <button type="button" class="link-btn" (click)="avatarInput.click()" [disabled]="avatarBusy">
              {{ user?.avatarUrl ? 'Changer la photo' : 'Ajouter une photo' }}
            </button>
            @if (user?.avatarUrl) {
              <span class="sep" aria-hidden="true">·</span>
              <button type="button" class="link-btn danger" (click)="confirmRemoveAvatar = true" [disabled]="avatarBusy">Supprimer</button>
            }
          }
        </div>
        <small class="avatar-hint">JPG, PNG ou WebP. Recadrée automatiquement en carré.</small>
        <p class="name">{{ fullName() }}</p>
        <p class="email">{{ user?.email }}</p>
        @if (overview(); as o) {
          <span class="adm-badge peach"><i class="fa-solid fa-crown"></i> {{ o.loyalty.tier.label }}</span>
          <dl class="facts">
            <div><dt>Membre depuis</dt><dd>{{ memberSince() }}</dd></div>
            <div><dt>Commandes</dt><dd>{{ o.orders.total }}</dd></div>
            <div><dt>Total de vos achats</dt><dd>{{ formatPrice(o.orders.spent) }}</dd></div>
            <div><dt>Points fidélité</dt><dd>{{ o.loyalty.points }}</dd></div>
          </dl>
        }
        <a routerLink="/compte/adresses" class="adm-btn adm-btn-ghost adm-btn-sm block"><i class="fa-solid fa-location-dot"></i> Gérer mes adresses</a>
      </aside>

      <div class="forms">
        <section class="adm-card panel" aria-labelledby="infos-title">
          <header class="panel-head">
            <span class="panel-icon"><i class="fa-regular fa-id-card"></i></span>
            <div>
              <h2 id="infos-title">Informations personnelles</h2>
              <p>Utilisées pour vos livraisons et pour vous contacter.</p>
            </div>
          </header>

          <form (ngSubmit)="updateProfile()" #profileForm="ngForm" novalidate>
            <div class="fields">
              <label class="field">
                <span>Prénom</span>
                <input class="adm-input" type="text" name="firstName" autocomplete="given-name"
                  [(ngModel)]="profileModel.firstName" required maxlength="100" [disabled]="profileSaving" />
              </label>
              <label class="field">
                <span>Nom</span>
                <input class="adm-input" type="text" name="lastName" autocomplete="family-name"
                  [(ngModel)]="profileModel.lastName" required maxlength="100" [disabled]="profileSaving" />
              </label>
              <label class="field">
                <span>Adresse e-mail</span>
                <div class="input-wrap">
                  <input class="adm-input is-readonly" type="email" [value]="user?.email ?? ''" readonly aria-describedby="email-hint" />
                  <i class="fa-solid fa-lock adornment" aria-hidden="true"></i>
                </div>
                <small id="email-hint" class="hint">Votre e-mail est votre identifiant et ne peut pas être modifié.</small>
              </label>
              <label class="field">
                <span>Téléphone</span>
                <input class="adm-input" type="tel" name="phone" autocomplete="tel" inputmode="tel" placeholder="Ex. 07 00 00 00 00"
                  [(ngModel)]="profileModel.phone" maxlength="30" [disabled]="profileSaving" />
              </label>
            </div>
            <div class="actions">
              <button type="button" class="adm-btn adm-btn-ghost" (click)="resetProfileForm()" [disabled]="profileSaving || !profileDirty">Annuler</button>
              <button type="submit" class="adm-btn" [disabled]="profileSaving || !profileDirty || !profileForm.valid">
                @if (profileSaving) { <span class="spinner" aria-hidden="true"></span> Enregistrement… } @else { Enregistrer les modifications }
              </button>
            </div>
          </form>
        </section>

        <section class="adm-card panel" aria-labelledby="security-title">
          <header class="panel-head">
            <span class="panel-icon"><i class="fa-solid fa-shield-halved"></i></span>
            <div>
              <h2 id="security-title">Sécurité du compte</h2>
              <p>Choisissez un mot de passe unique, que vous n'utilisez sur aucun autre site.</p>
            </div>
          </header>

          <form (ngSubmit)="changePassword()" #passwordForm="ngForm" novalidate>
            <div class="fields">
              <label class="field full">
                <span>Mot de passe actuel</span>
                <div class="input-wrap">
                  <input class="adm-input" name="currentPassword" autocomplete="current-password" required
                    [type]="visible.current ? 'text' : 'password'" [(ngModel)]="passwordFormModel.currentPassword" [disabled]="passwordLoading" />
                  <button type="button" class="eye" (click)="toggle('current')" [attr.aria-label]="visible.current ? 'Masquer le mot de passe' : 'Afficher le mot de passe'">
                    <i class="fa-regular" [class.fa-eye]="!visible.current" [class.fa-eye-slash]="visible.current"></i>
                  </button>
                </div>
              </label>
              <label class="field">
                <span>Nouveau mot de passe</span>
                <div class="input-wrap">
                  <input class="adm-input" name="newPassword" autocomplete="new-password" required minlength="8" maxlength="128"
                    [type]="visible.new ? 'text' : 'password'" aria-describedby="strength-label"
                    [(ngModel)]="passwordFormModel.newPassword" [disabled]="passwordLoading" />
                  <button type="button" class="eye" (click)="toggle('new')" [attr.aria-label]="visible.new ? 'Masquer le mot de passe' : 'Afficher le mot de passe'">
                    <i class="fa-regular" [class.fa-eye]="!visible.new" [class.fa-eye-slash]="visible.new"></i>
                  </button>
                </div>
                <div class="strength" [attr.data-level]="strength.level">
                  <div class="bars" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
                  <small class="hint" id="strength-label">{{ strength.label }}</small>
                </div>
              </label>
              <label class="field">
                <span>Confirmer le mot de passe</span>
                <div class="input-wrap">
                  <input class="adm-input" name="confirmPassword" autocomplete="new-password" required
                    [type]="visible.confirm ? 'text' : 'password'" [class.invalid]="confirmMismatch"
                    [(ngModel)]="passwordFormModel.confirmPassword" [disabled]="passwordLoading" />
                  <button type="button" class="eye" (click)="toggle('confirm')" [attr.aria-label]="visible.confirm ? 'Masquer le mot de passe' : 'Afficher le mot de passe'">
                    <i class="fa-regular" [class.fa-eye]="!visible.confirm" [class.fa-eye-slash]="visible.confirm"></i>
                  </button>
                </div>
                @if (confirmMismatch) {
                  <small class="hint error">Les deux mots de passe ne correspondent pas.</small>
                } @else if (passwordFormModel.confirmPassword && passwordFormModel.confirmPassword === passwordFormModel.newPassword) {
                  <small class="hint success"><i class="fa-solid fa-check"></i> Les mots de passe correspondent.</small>
                }
              </label>
            </div>
            @if (passwordError) {
              <p class="alert" role="alert"><i class="fa-solid fa-circle-exclamation"></i> {{ passwordError }}</p>
            }
            <div class="actions">
              <button type="button" class="adm-btn adm-btn-ghost" (click)="resetPasswordForm()" [disabled]="passwordLoading">Annuler</button>
              <button type="submit" class="adm-btn" [disabled]="passwordLoading || !passwordForm.valid || confirmMismatch">
                @if (passwordLoading) { <span class="spinner" aria-hidden="true"></span> Enregistrement… } @else { Mettre à jour le mot de passe }
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .layout { display: grid; grid-template-columns: 300px minmax(0, 1fr); gap: 20px; align-items: start; }
    .summary { padding: 28px 22px 22px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 6px; position: sticky; top: calc(var(--adm-topbar-h) + 20px); }
    .avatar-wrap { position: relative; margin-bottom: 6px; }
    .avatar {
      position: relative; width: 104px; height: 104px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
      background: radial-gradient(circle at 30% 25%, #ffd9bd 0%, #ffb27a 45%, #ff6600 100%);
      color: #fff; font-size: 2rem; font-weight: 700;
      box-shadow: 0 0 0 6px #fff3ea, 0 10px 24px rgba(255, 102, 0, .25);
    }
    .avatar-loader { position: absolute; inset: 0; border-radius: 50%; background: rgba(26, 20, 16, .45); display: flex; align-items: center; justify-content: center; }
    .avatar-loader .spinner { width: 26px; height: 26px; border-width: 3px; }
    .avatar-cam {
      position: absolute; right: -2px; bottom: -2px; width: 36px; height: 36px; border-radius: 50%;
      display: inline-flex; align-items: center; justify-content: center;
      background: var(--adm-orange); color: #fff; font-size: .85rem; border: 3px solid #fff;
      box-shadow: 0 4px 12px rgba(255, 102, 0, .35); transition: transform .2s, background .2s;
    }
    .avatar-cam:hover:not(:disabled) { transform: scale(1.08); background: #e65c00; }
    .avatar-cam:focus-visible { outline: 3px solid rgba(255, 102, 0, .35); outline-offset: 2px; }
    .avatar-cam:disabled { opacity: .6; cursor: progress; }
    .avatar-actions { display: flex; align-items: center; gap: 6px; margin: 8px 0 6px; font-size: .8rem; }
    .link-btn { background: none; border: 0; padding: 2px 0; font-size: .8rem; font-weight: 600; color: var(--adm-orange); cursor: pointer; }
    .link-btn:hover:not(:disabled) { text-decoration: underline; }
    .link-btn:disabled { opacity: .5; cursor: progress; }
    .link-btn.danger { color: #c53b4b; }
    .sep { color: var(--adm-muted); }
    .avatar-hint { font-size: .72rem; color: var(--adm-muted); margin-bottom: 10px; }
    .name { margin: 0; font-size: 1.1rem; font-weight: 700; color: var(--adm-ink); word-break: break-word; }
    .email { margin: 0 0 8px; font-size: .82rem; color: var(--adm-muted); word-break: break-all; }
    .facts { width: 100%; margin: 16px 0 14px; padding: 14px 0 0; border-top: 1px solid var(--adm-line); display: flex; flex-direction: column; gap: 10px; }
    .facts div { display: flex; justify-content: space-between; gap: 10px; font-size: .82rem; }
    .facts dt { color: var(--adm-muted); }
    .facts dd { margin: 0; font-weight: 600; color: var(--adm-ink); text-align: right; }
    .block { width: 100%; }
    .forms { display: flex; flex-direction: column; gap: 20px; min-width: 0; }
    .panel { padding: 24px; }
    .panel-head { display: flex; gap: 14px; align-items: flex-start; padding-bottom: 18px; margin-bottom: 20px; border-bottom: 1px solid var(--adm-line); }
    .panel-head h2 { margin: 0; font-size: 1.08rem; font-weight: 700; }
    .panel-head p { margin: 3px 0 0; font-size: .84rem; color: var(--adm-muted); }
    .panel-icon { width: 44px; height: 44px; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; background: var(--adm-orange-soft); color: var(--adm-orange); flex-shrink: 0; }
    .fields { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px 20px; }
    .field { display: flex; flex-direction: column; gap: 7px; min-width: 0; }
    .field.full { grid-column: 1 / -1; }
    .field > span { font-size: .78rem; font-weight: 600; color: var(--adm-text); }
    .input-wrap { position: relative; }
    .input-wrap .adm-input { padding-right: 46px; }
    .is-readonly { background: #f8f4f1; color: var(--adm-muted); }
    .adornment { position: absolute; right: 16px; top: 50%; transform: translateY(-50%); color: #b5aca6; font-size: .8rem; }
    .eye { position: absolute; right: 4px; top: 50%; transform: translateY(-50%); width: 36px; height: 36px; border-radius: 8px; background: transparent; color: var(--adm-muted); }
    .eye:hover { background: var(--adm-orange-50); color: var(--adm-ink); }
    .invalid { border-color: #c53b4b !important; }
    .hint { font-size: .76rem; color: var(--adm-muted); }
    .hint.error { color: #c53b4b; }
    .hint.success { color: #2b8a52; }
    .strength .bars { display: grid; grid-template-columns: repeat(4, 1fr); gap: 5px; margin-bottom: 5px; }
    .strength .bars i { height: 4px; border-radius: 4px; background: #f1ebe7; transition: background .3s; }
    .strength[data-level="1"] .bars i:nth-child(-n+1) { background: #d93025; }
    .strength[data-level="2"] .bars i:nth-child(-n+2) { background: #f29900; }
    .strength[data-level="3"] .bars i:nth-child(-n+3) { background: #7cb342; }
    .strength[data-level="4"] .bars i { background: #2b8a52; }
    .alert { display: flex; align-items: center; gap: 10px; margin: 18px 0 0; padding: 12px 14px; border-radius: 10px; font-size: .86rem; color: #8c1d18; background: #fdeceb; border: 1px solid #f6c9c6; }
    .actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 22px; flex-wrap: wrap; }
    .spinner { width: 14px; height: 14px; border-radius: 50%; border: 2px solid rgba(255, 255, 255, .4); border-top-color: #fff; animation: spin .8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    @media (max-width: 1100px) {
      .layout { grid-template-columns: minmax(0, 1fr); }
      .summary { position: static; }
    }
    @media (max-width: 640px) {
      .fields { grid-template-columns: minmax(0, 1fr); }
      .panel { padding: 18px 16px; }
      .actions .adm-btn { flex: 1; }
    }
  `],
})
export class ProfileComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private overviewService = inject(AccountOverviewService);

  user: User | null = null;
  profileModel = { firstName: '', lastName: '', phone: '' };
  profileSaving = false;
  avatarBusy = false;
  confirmRemoveAvatar = false;

  passwordFormModel = { currentPassword: '', newPassword: '', confirmPassword: '' };
  passwordLoading = false;
  passwordError = '';
  visible: Record<PasswordField, boolean> = { current: false, new: false, confirm: false };

  readonly overview = this.overviewService.overview;
  readonly memberSince = computed(() => {
    const d = this.overview()?.user.memberSince;
    return d ? monthYear.format(new Date(d)) : '—';
  });
  readonly formatPrice = formatPrice;

  private sub?: Subscription;

  ngOnInit(): void {
    this.sub = this.authService.currentUser$.subscribe((u) => {
      this.user = u;
      this.resetProfileForm();
    });
    if (!this.overview()) this.overviewService.refresh();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  fullName(): string {
    return `${this.user?.firstName ?? ''} ${this.user?.lastName ?? ''}`.trim() || 'Mon compte';
  }

  async onAvatarSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file || this.avatarBusy) return;

    this.avatarBusy = true;
    let image: Blob;
    try {
      image = await prepareAvatar(file);
    } catch (err) {
      this.avatarBusy = false;
      this.toast.error(err instanceof Error ? err.message : 'Impossible de préparer l’image.');
      return;
    }

    const form = new FormData();
    form.append('file', image, image.type === 'image/webp' ? 'avatar.webp' : 'avatar.jpg');
    this.api.post<{ avatarUrl: string }>('/account/avatar', form).subscribe({
      next: ({ avatarUrl }) => {
        this.avatarBusy = false;
        this.confirmRemoveAvatar = false;
        this.authService.patchCurrentUser({ avatarUrl });
        this.toast.success('Votre photo de profil a été mise à jour.');
      },
      error: (err) => {
        this.avatarBusy = false;
        this.toast.error(err?.message ?? 'Impossible d’envoyer la photo.');
      },
    });
  }

  removeAvatar(): void {
    if (this.avatarBusy || !this.user?.avatarUrl) return;
    this.avatarBusy = true;
    this.api.delete<{ avatarUrl: null }>('/account/avatar').subscribe({
      next: () => {
        this.avatarBusy = false;
        this.confirmRemoveAvatar = false;
        this.authService.patchCurrentUser({ avatarUrl: null });
        this.toast.success('Votre photo de profil a été supprimée.');
      },
      error: (err) => {
        this.avatarBusy = false;
        this.toast.error(err?.message ?? 'Impossible de supprimer la photo.');
      },
    });
  }

  get profileDirty(): boolean {
    if (!this.user) return false;
    return this.profileModel.firstName.trim() !== (this.user.firstName ?? '')
      || this.profileModel.lastName.trim() !== (this.user.lastName ?? '')
      || this.profileModel.phone.trim() !== (this.user.phone ?? '');
  }

  get confirmMismatch(): boolean {
    const { newPassword, confirmPassword } = this.passwordFormModel;
    return !!confirmPassword && confirmPassword !== newPassword;
  }

  get strength(): { level: number; label: string } {
    const p = this.passwordFormModel.newPassword;
    if (!p) return { level: 0, label: 'Au moins 8 caractères. Mélangez lettres, chiffres et symboles.' };
    if (p.length < 8) return { level: 1, label: 'Trop court — 8 caractères minimum.' };
    let score = 1;
    if (p.length >= 12) score++;
    if (/[a-z]/.test(p) && /[A-Z]/.test(p)) score++;
    if (/\d/.test(p) && /[^A-Za-z0-9]/.test(p)) score++;
    const level = Math.min(score, 4);
    const labels = ['', 'Faible', 'Moyen', 'Bon', 'Excellent'];
    return { level, label: `Robustesse : ${labels[level]}` };
  }

  toggle(field: PasswordField): void {
    this.visible[field] = !this.visible[field];
  }

  resetProfileForm(): void {
    this.profileModel = {
      firstName: this.user?.firstName ?? '',
      lastName: this.user?.lastName ?? '',
      phone: this.user?.phone ?? '',
    };
  }

  updateProfile(): void {
    if (!this.user || !this.profileDirty) return;
    const payload = {
      firstName: this.profileModel.firstName.trim(),
      lastName: this.profileModel.lastName.trim(),
      phone: this.profileModel.phone.trim(),
    };
    if (!payload.firstName || !payload.lastName) {
      this.toast.error('Le prénom et le nom sont obligatoires.');
      return;
    }
    this.profileSaving = true;
    this.api.patch<User>('/users/me', payload).subscribe({
      next: (updated) => {
        this.profileSaving = false;
        const current = this.authService.getCurrentUser();
        this.authService.updateCurrentUser({
          ...(current || { id: updated.id, email: updated.email, role: updated.role }),
          firstName: updated.firstName,
          lastName: updated.lastName,
          phone: updated.phone,
        } as User);
        this.overviewService.refresh();
        this.toast.success('Vos informations ont été mises à jour.');
      },
      error: (err) => {
        this.profileSaving = false;
        this.toast.error(err?.error?.message ?? 'Impossible de mettre à jour le profil.');
      },
    });
  }

  changePassword(): void {
    this.passwordError = '';
    const cur = this.passwordFormModel.currentPassword.trim();
    const newP = this.passwordFormModel.newPassword.trim();
    const conf = this.passwordFormModel.confirmPassword.trim();
    if (!cur) {
      this.passwordError = 'Indiquez votre mot de passe actuel.';
      return;
    }
    if (newP.length < 8) {
      this.passwordError = 'Le nouveau mot de passe doit contenir au moins 8 caractères.';
      return;
    }
    if (newP !== conf) {
      this.passwordError = 'Les deux mots de passe ne correspondent pas.';
      return;
    }
    if (cur === newP) {
      this.passwordError = 'Le nouveau mot de passe doit être différent de l’actuel.';
      return;
    }
    this.passwordLoading = true;
    this.api.post<{ success: boolean; message: string }>('/auth/change-password', {
      currentPassword: cur,
      newPassword: newP,
    }).subscribe({
      next: (res) => {
        this.passwordLoading = false;
        this.resetPasswordForm();
        this.toast.success(res?.message ?? 'Mot de passe mis à jour.');
      },
      error: (err) => {
        this.passwordLoading = false;
        this.passwordError = err?.error?.message ?? 'Impossible de modifier le mot de passe.';
      },
    });
  }

  resetPasswordForm(): void {
    this.passwordFormModel = { currentPassword: '', newPassword: '', confirmPassword: '' };
    this.passwordError = '';
    this.visible = { current: false, new: false, confirm: false };
  }
}
