import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';
import { AuthService } from './auth.service';
import { Observable } from 'rxjs';
const SWAGGER_UI_URL = 'https://m1.systeo.tn/swagger-ui.html';
@Injectable({
  providedIn: 'root'
})
export class SwaggerService {
 constructor(private http: HttpClient, private oauthService: OAuthService,private authService: AuthService

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
  
    
  // Méthode pour ouvrir Swagger UI avec authentification
  openSwaggerUI(): void {
    const token = this.authService.getAccessToken();
    
    if (token) {
      // Solution 1: Passer le token dans l'URL (si Swagger est configuré pour cela)
      window.open(`${SWAGGER_UI_URL}?token=${encodeURIComponent(token)}`, '_blank');
      
      // Solution 2: Stocker temporairement le token pour Swagger
      localStorage.setItem('swagger_token', token);
      window.open(SWAGGER_UI_URL, '_blank');
      
      // Nettoyer après 5 secondes
      setTimeout(() => localStorage.removeItem('swagger_token'), 5000);
    } else {
      this.authService.login();
    }
  }

  // Méthode pour récupérer la documentation Swagger JSON
  getSwaggerDocs(): Observable<any> {

    return this.http.get('https://m1.systeo.tn/v3/api-docs', this.getRequestOptions())

    
  }
}
