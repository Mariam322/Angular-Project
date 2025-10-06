import { HttpClient, HttpErrorResponse, HttpEvent, HttpEventType, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';
import { AuthService } from './auth.service';
import { catchError, map, Observable, throwError } from 'rxjs';
import { saveAs } from 'file-saver';
import { TypeDocument } from './TypeDocument';
const API_BASE_URL = 'https://m1.systeo.tn/documents';
@Injectable({
  providedIn: 'root'
})
export class DocumentsService {

 
  constructor(
    private http: HttpClient, 
   
    private authService: AuthService
  ) { }

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

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Une erreur inconnue est survenue';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      errorMessage = `Code d'erreur: ${error.status}\nMessage: ${error.message}`;
    }
    console.error(errorMessage);
    return throwError(errorMessage);
  }

  // Ajouter un document (via metadata)
  addDocument(createRequest: any): Observable<any> {
    return this.http.post(`${API_BASE_URL}/document/add`, createRequest, this.getRequestOptions())
      .pipe(catchError(this.handleError));
  }

   // Uploader un document avec fichier
 uploadDocument(
  file: File,
  type: TypeDocument,

  factureId?: number,
  depenseId?: number,
  operationId?: number
): Observable<{progress: number, response?: any}> {
  // Validation des entrées
  if (!file || !type) {
    return throwError(() => new Error('Fichier et type sont requis'));
  }

  const formData = new FormData();
  
  // Ajout du fichier avec le nom original
  formData.append('file', file, file.name);
  
  // Ajout des autres paramètres
  formData.append('type', type);

  if (factureId) formData.append('factureId', factureId.toString());
  if (depenseId) formData.append('depenseId', depenseId.toString());
  if (operationId) formData.append('operationId', operationId.toString());
    const headers = new HttpHeaders({
    'Authorization': `Bearer ${this.authService.getAccessToken()}`
  });

  return this.http.post(`${API_BASE_URL}/document/upload`, formData, {
    headers: headers,
    reportProgress: true,
    observe: 'events'
  }).pipe(
    map((event: HttpEvent<any>) => {
      if (event.type === HttpEventType.UploadProgress && event.total) {
        const progress = Math.round(100 * event.loaded / event.total);
        return { progress };
      } else if (event.type === HttpEventType.Response) {
        return { progress: 100, response: event.body };
      }
      return { progress: 0 };
    }),
    catchError((error: HttpErrorResponse) => {
      console.error('Erreur upload:', error);
      let errorMsg = 'Erreur lors du téléchargement';
      if (error.status === 0) {
        errorMsg = 'Problème de connexion au serveur';
      } else if (error.error?.message) {
        errorMsg = error.error.message;
      }
      return throwError(() => new Error(errorMsg));
    })
  );
}
// Ajoutez cette méthode pour récupérer l'URL Google Drive
getDriveUrl(documentId: number): Observable<{driveUrl: string}> {
  return this.http.get<{driveUrl: string}>(`${API_BASE_URL}/document/${documentId}/drive-url`, this.getRequestOptions())
    .pipe(catchError(this.handleError));
}
   // Sauvegarder le fichier téléchargé
  saveFile(blob: Blob, filename: string): void {
    saveAs(blob, filename);
  }
  // Récupérer tous les documents
  getAllDocuments(): Observable<any[]> {
    return this.http.get<any[]>(`${API_BASE_URL}/document`, this.getRequestOptions())
      .pipe(catchError(this.handleError));
  }

  // Récupérer un document par ID
  getDocumentById(id: number): Observable<any> {
    return this.http.get<any>(`${API_BASE_URL}/document/${id}`, this.getRequestOptions())
      .pipe(catchError(this.handleError));
  }

  // Télécharger un document
  downloadDocument(id: number): Observable<Blob> {
    const options = {
      ...this.getRequestOptions(),
      responseType: 'blob' as 'json'
    };
    return this.http.get<Blob>(`${API_BASE_URL}/document/download/${id}`, options)
      .pipe(catchError(this.handleError));
  }

  // Visualiser un document
  viewDocument(id: number): Observable<Blob> {
    const options = {
      ...this.getRequestOptions(),
      responseType: 'blob' as 'json'
    };
    return this.http.get<Blob>(`${API_BASE_URL}/document/view/${id}`, options)
      .pipe(catchError(this.handleError));
  }

  // Supprimer un document
  deleteDocument(id: number): Observable<any> {
    return this.http.delete(`${API_BASE_URL}/document/delete/${id}`, this.getRequestOptions())
      .pipe(catchError(this.handleError));
  }

  // Récupérer les documents par type
  getDocumentsByType(type: string): Observable<any[]> {
    return this.http.get<any[]>(`${API_BASE_URL}/document/type/${type}`, this.getRequestOptions())
      .pipe(catchError(this.handleError));
  }

  // Mettre à jour un document
  updateDocument(id: number, updateRequest: any): Observable<any> {
    return this.http.put(`${API_BASE_URL}/document/update/${id}`, updateRequest, this.getRequestOptions())
      .pipe(catchError(this.handleError));
  }

  // Télécharger un PDF associé à une facture (via Google Drive)
  downloadPdfByFactureId(factureId: number): Observable<Blob> {
    const options = {
      ...this.getRequestOptions(),
      responseType: 'blob' as 'json'
    };
    return this.http.get<Blob>(`${API_BASE_URL}/${factureId}`, options)
      .pipe(catchError(this.handleError));
  }
}