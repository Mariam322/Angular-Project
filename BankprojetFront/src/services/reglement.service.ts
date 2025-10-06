import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { Reglement } from './Reglement';
import { catchError, Observable, throwError } from 'rxjs';
import { TypeClientFournisseur } from './type-client-fournisseur';
import { compain } from './compain';
import { Affectation } from './Affectation';
const API_BASE_URL = 'https://m1.systeo.tn/reglementaffectation';
const COMPAIN_API_URL = 'https://m1.systeo.tn/projetcompain';

@Injectable({
  providedIn: 'root'
})
export class ReglementService {

  constructor(private http: HttpClient, private authService: AuthService) { }

  private getRequestOptions() {
    const token = this.authService.getAccessToken();
    if (token) {
      localStorage.setItem('token', token);
    }
  
    const storedToken = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${storedToken || ''}`
    });
  
    return { headers };
  }

  // Opérations CRUD pour Reglement
  getAllReglements(): Observable<Reglement[]> {
    return this.http.get<Reglement[]>(`${API_BASE_URL}/reglement/getAll`, this.getRequestOptions());
  }

  getReglementById(id: number): Observable<Reglement> {
    return this.http.get<Reglement>(`${API_BASE_URL}/reglement/getById/${id}`, this.getRequestOptions());
  }



   createReglement(Reglement: Reglement): Observable<any> {
        return this.http.post(`${API_BASE_URL}/reglement/create`, Reglement, this.getRequestOptions());
      }
    

  updateReglement(id: number, reglement: Partial<Reglement>): Observable<Reglement> {
    return this.http.put<Reglement>(`${API_BASE_URL}/reglement/update/${id}`, reglement, this.getRequestOptions());
  }
  getAllCampaigns(): Observable<compain[]> {
      return this.http.get<compain[]>(
        `${COMPAIN_API_URL}/compain`,
        this.getRequestOptions()
      ).pipe(
        catchError(this.handleError)
      );
    }

  deleteReglement(id: number): Observable<void> {
    return this.http.delete<void>(`${API_BASE_URL}/reglement/delete/${id}`, this.getRequestOptions());
  }
  private handleError(error: HttpErrorResponse) {
      if (error.error instanceof ErrorEvent) {
        // A client-side or network error occurred.
        console.error('An error occurred:', error.error.message);
      } else {
        // The backend returned an unsuccessful response code.
        console.error(
          `Backend returned code ${error.status}, ` +
          `body was: ${JSON.stringify(error.error)}`);
      }
      // Return an observable with a user-facing error message.
      return throwError(() => new Error('Something bad happened; please try again later.'));
    }

  getReglementsByType(type: TypeClientFournisseur): Observable<Reglement[]> {
  return this.http.get<Reglement[]>(
    `${API_BASE_URL}/reglement/getByType/${type}`, 
    this.getRequestOptions()
  );
}

 

  searchReglements(searchTerm: string): Observable<Reglement[]> {
    return this.http.get<Reglement[]>(
      `${API_BASE_URL}/reglements/search?term=${searchTerm}`, 
      this.getRequestOptions()
    );
  }

}
