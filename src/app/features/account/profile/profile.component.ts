import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AuthService, User } from '../../../core/services/auth.service';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { Order } from '../../../models/order.model';
import { PricePipe } from '../../../shared/pipes/price.pipe';

type PasswordField = 'current' | 'new' | 'confirm';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, PricePipe],
  template: `
    @if (user) {
      <section class="account">
        <header class="account-hero">
          <div class="container">
            <p class="eyebrow">Espace client</p>
            <h1>Bonjour, <em>{{ user.firstName || 'chère cliente' }}</em></h1>
            <p class="hero-lead">Retrouvez vos informations, votre sécurité et le suivi de vos commandes, en toute sérénité.</p>
          </div>
        </header>

        <div class="container account-layout">
          <aside class="account-aside">
            <div class="member-card">
              <div class="avatar" aria-hidden="true">{{ initials }}</div>
              <div class="member-identity">
                <p class="member-name">{{ fullName }}</p>
                <p class="member-email">{{ user.email }}</p>
              </div>
              <span class="member-badge">
                <i class="fa-solid" [class.fa-crown]="user.role === 'admin'" [class.fa-gem]="user.role !== 'admin'"></i>
                {{ user.role === 'admin' ? 'Administrateur' : 'Membre Nera' }}
              </span>
            </div>

            <nav class="account-menu" aria-label="Navigation du compte">
              <a routerLink="/compte" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">
                <i class="fa-regular fa-user"></i><span>Mon profil</span>
              </a>
              <a routerLink="/compte/commandes" routerLinkActive="active">
                <i class="fa-solid fa-bag-shopping"></i><span>Mes commandes</span>
              </a>
              @if (user.role === 'admin') {
                <a routerLink="/admin">
                  <i class="fa-solid fa-gauge-high"></i><span>Administration</span>
                </a>
              }
              <a routerLink="/boutique">
                <i class="fa-solid fa-spa"></i><span>Continuer mes achats</span>
              </a>
              <button type="button" class="menu-logout" (click)="logout()">
                <i class="fa-solid fa-arrow-right-from-bracket"></i><span>Se déconnecter</span>
              </button>
            </nav>
          </aside>

          <div class="account-main">
            <div class="stats" aria-live="polite">
              <div class="stat">
                <span class="stat-icon"><i class="fa-solid fa-bag-shopping"></i></span>
                <div>
                  <p class="stat-value">{{ ordersLoading ? '—' : stats.count }}</p>
                  <p class="stat-label">Commande{{ stats.count > 1 ? 's' : '' }}</p>
                </div>
              </div>
              <div class="stat">
                <span class="stat-icon"><i class="fa-solid fa-truck-fast"></i></span>
                <div>
                  <p class="stat-value">{{ ordersLoading ? '—' : stats.inProgress }}</p>
                  <p class="stat-label">En cours</p>
                </div>
              </div>
              <div class="stat">
                <span class="stat-icon"><i class="fa-solid fa-wallet"></i></span>
                <div>
                  <p class="stat-value">{{ ordersLoading ? '—' : (stats.spent | price) }}</p>
                  <p class="stat-label">Total de vos achats</p>
                </div>
              </div>
            </div>

            <section class="panel" aria-labelledby="infos-title">
              <div class="panel-head">
                <span class="panel-icon"><i class="fa-regular fa-id-card"></i></span>
                <div>
                  <h2 id="infos-title">Informations personnelles</h2>
                  <p>Ces informations sont utilisées pour vos livraisons et pour vous contacter.</p>
                </div>
              </div>

              <form (ngSubmit)="updateProfile()" #profileForm="ngForm" novalidate>
                <div class="fields">
                  <div class="field">
                    <label for="firstName">Prénom</label>
                    <input id="firstName" type="text" name="firstName" autocomplete="given-name"
                      [(ngModel)]="profileModel.firstName" required maxlength="100" [disabled]="profileSaving" />
                  </div>
                  <div class="field">
                    <label for="lastName">Nom</label>
                    <input id="lastName" type="text" name="lastName" autocomplete="family-name"
                      [(ngModel)]="profileModel.lastName" required maxlength="100" [disabled]="profileSaving" />
                  </div>
                  <div class="field">
                    <label for="email">Adresse e-mail</label>
                    <div class="input-wrap">
                      <input id="email" type="email" [value]="user.email" readonly class="is-readonly" aria-describedby="email-hint" />
                      <i class="fa-solid fa-lock input-adornment" aria-hidden="true"></i>
                    </div>
                    <p class="hint" id="email-hint">L'adresse e-mail est votre identifiant et ne peut pas être modifiée.</p>
                  </div>
                  <div class="field">
                    <label for="phone">Téléphone</label>
                    <input id="phone" type="tel" name="phone" autocomplete="tel" inputmode="tel" placeholder="Ex. 07 00 00 00 00"
                      [(ngModel)]="profileModel.phone" maxlength="30" [disabled]="profileSaving" />
                  </div>
                </div>

                <div class="panel-actions">
                  <button type="button" class="btn-ghost" (click)="resetProfileForm()" [disabled]="profileSaving || !profileDirty">
                    Annuler
                  </button>
                  <button type="submit" class="btn-lux" [disabled]="profileSaving || !profileDirty || !profileForm.valid">
                    @if (profileSaving) {
                      <span class="spinner" aria-hidden="true"></span> Enregistrement…
                    } @else {
                      Enregistrer les modifications
                    }
                  </button>
                </div>
              </form>
            </section>

            <section class="panel" aria-labelledby="security-title">
              <div class="panel-head">
                <span class="panel-icon"><i class="fa-solid fa-shield-halved"></i></span>
                <div>
                  <h2 id="security-title">Sécurité du compte</h2>
                  <p>Choisissez un mot de passe unique, que vous n'utilisez sur aucun autre site.</p>
                </div>
              </div>

              <form (ngSubmit)="changePassword()" #passwordForm="ngForm" novalidate>
                <div class="fields">
                  <div class="field field-full">
                    <label for="currentPassword">Mot de passe actuel</label>
                    <div class="input-wrap">
                      <input id="currentPassword" name="currentPassword" autocomplete="current-password" required
                        [type]="visible.current ? 'text' : 'password'"
                        [(ngModel)]="passwordFormModel.currentPassword" [disabled]="passwordLoading" />
                      <button type="button" class="toggle-visibility" (click)="toggle('current')"
                        [attr.aria-label]="visible.current ? 'Masquer le mot de passe' : 'Afficher le mot de passe'">
                        <i class="fa-regular" [class.fa-eye]="!visible.current" [class.fa-eye-slash]="visible.current"></i>
                      </button>
                    </div>
                  </div>
                  <div class="field">
                    <label for="newPassword">Nouveau mot de passe</label>
                    <div class="input-wrap">
                      <input id="newPassword" name="newPassword" autocomplete="new-password" required minlength="6"
                        [type]="visible.new ? 'text' : 'password'" aria-describedby="strength-label"
                        [(ngModel)]="passwordFormModel.newPassword" [disabled]="passwordLoading" />
                      <button type="button" class="toggle-visibility" (click)="toggle('new')"
                        [attr.aria-label]="visible.new ? 'Masquer le mot de passe' : 'Afficher le mot de passe'">
                        <i class="fa-regular" [class.fa-eye]="!visible.new" [class.fa-eye-slash]="visible.new"></i>
                      </button>
                    </div>
                    <div class="strength" [attr.data-level]="strength.level">
                      <div class="strength-bars" aria-hidden="true"><span></span><span></span><span></span><span></span></div>
                      <p class="hint" id="strength-label">{{ strength.label }}</p>
                    </div>
                  </div>
                  <div class="field">
                    <label for="confirmPassword">Confirmer le mot de passe</label>
                    <div class="input-wrap">
                      <input id="confirmPassword" name="confirmPassword" autocomplete="new-password" required
                        [type]="visible.confirm ? 'text' : 'password'"
                        [class.is-invalid]="confirmMismatch"
                        [(ngModel)]="passwordFormModel.confirmPassword" [disabled]="passwordLoading" />
                      <button type="button" class="toggle-visibility" (click)="toggle('confirm')"
                        [attr.aria-label]="visible.confirm ? 'Masquer le mot de passe' : 'Afficher le mot de passe'">
                        <i class="fa-regular" [class.fa-eye]="!visible.confirm" [class.fa-eye-slash]="visible.confirm"></i>
                      </button>
                    </div>
                    @if (confirmMismatch) {
                      <p class="hint hint-error">Les deux mots de passe ne correspondent pas.</p>
                    } @else if (passwordFormModel.confirmPassword && passwordFormModel.confirmPassword === passwordFormModel.newPassword) {
                      <p class="hint hint-success"><i class="fa-solid fa-check"></i> Les mots de passe correspondent.</p>
                    }
                  </div>
                </div>

                @if (passwordError) {
                  <p class="alert" role="alert"><i class="fa-solid fa-circle-exclamation"></i> {{ passwordError }}</p>
                }

                <div class="panel-actions">
                  <button type="button" class="btn-ghost" (click)="resetPasswordForm()" [disabled]="passwordLoading">
                    Annuler
                  </button>
                  <button type="submit" class="btn-lux" [disabled]="passwordLoading || !passwordForm.valid || confirmMismatch">
                    @if (passwordLoading) {
                      <span class="spinner" aria-hidden="true"></span> Enregistrement…
                    } @else {
                      Mettre à jour le mot de passe
                    }
                  </button>
                </div>
              </form>
            </section>
          </div>
        </div>
      </section>
    }
  `,
  styles: [`
    :host {
      --ink: #1f1a17;
      --ink-soft: #6b625c;
      --ivory: #fdfaf7;
      --sand: #f4ece5;
      --line: rgba(31, 26, 23, 0.08);
      --gold: #b8895a;
      --accent: var(--primary-color, #ff6600);
      --radius: 20px;
      display: block;
    }

    .account {
      background: linear-gradient(180deg, var(--ivory) 0%, var(--sand) 100%);
      padding-bottom: 72px;
      min-height: 70vh;
    }

    /* En-tête */
    .account-hero {
      position: relative;
      padding: 56px 0 120px;
      overflow: hidden;
      background:
        radial-gradient(60% 120% at 85% 0%, rgba(255, 102, 0, 0.10) 0%, transparent 60%),
        radial-gradient(50% 100% at 0% 100%, rgba(184, 137, 90, 0.14) 0%, transparent 60%),
        linear-gradient(180deg, #fbf3ec 0%, var(--ivory) 100%);
      border-bottom: 1px solid var(--line);
    }
    .account-hero::after {
      content: '';
      position: absolute;
      right: -80px;
      top: -80px;
      width: 320px;
      height: 320px;
      border-radius: 50%;
      border: 1px solid rgba(184, 137, 90, 0.25);
      box-shadow: 0 0 0 40px rgba(184, 137, 90, 0.05), 0 0 0 80px rgba(184, 137, 90, 0.03);
      pointer-events: none;
    }
    .eyebrow {
      margin: 0 0 12px;
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.24em;
      text-transform: uppercase;
      color: var(--gold);
    }
    .account-hero h1 {
      margin: 0;
      font-size: clamp(2.25rem, 5vw, 3.5rem);
      font-weight: 500;
      line-height: 1.05;
      color: var(--ink);
    }
    .account-hero h1 em {
      font-style: italic;
      color: var(--accent);
    }
    .hero-lead {
      margin: 16px 0 0;
      max-width: 520px;
      color: var(--ink-soft);
      font-size: 1.0625rem;
      font-weight: 300;
    }

    /* Mise en page */
    .account-layout {
      display: grid;
      grid-template-columns: 300px minmax(0, 1fr);
      gap: 32px;
      margin-top: -72px;
      position: relative;
      z-index: 1;
    }

    /* Colonne latérale */
    .account-aside {
      position: sticky;
      top: calc(var(--header-height, 68px) + 24px);
      align-self: start;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .member-card {
      position: relative;
      overflow: hidden;
      padding: 32px 24px 24px;
      border-radius: var(--radius);
      background: linear-gradient(155deg, #2a211c 0%, #1a1512 100%);
      color: #fff;
      text-align: center;
      box-shadow: 0 24px 48px -24px rgba(31, 26, 23, 0.55);
    }
    .member-card::before {
      content: '';
      position: absolute;
      inset: 0;
      background:
        radial-gradient(80% 60% at 100% 0%, rgba(255, 102, 0, 0.28) 0%, transparent 60%),
        radial-gradient(70% 50% at 0% 100%, rgba(184, 137, 90, 0.30) 0%, transparent 60%);
      pointer-events: none;
    }
    .member-card > * { position: relative; }
    .avatar {
      width: 84px;
      height: 84px;
      margin: 0 auto 16px;
      display: grid;
      place-items: center;
      border-radius: 50%;
      font-family: var(--font-heading);
      font-size: 2rem;
      font-weight: 600;
      letter-spacing: 0.04em;
      color: #fff;
      background: linear-gradient(135deg, var(--accent) 0%, #c8814a 100%);
      box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.08), 0 0 0 5px rgba(212, 175, 130, 0.5);
    }
    .member-name {
      margin: 0;
      font-family: var(--font-heading);
      font-size: 1.5rem;
      font-weight: 600;
      line-height: 1.2;
      word-break: break-word;
    }
    .member-email {
      margin: 4px 0 0;
      font-size: 0.875rem;
      color: rgba(255, 255, 255, 0.65);
      word-break: break-all;
    }
    .member-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      margin-top: 16px;
      padding: 6px 14px;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #f1d7b8;
      background: rgba(212, 175, 130, 0.14);
      border: 1px solid rgba(212, 175, 130, 0.35);
    }

    .account-menu {
      display: flex;
      flex-direction: column;
      padding: 8px;
      border-radius: var(--radius);
      background: rgba(255, 255, 255, 0.85);
      backdrop-filter: blur(8px);
      border: 1px solid var(--line);
      box-shadow: 0 12px 32px -20px rgba(31, 26, 23, 0.25);
    }
    .account-menu a,
    .menu-logout {
      display: flex;
      align-items: center;
      gap: 14px;
      min-height: 48px;
      padding: 0 16px;
      border-radius: 12px;
      font-size: 0.9375rem;
      font-weight: 500;
      color: var(--ink);
      background: transparent;
      text-align: left;
      transition: background 0.2s ease, color 0.2s ease;
    }
    .account-menu i {
      width: 18px;
      text-align: center;
      color: var(--ink-soft);
      transition: color 0.2s ease;
    }
    .account-menu a:hover,
    .menu-logout:hover {
      background: var(--sand);
    }
    .account-menu a.active {
      background: linear-gradient(90deg, rgba(255, 102, 0, 0.12) 0%, rgba(255, 102, 0, 0.04) 100%);
      color: var(--accent);
      font-weight: 600;
    }
    .account-menu a.active i { color: var(--accent); }
    .menu-logout {
      margin-top: 4px;
      border-top: 1px solid var(--line);
      border-radius: 0 0 12px 12px;
      color: #b3261e;
    }
    .menu-logout i { color: #b3261e; }
    .menu-logout:hover { background: #fdf0ef; }

    /* Contenu principal */
    .account-main {
      display: flex;
      flex-direction: column;
      gap: 24px;
      min-width: 0;
    }

    .stats {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 16px;
    }
    .stat {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
      border-radius: var(--radius);
      background: #fff;
      border: 1px solid var(--line);
      box-shadow: 0 12px 32px -24px rgba(31, 26, 23, 0.3);
    }
    .stat-icon,
    .panel-icon {
      flex-shrink: 0;
      display: grid;
      place-items: center;
      width: 48px;
      height: 48px;
      border-radius: 14px;
      color: var(--accent);
      background: linear-gradient(135deg, #fff3ea 0%, #fbe7d6 100%);
      font-size: 1.125rem;
    }
    .stat-value {
      margin: 0;
      font-family: var(--font-heading);
      font-size: 1.75rem;
      font-weight: 600;
      line-height: 1.1;
      color: var(--ink);
      white-space: nowrap;
      font-variant-numeric: lining-nums tabular-nums;
    }
    .stat-label {
      margin: 2px 0 0;
      font-size: 0.8125rem;
      color: var(--ink-soft);
    }

    .panel {
      padding: 32px;
      border-radius: var(--radius);
      background: #fff;
      border: 1px solid var(--line);
      box-shadow: 0 20px 48px -32px rgba(31, 26, 23, 0.35);
      animation: rise 0.5s ease both;
    }
    .panel + .panel { animation-delay: 0.08s; }
    .panel-head {
      display: flex;
      gap: 16px;
      align-items: flex-start;
      padding-bottom: 24px;
      margin-bottom: 24px;
      border-bottom: 1px solid var(--line);
    }
    .panel-head h2 {
      margin: 0;
      font-size: 1.625rem;
      font-weight: 600;
      line-height: 1.2;
      color: var(--ink);
    }
    .panel-head p {
      margin: 4px 0 0;
      font-size: 0.9375rem;
      color: var(--ink-soft);
    }

    /* Formulaires */
    .fields {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 20px 24px;
    }
    .field-full { grid-column: 1 / -1; }
    .field label {
      display: block;
      margin-bottom: 8px;
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--ink-soft);
    }
    .input-wrap { position: relative; }
    .field input {
      width: 100%;
      height: 52px;
      padding: 0 16px;
      border-radius: 12px;
      border: 1px solid rgba(31, 26, 23, 0.14);
      background: #fcfaf8;
      font: inherit;
      font-size: 1rem;
      color: var(--ink);
      transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
    }
    .input-wrap input { padding-right: 52px; }
    .field input::placeholder { color: #b1a8a1; }
    .field input:hover:not(:disabled):not(.is-readonly) { border-color: rgba(31, 26, 23, 0.28); }
    .field input:focus {
      outline: none;
      background: #fff;
      border-color: var(--accent);
      box-shadow: 0 0 0 4px rgba(255, 102, 0, 0.12);
    }
    .field input.is-readonly {
      background: var(--sand);
      color: var(--ink-soft);
      cursor: default;
    }
    .field input.is-invalid,
    .field input.is-invalid:focus {
      border-color: #c5221f;
      box-shadow: 0 0 0 4px rgba(197, 34, 31, 0.1);
    }
    .field input:disabled { opacity: 0.6; cursor: not-allowed; }
    .input-adornment {
      position: absolute;
      right: 18px;
      top: 50%;
      transform: translateY(-50%);
      color: #b1a8a1;
      font-size: 0.875rem;
    }
    .toggle-visibility {
      position: absolute;
      right: 6px;
      top: 50%;
      transform: translateY(-50%);
      width: 40px;
      height: 40px;
      border-radius: 10px;
      color: var(--ink-soft);
      background: transparent;
      transition: background 0.2s ease, color 0.2s ease;
    }
    .toggle-visibility:hover { background: var(--sand); color: var(--ink); }
    .toggle-visibility:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
    .hint {
      margin: 8px 0 0;
      font-size: 0.8125rem;
      color: var(--ink-soft);
    }
    .hint-error { color: #c5221f; }
    .hint-success { color: #1e7a46; }

    .strength { margin-top: 10px; }
    .strength-bars {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 6px;
    }
    .strength-bars span {
      height: 4px;
      border-radius: 4px;
      background: rgba(31, 26, 23, 0.08);
      transition: background 0.3s ease;
    }
    .strength[data-level="1"] .strength-bars span:nth-child(-n+1) { background: #d93025; }
    .strength[data-level="2"] .strength-bars span:nth-child(-n+2) { background: #f29900; }
    .strength[data-level="3"] .strength-bars span:nth-child(-n+3) { background: #7cb342; }
    .strength[data-level="4"] .strength-bars span { background: #1e7a46; }
    .strength .hint { margin-top: 6px; }

    .alert {
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 20px 0 0;
      padding: 12px 16px;
      border-radius: 12px;
      font-size: 0.9375rem;
      color: #8c1d18;
      background: #fdeceb;
      border: 1px solid #f6c9c6;
    }

    .panel-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 28px;
    }
    .btn-lux,
    .btn-ghost {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      min-height: 50px;
      padding: 0 28px;
      border-radius: 999px;
      font-size: 0.9375rem;
      font-weight: 600;
      letter-spacing: 0.01em;
      transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease, opacity 0.2s ease;
    }
    .btn-lux {
      color: #fff;
      background: linear-gradient(135deg, #2a211c 0%, #120e0c 100%);
      box-shadow: 0 12px 24px -12px rgba(31, 26, 23, 0.6);
    }
    .btn-lux:hover:not(:disabled) {
      transform: translateY(-1px);
      background: linear-gradient(135deg, var(--accent) 0%, #d9560a 100%);
      box-shadow: 0 16px 28px -12px rgba(255, 102, 0, 0.55);
    }
    .btn-ghost {
      color: var(--ink);
      background: transparent;
      border: 1px solid rgba(31, 26, 23, 0.16);
    }
    .btn-ghost:hover:not(:disabled) { background: var(--sand); }
    .btn-lux:disabled,
    .btn-ghost:disabled { opacity: 0.45; cursor: not-allowed; transform: none; box-shadow: none; }
    .btn-lux:focus-visible,
    .btn-ghost:focus-visible,
    .account-menu a:focus-visible,
    .menu-logout:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

    .spinner {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      border: 2px solid rgba(255, 255, 255, 0.35);
      border-top-color: #fff;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes rise {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: none; }
    }
    @media (prefers-reduced-motion: reduce) {
      .panel, .spinner { animation: none; }
      .btn-lux:hover:not(:disabled) { transform: none; }
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .account-layout { grid-template-columns: 260px minmax(0, 1fr); gap: 24px; }
      .stats { grid-template-columns: 1fr; }
    }
    @media (max-width: 860px) {
      .account-hero { padding: 40px 0 96px; }
      .account-layout { grid-template-columns: 1fr; margin-top: -64px; }
      .account-aside { position: static; }
      .member-card {
        display: grid;
        grid-template-columns: auto 1fr;
        align-items: center;
        gap: 4px 16px;
        padding: 20px;
        text-align: left;
      }
      .avatar { grid-row: span 2; width: 64px; height: 64px; margin: 0; font-size: 1.5rem; }
      .member-badge { grid-column: 2; justify-self: start; margin-top: 8px; }
      .account-menu {
        flex-direction: row;
        overflow-x: auto;
        scrollbar-width: none;
        gap: 4px;
      }
      .account-menu::-webkit-scrollbar { display: none; }
      .account-menu a,
      .menu-logout { flex-shrink: 0; white-space: nowrap; }
      .menu-logout { margin-top: 0; border-top: 0; border-radius: 12px; }
      .stats { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    }
    @media (max-width: 640px) {
      .stats { grid-template-columns: 1fr; gap: 12px; }
      .stat { padding: 16px; }
      .panel { padding: 24px 20px; }
      .panel-head { flex-direction: column; gap: 12px; }
      .fields { grid-template-columns: 1fr; }
      .panel-actions { flex-direction: column-reverse; }
      .btn-lux, .btn-ghost { width: 100%; }
    }
  `]
})
export class ProfileComponent implements OnInit, OnDestroy {
  user: User | null = null;
  profileModel = { firstName: '', lastName: '', phone: '' };
  profileSaving = false;

