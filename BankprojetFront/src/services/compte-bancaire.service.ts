import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { OAuthService } from 'angular-oauth2-oidc';
import { AuthService } from './auth.service';
import { catchError, Observable, of } from 'rxjs';

const API_BASE_URL = 'https://m1.systeo.tn/banqueservice';
@Injectable({
  providedIn: 'root'
})
export class CompteBancaireService {

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
       getComptes(): Observable<any[]> {
    return this.http.get<any[]>(`${API_BASE_URL}/comptes`, this.getRequestOptions());
  }

  getCompteById(id: number): Observable<any> {
    return this.http.get<any>(`${API_BASE_URL}/comptes/${id}`, this.getRequestOptions());
  }

  addCompte(compte: any): Observable<any> {
    return this.http.post(`${API_BASE_URL}/comptes`, compte, this.getRequestOptions());
  }

updateCompte(id: number, compte: any): Observable<any> {
  return this.http.put(`${API_BASE_URL}/comptes/${id}`, compte, this.getRequestOptions());
}


  deleteCompte(id: number): Observable<any> {
    return this.http.delete(`${API_BASE_URL}/comptes/delete/${id}`, this.getRequestOptions());
  }

getOperationsByCompteId(id: number): Observable<any[]> {
  if (!id) {
    return of([]); // Retourne un Observable vide si l'ID est null/undefined
  }
  return this.http.get<any[]>(`${API_BASE_URL}/comptes/${id}/operations`, this.getRequestOptions())
    .pipe(
      catchError(error => {
        console.error('Error fetching operations:', error);
        return of([]); // Retourne un tableau vide en cas d'erreur
      })
    );
}

}
