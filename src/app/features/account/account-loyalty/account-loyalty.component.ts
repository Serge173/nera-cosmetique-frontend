import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { formatDate, formatNumber, formatPrice } from '../../admin/shared/admin-format';
import { AccountOverviewService } from '../shared/account-overview.service';
import { LoyaltyDetails, LoyaltyVoucher } from '../shared/account.models';

const TIER_ICONS: Record<string, string> = {
  member: 'fa-solid fa-seedling',
  loyal: 'fa-solid fa-heart',
  privilege: 'fa-solid fa-gem',
  vip: 'fa-solid fa-crown',
};

const VOUCHER_STATE: Record<LoyaltyVoucher['state'], { label: string; tone: string }> = {
  active: { label: 'Valable', tone: 'green' },
  used: { label: 'Utilisé', tone: 'grey' },
  expired: { label: 'Expiré', tone: 'red' },
  disabled: { label: 'Désactivé', tone: 'grey' },
};

@Component({
  selector: 'app-account-loyalty',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="adm-page-head">
      <div>
        <h1>Mes points fidélité</h1>
        <p>Gagnez des points dès l'inscription et à chaque commande, puis transformez-les en codes promo.</p>
      </div>
    </div>

    @if (loading() && !data()) {
      <div class="top"><div class="adm-skel sk-hero"></div><div class="adm-skel sk-hero"></div></div>
      <div class="adm-skel sk-block"></div>
    } @else if (error() && !data()) {
      <div class="adm-card adm-empty">
        <i class="fa-solid fa-triangle-exclamation"></i>
        <p>Impossible de charger votre programme fidélité.</p>
        <button type="button" class="adm-btn adm-btn-sm" (click)="load()">Réessayer</button>
      </div>
    } @else if (data()) {
      @let d = data()!;
      <div class="top">
        <section class="balance">
          <div class="balance-head">
            <span class="tier-chip"><i class="{{ tierIcon(d.tier.key) }}"></i> {{ d.tier.label }}</span>
            <i class="fa-solid fa-crown bg-crown" aria-hidden="true"></i>
          </div>
          <p class="pts"><strong>{{ formatNumber(d.points) }}</strong> point{{ d.points > 1 ? 's' : '' }} disponible{{ d.points > 1 ? 's' : '' }}</p>
          <p class="val">Soit <strong>{{ formatPrice(d.value) }}</strong> de réduction</p>
          @if (d.tier.next) {
            <div class="progress" role="progressbar" [attr.aria-valuenow]="d.tier.progress" aria-valuemin="0" aria-valuemax="100" [attr.aria-label]="'Progression vers ' + d.tier.next.label">
              <span [style.width.%]="d.tier.progress"></span>
            </div>
            <p class="next">Encore <strong>{{ d.tier.next.missing }} pts</strong> pour devenir « {{ d.tier.next.label }} »</p>
          } @else {
            <p class="next"><i class="fa-solid fa-star"></i> Vous avez atteint le plus haut niveau. Merci pour votre fidélité !</p>
          }
          <p class="lifetime">{{ formatNumber(d.lifetime) }} points cumulés depuis votre inscription</p>
        </section>

        <section class="adm-card redeem" aria-labelledby="redeem-title">
          <h2 id="redeem-title" class="title"><i class="fa-solid fa-gift"></i> Convertir mes points</h2>
          @if (!d.rules.redeemEnabled) {
            <div class="locked">
              <span class="lock-icon"><i class="fa-solid fa-pause"></i></span>
              <p>La conversion des points en codes promo est <strong>momentanément suspendue</strong>.</p>
              <small>Vos points restent acquis et vos codes déjà obtenus restent valables.</small>
            </div>
          } @else if (d.points >= d.rules.minRedeem) {
            <p class="muted">
              Choisissez le nombre de points à transformer en code promo : chaque point vaut {{ formatPrice(d.rules.pointValue) }}@if (d.rules.redeemStep > 1) { (par tranche de {{ d.rules.redeemStep }})}.
            </p>
            <div class="stepper">
              <button type="button" class="adm-icon-btn" (click)="step(-1)" [disabled]="amount() <= d.rules.minRedeem" aria-label="Diminuer"><i class="fa-solid fa-minus"></i></button>
              <label class="amount">
                <input type="number" inputmode="numeric" [min]="d.rules.minRedeem" [max]="maxRedeem()" [step]="d.rules.redeemStep"
                       [value]="amount()" (input)="setAmount($any($event.target), false)" (change)="setAmount($any($event.target), true)"
                       aria-label="Nombre de points à convertir" />
                <small>points</small>
              </label>
              <button type="button" class="adm-icon-btn" (click)="step(1)" [disabled]="amount() + d.rules.redeemStep > d.points" aria-label="Augmenter"><i class="fa-solid fa-plus"></i></button>
            </div>
            <p class="equals">= code promo de <strong>{{ formatPrice(amount() * d.rules.pointValue) }}</strong> de réduction</p>
            <div class="quick">
              <button type="button" class="adm-chip" [class.active]="amount() === d.rules.minRedeem" (click)="amount.set(d.rules.minRedeem)">Minimum</button>
              <button type="button" class="adm-chip" [class.active]="amount() === maxRedeem()" (click)="amount.set(maxRedeem())">Tout convertir</button>
            </div>
            <button type="button" class="adm-btn block" (click)="redeem()" [disabled]="redeeming()">
              @if (redeeming()) { <i class="fa-solid fa-spinner fa-spin"></i> Génération du code… } @else { <i class="fa-solid fa-ticket"></i> Générer mon code promo }
            </button>
            <small class="fine">Code à usage unique, valable {{ d.rules.voucherValidityDays }} jours, utilisable uniquement avec votre compte.</small>
          } @else {
            <div class="locked">
              <span class="lock-icon"><i class="fa-solid fa-lock"></i></span>
              <p>Il vous faut au moins <strong>{{ d.rules.minRedeem }} point{{ d.rules.minRedeem > 1 ? 's' : '' }}</strong> pour obtenir un code promo de {{ formatPrice(d.rules.minRedeem * d.rules.pointValue) }}.</p>
              <div class="progress light"><span [style.width.%]="(d.points / d.rules.minRedeem) * 100"></span></div>
              <small>Encore {{ d.rules.minRedeem - d.points }} points — soit environ {{ formatPrice((d.rules.minRedeem - d.points) * d.rules.amountPerPoint) }} d'achats.</small>
              <a routerLink="/boutique" class="adm-btn adm-btn-soft adm-btn-sm">Découvrir la boutique</a>
            </div>
          }
        </section>
      </div>

      @if (lastVoucher(); as v) {
        <div class="adm-card fresh" role="status">
          <span class="fresh-icon"><i class="fa-solid fa-champagne-glasses"></i></span>
          <div>
            <strong>Votre code promo de {{ formatPrice(v.value) }} est prêt !</strong>
            <p>Saisissez-le dans votre panier lors de votre prochaine commande (en étant connecté à votre compte).</p>
          </div>
          <button type="button" class="code big" (click)="copy(v.code)" [attr.aria-label]="'Copier le code ' + v.code">{{ v.code }} <i class="fa-regular fa-copy"></i></button>
        </div>
      }

      <section class="adm-card pad" aria-labelledby="tiers-title">
        <h2 id="tiers-title" class="title">Les niveaux du programme</h2>
        <div class="tiers">
          @for (t of d.tiers; track t.key) {
            <div class="tier" [class.reached]="d.lifetime >= t.min" [class.current]="t.key === d.tier.key">
              <span class="tier-icon"><i class="{{ tierIcon(t.key) }}"></i></span>
              <strong>{{ t.label }}</strong>
              <small>{{ t.min === 0 ? 'Dès l’inscription' : 'À partir de ' + t.min + ' pts' }}</small>
              @if (t.key === d.tier.key) {
                <span class="adm-badge peach">Votre niveau</span>
              } @else if (d.lifetime >= t.min) {
                <span class="adm-badge green"><i class="fa-solid fa-check"></i> Atteint</span>
              } @else {
                <span class="adm-badge grey">Encore {{ t.min - d.lifetime }} pts</span>
              }
            </div>
          }
        </div>
      </section>

      <div class="cols">
        <section class="adm-card pad" aria-labelledby="vouchers-title">
          <h2 id="vouchers-title" class="title">Mes codes promo fidélité</h2>
          @if (d.vouchers.length) {
            <ul class="vouchers">
              @for (v of d.vouchers; track v.code) {
                <li class="voucher" [class.inactive]="v.state !== 'active'">
                  <div class="v-left">
                    <strong>{{ formatPrice(v.value) }}</strong>
                    <small>{{ v.points }} pts</small>
                  </div>
                  <div class="v-main">
                    @if (v.state === 'active') {
                      <button type="button" class="code" (click)="copy(v.code)" [attr.aria-label]="'Copier le code ' + v.code">{{ v.code }} <i class="fa-regular fa-copy"></i></button>
                    } @else {
                      <span class="code off">{{ v.code }}</span>
                    }
                    <small>
                      @if (v.state === 'active' && v.validTo) { Valable jusqu'au {{ formatDate(v.validTo) }} }
                      @else { Obtenu le {{ formatDate(v.createdAt) }} }
                    </small>
                  </div>
                  <span class="adm-badge {{ voucherState(v).tone }}">{{ voucherState(v).label }}</span>
                </li>
              }
            </ul>
          } @else {
            <div class="adm-empty compact">
              <i class="fa-solid fa-ticket"></i>
              <p>Vous n'avez pas encore généré de code promo.</p>
            </div>
          }
        </section>

        <section class="adm-card pad" aria-labelledby="history-title">
          <h2 id="history-title" class="title">Historique des points</h2>
          @if (d.history.length) {
            <ul class="history">
              @for (h of d.history; track $index) {
                <li>
                  @if (h.type === 'welcome') {
                    <span class="h-icon"><i class="fa-solid fa-gift"></i></span>
                    <div class="h-main">
                      <strong>Bonus de bienvenue</strong>
                      <small>{{ formatDate(h.date) }} • Création de votre compte</small>
                    </div>
                  } @else {
                    <span class="h-icon"><i class="fa-solid fa-plus"></i></span>
                    <a [routerLink]="['/compte/commandes', h.orderId]" class="h-main">
                      <strong>Commande #{{ h.orderNumber }}</strong>
                      <small>{{ formatDate(h.date) }} • {{ formatPrice(h.amount) }}</small>
                    </a>
                  }
                  <span class="h-pts">+{{ h.points }} pts</span>
                </li>
              }
            </ul>
          } @else {
            <div class="adm-empty compact">
              <i class="fa-solid fa-clock-rotate-left"></i>
              <p>Vos points apparaîtront ici dès la livraison de votre première commande.</p>
            </div>
          }
        </section>
      </div>

      <section class="adm-card pad rules" aria-labelledby="rules-title">
        <h2 id="rules-title" class="title">Comment ça marche ?</h2>
        <ol class="how">
          <li><span>1</span><div><strong>Inscrivez-vous et commandez</strong><p>{{ d.rules.welcomeBonus }} points offerts à la création de votre compte, puis 1 point pour chaque {{ formatPrice(d.rules.amountPerPoint) }} d'achats, dès que votre commande est livrée.</p></div></li>
          <li><span>2</span><div><strong>Cumulez</strong><p>Chaque point vaut {{ formatPrice(d.rules.pointValue) }} de réduction : {{ d.rules.welcomeBonus }} points = {{ formatPrice(d.rules.welcomeBonus * d.rules.pointValue) }}. Plus vous cumulez, plus votre niveau augmente.</p></div></li>
          <li><span>3</span><div><strong>Profitez</strong><p>Dès {{ d.rules.minRedeem }} point{{ d.rules.minRedeem > 1 ? 's' : '' }}, générez un code promo du montant de vos points et utilisez-le sur votre prochaine commande.</p></div></li>
        </ol>
        <p class="fine">Les points sont calculés sur le montant des articles, hors frais de livraison et après réductions. Un code promo non utilisé avant expiration vous rend ses points.</p>
      </section>
    }
  `,
  styles: [`
    :host { display: block; }
    .top { display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr); gap: 20px; margin-bottom: 20px; }
    .balance { position: relative; overflow: hidden; border-radius: var(--adm-radius); padding: 26px 28px; color: #fff; background: radial-gradient(circle at 85% 15%, #ffb070 0%, transparent 45%), linear-gradient(135deg, #ff7a1a 0%, #ff6600 45%, #d65200 100%); box-shadow: 0 16px 40px rgba(255, 102, 0, .28); }
    .balance-head { display: flex; justify-content: space-between; align-items: flex-start; }
    .tier-chip { display: inline-flex; align-items: center; gap: 8px; padding: 6px 14px; border-radius: 999px; background: rgba(255, 255, 255, .2); font-size: .8rem; font-weight: 600; backdrop-filter: blur(4px); }
    .bg-crown { position: absolute; right: -10px; top: -14px; font-size: 7.5rem; opacity: .12; transform: rotate(14deg); }
    .pts { margin: 22px 0 2px; font-size: 1rem; }
    .pts strong { font-size: 3rem; font-weight: 800; line-height: 1; margin-right: 6px; letter-spacing: -.02em; }
    .val { margin: 0 0 20px; font-size: .95rem; opacity: .95; }
    .progress { height: 8px; border-radius: 999px; background: rgba(255, 255, 255, .28); overflow: hidden; }
    .progress span { display: block; height: 100%; border-radius: inherit; background: #fff; transition: width .6s ease; max-width: 100%; }
    .progress.light { background: #f4ece6; margin: 10px 0 6px; width: 100%; }
    .progress.light span { background: var(--adm-orange); }
    .next { margin: 10px 0 0; font-size: .86rem; }
    .lifetime { margin: 16px 0 0; font-size: .78rem; opacity: .8; }
    .title { display: flex; align-items: center; gap: 10px; margin: 0 0 14px; font-size: 1.02rem; font-weight: 700; color: var(--adm-ink); }
    .title i { color: var(--adm-orange); }
    .redeem { padding: 22px 24px; display: flex; flex-direction: column; }
    .muted { margin: 0 0 16px; font-size: .85rem; color: var(--adm-muted); }
    .stepper { display: flex; align-items: center; justify-content: center; gap: 18px; }
    .amount { min-width: 120px; text-align: center; display: flex; flex-direction: column; }
    .amount input { width: 120px; border: 0; border-bottom: 2px solid var(--adm-line); background: transparent; text-align: center; font: inherit; font-size: 2rem; font-weight: 700; color: var(--adm-ink); line-height: 1.1; padding: 0 0 2px; -moz-appearance: textfield; appearance: textfield; }
    .amount input::-webkit-outer-spin-button, .amount input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
    .amount input:focus { outline: none; border-bottom-color: var(--adm-orange); }
    .amount small { color: var(--adm-muted); font-size: .78rem; }
    .equals { text-align: center; margin: 10px 0 12px; color: var(--adm-text); }
    .equals strong { color: var(--adm-orange-dark); }
    .quick { display: flex; justify-content: center; gap: 8px; margin-bottom: 16px; }
    .block { width: 100%; margin-top: auto; }
    .fine { display: block; margin-top: 10px; font-size: .76rem; color: var(--adm-muted); text-align: center; }
    .rules .fine { text-align: left; margin-top: 14px; }
    .locked { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 4px; flex: 1; justify-content: center; }
    .locked p { margin: 6px 0 0; font-size: .88rem; color: var(--adm-text); }
    .locked small { color: var(--adm-muted); font-size: .78rem; margin-bottom: 12px; }
    .lock-icon { width: 54px; height: 54px; border-radius: 50%; background: var(--adm-orange-soft); color: var(--adm-orange); display: inline-flex; align-items: center; justify-content: center; font-size: 1.2rem; }
    .fresh { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; padding: 18px 22px; margin-bottom: 20px; border: 1.5px solid #ffd2b0; background: linear-gradient(90deg, #fff6ef, #fff); }
    .fresh > div { flex: 1; min-width: 200px; }
    .fresh p { margin: 2px 0 0; font-size: .85rem; color: var(--adm-muted); }
    .fresh-icon { width: 46px; height: 46px; border-radius: 50%; background: var(--adm-orange); color: #fff; display: inline-flex; align-items: center; justify-content: center; }
    .code { display: inline-flex; align-items: center; gap: 8px; padding: 6px 12px; border-radius: 8px; border: 1.5px dashed var(--adm-orange); background: var(--adm-orange-50); color: var(--adm-orange-deep); font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-weight: 700; font-size: .86rem; letter-spacing: .06em; cursor: pointer; }
    .code:hover { background: var(--adm-orange-soft); }
    .code.big { font-size: 1.05rem; padding: 10px 16px; }
    .code.off { border-color: #ddd3cd; background: #f8f5f3; color: var(--adm-muted); cursor: default; text-decoration: line-through; }
    .pad { padding: 22px 24px; margin-bottom: 20px; }
    .tiers { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; }
    .tier { position: relative; padding: 18px 16px; border-radius: 14px; border: 1.5px solid var(--adm-line); display: flex; flex-direction: column; gap: 4px; background: #fdfbfa; }
    .tier.reached { background: #fff; }
    .tier.current { border-color: var(--adm-orange); box-shadow: 0 10px 24px rgba(255, 102, 0, .12); }
    .tier-icon { width: 42px; height: 42px; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; background: #f2ece8; color: #b3a79f; margin-bottom: 6px; }
    .tier.reached .tier-icon { background: var(--adm-orange-soft); color: var(--adm-orange); }
    .tier strong { color: var(--adm-ink); font-size: .92rem; }
    .tier small { color: var(--adm-muted); font-size: .76rem; }
    .tier .adm-badge { align-self: flex-start; margin-top: 10px; }
    .cols { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; }
    .vouchers, .history { list-style: none; margin: 0; padding: 0; }
    .voucher { display: flex; align-items: center; gap: 14px; padding: 12px 0; border-top: 1px solid var(--adm-line); }
    .voucher:first-child { border-top: 0; padding-top: 0; }
    .voucher.inactive .v-left { background: #f4f0ed; color: var(--adm-muted); }
    .v-left { width: 84px; flex-shrink: 0; padding: 10px 6px; border-radius: 10px; text-align: center; background: var(--adm-orange-soft); color: var(--adm-orange-deep); display: flex; flex-direction: column; }
    .v-left strong { font-size: .8rem; }
    .v-left small { font-size: .7rem; opacity: .8; }
    .v-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 5px; align-items: flex-start; }
    .v-main small { font-size: .76rem; color: var(--adm-muted); }
    .history li { display: flex; align-items: center; gap: 12px; padding: 11px 0; border-top: 1px solid var(--adm-line); }
    .history li:first-child { border-top: 0; padding-top: 0; }
    .h-icon { width: 34px; height: 34px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; background: #e3f6ea; color: #2b8a52; font-size: .75rem; flex-shrink: 0; }
    .h-main { flex: 1; min-width: 0; display: flex; flex-direction: column; text-decoration: none; }
    .h-main strong { color: var(--adm-ink); font-size: .88rem; }
    .h-main:hover strong { color: var(--adm-orange); }
    .h-main small { color: var(--adm-muted); font-size: .76rem; }
    .h-pts { font-weight: 700; color: #2b8a52; white-space: nowrap; }
    .compact { padding: 28px 12px; }
    .how { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 18px; }
    .how li { display: flex; gap: 14px; align-items: flex-start; }
    .how span { width: 36px; height: 36px; border-radius: 50%; background: var(--adm-orange); color: #fff; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .how strong { color: var(--adm-ink); }
    .how p { margin: 4px 0 0; font-size: .84rem; color: var(--adm-text); line-height: 1.5; }
    .sk-hero { height: 250px; border-radius: var(--adm-radius); }
    .sk-block { height: 220px; border-radius: var(--adm-radius); }
    @media (max-width: 1200px) { .tiers { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
    @media (max-width: 1000px) {
      .top, .cols { grid-template-columns: minmax(0, 1fr); }
      .how { grid-template-columns: minmax(0, 1fr); }
    }
    @media (max-width: 560px) {
      .balance { padding: 22px 20px; }
      .pts strong { font-size: 2.4rem; }
      .tiers { grid-template-columns: minmax(0, 1fr); }
      .pad, .redeem { padding: 18px 16px; }
    }
  `],
})
export class AccountLoyaltyComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private overview = inject(AccountOverviewService);

  readonly data = signal<LoyaltyDetails | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly amount = signal(0);
  readonly redeeming = signal(false);
  readonly lastVoucher = signal<{ code: string; value: number } | null>(null);

  readonly maxRedeem = computed(() => {
    const d = this.data();
    if (!d) return 0;
    return Math.floor(d.points / d.rules.redeemStep) * d.rules.redeemStep;
  });

  readonly formatPrice = formatPrice;
  readonly formatNumber = formatNumber;
  readonly formatDate = formatDate;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(false);
    this.api.get<LoyaltyDetails>('/account/loyalty').subscribe({
      next: (d) => {
        this.data.set(d);
        const current = this.amount();
        this.amount.set(Math.max(d.rules.minRedeem, current > 0 ? Math.min(current, this.maxRedeem()) : this.maxRedeem()));
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  tierIcon(key: string): string {
    return TIER_ICONS[key] ?? 'fa-solid fa-star';
  }

  voucherState(v: LoyaltyVoucher) {
    return VOUCHER_STATE[v.state] ?? VOUCHER_STATE.disabled;
  }

  step(direction: 1 | -1): void {
    const d = this.data();
    if (!d) return;
    const next = this.amount() + direction * d.rules.redeemStep;
    if (next < d.rules.minRedeem || next > d.points) return;
    this.amount.set(next);
  }

  /** Saisie libre : la valeur est ramenée dans les bornes autorisées à la validation du champ. */
  setAmount(input: HTMLInputElement, commit: boolean): void {
    const d = this.data();
    if (!d) return;
    const n = Math.floor(Number(input.value));
    const inRange = input.value !== '' && Number.isFinite(n) && n >= d.rules.minRedeem && n <= this.maxRedeem();
    if (!commit && !inRange) return;
    const base = Number.isFinite(n) && input.value !== '' ? n : d.rules.minRedeem;
    const stepped = Math.floor(base / d.rules.redeemStep) * d.rules.redeemStep;
    this.amount.set(Math.min(this.maxRedeem(), Math.max(d.rules.minRedeem, stepped)));
    if (commit) input.value = String(this.amount());
  }

  redeem(): void {
    const d = this.data();
    if (!d || this.redeeming()) return;
    const points = this.amount();
    if (points < d.rules.minRedeem || points > d.points || points % d.rules.redeemStep !== 0) return;
    this.redeeming.set(true);
    this.api.post<{ code: string; value: number; points: number; remaining: number }>('/account/loyalty/redeem', { points }).subscribe({
      next: (res) => {
        this.redeeming.set(false);
        this.lastVoucher.set({ code: res.code, value: res.value });
        this.toast.success(`Votre bon de ${formatPrice(res.value)} a été créé.`);
        this.load();
        this.overview.refresh();
      },
      error: (err) => {
        this.redeeming.set(false);
        this.toast.error(err?.error?.message ?? 'Impossible de convertir vos points pour le moment.');
        this.load();
      },
    });
  }

  copy(code: string): void {
    const done = () => this.toast.success(`Code ${code} copié.`);
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(code).then(done, () => this.toast.info(`Votre code : ${code}`));
    } else {
      this.toast.info(`Votre code : ${code}`);
    }
  }
}
