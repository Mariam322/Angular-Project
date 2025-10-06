import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatButtonModule, MatFabButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { catchError, finalize, forkJoin, map, Observable, of, Subject, takeUntil, tap } from 'rxjs';
import { AuthService } from 'src/services/auth.service';
import { GmailService } from 'src/services/gmailService';
import { GoogleAuthService } from 'src/services/googleAuthSerivce';
import { EmailFormComponent } from '../email-form/email-form.component';
type ActiveEmailTab = 'received' | 'sent' ;

@Component({
  selector: 'app-emails',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    EmailFormComponent
  ],
  templateUrl: './emails.component.html',
  styleUrl: './emails.component.css'
})
export class EmailsComponent implements OnInit,OnDestroy    {
 receivedEmails: any[] = [];
  sentEmails: any[] = [];
  activeTab: ActiveEmailTab = 'received';
  isLoading = false;
  error: string | null = null;
  currentUserEmail: string = '';
    selectedEmailId: string | null = null; // Pour suivre l'email sélectionné
isFormOpen = false;
  selectedEmail: any = null;
  
private destroy$ = new Subject<void>();
  constructor(
    private googleAuthService: GoogleAuthService,
    private router: Router,
    private gmailService: GmailService,
    private authService: AuthService,
        public dialog: MatDialog
  ) {}
  ngOnInit(): void {
    this.checkAuthAndLoadEmails();
  }
ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  private checkAuthAndLoadEmails(): void {
    const googleToken = this.googleAuthService.getAccessToken();
    const userProfile = this.authService.getDecodedToken();
    console.log("Profil utilisateur:", userProfile);
    console.log("Token Google:", googleToken);


    if (!googleToken) {
       this.currentUserEmail = userProfile?.email || ''; // Set it here as well

      const currentUrl = this.router.url;
      this.googleAuthService.initGoogleAuth(currentUrl);
      return;
    }

    this.loadAllEmails();
  }
private setCurrentUserEmail(): boolean {
    const userProfile = this.authService.getDecodedToken();
    this.currentUserEmail = userProfile?.email || '';
    console.log("Email utilisateur actuel:", this.currentUserEmail);
    return !!this.currentUserEmail;
  }
   loadAllEmails(): void {
    this.isLoading = true;
    this.error = null;

    forkJoin([
      this.loadReceivedEmails(),
      this.loadSentEmails(),
    ]).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.isLoading = false)
    ).subscribe({
      error: (err) => {
        this.error = err.message || 'Erreur lors du chargement des emails';
        console.error('Erreur:', err);
        if (err.status === 401) {
          this.handleTokenExpired();
        }
      }
    });
  }

 private loadReceivedEmails(): Observable<void> {
    // 1. Récupération du token Google
    const googleToken = this.googleAuthService.getAccessToken();
    
    if (!googleToken) {
      console.warn('Aucun token Google disponible');
      return of(void 0);
    }

    if (!this.currentUserEmail && !this.setCurrentUserEmail()) {
      console.warn('Email utilisateur non disponible pour charger les emails reçus.');
      this.error = 'Impossible de récupérer les informations utilisateur pour charger les emails.';
      return of(void 0);
    }
    return this.gmailService.getInboxEmails(googleToken, 100, this.currentUserEmail).pipe(
       tap((response: any) => {
    console.log("Réponse complète:", response);
    if (response && response.success && Array.isArray(response.data)) {
          this.receivedEmails = response.data;
          console.log('Emails chargés:', this.receivedEmails.length, this.receivedEmails);
        } else {
          console.warn('Structure de réponse inattendue:', response);
          this.receivedEmails = [];
          this.error = 'Format de données incorrect pour les emails reçus.';

        }
      }),
      map(() => void 0),
      catchError(err => {
        console.error('Erreur lors du chargement des emails:', err);
        this.receivedEmails = [];
        return of(void 0);
      })
    );
 
  }

  private loadSentEmails(): Observable<void> {
    const token = this.googleAuthService.getAccessToken();
    if (!token) return of(void 0);

    return this.gmailService.getSentEmails(token, this.currentUserEmail).pipe(
      takeUntil(this.destroy$),
      tap(response => {
        console.log("emails dans sent",response)
        if (response && response.success && Array.isArray(response.data)) {
          this.sentEmails = response.data;
          console.log('Emails chargés:', this.sentEmails.length, this.sentEmails);
        } else {
          console.warn('Structure de réponse inattendue:', response);
          this.error = 'Format de données incorrect pour les emails envoyés.';

          this.sentEmails = [];
        }
      }),
      map(() => void 0),
      catchError(err => {
        console.error('Erreur chargement emails envoyés:', err);
        return of(void 0);
        
      })
    );
  }



  
