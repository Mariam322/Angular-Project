import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { catchError, from, lastValueFrom, Observable, switchMap, throwError } from 'rxjs';
import { GoogleAuthService } from 'src/services/googleAuthSerivce';
import { Router } from '@angular/router';

@Injectable()
export class GoogleAuthInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Seulement pour les API Google
    if (req.url.includes('googleapis.com')) {
      const token = localStorage.getItem('google_token');
      if (token) {
        req = req.clone({
          setHeaders: { Authorization: `Bearer ${token}` }
        });
      }
    }
    return next.handle(req);
  }
}