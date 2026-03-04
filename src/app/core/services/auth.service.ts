import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { ApiService } from './api.service';
import { StorageService } from './storage.service';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'customer' | 'admin';
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private api: ApiService,
    private storage: StorageService
  ) {
    const user = this.storage.get<User>('user');
    const token = this.storage.get<string>('accessToken');
    if (user && token) {
      this.currentUserSubject.next(user);
    }
  }

  register(data: { email: string; password: string; firstName: string; lastName: string; phone?: string }): Observable<AuthResponse> {
    return this.api.post<AuthResponse>('/auth/register', data).pipe(
      tap(response => this.setAuth(response))
    );
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.api.post<AuthResponse>('/auth/login', { email, password }).pipe(
      tap(response => this.setAuth(response))
    );
  }

  logout(): void {
    this.storage.remove('accessToken');
    this.storage.remove('refreshToken');
    this.storage.remove('user');
    this.currentUserSubject.next(null);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return !!this.getCurrentUser();
  }

  isAdmin(): boolean {
    return this.getCurrentUser()?.role === 'admin';
  }

  getToken(): string | null {
    return this.storage.get<string>('accessToken');
  }

  refreshToken(): Observable<AuthResponse> {
    const refreshToken = this.storage.get<string>('refreshToken');
    return this.api.post<AuthResponse>('/auth/refresh', { refreshToken }).pipe(
      tap(response => this.setAuth(response))
    );
  }

  forgotPassword(email: string): Observable<{ success: boolean; message: string }> {
    return this.api.post<{ success: boolean; message: string }>('/auth/forgot-password', { email });
  }

  resetPassword(token: string, newPassword: string): Observable<{ success: boolean; message: string }> {
    return this.api.post<{ success: boolean; message: string }>('/auth/reset-password', { token, newPassword });
  }

  private setAuth(response: AuthResponse): void {
    this.storage.set('accessToken', response.accessToken);
    this.storage.set('refreshToken', response.refreshToken);
    this.storage.set('user', response.user);
    this.currentUserSubject.next(response.user);
  }
}
