import { ChangeDetectionStrategy, Component, computed, effect, input, signal } from '@angular/core';
import { initials } from '../../../features/admin/shared/admin-format';

/** Contenu d'une pastille d'avatar : la photo si elle se charge, sinon les initiales. Le conteneur garde son propre style. */
@Component({
  selector: 'app-user-avatar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (src() && !failed()) {
      <img [src]="src()" alt="" (error)="failed.set(true)" decoding="async" referrerpolicy="no-referrer" />
    } @else {
      <span>{{ letters() }}</span>
    }
  `,
  styles: [`
    :host { display: contents; }
    img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; display: block; }
  `],
})
export class UserAvatarComponent {
  readonly url = input<string | null | undefined>(null);
  readonly name = input<string>('');

  readonly failed = signal(false);
  readonly letters = computed(() => initials(this.name()));
  readonly src = computed(() => {
    const url = this.url();
    return url && /^https?:\/\//i.test(url) ? url : null;
  });

  constructor() {
    effect(() => {
      this.src();
      this.failed.set(false);
    }, { allowSignalWrites: true });
  }
}
