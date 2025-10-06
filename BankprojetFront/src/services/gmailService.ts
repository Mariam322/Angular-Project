import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { catchError, forkJoin, map, Observable, switchMap, tap, throwError } from 'rxjs';
import { UserService } from './user.service'
import { AuthService } from './auth.service';


@Injectable({
  providedIn: 'root'
})
export class GmailService {
    private apiUrl = 'https://m4.systeo.tn';
    
    constructor(private http: HttpClient, private authService: AuthService) { }

// gmail.service.ts
/* sendEmail(emailData: any): Observable<any> {
    const headers = this.getApiHeaders();
   

            return this.http.post(`${this.apiUrl}/emails/send`, emailData, {
            headers,
            withCredentials: true // Keep if your backend requires cookies/session info
        }).pipe(
            catchError(this.handleError) // Use the existing centralized error handler
        );
    } */


         sendEmail(
    accessToken: string,
    from: string,
    to: string,
    subject: string,
    text: string,
    attachments: File[] = []
  ): Observable<any> {
    const formData = new FormData();
    
    formData.append('accessToken', accessToken);
    formData.append('from', from);
    formData.append('to', to);
    formData.append('subject', subject);
    formData.append('text', text);

    // Ajouter les fichiers joints
    attachments.forEach((file, index) => {
      formData.append(`file${index}`, file, file.name);
    });

    return this.http.post(`${this.apiUrl}/emails/send`, formData);
  }

getEmail(accessToken: string, emailId: string, userId: string, includeAttachments = true): Observable<any> {
    const params = new HttpParams()
      .set('accessToken', accessToken)
      .set('userId', userId)
      .set('includeAttachments', includeAttachments.toString());
    const headers = this.getApiHeaders()
    return this.http.get<any>(`${this.apiUrl}/emails/${emailId}`, { params , headers});
  }
// Obtenir les emails reçus
  getInboxEmails(googleAccessToken: string,  maxResults = 100,userId: string): Observable<any> {
    const params = new HttpParams()
      .set('accessToken', googleAccessToken)
      .set('userId', userId)
      .set('maxResults', maxResults.toString());
 
 const headers = this.getApiHeaders()
    console.log("params",params)
    return this.http.get<any>(`https://e8.systeo.tn/emails/inbox/list`, { headers , params }).pipe(
    catchError(error => {
      console.error('Error fetching emails:', error);
      return throwError(() => new Error('Failed to load emails'));
    })
  );  }

  // Obtenir les emails envoyés
  getSentEmails(accessToken: string, userId: string, maxResults = 20): Observable<any> {
    const params = new HttpParams()
      .set('accessToken', accessToken)
      .set('userId', userId)
      .set('maxResults', maxResults.toString());
const headers = this.getApiHeaders()
    return this.http.get<any>(`${this.apiUrl}/emails/sent/list`, { headers,params });
  }

  // Supprimer un email
  deleteEmail(accessToken: string, emailId: string, userId: string, permanent = false): Observable<any> {
    const params = new HttpParams()
      .set('accessToken', accessToken)
      .set('userId', userId)
      .set('permanent', permanent.toString());

    return this.http.delete(`${this.apiUrl}/emails/${emailId}`, { params });
  }

  // Marquer un email comme lu
  markAsRead(accessToken: string, emailId: string, userId: string): Observable<any> {
    const params = new HttpParams()
      .set('accessToken', accessToken)
      .set('userId', userId);
const headers = this.getApiHeaders()
    return this.http.patch(`${this.apiUrl}/emails/${emailId}/read`, {}, {headers, params });
  }

  // Gestion des brouillons
  createDraft(accessToken: string, draftData: any, userId: string): Observable<any> {
    const headers = this.getApiHeaders()

    return this.http.post(`${this.apiUrl}/drafts/create`, {
      ...draftData,
      accessToken,
      userId
    }, { headers });
  }

  getDrafts(accessToken: string, userId: string, maxResults = 10): Observable<any> {
    const params = new HttpParams()
      .set('accessToken', accessToken)
      .set('userId', userId)
      .set('maxResults', maxResults.toString());
const headers = this.getApiHeaders()
    return this.http.get<any>(`${this.apiUrl}/drafts/list`, { headers,params });
  }

  deleteDraft(accessToken: string, draftId: string, userId: string): Observable<any> {
    const params = new HttpParams()
      .set('accessToken', accessToken)
      .set('userId', userId);
const headers = this.getApiHeaders()
    return this.http.delete(`${this.apiUrl}/drafts/${draftId}`, { headers,params });
  }

  sendDraft(accessToken: string, draftId: string, userId: string): Observable<any> {
    const params = new HttpParams()
      .set('accessToken', accessToken)
      .set('userId', userId);
const headers = this.getApiHeaders()
    return this.http.post(`${this.apiUrl}/drafts/${draftId}/send`, {}, {headers, params });
  }
sendSystemEmail(emailData: any): Observable<any> {
  console.log('Envoi de l\'email système - Données:', emailData);
  
  // Ajoutez des headers si nécessaire
  const headers = new HttpHeaders({
    'Content-Type': 'application/json'
  });

  return this.http.post(`${this.apiUrl}/emails/system`, emailData, { headers }).pipe(
    catchError(error => {
      console.error('Erreur détaillée:', error);
      console.error('Status:', error.status);
      console.error('Message:', error.error?.message || error.message);
      console.error('Détails:', error.error?.details);
      return throwError(() => error);
    })
  );
}
    
      private getApiHeaders(): HttpHeaders {
         const token = this.authService.getAccessToken();
         return new HttpHeaders({
           'Content-Type': 'application/json',
           'Authorization': `Bearer ${token}`,
           
         });
       }
       
         private handleError(error: HttpErrorResponse): Observable<never> {
           console.error('API Error Details:', error);
           
           let errorMessage = 'Une erreur est survenue';
           if (error.status === 401) {
             errorMessage = 'Session expirée - veuillez vous reconnecter';
             this.authService.logout();
           } else if (error.error?.message) {
             errorMessage = error.error.message;
           } else if (error.status === 500) {
             errorMessage = `Erreur serveur (${error.status}) - ${error.error?.error || 'Veuillez contacter l\'administrateur'}`;
           }
       
           return throwError(() => new Error(errorMessage));
         }
}