import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private options = { withCredentials: true as const };

  get<T>(endpoint: string, params?: any): Observable<T> {
    return this.http.get<T>(`${this.apiUrl}${endpoint}`, { ...this.options, params });
  }

  post<T>(endpoint: string, body: any): Observable<T> {
    return this.http.post<T>(`${this.apiUrl}${endpoint}`, body, this.options);
  }

  put<T>(endpoint: string, body: any): Observable<T> {
    return this.http.put<T>(`${this.apiUrl}${endpoint}`, body, this.options);
  }

  patch<T>(endpoint: string, body: any): Observable<T> {
    return this.http.patch<T>(`${this.apiUrl}${endpoint}`, body, this.options);
  }

  delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(`${this.apiUrl}${endpoint}`, this.options);
  }

  /** Upload d’une image (ex. pour un produit). Retourne l’URL publique de l’image. */
  uploadImage(file: File, accessToken?: string | null): Observable<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    const headers = new HttpHeaders();
    const options = accessToken
      ? { ...this.options, headers: headers.set('Authorization', `Bearer ${accessToken}`) }
      : this.options;
    return this.http.post<{ url: string }>(`${this.apiUrl}/admin/upload/image`, formData, options);
  }
}
