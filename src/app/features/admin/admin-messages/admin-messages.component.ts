import { Component, OnInit } from '@angular/core';
import { AdminSidebarComponent } from '../admin-sidebar/admin-sidebar.component';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';

interface AdminMessage {
  id: number;
  name: string;
  email: string;
  phone?: string;
  message: string;
  read: boolean;
  adminResponse?: string | null;
  createdAt: string;
  respondedAt?: string | null;
}

@Component({
  selector: 'app-admin-messages',
  standalone: true,
  imports: [AdminSidebarComponent, CommonModule, RouterModule, FormsModule, DatePipe],
  template: `
    <div class="admin-layout">
      <div class="container admin-layout-inner">
        <app-admin-sidebar></app-admin-sidebar>
        <main class="admin-main">
          <div class="admin-header">
            <h1>Messagerie</h1>
            <p class="admin-subtitle">
              {{ unreadCount }} message(s) non lus — {{ messages.length }} au total
            </p>
          </div>

          <div class="messages-layout" *ngIf="!loading; else loadingTpl">
            <section class="messages-list">
              <div
                *ngFor="let m of messages"
                class="message-item"
                [class.unread]="!m.read"
                (click)="selectMessage(m)">
                <div class="message-meta">
                  <span class="message-name">{{ m.name }}</span>
                  <span class="message-email">{{ m.email }}</span>
                </div>
                <div class="message-snippet">
                  {{ m.message | slice:0:80 }}{{ m.message.length > 80 ? '…' : '' }}
                </div>
                <div class="message-footer">
                  <span class="message-date">{{ m.createdAt | date:'short':'GMT' }}</span>
                  <span class="badge" [class.badge-unread]="!m.read" [class.badge-replied]="!!m.adminResponse">
                    @if (!m.read) { Non lu } @else if (m.adminResponse) { Répondu } @else { Lu }
                  </span>
                </div>
              </div>
              <div class="empty-state" *ngIf="messages.length === 0">
                Aucun message pour le moment.
              </div>
            </section>

            <section class="message-detail" *ngIf="selected; else emptyDetailTpl">
              <header class="detail-header">
                <div>
                  <h2>{{ selected.name }}</h2>
                  <p class="detail-contact">
                    <a [href]="'mailto:' + selected.email">{{ selected.email }}</a>
                    <span *ngIf="selected.phone">· {{ selected.phone }}</span>
                  </p>
                  <p class="detail-date">
                    Reçu le {{ selected.createdAt | date:'fullDate':'GMT' }} à {{ selected.createdAt | date:'shortTime':'GMT' }}
                  </p>
                </div>
              </header>

              <section class="detail-message">
                <h3>Message</h3>
                <p class="detail-message-body">
                  {{ selected.message }}
                </p>
              </section>

              <section class="detail-reply">
                <h3>Réponse interne</h3>
                <p class="detail-reply-info">
                  Cette réponse est enregistrée dans la console. Pour répondre par email au client, utilisez le lien
                  ci-dessus ou votre messagerie habituelle.
                </p>
                <textarea
                  [(ngModel)]="replyText"
                  rows="5"
                  placeholder="Rédigez ici votre réponse ou vos notes internes à propos de ce message…">
                </textarea>
                <div class="detail-reply-footer">
                  <button type="button" class="btn btn-secondary" (click)="markRead(selected)" [disabled]="updating">
                    Marquer comme lu
                  </button>
                  <button type="button" class="btn btn-primary" (click)="saveReply(selected)" [disabled]="updating">
                    {{ updating ? 'Enregistrement...' : 'Enregistrer la réponse' }}
                  </button>
                </div>
                <p class="detail-replied-at" *ngIf="selected.adminResponse">
                  Dernière réponse enregistrée le {{ selected.respondedAt || selected.createdAt | date:'short' }}.
                </p>
              </section>
            </section>
          </div>

          <ng-template #loadingTpl>
            <p>Chargement des messages…</p>
          </ng-template>
          <ng-template #emptyDetailTpl>
            <div class="empty-detail">
              Sélectionnez un message à gauche pour le consulter.
            </div>
          </ng-template>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .admin-layout { padding: 32px 0; }
    .admin-layout-inner {
      display: flex;
      align-items: flex-start;
      gap: 24px;
    }
    .admin-main {
      flex: 1;
    }
    .admin-header {
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin-bottom: 16px;
    }
    .admin-subtitle {
      font-size: 0.875rem;
      color: var(--text-light);
    }
    .messages-layout {
      display: grid;
      grid-template-columns: minmax(280px, 360px) minmax(0, 1fr);
      gap: 20px;
      align-items: stretch;
    }
    .messages-list {
      background: #fff;
      border-radius: 10px;
      box-shadow: var(--shadow);
      border: 1px solid var(--border-color);
      max-height: 640px;
      overflow-y: auto;
    }
    .message-item {
      padding: 12px 14px;
      border-bottom: 1px solid var(--border-color);
      cursor: pointer;
      transition: background 0.15s;
    }
    .message-item:last-child {
      border-bottom: none;
    }
    .message-item.unread {
      background: #fff9f2;
    }
    .message-item:hover {
      background: #fff3e6;
    }
    .message-meta {
      display: flex;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 4px;
      font-size: 0.875rem;
    }
    .message-name {
      font-weight: 600;
      color: var(--text-dark);
    }
    .message-email {
      color: var(--text-light);
      font-size: 0.8125rem;
    }
    .message-snippet {
      font-size: 0.875rem;
      color: var(--text-dark);
      margin-bottom: 6px;
    }
    .message-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.75rem;
      color: var(--text-light);
    }
    .badge {
      padding: 2px 8px;
      border-radius: 999px;
      font-size: 0.7rem;
      font-weight: 600;
    }
    .badge-unread {
      background: #ffe0b2;
      color: #e65100;
    }
    .badge-replied {
      background: #e8f5e9;
      color: #2e7d32;
    }
    .message-detail {
      background: #fff;
      border-radius: 10px;
      box-shadow: var(--shadow);
      border: 1px solid var(--border-color);
      padding: 20px 22px 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      min-height: 320px;
    }
    .detail-header h2 {
      font-size: 1.25rem;
      margin-bottom: 4px;
    }
    .detail-contact a {
      color: var(--primary-color);
      text-decoration: none;
      font-weight: 500;
    }
    .detail-contact a:hover {
      text-decoration: underline;
    }
    .detail-contact {
      font-size: 0.9rem;
      color: var(--text-dark);
      margin-bottom: 4px;
    }
    .detail-date {
      font-size: 0.8rem;
      color: var(--text-light);
    }
    .detail-message h3,
    .detail-reply h3 {
      font-size: 1rem;
      margin-bottom: 6px;
    }
    .detail-message-body {
      font-size: 0.9375rem;
      line-height: 1.5;
      color: var(--text-dark);
      background: #fafafa;
      border-radius: 8px;
      padding: 12px 14px;
      white-space: pre-line;
    }
    .detail-reply-info {
      font-size: 0.8rem;
      color: var(--text-light);
      margin-bottom: 8px;
    }
    .detail-reply textarea {
      width: 100%;
      padding: 10px 12px;
      border-radius: 8px;
      border: 1px solid var(--border-color);
      font-family: inherit;
      font-size: 0.9375rem;
      resize: vertical;
      min-height: 120px;
    }
    .detail-reply-footer {
      margin-top: 8px;
      display: flex;
      gap: 8px;
      justify-content: flex-end;
    }
    .detail-replied-at {
      margin-top: 6px;
      font-size: 0.75rem;
      color: var(--text-light);
    }
    .empty-state {
      padding: 16px;
      font-size: 0.9rem;
      color: var(--text-light);
      text-align: center;
    }
    .empty-detail {
      background: #fff;
      border-radius: 10px;
      box-shadow: var(--shadow);
      border: 1px solid var(--border-color);
      padding: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.95rem;
      color: var(--text-light);
    }
    @media (max-width: 900px) {
      .messages-layout {
        grid-template-columns: 1fr;
      }
      .messages-list {
        max-height: 320px;
      }
    }
  `]
})
export class AdminMessagesComponent implements OnInit {
  messages: AdminMessage[] = [];
  loading = true;
  updating = false;
  selected: AdminMessage | null = null;
  replyText = '';

