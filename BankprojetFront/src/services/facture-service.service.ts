// facture.service.ts
import { HttpClient, HttpErrorResponse, HttpEventType, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, filter, map, Observable, tap, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { Facture } from './Facture';
import { compain } from './compain';

const API_BASE_URL = 'https://m1.systeo.tn/facturation';
const COMPAIN_API_URL = 'https://m1.systeo.tn/projetcompain';
@Injectable({
  providedIn: 'root'
})
export class FactureService {

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

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

  // Opérations CRUD pour les factures
  getFactures(): Observable<Facture[]> {
    return this.http.get<Facture[]>(
      `${API_BASE_URL}/facture/getAll`, 
      this.getRequestOptions()
    ).pipe(
      catchError(this.handleError)
    );
  }
getAllCampaigns(): Observable<compain[]> {
    return this.http.get<compain[]>(
      `${COMPAIN_API_URL}/compain`,
      this.getRequestOptions()
    ).pipe(
      catchError(this.handleError)
    );
  }

  // Nouvelle méthode pour récupérer une campagne par son ID
  getCampaignById(id: number): Observable<compain> {
    return this.http.get<compain>(
      `${COMPAIN_API_URL}/compain/${id}`,
      this.getRequestOptions()
    ).pipe(
      catchError(this.handleError)
    );
  }

  getFactureById(id: number): Observable<Facture> {
    return this.http.get<Facture>(
      `${API_BASE_URL}/facture/getById/${id}`,
      this.getRequestOptions()
    ).pipe(
     
    );
  }

  createFactureWithLines(facture: Facture): Observable<Facture> {
    if (!facture.montantHt && facture.lignes) {
      facture.montantHt = facture.lignes.reduce(
        (sum, ligne) => sum + (ligne.quantite * ligne.prixUnitaire), 0
      );
    }

    if (!facture.montantTtc && facture.montantHt && facture.tva) {
      facture.montantTtc = facture.montantHt * (1 + facture.tva / 100);
    }

    return this.http.post<Facture>(
      `${API_BASE_URL}/facture/create`,
      facture,
      this.getRequestOptions()
    ).pipe(
      catchError(this.handleError)
    );
  }
// Dans facture.service.ts
getFactureStats(): Observable<{ [key: string]: number }> {
  return this.http.get<{ [key: string]: number }>(
    `${API_BASE_URL}/facture/stats`,
    this.getRequestOptions()
  ).pipe(
    catchError(this.handleError)
  );
}
  updateFacture(id: number, facture: Facture): Observable<Facture> {
    return this.http.put<Facture>(
      `${API_BASE_URL}/facture/update/${id}`,
      facture,
      this.getRequestOptions()
    ).pipe(
      catchError(this.handleError)
    );
  }
    createFacture(facture: Facture): Observable<Facture> {
    return this.http.post<Facture>(
      `${API_BASE_URL}/facture/create`,
      facture,
      this.getRequestOptions()
    ).pipe(
      catchError(this.handleError)
    );
  }

  deleteFacture(id: number): Observable<void> {
    return this.http.delete<void>(
      `${API_BASE_URL}/facture/delete/${id}`,
      this.getRequestOptions()
    ).pipe(
      catchError(this.handleError)
    );
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
    // In your FactureService

 // Génération du PDF
  generatePdf(factureId: number): Observable<{message: string}> {
  return this.http.post<{message: string}>(
    `${API_BASE_URL}/facture/${factureId}/generate-pdf`, 
    null,  // Pas de body pour cette requête
    this.getRequestOptions()  // Ajout des en-têtes d'autorisation
  ).pipe(
    catchError(this.handleError)  // Gestion des erreurs
  );
}

  // Téléchargement du PDF
downloadPdf(factureId: number): Observable<Blob> {
  const options = {
    ...this.getRequestOptions(),
    responseType: 'blob' as 'json'
  };
  
  
  return this.http.get<Blob>(
    `${API_BASE_URL}/${factureId}/download`,
    options
  ).pipe(
    map(response => response as Blob),
    catchError(this.handleError)
  );
}
sendPdfToBackend(pdfData: any): Observable<any> {
  return this.http.post(`${API_BASE_URL}/facture/send-pdf`, pdfData);
}
getFacturesByClient(clientId: number): Observable<Facture[]> {
    return this.http.get<Facture[]>(`${API_BASE_URL}/facture/by-company/${clientId}`,this.getRequestOptions());
  }

}
