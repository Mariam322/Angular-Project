import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router, UrlTree } from '@angular/router';
import { OAuthService } from 'angular-oauth2-oidc';
import { Observable, of, from } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { AuthService } from 'src/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router,
    private oauthService: OAuthService
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> {
    // Bypass for specific routes (like '/emails')
    if (state.url.includes('/emails')) {
      return of(true);
    }

    // If already authenticated
    if (this.authService.isAuthenticated()) {
      return of(true);
    }

    // Check if returning from Keycloak (has code and state)
    const hasCode = window.location.search.includes('code=');
    const hasState = window.location.search.includes('state=');

    if (hasCode && hasState) {
      // Handle the OAuth callback
      return from(this.oauthService.tryLoginCodeFlow()).pipe(
        switchMap(() => {
          if (this.authService.isAuthenticated()) {
            return of(true);
          } else {
            return of(this.router.createUrlTree(['/login']));
          }
        }),
        catchError((error) => {
          console.error('AuthGuard error during tryLoginCodeFlow:', error);
          return of(this.router.createUrlTree(['/login']));
        })
      );
    }

    // Not authenticated and not in OAuth flow - redirect to login
    this.authService.login(); // Initiate Keycloak login
    return of(false);
  }
}