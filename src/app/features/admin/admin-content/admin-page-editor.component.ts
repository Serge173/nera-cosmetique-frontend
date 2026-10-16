import { Component, DestroyRef, HostListener, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { EMPTY, catchError, map, switchMap } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { AboutContent, LegalContent, SiteService } from '../../../core/services/site.service';
import { ToastService } from '../../../core/services/toast.service';
import { formatDateTime } from '../shared/admin-format';

interface PagePayload {
  slug: string;
  kind: 'about' | 'legal';
  label: string;
  content: AboutContent | LegalContent;
  updatedAt: string | null;
}

const MAX_SECTIONS = 30;
const MAX_COMMITMENTS = 8;

@Component({
  selector: 'app-admin-page-editor',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <header class="adm-page-head">
      <div>
        <a routerLink="/admin/contenu" [queryParams]="{ onglet: 'pages' }" class="back"><i class="fa-solid fa-arrow-left"></i> Pages du site</a>
        <h1>{{ page()?.label || 'Modifier la page' }}</h1>
        <p>
          @if (page()?.updatedAt) { Dernière modification : {{ formatDateTime(page()!.updatedAt!) }} } @else { Texte d’origine, jamais modifié. }
        </p>
      </div>
      @if (page()) {
        <div class="head-actions">
          <a class="adm-btn adm-btn-ghost" [href]="'/' + page()!.slug" target="_blank" rel="noopener"><i class="fa-solid fa-arrow-up-right-from-square"></i> Voir la page</a>
          <button type="button" class="adm-btn" (click)="save()" [disabled]="saving() || !dirty()">
            @if (saving()) { Enregistrement… } @else { <i class="fa-solid fa-check"></i> Enregistrer }
          </button>
        </div>
      }
    </header>

    @if (page(); as p) {
      <div class="layout">
        <div class="main">
          @if (legal; as c) {
            <section class="adm-card block">
              <h2 class="b-title">En-tête de la page</h2>
              <div class="adm-form-grid">
                <label class="adm-field span-2"><span>Titre *</span><input class="adm-input" name="title" [(ngModel)]="c.title" maxlength="120" /></label>
                <label class="adm-field span-2"><span>Introduction</span><textarea class="adm-textarea" name="intro" [(ngModel)]="c.intro" maxlength="1200" rows="3"></textarea></label>
              </div>
            </section>

            @for (s of c.sections; track s; let i = $index; let first = $first; let last = $last) {
              <section class="adm-card block section">
                <div class="s-head">
                  <span class="s-num">{{ i + 1 }}</span>
                  <input class="adm-input s-title" [name]="'h' + i" [(ngModel)]="s.heading" maxlength="160" placeholder="Titre de la section" [attr.aria-label]="'Titre de la section ' + (i + 1)" />
                  <div class="s-tools">
                    <button type="button" class="adm-icon-btn sm" (click)="move(c.sections, i, -1)" [disabled]="first" aria-label="Monter"><i class="fa-solid fa-arrow-up"></i></button>
                    <button type="button" class="adm-icon-btn sm" (click)="move(c.sections, i, 1)" [disabled]="last" aria-label="Descendre"><i class="fa-solid fa-arrow-down"></i></button>
                    <button type="button" class="adm-icon-btn sm danger" (click)="removeAt(c.sections, i)" aria-label="Supprimer la section"><i class="fa-regular fa-trash-can"></i></button>
                  </div>
                </div>
                <textarea class="adm-textarea s-body" [name]="'b' + i" [(ngModel)]="s.body" maxlength="6000" rows="6" placeholder="Texte de la section…" [attr.aria-label]="'Texte de la section ' + (i + 1)"></textarea>
              </section>
            }
            <button type="button" class="adm-btn adm-btn-soft add" (click)="addSection(c)" [disabled]="c.sections.length >= maxSections">
              <i class="fa-solid fa-plus"></i> Ajouter une section
            </button>
          }

          @if (about; as a) {
            <section class="adm-card block">
              <h2 class="b-title">Bandeau du haut</h2>
              <div class="adm-form-grid">
                <label class="adm-field"><span>Petit titre</span><input class="adm-input" name="heroLabel" [(ngModel)]="a.heroLabel" maxlength="60" /></label>
                <label class="adm-field"><span>Titre principal *</span><input class="adm-input" name="heroTitle" [(ngModel)]="a.heroTitle" maxlength="120" /></label>
                <label class="adm-field span-2"><span>Phrase d’accroche</span><textarea class="adm-textarea" name="heroTagline" [(ngModel)]="a.heroTagline" maxlength="300" rows="2"></textarea></label>
              </div>
            </section>

            <section class="adm-card block">
              <h2 class="b-title">Notre histoire</h2>
              <div class="adm-form-grid">
                <label class="adm-field"><span>Petit titre</span><input class="adm-input" name="storyLabel" [(ngModel)]="a.storyLabel" maxlength="60" /></label>
                <label class="adm-field"><span>Titre</span><input class="adm-input" name="storyTitle" [(ngModel)]="a.storyTitle" maxlength="160" /></label>
                <label class="adm-field span-2"><span>Paragraphe d’introduction (mis en avant)</span><textarea class="adm-textarea" name="storyLead" [(ngModel)]="a.storyLead" maxlength="600" rows="3"></textarea></label>
                <label class="adm-field span-2"><span>Texte</span><textarea class="adm-textarea" name="storyBody" [(ngModel)]="a.storyBody" maxlength="4000" rows="7"></textarea></label>
              </div>
              <div class="image-row">
                <div class="img-preview">
                  @if (a.imageUrl) { <img [src]="a.imageUrl" alt="Aperçu de l’image" /> } @else { <i class="fa-regular fa-image"></i> }
                </div>
                <div class="img-fields">
                  <label class="adm-field"><span>Image</span><input class="adm-input" name="imageUrl" [(ngModel)]="a.imageUrl" maxlength="500" placeholder="https://… ou laissez vide pour ne pas afficher d’image" /></label>
                  <div class="img-actions">
                    <button type="button" class="adm-btn adm-btn-ghost adm-btn-sm" (click)="imageInput.click()" [disabled]="uploading()">
                      @if (uploading()) { Envoi… } @else { <i class="fa-solid fa-upload"></i> Envoyer une image }
                    </button>
                    @if (a.imageUrl) { <button type="button" class="adm-btn adm-btn-ghost adm-btn-sm" (click)="a.imageUrl = ''"><i class="fa-regular fa-trash-can"></i> Retirer</button> }
                    <input #imageInput type="file" accept="image/jpeg,image/png,image/webp" hidden (change)="uploadImage($event, a)" />
                  </div>
                  <label class="adm-field"><span>Badge sur l’image</span><input class="adm-input" name="imageBadge" [(ngModel)]="a.imageBadge" maxlength="40" placeholder="Ex. Import France" /></label>
                </div>
              </div>
            </section>

            <section class="adm-card block">
              <h2 class="b-title">Mission & vision</h2>
              <div class="adm-form-grid">
                <label class="adm-field"><span>Titre (mission)</span><input class="adm-input" name="missionTitle" [(ngModel)]="a.missionTitle" maxlength="80" /></label>
                <label class="adm-field"><span>Titre (vision)</span><input class="adm-input" name="visionTitle" [(ngModel)]="a.visionTitle" maxlength="80" /></label>
                <label class="adm-field"><span>Texte (mission)</span><textarea class="adm-textarea" name="missionText" [(ngModel)]="a.missionText" maxlength="800" rows="4"></textarea></label>
                <label class="adm-field"><span>Texte (vision)</span><textarea class="adm-textarea" name="visionText" [(ngModel)]="a.visionText" maxlength="800" rows="4"></textarea></label>
              </div>
              <small class="muted">Laissez un texte vide pour masquer le bloc correspondant.</small>
            </section>

            <section class="adm-card block">
              <h2 class="b-title">Nos engagements</h2>
              <div class="adm-form-grid">
                <label class="adm-field"><span>Petit titre</span><input class="adm-input" name="commitmentsLabel" [(ngModel)]="a.commitmentsLabel" maxlength="60" /></label>
                <label class="adm-field"><span>Titre</span><input class="adm-input" name="commitmentsTitle" [(ngModel)]="a.commitmentsTitle" maxlength="120" /></label>
              </div>
              <div class="commitments">
                @for (item of a.commitments; track item; let i = $index; let first = $first; let last = $last) {
                  <div class="commitment">
                    <div class="s-head">
                      <span class="s-num">{{ i + 1 }}</span>
                      <input class="adm-input s-title" [name]="'ct' + i" [(ngModel)]="item.title" maxlength="120" placeholder="Titre de l’engagement" />
                      <div class="s-tools">
                        <button type="button" class="adm-icon-btn sm" (click)="move(a.commitments, i, -1)" [disabled]="first" aria-label="Monter"><i class="fa-solid fa-arrow-up"></i></button>
                        <button type="button" class="adm-icon-btn sm" (click)="move(a.commitments, i, 1)" [disabled]="last" aria-label="Descendre"><i class="fa-solid fa-arrow-down"></i></button>
                        <button type="button" class="adm-icon-btn sm danger" (click)="removeAt(a.commitments, i)" aria-label="Supprimer"><i class="fa-regular fa-trash-can"></i></button>
                      </div>
                    </div>
                    <textarea class="adm-textarea" [name]="'cx' + i" [(ngModel)]="item.text" maxlength="600" rows="2" placeholder="Description"></textarea>
                  </div>
                }
              </div>
              <button type="button" class="adm-btn adm-btn-soft adm-btn-sm add" (click)="a.commitments.push({ title: '', text: '' })" [disabled]="a.commitments.length >= maxCommitments">
                <i class="fa-solid fa-plus"></i> Ajouter un engagement
              </button>
            </section>

            <section class="adm-card block">
              <h2 class="b-title">Appel à l’action (bas de page)</h2>
              <div class="adm-form-grid">
                <label class="adm-field span-2"><span>Titre</span><input class="adm-input" name="ctaTitle" [(ngModel)]="a.ctaTitle" maxlength="160" /></label>
                <label class="adm-field span-2"><span>Texte</span><textarea class="adm-textarea" name="ctaText" [(ngModel)]="a.ctaText" maxlength="400" rows="2"></textarea></label>
              </div>
            </section>
          }
        </div>

        <aside class="side">
          <section class="adm-card help">
            <h2><i class="fa-regular fa-lightbulb"></i> Mise en forme</h2>
            <ul>
              <li><strong>Ligne vide</strong> : nouveau paragraphe.</li>
              <li><strong>Ligne commençant par « - »</strong> : élément de liste à puces.</li>
            </ul>
            <h3>Raccourcis</h3>
            <p>Remplacés automatiquement par les informations de la boutique :</p>
            <div class="tokens">
              @for (t of tokens; track t.code) {
                <button type="button" class="token" (click)="copy(t.code)" [title]="'Copier ' + t.code"><code>{{ t.code }}</code><span>{{ t.value() || '—' }}</span></button>
              }
            </div>
            <a routerLink="/admin/contenu" class="link">Modifier les informations de la boutique <i class="fa-solid fa-arrow-right"></i></a>
          </section>
          <section class="adm-card help danger-zone">
            <h2><i class="fa-solid fa-clock-rotate-left"></i> Texte d’origine</h2>
            <p>Remet le contenu proposé par défaut. Vos modifications de cette page seront perdues.</p>
            <button type="button" class="adm-btn adm-btn-ghost adm-btn-sm" (click)="restore()" [disabled]="saving() || !p.updatedAt">Rétablir le texte d’origine</button>
          </section>
        </aside>
      </div>

      <div class="save-bar" [class.visible]="dirty()">
        <span><i class="fa-solid fa-circle-info"></i> Modifications non enregistrées</span>
        <div>
          <button type="button" class="adm-btn adm-btn-ghost" (click)="discard()" [disabled]="saving()">Annuler</button>
          <button type="button" class="adm-btn" (click)="save()" [disabled]="saving()">
            @if (saving()) { Enregistrement… } @else { <i class="fa-solid fa-check"></i> Enregistrer }
          </button>
        </div>
      </div>
    } @else if (notFound()) {
      <div class="adm-card adm-empty"><i class="fa-regular fa-file-lines"></i><strong>Page introuvable</strong><a routerLink="/admin/contenu" [queryParams]="{ onglet: 'pages' }" class="adm-btn adm-btn-sm">Retour aux pages</a></div>
    } @else {
      <div class="layout"><div class="main">@for (i of [1, 2, 3]; track i) { <div class="adm-card block"><div class="adm-skel" style="height: 110px"></div></div> }</div></div>
    }
  `,
  styles: [`
    :host { display: block; padding-bottom: 80px; }
    .back { display: inline-flex; gap: 8px; align-items: center; font-size: .8rem; font-weight: 600; color: var(--adm-muted); text-decoration: none; margin-bottom: 6px; }
    .back:hover { color: var(--adm-orange); }
    .head-actions { display: flex; gap: 10px; flex-wrap: wrap; }
    .layout { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 20px; align-items: start; }
    .main { display: flex; flex-direction: column; gap: 14px; min-width: 0; }
    .block { padding: 20px; }
    .b-title { margin: 0 0 14px; font-size: .98rem; font-weight: 700; }
    .s-head { display: flex; gap: 10px; align-items: center; margin-bottom: 10px; }
    .s-num { width: 30px; height: 30px; border-radius: 50%; background: var(--adm-orange-soft); color: var(--adm-orange-dark); font-weight: 700; font-size: .8rem; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .s-title { flex: 1; font-weight: 600; }
    .s-tools { display: flex; gap: 4px; flex-shrink: 0; }
    .s-body { min-height: 140px; }
    .add { align-self: flex-start; }
    .image-row { display: grid; grid-template-columns: 180px minmax(0, 1fr); gap: 16px; margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--adm-line); }
    .img-preview { aspect-ratio: 4 / 3; border-radius: 12px; overflow: hidden; background: #faf7f5; border: 1px solid var(--adm-line); display: flex; align-items: center; justify-content: center; color: #d9c8bd; font-size: 1.8rem; }
    .img-preview img { width: 100%; height: 100%; object-fit: cover; }
    .img-fields { display: flex; flex-direction: column; gap: 12px; }
    .img-actions { display: flex; gap: 8px; flex-wrap: wrap; }
    .commitments { display: flex; flex-direction: column; gap: 14px; margin: 16px 0 12px; }
    .commitment { padding: 14px; border: 1px solid var(--adm-line); border-radius: 12px; background: #fffcfa; }
    .muted { color: var(--adm-muted); font-size: .76rem; display: block; margin-top: 10px; }
    .side { display: flex; flex-direction: column; gap: 14px; position: sticky; top: calc(var(--adm-topbar-h) + 16px); }
    .help { padding: 18px; font-size: .82rem; color: var(--adm-text); }
    .help h2 { margin: 0 0 10px; font-size: .92rem; display: flex; gap: 8px; align-items: center; }
    .help h2 i { color: var(--adm-orange); }
    .help h3 { margin: 14px 0 4px; font-size: .82rem; }
    .help ul { margin: 0; padding-left: 1.1em; display: flex; flex-direction: column; gap: 4px; }
    .help p { margin: 0 0 8px; color: var(--adm-muted); }
    .tokens { display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; }
    .token { display: flex; justify-content: space-between; gap: 10px; align-items: center; padding: 6px 8px; border-radius: 8px; border: 1px solid var(--adm-line); background: #fff; cursor: pointer; text-align: left; }
    .token:hover { border-color: #f6d8c4; background: var(--adm-orange-50); }
    .token code { font-size: .76rem; color: var(--adm-orange-dark); }
    .token span { font-size: .74rem; color: var(--adm-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 150px; }
    .link { font-size: .8rem; font-weight: 600; color: var(--adm-orange); text-decoration: none; display: inline-flex; gap: 6px; align-items: center; }
    .save-bar {
      position: sticky; bottom: 16px; z-index: 5; margin-top: 16px; display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap;
      padding: 12px 16px; border-radius: 14px; background: var(--adm-ink); color: #fff; box-shadow: var(--adm-shadow-lg);
      transform: translateY(20px); opacity: 0; visibility: hidden; pointer-events: none; transition: transform .25s, opacity .25s, visibility .25s;
    }
    .save-bar.visible { transform: none; opacity: 1; visibility: visible; pointer-events: auto; }
    .save-bar > span { display: flex; gap: 8px; align-items: center; font-size: .88rem; }
    .save-bar > div { display: flex; gap: 8px; }
    .save-bar .adm-btn-ghost { background: transparent; color: #fff; border-color: rgba(255, 255, 255, .3); }
    @media (max-width: 1100px) {
      .layout { grid-template-columns: minmax(0, 1fr); }
      .side { position: static; }
    }
    @media (max-width: 640px) {
      .block { padding: 16px; }
      .adm-form-grid { grid-template-columns: minmax(0, 1fr); }
      .image-row { grid-template-columns: minmax(0, 1fr); }
      .s-head { flex-wrap: wrap; }
      .s-title { min-width: 0; flex-basis: calc(100% - 40px); }
    }
  `],
})
export class AdminPageEditorComponent implements OnInit {
  private api = inject(ApiService);
  private site = inject(SiteService);
  private toast = inject(ToastService);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  readonly page = signal<PagePayload | null>(null);
  readonly notFound = signal(false);
  readonly saving = signal(false);
  readonly uploading = signal(false);
  readonly maxSections = MAX_SECTIONS;
  readonly maxCommitments = MAX_COMMITMENTS;
  readonly formatDateTime = formatDateTime;

  legal: LegalContent | null = null;
  about: AboutContent | null = null;
  private original = '';

  readonly tokens = [
    { code: '{boutique}', value: () => this.site.settings().storeName },
    { code: '{email}', value: () => this.site.settings().email },
    { code: '{telephone}', value: () => this.site.settings().phone },
    { code: '{whatsapp}', value: () => this.site.settings().whatsapp },
    { code: '{adresse}', value: () => this.site.fullAddress() },
    { code: '{ville}', value: () => this.site.settings().city },
  ];

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        map((params) => params.get('slug') ?? ''),
        switchMap((slug) => {
          this.page.set(null);
          this.notFound.set(false);
          this.legal = this.about = null;
          this.original = '';
          return this.api.get<PagePayload>(`/admin/site/pages/${encodeURIComponent(slug)}`).pipe(
            catchError(() => {
              this.notFound.set(true);
              return EMPTY;
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((p) => this.setPage(p));
  }

  private setPage(p: PagePayload): void {
    const content = structuredClone(p.content);
    this.legal = p.kind === 'legal' ? (content as LegalContent) : null;
    this.about = p.kind === 'about' ? (content as AboutContent) : null;
    this.original = JSON.stringify(content);
    this.page.set(p);
  }

  private current(): AboutContent | LegalContent | null {
    return this.legal ?? this.about;
  }

  dirty(): boolean {
    const c = this.current();
    return !!c && JSON.stringify(c) !== this.original;
  }

  canLeave(): boolean {
    return !this.dirty() || confirm('Vous avez des modifications non enregistrées. Quitter quand même ?');
  }

  move<T>(list: T[], i: number, delta: number): void {
    const j = i + delta;
    if (j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
  }

  removeAt<T>(list: T[], i: number): void {
    list.splice(i, 1);
  }

  addSection(c: LegalContent): void {
    if (c.sections.length >= MAX_SECTIONS) return;
    c.sections.push({ heading: '', body: '' });
  }

  copy(code: string): void {
    navigator.clipboard?.writeText(code).then(
      () => this.toast.success(`${code} copié. Collez-le dans votre texte.`),
      () => this.toast.info(`Tapez ${code} dans votre texte.`),
    );
  }

  uploadImage(event: Event, a: AboutContent): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      this.toast.error('Choisissez une image JPG, PNG ou WebP.');
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      this.toast.error('Image trop lourde (4 Mo maximum).');
      return;
    }
    const form = new FormData();
    form.append('file', file);
    this.uploading.set(true);
    this.api.post<{ url: string }>('/admin/upload/image?folder=pages', form).subscribe({
      next: ({ url }) => {
        this.uploading.set(false);
        a.imageUrl = url;
        this.toast.success('Image envoyée. Pensez à enregistrer la page.');
      },
      error: (err) => {
        this.uploading.set(false);
        this.toast.error(err?.message || 'Envoi de l’image impossible.');
      },
    });
  }

  private validate(): string | null {
    if (this.legal) {
      if (!this.legal.title.trim()) return 'Le titre de la page est obligatoire.';
      if (this.legal.sections.some((s) => !s.heading.trim() && s.body.trim())) return 'Chaque section doit avoir un titre.';
    }
    if (this.about) {
      if (!this.about.heroTitle.trim()) return 'Le titre principal est obligatoire.';
      const img = this.about.imageUrl.trim();
      if (img && !/^https:\/\/\S+$/i.test(img) && !/^\/assets\/[\w./-]+$/.test(img)) return 'Le lien de l’image doit commencer par https://';
    }
    return null;
  }

  save(): void {
    const p = this.page();
    const content = this.current();
    if (!p || !content || this.saving()) return;
    const error = this.validate();
    if (error) {
      this.toast.error(error);
      return;
    }
    this.saving.set(true);
    this.api.put<PagePayload>(`/admin/site/pages/${p.slug}`, { content }).subscribe({
      next: (saved) => {
        this.saving.set(false);
        this.setPage(saved);
        this.site.invalidatePage(saved.slug);
        this.toast.success('Page enregistrée. Elle est en ligne.');
      },
      error: (err) => {
        this.saving.set(false);
        this.toast.error(err?.message || 'Enregistrement impossible.');
      },
    });
  }

  discard(): void {
    const p = this.page();
    if (!p) return;
    this.setPage({ ...p, content: JSON.parse(this.original) });
  }

  restore(): void {
    const p = this.page();
    if (!p || !confirm('Rétablir le texte d’origine de cette page ? Vos modifications seront perdues.')) return;
    this.saving.set(true);
    this.api.post<PagePayload>(`/admin/site/pages/${p.slug}/reset`, {}).subscribe({
      next: (fresh) => {
        this.saving.set(false);
        this.setPage(fresh);
        this.site.invalidatePage(fresh.slug);
        this.toast.success('Texte d’origine rétabli.');
      },
      error: (err) => {
        this.saving.set(false);
        this.toast.error(err?.message || 'Opération impossible.');
      },
    });
  }

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.dirty()) event.preventDefault();
  }
}
