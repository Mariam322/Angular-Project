// google-auth.service.ts
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, lastValueFrom, Observable, of, tap, throwError } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class GoogleAuthService {
  private readonly ACCESS_TOKEN_KEY = 'google_access_token';
  private readonly REFRESH_TOKEN_KEY = 'google_refresh_token';
  private readonly TOKEN_EXPIRY_KEY = 'google_token_expiry';
  private readonly USER_EMAIL_KEY = 'google_user_email';

  constructor(private http: HttpClient, private router: Router) {}

  initGoogleAuth(returnUrl: string = '/emails'): void {
    const state = encodeURIComponent(returnUrl);
    window.location.href = `https://m4.systeo.tn/auth/google?returnUrl=${state}`;
  }

  async handleCallback(): Promise<boolean> {
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    const email = params.get('email');
    const expiresIn = params.get('expires_in');

    if (accessToken && refreshToken && email) {
      this.storeTokens(accessToken, refreshToken, expiresIn, email);
      return true;
    }
    return false;
  }

  private storeTokens(accessToken: string, refreshToken: string, expiresIn: string | null, email: string): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
    localStorage.setItem(this.USER_EMAIL_KEY, email);
    
    if (expiresIn) {
      const expiryDate = new Date();
      expiryDate.setSeconds(expiryDate.getSeconds() + parseInt(expiresIn));
      localStorage.setItem(this.TOKEN_EXPIRY_KEY, expiryDate.toISOString());
    }
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  getUserEmail(): string | null {
    return localStorage.getItem(this.USER_EMAIL_KEY);
  }

  isTokenExpired(): boolean {
    const expiry = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
    if (!expiry) return true;
    return new Date() > new Date(expiry);
  }

  async refreshToken(): Promise<void> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) throw new Error('No refresh token available');
    
    try {
      const response = await lastValueFrom(
        this.http.post<{ access_token: string, expires_in: number }>(
          `https://m4.systeo.tn/auth/refresh-token`,
          { refreshToken }
        )
      );
      
      const expiryDate = new Date();
      expiryDate.setSeconds(expiryDate.getSeconds() + response.expires_in);
      localStorage.setItem(this.ACCESS_TOKEN_KEY, response.access_token);
      localStorage.setItem(this.TOKEN_EXPIRY_KEY, expiryDate.toISOString());
    } catch (error) {
      this.clearTokens();
      throw error;
    }
  }

  clearTokens(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.TOKEN_EXPIRY_KEY);
    localStorage.removeItem(this.USER_EMAIL_KEY);
  }
}