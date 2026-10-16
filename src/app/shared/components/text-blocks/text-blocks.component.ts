import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

type Block = { type: 'p'; text: string } | { type: 'ul'; items: string[] };

const BULLET = /^\s*[-•*]\s+/;

/** Affiche un texte saisi dans l'admin : lignes vides = paragraphes, lignes « - » = liste à puces. Jamais de HTML. */
export function parseBlocks(text: string): Block[] {
  const blocks: Block[] = [];
  for (const chunk of (text ?? '').split(/\n\s*\n/)) {
    let para: string[] = [];
    let list: string[] = [];
    const flushPara = () => {
      if (para.length) blocks.push({ type: 'p', text: para.join('\n') });
      para = [];
    };
    const flushList = () => {
      if (list.length) blocks.push({ type: 'ul', items: list });
      list = [];
    };
    for (const line of chunk.split('\n')) {
      if (!line.trim()) continue;
      if (BULLET.test(line)) {
        flushPara();
        list.push(line.replace(BULLET, '').trim());
      } else {
        flushList();
        para.push(line.trim());
      }
    }
    flushPara();
    flushList();
  }
  return blocks;
}

@Component({
  selector: 'app-text-blocks',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @for (b of blocks(); track $index) {
      @if (b.type === 'p') {
        <p>{{ b.text }}</p>
      } @else {
        <ul>
          @for (item of b.items; track $index) { <li>{{ item }}</li> }
        </ul>
      }
    }
  `,
  styles: [`
    :host { display: block; }
    p { margin: 0 0 14px; white-space: pre-line; }
    p:last-child, ul:last-child { margin-bottom: 0; }
    ul { margin: 0 0 14px; padding-left: 1.25em; }
    li { margin-bottom: 6px; }
    li::marker { color: var(--primary-color, #ff6600); }
  `],
})
export class TextBlocksComponent {
  readonly text = input<string>('');
  readonly blocks = computed(() => parseBlocks(this.text()));
}
