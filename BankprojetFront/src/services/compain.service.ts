import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, EMPTY, Observable, throwError } from 'rxjs';
import { compain } from './compain';
import { KeycloakService } from 'keycloak-angular';
import { OAuthService } from 'angular-oauth2-oidc';
import { AuthService } from './auth.service';
import { TypeClientFournisseur } from './type-client-fournisseur';

const API_BASE_URL = 'https://m1.systeo.tn/projetcompain';


@Injectable({
  providedIn: 'root'
})
export class CompainService {
  constructor(private http: HttpClient, private oauthService: OAuthService,private authService: AuthService) { }

  private getRequestOptions() {
    // Récupération et stockage du token
    const token = this.authService.getAccessToken();
    if (token) {
      localStorage.setItem('token', token);
    }
  
    // Création des headers
    const storedToken = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${storedToken || ''}`
    });
  
    return { headers };
  }
  


    // Opérations CRUD unifiées
    getCompains(): Observable<any[]> {
      console.log('Access Token:', this.authService.getAccessToken());
      return this.http.get<any[]>(`${API_BASE_URL}/compain`, this.getRequestOptions());
    }
  
    getCompain(id: number): Observable<any> {
      return this.http.get<any>(`${API_BASE_URL}/compain/${id}`, this.getRequestOptions());
    }
  
    createCompain(compain: any): Observable<any> {
      return this.http.post(`${API_BASE_URL}/compain/add`, compain, this.getRequestOptions());
    }
  
    updateCompain(id: number, compain: any): Observable<any> {
      return this.http.put(`${API_BASE_URL}/compain/update/${id}`, compain, this.getRequestOptions());
    }
  
    deleteCompain(id: number): Observable<any> {
      return this.http.delete(`${API_BASE_URL}/compain/delete/${id}`, this.getRequestOptions());
    }
getCompainsByType(type: TypeClientFournisseur): Observable<compain[]> {
    return this.http.get<compain[]>(
      `${API_BASE_URL}/compain/type/${type}`,
      this.getRequestOptions()
    ).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    console.error('Error:', error);
    return throwError(() => new Error('Erreur lors de la récupération des compains'));
  }
  
  }
