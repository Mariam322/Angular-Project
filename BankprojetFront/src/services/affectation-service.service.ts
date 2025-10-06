import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Affectation } from './Affectation';
import { catchError, Observable, of, throwError } from 'rxjs';
import { Facture } from './Facture';
import { AuthService } from './auth.service';
import { Depense } from './Depense';
import { OperationBancaire } from './OperationBancaire';
   const API_BASE_URL = 'https://m1.systeo.tn/facturation';
   const DEPENSE_API_URL = 'https://m1.systeo.tn/depense';
   const API_BASE_URLop = 'https://m1.systeo.tn/banqueservice';
@Injectable({
  providedIn: 'root'
})
export class AffectationServiceService {

   private apiUrl = 'https://m1.systeo.tn/reglementaffectation';



  
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
  

  createAffectation(affectation: any): Observable<Affectation> {
    return this.http.post<Affectation>(`${this.apiUrl}/affectation/create`, affectation);
  }

  getAffectationById(id: number): Observable<Affectation> {
    return this.http.get<Affectation>(`${this.apiUrl}/affectation/getById/${id}`);
  }
 getAffectationsByReglement(reglementId: number): Observable<Affectation[]> {
  return this.http.get<Affectation[]>(
    `${this.apiUrl}/affectation/by-reglement/${reglementId}`, // URL corrigée
    this.getRequestOptions()
  ).pipe(
    catchError(error => {
      console.error('Error loading affectations:', error);
      return of([]);
    })
  );
}
  getAllAffectations(): Observable<Affectation[]> {
  return this.http.get<Affectation[]>(
    `${this.apiUrl}/affectation/getAll`,
    this.getRequestOptions()
  ).pipe(
    catchError(error => {
      console.error('Error loading all affectations:', error);
      return of([]); // Retourne un tableau vide en cas d'erreur
    })
  );
}

  updateAffectation(id: number, affectation: any): Observable<Affectation> {
    return this.http.put<Affectation>(`${this.apiUrl}/affectation/update/${id}`, affectation);
  }

 
  getAllfacture(): Observable<Facture[]> {
    return this.http.get<Facture[]>(`${API_BASE_URL}/facture/getAll`);
  }
 getFacturesByClient(clientId: number): Observable<Facture[]> {
      return this.http.get<Facture[]>(`${API_BASE_URL}/facture/by-company/${clientId}`,this.getRequestOptions());
    } 
    
getFacturesByCompany(companyId: number): Observable<Facture[]> {
  return this.http.get<Facture[]>(
    `${API_BASE_URL}/facture/by-company/${companyId}`,
    this.getRequestOptions()
  ).pipe(
    catchError(error => {
      console.error('Erreur lors de la récupération des factures:', error);
      return of([]); // Retourne un tableau vide en cas d'erreur
    })
  );
}
   
// Dans AffectationServiceService
getAllDepenses(): Observable<Depense[]> {
  return this.http.get<Depense[]>(`${DEPENSE_API_URL}/depense/getAll`, this.getRequestOptions());
}

getAllOperations(): Observable<OperationBancaire[]> {
  return this.http.get<OperationBancaire[]>(`${API_BASE_URLop}/operations`, this.getRequestOptions());
}
  
  affecterAFacture(reglementId: number, factureId: number, montant: number): Observable<Affectation> {
    return this.http.post<Affectation>(
      `${this.apiUrl}/affectation/affecter-facture`,
      { reglementId, factureId, montant },
      this.getRequestOptions()
    ).pipe(
      catchError(error => {
        console.error('Error in affecterAFacture:', error);
        throw error;
      })
    );
  }

  affecterADepense(reglementId: number, depenseId: number, montant: number): Observable<Affectation> {
    return this.http.post<Affectation>(
      `${this.apiUrl}/affectation/affecter-depense`,
      { reglementId, depenseId, montant },
      this.getRequestOptions()
    ).pipe(
      catchError(error => {
        console.error('Error in affecterADepense:', error);
        throw error;
      })
    );
  }

affecterAOperation(reglementId: number, operationId: number, montant: number): Observable<Affectation> {
  // Vérification des paramètres
  if (!reglementId || !operationId || !montant) {
    return throwError(() => new Error('Paramètres manquants'));
  }

  // Créez un objet avec les paramètres
  const params = {
    reglementId: reglementId.toString(),
    operationId: operationId.toString(),
    montant: montant.toString()
  };

  // Envoyez comme params dans l'URL
  return this.http.post<Affectation>(
    `${this.apiUrl}/affectation/affecter-operation`,
    null,
    {
      ...this.getRequestOptions(),
      params: new HttpParams({ fromObject: params })
    }
  ).pipe(
    catchError(error => {
      console.error('Détails erreur:', error);
      return throwError(() => error);
    })
  );

}

  deleteAffectation(id: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/affectation/delete/${id}`,
      this.getRequestOptions()
    ).pipe(
      catchError(error => {
        console.error('Error deleting affectation:', error);
        throw error;
      })
    );
  }
}