extractEmailAddress(fullString: string): string {
  if (!fullString) return '';
  
  // Cherche le pattern <email@domain.com>
  const matches = fullString.match(/<([^>]+)>/);
  
  // Si trouvé, retourne l'email, sinon retourne la string complète
  return matches ? matches[1] : fullString;
}


  private handleTokenExpired(): void {
    const refreshToken = this.googleAuthService.getRefreshToken();
    
    if (refreshToken) {
      this.googleAuthService.refreshToken()
      
        .then(() => this.loadAllEmails())
        .catch(() => this.router.navigate(['/login']));
    } else {
      this.googleAuthService.initGoogleAuth(this.router.url);
    }
  }

  setActiveTab(tab: ActiveEmailTab): void {
    this.activeTab = tab;
  }

  selectEmail(email: any, tab: ActiveEmailTab): void {
  this.selectedEmailId = email.id;
  
  if (tab === 'received' && !email.isRead) {
    this.markAsRead(email.id, () => {
      this.navigateToEmailDetail(email, tab);
    });
  } else {
    this.navigateToEmailDetail(email, tab);
  }
}
private navigateToEmailDetail(email: any, tab: ActiveEmailTab): void {
  this.isFormOpen = false;
  this.selectedEmail = null;
  
  this.router.navigate(['/emails', email.id], {
    state: {
      emailData: email,
      userEmail: this.currentUserEmail,
      activeTabContext: tab
    }
  });
}
 openEmailForm(): void {
    this.selectedEmail = null; // Préparer les données pour le formulaire
    this.isFormOpen = true;
  }

  closeEmailForm(): void {
    this.isFormOpen = false;
    this.selectedEmail = null;
  }
  onEmailSent(email: any): void {
    console.log("Email sent:", email);
    this.isLoading = true;
    
    forkJoin([
      this.loadReceivedEmails(),
      this.loadSentEmails()
    ]).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: () => {
        console.log("Emails rechargés avec succès après envoi");
        // Basculer vers l'onglet "Envoyés"
        this.activeTab = 'sent';
      },
      error: (err) => {
        console.error('Erreur lors du rechargement des emails:', err);
        this.error = err.message || 'Erreur lors du rechargement des emails';
      }
    });
  
    this.closeEmailForm();
  }


 private markAsRead(emailId: string, callback?: () => void): void {
  const token = this.googleAuthService.getAccessToken();
  if (!token) return;

  this.gmailService.markAsRead(token, emailId, this.currentUserEmail)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: () => {
        const email = this.receivedEmails.find(e => e.id === emailId);
        if (email) {
          email.isRead = true;
        }
        if (callback) {
          callback();
        }
      },
      error: (err) => console.error('Erreur marquage comme lu:', err)
    });
}

  onDeleteEmail(emailId: string, tab: ActiveEmailTab): void {
    const token = this.googleAuthService.getAccessToken();
    if (!token) {
      console.warn('Aucun token Google disponible pour supprimer l\'email.');
      this.error = 'Session Google expirée. Veuillez rafraîchir ou vous reconnecter.';
      // this.handleTokenExpired(); // Optionally trigger re-auth
      return;
    }

    if (!this.currentUserEmail && !this.setCurrentUserEmail()) {
      console.warn('Email utilisateur non disponible pour la suppression.');
      this.error = 'Impossible de vérifier l\'utilisateur pour cette action.';
      return;
    }

    this.gmailService.deleteEmail(token, emailId, this.currentUserEmail)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: () => {
        if (tab === 'received') {
          this.receivedEmails = this.receivedEmails.filter(e => e.id !== emailId);
        } else if (tab === 'sent') {
          this.sentEmails = this.sentEmails.filter(e => e.id !== emailId);
        } 
      },
     error: (err) => {
        console.error('Erreur suppression:', err);
        this.error = `Erreur lors de la suppression: ${err.message || 'Veuillez réessayer.'}`;
        if (err.status === 401) {
          this.handleTokenExpired();
        }
      }
    });
  }
}