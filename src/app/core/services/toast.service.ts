import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
  duration: number;
  createdAt: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 1;
  private readonly defaultDuration = 5000;

  private listSubject = new BehaviorSubject<Toast[]>([]);
  readonly list$ = this.listSubject.asObservable();

  private get list(): Toast[] {
    return this.listSubject.value;
  }

  private set list(value: Toast[]) {
    this.listSubject.next(value);
  }

  show(message: string, type: ToastType = 'info', duration: number = this.defaultDuration): void {
    const id = this.nextId++;
    const toast: Toast = { id, message, type, duration, createdAt: Date.now() };
    this.list = [...this.list, toast];
    if (duration > 0) {
      setTimeout(() => this.dismiss(id), duration);
    }
  }

  success(message: string, duration?: number): void {
    this.show(message, 'success', duration ?? this.defaultDuration);
  }

  error(message: string, duration?: number): void {
    this.show(message, 'error', duration ?? Math.max(this.defaultDuration, 7000));
  }

  info(message: string, duration?: number): void {
    this.show(message, 'info', duration ?? this.defaultDuration);
  }

  dismiss(id: number): void {
    this.list = this.list.filter(t => t.id !== id);
  }

  dismissAll(): void {
    this.list = [];
  }
}
