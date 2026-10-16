import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Order } from '../../../models/order.model';
import { safeProductImageUrl } from '../../../shared/utils/placeholder-image';
import { formatDateTime, formatPrice, paymentLabel, statusLabel, statusTone } from '../../admin/shared/admin-format';
import { ReorderService } from '../shared/reorder.service';

const STEPS = [
  { label: 'Commande reçue', icon: 'fa-solid fa-receipt' },
  { label: 'En préparation', icon: 'fa-solid fa-box' },
  { label: 'Expédiée', icon: 'fa-solid fa-truck-fast' },
  { label: 'Livrée', icon: 'fa-solid fa-house-circle-check' },
];

const STEP_INDEX: Record<string, number> = { pending: 0, paid: 1, processing: 1, shipped: 2, delivered: 3 };

const DELIVERY_LABELS: Record<string, string> = {
  abidjan: 'Livraison à Abidjan',
  interior: 'Livraison à l’intérieur du pays',
  standard: 'Livraison standard',
  express: 'Livraison express',
};

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [RouterLink],
  template: `
    <a routerLink="/compte/commandes" class="back"><i class="fa-solid fa-arrow-left"></i> Retour à mes commandes</a>

    @if (loading()) {
      <div class="adm-card pad"><div class="adm-skel sk-title"></div><div class="adm-skel sk-steps"></div></div>
      <div class="adm-card pad"><div class="adm-skel sk-block"></div></div>
    } @else if (order()) {
      @let o = order()!;
      <div class="adm-page-head">
        <div>
          <h1>Commande #{{ o.orderNumber }}</h1>
          <p>Passée le {{ formatDateTime(o.createdAt) }}</p>
        </div>
        <div class="head-actions">
          <span class="adm-badge {{ statusTone(o.status) }} big">{{ statusLabel(o.status) }}</span>
          @if (o.status === 'delivered' || o.status === 'cancelled') {
            <button type="button" class="adm-btn" (click)="reorder(o)" [disabled]="reordering()">
              @if (reordering()) { <i class="fa-solid fa-spinner fa-spin"></i> } @else { <i class="fa-solid fa-rotate-right"></i> }
              Commander à nouveau
            </button>
          }
        </div>
      </div>

      <section class="adm-card pad" aria-label="Suivi de la commande">
        @if (o.status === 'cancelled') {
          <div class="cancelled">
            <i class="fa-solid fa-ban"></i>
            <div>
              <strong>Cette commande a été annulée.</strong>
              <p>Si vous pensez qu'il s'agit d'une erreur, notre service client est là pour vous aider.</p>
            </div>
            <a routerLink="/compte/support" fragment="contact" class="adm-btn adm-btn-ghost adm-btn-sm">Nous contacter</a>
          </div>
        } @else {
          <ol class="steps">
            @for (s of steps; track s.label; let i = $index) {
              <li [class.done]="i < step()" [class.current]="i === step()">
                <span class="dot"><i class="{{ i < step() ? 'fa-solid fa-check' : s.icon }}"></i></span>
                <span class="label">{{ s.label }}</span>
              </li>
            }
          </ol>
          <p class="step-note">
            @switch (o.status) {
              @case ('pending') { Nous avons bien reçu votre commande. Nous vous contacterons pour la confirmer. }
              @case ('shipped') { Votre colis est en route ! Le livreur vous appellera avant de passer. }
              @case ('delivered') { Votre commande a été livrée. Merci pour votre confiance ! }
              @default { Votre commande est en cours de préparation dans nos locaux. }
            }
          </p>
        }
      </section>

      <div class="grid">
        <section class="adm-card pad" aria-labelledby="items-title">
          <h2 id="items-title" class="title">Articles ({{ itemCount() }})</h2>
          <ul class="items">
            @for (item of o.items; track item.id) {
              <li class="item">
                <a [routerLink]="['/produit', item.productSlug]" class="thumb">
                  <img [src]="image(item.productImageUrl)" [alt]="item.productName" loading="lazy" />
                </a>
                <div class="item-info">
                  <a [routerLink]="['/produit', item.productSlug]" class="item-name">{{ item.productName }}</a>
                  @if (item.productBrandName) { <small>{{ item.productBrandName }}</small> }
                  <small>{{ formatPrice(item.unitPrice) }} × {{ item.quantity }}</small>
                </div>
                <strong class="item-total">{{ formatPrice(item.totalPrice) }}</strong>
              </li>
            }
          </ul>
          @if (o.status === 'delivered') {
            <a routerLink="/compte/avis" class="review-cta">
              <i class="fa-regular fa-star"></i>
              <span>Vous avez aimé vos produits ? <strong>Donnez votre avis</strong></span>
              <i class="fa-solid fa-chevron-right"></i>
            </a>
          }
        </section>

        <div class="side">
          <section class="adm-card pad" aria-labelledby="sum-title">
            <h2 id="sum-title" class="title">Récapitulatif</h2>
            <dl class="totals">
              <div><dt>Sous-total</dt><dd>{{ formatPrice(o.subtotal) }}</dd></div>
              <div><dt>Livraison</dt><dd>{{ +o.shippingAmount > 0 ? formatPrice(o.shippingAmount) : 'Offerte' }}</dd></div>
              @if (+o.discountAmount > 0) {
                <div class="discount"><dt>Réduction</dt><dd>− {{ formatPrice(o.discountAmount) }}</dd></div>
              }
              <div class="grand"><dt>Total</dt><dd>{{ formatPrice(o.total) }}</dd></div>
            </dl>
            <p class="pay"><i class="fa-solid fa-wallet"></i> {{ paymentLabel(o.paymentMethod) }}</p>
          </section>

          <section class="adm-card pad" aria-labelledby="addr-title">
            <h2 id="addr-title" class="title">Livraison</h2>
            <address class="addr">
              <strong>{{ o.firstName }} {{ o.lastName }}</strong>
              <span>{{ o.addressLine1 }}</span>
              @if (o.addressLine2) { <span>{{ o.addressLine2 }}</span> }
              <span>{{ o.city }}</span>
              <span><i class="fa-solid fa-phone"></i> {{ o.phone }}</span>
              <span><i class="fa-regular fa-envelope"></i> {{ o.email }}</span>
            </address>
            @if (o.deliveryMethod) {
              <p class="pay"><i class="fa-solid fa-truck"></i> {{ deliveryLabel(o.deliveryMethod) }}</p>
            }
          </section>

          <section class="adm-card pad help">
            <p><strong>Une question sur cette commande ?</strong></p>
            <a [href]="whatsappLink(o)" target="_blank" rel="noopener" class="adm-btn adm-btn-soft adm-btn-sm"><i class="fa-brands fa-whatsapp"></i> Écrire sur WhatsApp</a>
          </section>
        </div>
      </div>
    } @else {
      <div class="adm-card adm-empty">
        <i class="fa-solid fa-magnifying-glass"></i>
        <strong>Commande introuvable</strong>
        <p>Cette commande n'existe pas ou n'est pas associée à votre compte.</p>
        <a routerLink="/compte/commandes" class="adm-btn adm-btn-sm">Voir mes commandes</a>
      </div>
    }
  `,
  styles: [`
    :host { display: block; }
    .back { display: inline-flex; align-items: center; gap: 8px; margin-bottom: 14px; font-size: .85rem; font-weight: 600; color: var(--adm-muted); text-decoration: none; }
    .back:hover { color: var(--adm-orange); }
    .head-actions { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .big { font-size: .82rem; padding: 7px 14px; }
    .pad { padding: 22px 24px; margin-bottom: 20px; }
    .title { margin: 0 0 16px; font-size: 1.02rem; font-weight: 700; color: var(--adm-ink); }
    .steps { list-style: none; margin: 4px 0 0; padding: 0; display: grid; grid-template-columns: repeat(4, 1fr); }
    .steps li { position: relative; display: flex; flex-direction: column; align-items: center; gap: 10px; text-align: center; }
    .steps li + li::before { content: ''; position: absolute; top: 22px; right: 50%; width: 100%; height: 3px; background: var(--adm-line); z-index: 0; }
    .steps li.done::before, .steps li.current::before { background: var(--adm-orange); }
    .dot { position: relative; z-index: 1; width: 46px; height: 46px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; background: #f5f0ed; color: #b3aaa4; border: 3px solid #fff; box-shadow: 0 0 0 1px var(--adm-line); }
    .done .dot { background: var(--adm-orange); color: #fff; box-shadow: none; }
    .current .dot { background: #fff; color: var(--adm-orange); box-shadow: 0 0 0 2px var(--adm-orange), 0 0 0 7px rgba(255, 102, 0, .14); }
    .label { font-size: .82rem; font-weight: 600; color: var(--adm-muted); }
    .done .label, .current .label { color: var(--adm-ink); }
    .step-note { margin: 20px 0 0; padding: 12px 16px; border-radius: 10px; background: var(--adm-orange-50); color: var(--adm-text); font-size: .86rem; text-align: center; }
    .cancelled { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
    .cancelled > i { width: 46px; height: 46px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; background: #fdeceb; color: #c53b4b; font-size: 1.1rem; }
    .cancelled div { flex: 1; min-width: 200px; }
    .cancelled p { margin: 2px 0 0; font-size: .86rem; color: var(--adm-muted); }
    .grid { display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: 20px; align-items: start; }
    .grid .pad { margin-bottom: 0; }
    .side { display: flex; flex-direction: column; gap: 20px; }
    .items { list-style: none; margin: 0; padding: 0; }
    .item { display: grid; grid-template-columns: 68px minmax(0, 1fr) auto; gap: 14px; align-items: center; padding: 12px 0; border-top: 1px solid var(--adm-line); }
    .item:first-child { border-top: 0; padding-top: 0; }
    .thumb img { width: 68px; height: 68px; border-radius: 12px; object-fit: cover; background: #fbf6f2; display: block; }
    .item-info { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    .item-name { font-weight: 600; color: var(--adm-ink); text-decoration: none; }
    .item-name:hover { color: var(--adm-orange); }
    .item-info small { font-size: .78rem; color: var(--adm-muted); }
    .item-total { white-space: nowrap; color: var(--adm-ink); }
    .review-cta { display: flex; align-items: center; gap: 12px; margin-top: 16px; padding: 14px 16px; border-radius: 12px; background: var(--adm-orange-50); border: 1px dashed #f6c9a8; color: var(--adm-text); text-decoration: none; font-size: .88rem; }
    .review-cta span { flex: 1; }
    .review-cta > i:first-child { color: #f2b33d; font-size: 1.1rem; }
    .review-cta strong { color: var(--adm-orange-dark); }
    .totals { margin: 0; display: flex; flex-direction: column; gap: 10px; }
    .totals div { display: flex; justify-content: space-between; gap: 10px; font-size: .88rem; }
    .totals dt { color: var(--adm-muted); }
    .totals dd { margin: 0; font-weight: 600; color: var(--adm-ink); }
    .totals .discount dd { color: #2b8a52; }
    .totals .grand { margin-top: 6px; padding-top: 12px; border-top: 1px solid var(--adm-line); font-size: 1rem; }
    .totals .grand dt { color: var(--adm-ink); font-weight: 700; }
    .totals .grand dd { color: var(--adm-orange-dark); font-weight: 800; }
    .pay { display: flex; align-items: center; gap: 8px; margin: 14px 0 0; padding: 10px 12px; border-radius: 10px; background: #faf6f3; font-size: .84rem; color: var(--adm-text); }
    .pay i { color: var(--adm-orange); }
    .addr { font-style: normal; display: flex; flex-direction: column; gap: 4px; font-size: .88rem; color: var(--adm-text); word-break: break-word; }
    .addr strong { color: var(--adm-ink); }
    .addr i { width: 16px; color: var(--adm-muted); font-size: .78rem; }
    .help p { margin: 0 0 10px; font-size: .9rem; }
    .sk-title { height: 28px; width: 40%; margin-bottom: 20px; }
    .sk-steps { height: 70px; }
    .sk-block { height: 180px; }
    @media (max-width: 1100px) { .grid { grid-template-columns: minmax(0, 1fr); } }
    @media (max-width: 600px) {
      .pad { padding: 18px 16px; }
      .dot { width: 38px; height: 38px; font-size: .85rem; }
      .steps li + li::before { top: 18px; }
      .label { font-size: .72rem; }
      .item { grid-template-columns: 56px minmax(0, 1fr); }
      .thumb img { width: 56px; height: 56px; }
      .item-total { grid-column: 2; }
    }
  `],
})
export class OrderDetailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);
  private reorderService = inject(ReorderService);

  readonly steps = STEPS;
  readonly order = signal<Order | null>(null);
  readonly loading = signal(true);
  readonly reordering = signal(false);
  readonly step = computed(() => STEP_INDEX[this.order()?.status ?? ''] ?? 0);
  readonly itemCount = computed(() => (this.order()?.items ?? []).reduce((n, i) => n + Number(i.quantity || 0), 0));

  readonly formatPrice = formatPrice;
  readonly formatDateTime = formatDateTime;
  readonly statusLabel = statusLabel;
  readonly statusTone = statusTone;
  readonly paymentLabel = paymentLabel;
  readonly image = safeProductImageUrl;

  private sub?: Subscription;

  ngOnInit(): void {
    this.sub = this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (!id) {
        this.order.set(null);
        this.loading.set(false);
        return;
      }
      this.loading.set(true);
      this.api.get<Order>(`/orders/${encodeURIComponent(id)}`).subscribe({
        next: (order) => {
          this.order.set(order ?? null);
          this.loading.set(false);
        },
        error: () => {
          this.order.set(null);
          this.loading.set(false);
        },
      });
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  deliveryLabel(method: string): string {
    return DELIVERY_LABELS[method] ?? method;
  }

  whatsappLink(o: Order): string {
    const text = `Bonjour Nera Cosmétique, j'ai une question concernant ma commande #${o.orderNumber}.`;
    return `https://wa.me/2250789684467?text=${encodeURIComponent(text)}`;
  }

  reorder(o: Order): void {
    if (this.reordering()) return;
    this.reordering.set(true);
    this.reorderService.reorder(o.items).subscribe({
      complete: () => this.reordering.set(false),
      error: () => this.reordering.set(false),
    });
  }
}
