import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthService } from 'src/services/auth.service';
import { Depense } from './Depense';
import { catchError, map, Observable, throwError } from 'rxjs';
import { compain } from './compain';
const DEPENSE_API_URL = 'https://m1.systeo.tn/depense';
const COMPAIN_API_URL = 'https://m1.systeo.tn/projetcompain';
@Injectable({
  providedIn: 'root'
})
export class DepenseService {
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

  createDepense(Depense: Depense): Observable<Depense> {
    return this.http.post<Depense>(
      `${DEPENSE_API_URL}/depense/create`,
      Depense,
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
createDepenseWithLines(depense: Depense): Observable<Depense> {
    // Calculate montantHtDepense if not provided
    if (!depense.montantHtDepense && depense.lignes) {
      depense.montantHtDepense = depense.lignes.reduce(
        (sum, ligne) => sum + (ligne.quantite * ligne.prix), 0
      );
    }

    // Calculate montantTtcDepense if not provided
    if (!depense.montantTtcDepense && depense.montantHtDepense && depense.tvaDepense) {
      depense.montantTtcDepense = depense.montantHtDepense * (1 + depense.tvaDepense / 100);
    }

    // Calculate totalGeneralDepense (same as TTC in this case)
    depense.totalGeneralDepense = depense.montantTtcDepense;

    return this.http.post<Depense>(
      `${DEPENSE_API_URL}/depense/create`,
      depense,
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

  getDepenseById(id: number): Observable<Depense> {
    return this.http.get<Depense>(
      `${DEPENSE_API_URL}/depense/getById/${id}`,
      this.getRequestOptions()
    ).pipe(
      catchError(this.handleError)
    );
  }

  getAllDepenses(): Observable<Depense[]> {
    return this.http.get<Depense[]>(
      `${DEPENSE_API_URL}/depense/getAll`,
      this.getRequestOptions()
    ).pipe(
      catchError(this.handleError)
    );
  }

  updateDepense(id: number, Depense: Depense): Observable<Depense> {
    return this.http.put<Depense>(
      `${DEPENSE_API_URL}/depense/update/${id}`,
      Depense,
      this.getRequestOptions()
    ).pipe(
      catchError(this.handleError)
    );
  }

  deleteDepense(id: number): Observable<void> {
    return this.http.delete<void>(
      `${DEPENSE_API_URL}/depense/delete/${id}`,
      this.getRequestOptions()
    ).pipe(
      catchError(this.handleError)
    );
  }
  // Dans depense.service.ts
getMonthlyExpenses(): Observable<{months: string[], expenses: number[]}> {
  return this.getAllDepenses().pipe(
    map((depenses: Depense[]) => {
      // Grouper les dépenses par mois
      const monthlyExpenses = new Map<string, number>();
      
      depenses.forEach(depense => {
        const date = new Date(depense.dateDepense);
        const monthYear = `${date.getMonth()+1}/${date.getFullYear()}`;
        
        const current = monthlyExpenses.get(monthYear) || 0;
        monthlyExpenses.set(monthYear, current + (depense.totalGeneralDepense || 0));
      });
      
      // Trier par date et formater
      const sortedMonths = Array.from(monthlyExpenses.keys())
        .sort((a, b) => {
          const [monthA, yearA] = a.split('/').map(Number);
          const [monthB, yearB] = b.split('/').map(Number);
          return yearA === yearB ? monthA - monthB : yearA - yearB;
        });
      
      return {
        months: sortedMonths,
        expenses: sortedMonths.map(month => monthlyExpenses.get(month) || 0)
      };
    })
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
}