  constructor(
    private api: ApiService,
    private toast: ToastService,
  ) {}

  get unreadCount(): number {
    return this.messages.filter(m => !m.read).length;
  }

  ngOnInit(): void {
    this.loadMessages();
  }

  loadMessages(): void {
    this.loading = true;
    this.api.get<AdminMessage[]>('/admin/messages').subscribe({
      next: (msgs) => {
        this.messages = msgs || [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toast.error('Impossible de charger les messages.');
      }
    });
  }

  selectMessage(m: AdminMessage): void {
    this.selected = m;
    this.replyText = m.adminResponse || '';
    if (!m.read) {
      this.markRead(m, false);
    }
  }

  markRead(m: AdminMessage, showToast: boolean = true): void {
    if (m.read) {
      return;
    }
    this.updating = true;
    this.api.patch<AdminMessage>(`/admin/messages/${m.id}/read`, {}).subscribe({
      next: (updated) => {
        m.read = updated.read;
        this.updating = false;
        if (showToast) {
          this.toast.info('Message marqué comme lu.');
        }
      },
      error: () => {
        this.updating = false;
        this.toast.error('Impossible de marquer le message comme lu.');
      }
    });
  }

  saveReply(m: AdminMessage): void {
    const text = (this.replyText || '').trim();
    if (!text) {
      this.toast.error('La réponse ne peut pas être vide.');
      return;
    }
    this.updating = true;
    this.api.patch<AdminMessage>(`/admin/messages/${m.id}/reply`, { response: text }).subscribe({
      next: (updated) => {
        m.adminResponse = updated.adminResponse;
        m.read = updated.read;
        m.respondedAt = (updated as any).respondedAt;
        this.updating = false;
        this.toast.success('Réponse enregistrée.');
      },
      error: () => {
        this.updating = false;
        this.toast.error('Impossible d\'enregistrer la réponse.');
      }
    });
  }
}