  passwordFormModel = { currentPassword: '', newPassword: '', confirmPassword: '' };
  passwordLoading = false;
  passwordError = '';
  visible: Record<PasswordField, boolean> = { current: false, new: false, confirm: false };

  ordersLoading = true;
  stats = { count: 0, inProgress: 0, spent: 0 };

  private sub?: Subscription;

  constructor(
    private authService: AuthService,
    private api: ApiService,
    private toast: ToastService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.sub = this.authService.currentUser$.subscribe(u => {
      this.user = u;
      this.resetProfileForm();
    });
    this.loadOrderStats();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  get fullName(): string {
    const name = `${this.user?.firstName ?? ''} ${this.user?.lastName ?? ''}`.trim();
    return name || 'Mon compte';
  }

  get initials(): string {
    const f = this.user?.firstName?.trim()?.[0] ?? '';
    const l = this.user?.lastName?.trim()?.[0] ?? '';
    return (f + l).toUpperCase() || (this.user?.email?.[0]?.toUpperCase() ?? 'N');
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
    if (!p) return { level: 0, label: 'Au moins 6 caractères. Mélangez lettres, chiffres et symboles.' };
    if (p.length < 6) return { level: 1, label: 'Trop court — 6 caractères minimum.' };
    let score = 1;
    if (p.length >= 10) score++;
    if (/[a-z]/.test(p) && /[A-Z]/.test(p)) score++;
    if (/\d/.test(p) && /[^A-Za-z0-9]/.test(p)) score++;
    const level = Math.min(score, 4);
    const labels = ['', 'Faible', 'Moyen', 'Bon', 'Excellent'];
    return { level, label: `Robustesse : ${labels[level]}` };
  }

  toggle(field: PasswordField): void {
    this.visible[field] = !this.visible[field];
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
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
      phone: this.profileModel.phone.trim() || null,
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
          ...updated,
        } as User);
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
    if (newP.length < 6) {
      this.passwordError = 'Le nouveau mot de passe doit contenir au moins 6 caractères.';
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

  private loadOrderStats(): void {
    this.api.get<Order[]>('/orders').subscribe({
      next: (orders) => {
        const list = orders ?? [];
        const active: Order['status'][] = ['pending', 'paid', 'processing', 'shipped'];
        this.stats = {
          count: list.length,
          inProgress: list.filter(o => active.includes(o.status)).length,
          spent: list.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + Number(o.total || 0), 0),
        };
        this.ordersLoading = false;
      },
      error: () => {
        this.ordersLoading = false;
      },
    });
  }
}
