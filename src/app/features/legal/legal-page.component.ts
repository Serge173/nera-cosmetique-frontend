import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LegalContent, SiteService } from '../../core/services/site.service';
import { TextBlocksComponent } from '../../shared/components/text-blocks/text-blocks.component';

const longDate = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

@Component({
  selector: 'app-legal-page',
  standalone: true,
  imports: [RouterLink, TextBlocksComponent],
  template: `
    <div class="legal">
      <header class="legal-hero">
        <div class="container">
          <nav class="crumbs" aria-label="Fil d'Ariane"><a routerLink="/">Accueil</a><span aria-hidden="true">›</span><span>{{ heading() }}</span></nav>
          <h1>{{ heading() }}</h1>
          @if (updatedLabel()) { <p class="updated">Dernière mise à jour : {{ updatedLabel() }}</p> }
        </div>
      </header>

      <div class="container">
        @if (error()) {
          <div class="state">
            <p>Impossible de charger cette page pour le moment.</p>
            <button type="button" class="btn btn-primary" (click)="load()">Réessayer</button>
          </div>
        } @else if (content()) {
          @let c = content()!;
          <div class="layout" [class.with-toc]="c.sections.length > 2">
            @if (c.sections.length > 2) {
              <aside class="toc" aria-label="Sommaire">
                <p class="toc-title">Sommaire</p>
                <ol>
                  @for (s of c.sections; track $index) {
                    @if (s.heading) { <li><a [href]="'#' + anchor($index)" (click)="scrollTo($event, $index)">{{ fill(s.heading) }}</a></li> }
                  }
                </ol>
              </aside>
            }
            <article class="card">
              @if (c.intro) { <app-text-blocks class="intro" [text]="fill(c.intro)" /> }

              @if (isMentions() && identity().length) {
                <section class="block">
                  <h2>Éditeur du site</h2>
                  <dl class="identity">
                    @for (row of identity(); track row.label) {
                      <div><dt>{{ row.label }}</dt><dd>{{ row.value }}</dd></div>
                    }
                  </dl>
                </section>
                @if (site.settings().hostInfo) {
                  <section class="block">
                    <h2>Hébergement</h2>
                    <app-text-blocks [text]="site.settings().hostInfo" />
                  </section>
                }
              }

              @for (s of c.sections; track $index) {
                <section class="block" [id]="anchor($index)">
                  @if (s.heading) { <h2>{{ fill(s.heading) }}</h2> }
                  <app-text-blocks [text]="fill(s.body)" />
                </section>
              }

              <footer class="help">
                <i class="fa-regular fa-circle-question" aria-hidden="true"></i>
                <span>Une question ? <a routerLink="/contact">Contactez-nous</a>@if (site.whatsappUrl()) { ou écrivez-nous sur <a [href]="site.whatsappUrl()" target="_blank" rel="noopener noreferrer">WhatsApp</a>}.</span>
              </footer>
            </article>
          </div>
        } @else {
          <div class="layout"><div class="card"><div class="sk w40"></div><div class="sk"></div><div class="sk"></div><div class="sk w80"></div><div class="sk w60"></div></div></div>
        }
      </div>
    </div>
  `,
  styles: [`
    .legal { padding-bottom: 40px; background: linear-gradient(180deg, var(--cosmetic-pearl, #fffaf7) 0%, #fff 360px); }
    .legal-hero { padding: 44px 0 30px; }
    .crumbs { display: flex; gap: 8px; align-items: center; font-size: .85rem; color: var(--text-light); margin-bottom: 14px; flex-wrap: wrap; }
    .crumbs a { color: var(--text-light); }
    .crumbs a:hover { color: var(--primary-color); }
    h1 { font-size: clamp(1.8rem, 4vw, 2.6rem); font-weight: 700; letter-spacing: -.02em; color: var(--text-dark); margin: 0; }
    .updated { margin: 10px 0 0; font-size: .88rem; color: var(--text-light); }
    .layout { max-width: 860px; margin: 0 auto; }
    .layout.with-toc { max-width: 1120px; display: grid; grid-template-columns: 250px minmax(0, 1fr); gap: 32px; align-items: start; }
    .toc { position: sticky; top: 100px; padding: 18px; border: 1px solid var(--border-color, #eee); border-radius: 16px; background: #fff; }
    .toc-title { margin: 0 0 10px; font-size: .78rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--primary-color); }
    .toc ol { margin: 0; padding-left: 1.1em; display: flex; flex-direction: column; gap: 8px; }
    .toc li::marker { color: var(--text-light); font-size: .8rem; }
    .toc a { font-size: .88rem; color: var(--text-dark); line-height: 1.35; }
    .toc a:hover { color: var(--primary-color); }
    .card { background: #fff; border: 1px solid var(--border-color, #eee); border-radius: 20px; padding: 36px 40px; box-shadow: 0 10px 30px rgba(0, 0, 0, .04); color: var(--text-light); line-height: 1.7; font-size: 1rem; }
    .intro { font-size: 1.06rem; color: var(--text-dark); padding-bottom: 22px; margin-bottom: 8px; border-bottom: 1px solid var(--border-color, #eee); }
    .block { padding-top: 22px; scroll-margin-top: 100px; }
    .block h2 { font-size: 1.2rem; font-weight: 700; color: var(--text-dark); margin: 0 0 10px; }
    .identity { margin: 0; display: grid; gap: 8px; }
    .identity div { display: grid; grid-template-columns: 200px minmax(0, 1fr); gap: 12px; }
    .identity dt { font-weight: 600; color: var(--text-dark); }
    .identity dd { margin: 0; word-break: break-word; }
    .help { margin-top: 30px; padding: 16px 18px; border-radius: 14px; background: var(--secondary-color, #fff3ea); color: var(--text-dark); display: flex; gap: 12px; align-items: center; font-size: .95rem; }
    .help i { color: var(--primary-color); font-size: 1.2rem; }
    .help a { color: var(--primary-color); font-weight: 600; }
    .state { max-width: 560px; margin: 30px auto; text-align: center; padding: 32px; background: #fff; border-radius: 16px; border: 1px solid var(--border-color, #eee); }
    .sk { height: 16px; border-radius: 8px; margin-bottom: 14px; background: linear-gradient(90deg, #f4efeb 25%, #fbf7f4 50%, #f4efeb 75%); background-size: 200% 100%; animation: sk 1.2s infinite; }
    .sk.w40 { width: 40%; height: 22px; } .sk.w60 { width: 60%; } .sk.w80 { width: 80%; }
    @keyframes sk { to { background-position: -200% 0; } }
    @media (max-width: 960px) {
      .layout.with-toc { grid-template-columns: minmax(0, 1fr); }
      .toc { position: static; }
    }
    @media (max-width: 600px) {
      .legal-hero { padding: 28px 0 20px; }
      .card { padding: 24px 18px; border-radius: 16px; }
      .identity div { grid-template-columns: minmax(0, 1fr); gap: 2px; }
    }
  `],
})
export class LegalPageComponent implements OnInit {
  readonly site = inject(SiteService);
  private route = inject(ActivatedRoute);
  private title = inject(Title);
  private destroyRef = inject(DestroyRef);

