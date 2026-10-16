import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  NgZone,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { formatCompact } from './admin-format';

let uid = 0;

function svgUrl(id: string): string {
  return `url(${location.href.split('#')[0]}#${id})`;
}

function niceScale(max: number, steps = 4): { max: number; step: number } {
  if (max <= 0) return { max: steps, step: 1 };
  const raw = max / steps;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10) * mag;
  return { max: step * steps, step };
}

/* ------------------------------------------------------------------ */
/* Courbe d'évolution                                                  */
/* ------------------------------------------------------------------ */

export interface LinePoint {
  label: string;
  value: number;
  hint?: string;
}

@Component({
  selector: 'adm-line-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="lc" #box (mouseleave)="hover = -1">
      @if (width > 0) {
        <svg [attr.width]="width" [attr.height]="height" [attr.aria-label]="ariaLabel" role="img"
             (mousemove)="onMove($event)" (touchstart)="onTouch($event)">
          <defs>
            <linearGradient [attr.id]="gid" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="var(--adm-orange)" stop-opacity="0.26" />
              <stop offset="100%" stop-color="var(--adm-orange)" stop-opacity="0" />
            </linearGradient>
          </defs>
          @for (t of ticks; track t.y) {
            <line class="grid" [attr.x1]="padL" [attr.x2]="width - padR" [attr.y1]="t.y" [attr.y2]="t.y" />
            <text class="ytick" [attr.x]="padL - 10" [attr.y]="t.y + 4" text-anchor="end">{{ t.label }}</text>
          }
          <path [attr.d]="areaPath" [attr.fill]="fillUrl" />
          <path [attr.d]="linePath" class="line" />
          @if (hover >= 0) {
            <line class="guide" [attr.x1]="pts[hover].x" [attr.x2]="pts[hover].x" [attr.y1]="padT" [attr.y2]="height - padB" />
          }
          @for (p of pts; track $index) {
            @if (showDots || hover === $index) {
              <circle [attr.cx]="p.x" [attr.cy]="p.y" [attr.r]="hover === $index ? 6 : 4" class="dot" [class.active]="hover === $index" />
            }
          }
          @for (p of pts; track $index) {
            @if (p.showLabel) {
              <text class="xtick" [attr.x]="p.x" [attr.y]="height - 8" text-anchor="middle">{{ p.label }}</text>
            }
          }
        </svg>
        @if (hover >= 0) {
          <div class="tip" [style.left.px]="pts[hover].x" [style.top.px]="pts[hover].y">
            <span class="tip-label">{{ pts[hover].label }}</span>
            <strong>{{ format(pts[hover].value) }}</strong>
            @if (pts[hover].hint) { <span class="tip-hint">{{ pts[hover].hint }}</span> }
          </div>
        }
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .lc { position: relative; width: 100%; }
    svg { display: block; overflow: visible; touch-action: pan-y; }
    .grid { stroke: #f1ebe7; stroke-width: 1; }
    .ytick, .xtick { fill: #9a938f; font-size: 11px; font-family: var(--font-body); }
    .line { fill: none; stroke: var(--adm-orange); stroke-width: 2.25; stroke-linejoin: round; stroke-linecap: round; }
    .dot { fill: var(--adm-orange); stroke: #fff; stroke-width: 2; transition: r .15s; }
    .guide { stroke: var(--adm-orange); stroke-width: 1; stroke-dasharray: 3 4; opacity: .5; }
    .tip {
      position: absolute; transform: translate(-50%, calc(-100% - 14px)); pointer-events: none;
      background: #241f1c; color: #fff; padding: 8px 12px; border-radius: 10px; font-size: 12px;
      white-space: nowrap; display: flex; flex-direction: column; align-items: center; gap: 1px;
      box-shadow: 0 10px 24px rgba(36, 31, 28, .22);
    }
    .tip::after {
      content: ''; position: absolute; bottom: -5px; left: 50%; width: 10px; height: 10px;
      background: #241f1c; transform: translateX(-50%) rotate(45deg);
    }
    .tip strong { font-size: 13px; font-weight: 600; }
    .tip-label, .tip-hint { opacity: .7; font-size: 11px; }
  `],
})
export class AdmLineChartComponent implements AfterViewInit, OnDestroy {
  @ViewChild('box', { static: true }) box!: ElementRef<HTMLDivElement>;
  @Input() height = 240;
  @Input() ariaLabel = 'Graphique';
  @Input() format: (n: number) => string = (n) => formatCompact(n);
  @Input() axisFormat: (n: number) => string = (n) => formatCompact(n);
  @Input() set points(value: LinePoint[] | null | undefined) {
    this.data = value ?? [];
    this.layout();
  }

  readonly gid = `lc-grad-${++uid}`;
  readonly padL = 46;
  readonly padR = 12;
  readonly padT = 14;
  readonly padB = 30;
  width = 0;
  hover = -1;
  data: LinePoint[] = [];
  pts: { x: number; y: number; label: string; value: number; hint?: string; showLabel: boolean }[] = [];
  ticks: { y: number; label: string }[] = [];
  linePath = '';
  areaPath = '';
  fillUrl = '';
  showDots = true;
  private observer?: ResizeObserver;

  constructor(private cdr: ChangeDetectorRef, private zone: NgZone) {}

  ngAfterViewInit(): void {
    this.observer = new ResizeObserver((entries) => {
      const w = Math.floor(entries[0].contentRect.width);
      if (w !== this.width) this.zone.run(() => { this.width = w; this.layout(); });
    });
    this.observer.observe(this.box.nativeElement);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  private layout(): void {
    if (!this.width) return;
    const n = this.data.length;
    const innerW = Math.max(this.width - this.padL - this.padR, 10);
    const innerH = this.height - this.padT - this.padB;
    const { max, step } = niceScale(Math.max(0, ...this.data.map((d) => d.value)));
    this.ticks = [];
    for (let v = 0; v <= max + step / 2; v += step) {
      this.ticks.push({ y: this.padT + innerH - (v / max) * innerH, label: this.axisFormat(v) });
    }
    const maxLabels = Math.max(2, Math.floor(innerW / 64));
    const every = Math.max(1, Math.ceil(n / maxLabels));
    this.showDots = n <= 31;
    this.pts = this.data.map((d, i) => ({
      x: this.padL + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW),
      y: this.padT + innerH - (d.value / max) * innerH,
      label: d.label,
      value: d.value,
      hint: d.hint,
      showLabel: (n - 1 - i) % every === 0,
    }));
    this.linePath = this.pts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    const base = (this.padT + innerH).toFixed(1);
    this.areaPath = this.pts.length
      ? `${this.linePath} L${this.pts[this.pts.length - 1].x.toFixed(1)},${base} L${this.pts[0].x.toFixed(1)},${base} Z`
      : '';
    this.fillUrl = svgUrl(this.gid);
    this.cdr.markForCheck();
  }

  onMove(ev: MouseEvent): void {
    this.pick(ev.clientX);
  }

  onTouch(ev: TouchEvent): void {
    if (ev.touches[0]) this.pick(ev.touches[0].clientX);
  }

  private pick(clientX: number): void {
    if (!this.pts.length) return;
    const x = clientX - this.box.nativeElement.getBoundingClientRect().left;
    let best = 0;
    for (let i = 1; i < this.pts.length; i++) {
      if (Math.abs(this.pts[i].x - x) < Math.abs(this.pts[best].x - x)) best = i;
    }
    if (best !== this.hover) {
      this.hover = best;
      this.cdr.markForCheck();
    }
  }
}

/* ------------------------------------------------------------------ */
/* Anneau de répartition                                               */
/* ------------------------------------------------------------------ */

export interface DonutSlice {
  label: string;
  value: number;
  percent: number;
  color: string;
}

export const DONUT_COLORS = ['#ff6600', '#ffa24d', '#b84a00', '#ffd2a8', '#e0803a', '#c9b5a8', '#7a3300', '#f5b971'];

@Component({
  selector: 'adm-donut-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="donut-wrap">
      <div class="donut">
        <svg viewBox="0 0 200 200" role="img" [attr.aria-label]="ariaLabel">
          <circle cx="100" cy="100" [attr.r]="r" class="track" />
          @for (s of arcs; track s.label) {
            <circle cx="100" cy="100" [attr.r]="r" class="arc" [attr.stroke]="s.color"
                    [attr.stroke-dasharray]="s.dash" [attr.stroke-dashoffset]="s.offset"
                    [class.dim]="active !== null && active !== $index"
                    (mouseenter)="active = $index" (mouseleave)="active = null" />
          }
        </svg>
        <div class="center">
          <strong>{{ centerValue }}</strong>
          <span>{{ centerLabel }}</span>
        </div>
      </div>
      <ul class="legend">
        @for (s of slices; track s.label) {
          <li [class.dim]="active !== null && active !== $index" (mouseenter)="active = $index" (mouseleave)="active = null">
            <i [style.background]="s.color"></i>
            <span class="name">{{ s.label }}</span>
            <span class="pct">{{ s.percent | number: '1.0-0' }}%</span>
          </li>
        } @empty {
          <li class="empty">Aucune vente sur la période</li>
        }
      </ul>
    </div>
  `,
  imports: [DecimalPipe],
  styles: [`
    :host { display: block; }
    .donut-wrap { display: flex; align-items: center; gap: 28px; }
    .donut { position: relative; width: 190px; flex-shrink: 0; aspect-ratio: 1; }
    svg { display: block; width: 100%; height: 100%; transform: rotate(-90deg); overflow: visible; }
    .track { fill: none; stroke: #f6f1ee; stroke-width: 34; }
    .arc { fill: none; stroke-width: 34; transition: opacity .2s, stroke-width .2s; cursor: pointer; }
    .arc:hover { stroke-width: 38; }
    .arc.dim, li.dim { opacity: .35; }
    .center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
    .center strong { font-size: 1.05rem; font-weight: 700; color: var(--adm-ink); line-height: 1.2; }
    .center span { font-size: .8rem; color: var(--adm-muted); }
    .legend { list-style: none; margin: 0; padding: 0; flex: 1; display: flex; flex-direction: column; gap: 12px; min-width: 0; }
    .legend li { display: flex; align-items: center; gap: 10px; font-size: .85rem; color: #5b5450; transition: opacity .2s; cursor: default; }
    .legend i { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
    .legend .name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .legend .pct { font-weight: 600; color: var(--adm-ink); }
    .legend .empty { color: var(--adm-muted); }
    :host { container: donut / inline-size; }
    @container donut (max-width: 400px) {
      .donut { width: 150px; }
      .donut-wrap { gap: 18px; }
      .legend { gap: 9px; }
      .center strong { font-size: .92rem; }
    }
    @container donut (max-width: 300px) {
      .donut-wrap { flex-direction: column; gap: 18px; }
      .donut { width: 170px; }
      .legend { width: 100%; }
    }
  `],
})
export class AdmDonutChartComponent {
  @Input() ariaLabel = 'Répartition';
  @Input() centerValue = '';
  @Input() centerLabel = '';
  @Input() set data(value: DonutSlice[] | null | undefined) {
    this.slices = value ?? [];
    const C = 2 * Math.PI * this.r;
    const gap = this.slices.length > 1 ? 2 : 0;
    let acc = 0;
    this.arcs = this.slices.map((s) => {
      const len = Math.max((s.percent / 100) * C - gap, 0.5);
      const arc = { label: s.label, color: s.color, dash: `${len} ${C - len}`, offset: -acc };
      acc += (s.percent / 100) * C;
      return arc;
    });
  }

  readonly r = 70;
  slices: DonutSlice[] = [];
  arcs: { label: string; color: string; dash: string; offset: number }[] = [];
  active: number | null = null;
}

/* ------------------------------------------------------------------ */
/* Mini-courbe (sparkline)                                             */
/* ------------------------------------------------------------------ */

@Component({
  selector: 'adm-sparkline',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg viewBox="0 0 100 36" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient [attr.id]="gid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--adm-orange)" stop-opacity="0.22" />
          <stop offset="100%" stop-color="var(--adm-orange)" stop-opacity="0" />
        </linearGradient>
      </defs>
      <path [attr.d]="area" [attr.fill]="fillUrl" />
      <path [attr.d]="line" class="line" />
    </svg>
  `,
  styles: [`
    :host { display: block; width: 100%; height: 100%; }
    svg { width: 100%; height: 100%; display: block; overflow: visible; }
    .line { fill: none; stroke: var(--adm-orange); stroke-width: 1.8; vector-effect: non-scaling-stroke; stroke-linejoin: round; stroke-linecap: round; }
  `],
})
export class AdmSparklineComponent {
  readonly gid = `sp-grad-${++uid}`;
  line = '';
  area = '';
  fillUrl = svgUrl(this.gid);

  @Input() set values(v: number[] | null | undefined) {
    let vals = (v ?? []).map((n) => Number(n) || 0);
    if (vals.length < 2) vals = [0, 0];
    const flat = vals.every((n) => n === vals[0]);
    const max = Math.max(...vals);
    const min = Math.min(...vals);
    const span = max - min || 1;
    const pts = vals.map((n, i) => {
      const x = (i / (vals.length - 1)) * 100;
      const y = flat ? 26 : 32 - ((n - min) / span) * 26;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    });
    this.line = `M${pts.join(' L')}`;
    this.area = `${this.line} L100,36 L0,36 Z`;
    this.fillUrl = svgUrl(this.gid);
  }
}
