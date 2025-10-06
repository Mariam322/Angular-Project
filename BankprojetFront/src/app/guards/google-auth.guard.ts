import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, CanActivateFn, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { GoogleAuthService } from 'src/services/googleAuthSerivce';

@Injectable({ providedIn: 'root' })
export class GoogleAuthGuard implements CanActivate {
  constructor(
    private authService: GoogleAuthService,
    private router: Router
  ) {}

  async canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Promise<boolean | UrlTree> {
    const token = this.authService.getAccessToken();
    
    // Si token valide présent
    if (token && !this.authService.isTokenExpired()) {
      return true;
    }

    // Si refresh token disponible
    if (this.authService.getRefreshToken()) {
      try {
        await this.authService.refreshToken();
        return true;
      } catch (error) {
        console.error('Échec du rafraîchissement:', error);
        return this.initAuthFlow(state.url);
      }
    }

    // Sinon initier le flux
    return this.initAuthFlow(state.url);
  }

  private initAuthFlow(returnUrl: string): UrlTree {
    this.authService.initGoogleAuth(returnUrl);
    return this.router.createUrlTree(['/loading']); // Page intermédiaire
  }
}