  readonly slug = signal<string>('');
  readonly content = signal<LegalContent | null>(null);
  readonly updatedAt = signal<string | null>(null);
  readonly error = signal(false);

  readonly isMentions = computed(() => this.slug() === 'mentions-legales');
  readonly heading = computed(() => this.content()?.title || (this.route.snapshot.data['label'] as string) || '');
  readonly updatedLabel = computed(() => {
    const d = this.updatedAt();
    return d ? longDate.format(new Date(d)) : '';
  });
  readonly identity = computed(() => {
    const s = this.site.settings();
    const rows = [
      { label: 'Raison sociale', value: s.legalName || s.storeName },
      { label: 'Forme juridique', value: s.legalForm },
      { label: 'Capital social', value: s.capital },
      { label: 'RCCM', value: s.rccm },
      { label: 'N° compte contribuable', value: s.ncc },
      { label: 'Siège social', value: s.headOffice || this.site.fullAddress() },
      { label: 'Directeur de la publication', value: s.director },
      { label: 'E-mail', value: s.email },
      { label: 'Téléphone', value: s.phone },
    ];
    return rows.filter((r) => r.value);
  });

  ngOnInit(): void {
    this.slug.set(this.route.snapshot.data['slug']);
    this.title.setTitle(`${this.route.snapshot.data['label']} — Nera Cosmétique`);
    this.load();
  }

  load(): void {
    this.error.set(false);
    this.site.page<LegalContent>(this.slug()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (page) => {
        this.content.set(page.content);
        this.updatedAt.set(page.updatedAt);
        if (page.content.title) this.title.setTitle(`${page.content.title} — Nera Cosmétique`);
      },
      error: () => this.error.set(true),
    });
  }

  fill(text: string): string {
    return this.site.fill(text);
  }

  anchor(i: number): string {
    return `section-${i + 1}`;
  }

  scrollTo(event: Event, i: number): void {
    event.preventDefault();
    document.getElementById(this.anchor(i))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
