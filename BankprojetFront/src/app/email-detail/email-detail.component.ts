import { CommonModule, DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, Subject, takeUntil } from 'rxjs';
import { AuthService } from 'src/services/auth.service';
import { GmailService } from 'src/services/gmailService';
import { GoogleAuthService } from 'src/services/googleAuthSerivce';
import { Location } from '@angular/common';

@Component({
  selector: 'app-email-detail',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    CommonModule
  ],
  providers: [Location], // Add this line
  templateUrl: './email-detail.component.html',
  styleUrl: './email-detail.component.css'
})
export class EmailDetailComponent implements OnInit, OnDestroy, OnChanges {
  @Input() emailDataInput: { emailData: any, userEmail: string, activeTabContext: 'received' | 'sent' | 'draft' } | null = null;
  @Output() closeDetailView = new EventEmitter<void>();
  @Output() emailAction = new EventEmitter<{ action: 'delete', emailId: string, tabContext: ActiveEmailTab | null }>();

  email: any | null = null;
  emailHtmlBody: SafeHtml | null = null;
  isLoading = false;
  error: string | null = null;
  
  userEmail: string = '';
  activeTabContext: ActiveEmailTab | null = null;
  emailId: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private sanitizer: DomSanitizer,
    private gmailService: GmailService,
    private googleAuthService: GoogleAuthService,
    private authService: AuthService // Injecté pour l'email utilisateur
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['emailDataInput'] && changes['emailDataInput'].currentValue) {
      this.isLoading = true;
      const input = changes['emailDataInput'].currentValue;
      this.email = input.emailData;
      this.userEmail = input.userEmail;
      this.activeTabContext = input.activeTabContext;
      this.emailId = this.email?.id;
      
      if (this.emailId) {
        this.processEmailContent();
        this.error = null;
      } else {
        this.error = "Données d'email d'entrée invalides.";
        this.email = null; // Assurez-vous que l'email est nullifié
      }
      this.isLoading = false;
    }
  }

  ngOnInit(): void {
    // Si les données ne sont pas fournies par @Input, essayez de les charger depuis la route
    if (!this.emailDataInput) {
      this.isLoading = true;
      const navigation = this.router.getCurrentNavigation();
      const state = navigation?.extras.state as { 
        emailData: any, 
        userEmail: string, 
        activeTabContext: ActiveEmailTab 
      };

      this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
        const routeEmailId = params.get('id');
        if (routeEmailId) {
            this.emailId = routeEmailId;
        }
      });

      if (state && state.emailData) {
        this.email = state.emailData;
        this.userEmail = state.userEmail;
        this.activeTabContext = state.activeTabContext;
        // this.emailId est déjà défini par les params de la route ou implicitement par state.emailData.id
        if (!this.emailId && this.email) this.emailId = this.email.id;

        this.processEmailContent();
        this.isLoading = false;
      } else if (this.emailId) {
        // Tentative de récupération de l'email utilisateur si non disponible
        if (!this.userEmail) {
            const decodedToken = this.authService.getDecodedToken();
            this.userEmail = decodedToken?.email || '';
        }
        if(this.userEmail){
            this.fetchEmailDetails(this.emailId);
        } else {
            this.error = "Impossible de déterminer l'utilisateur actuel pour charger l'email.";
            this.isLoading = false;
        }
      } else {
        this.error = "Impossible de charger les détails de l'email. ID ou données manquantes.";
        this.isLoading = false;
      }
    } else if (this.emailDataInput && !this.email) {
        // Cas où ngOnChanges a défini emailDataInput, mais this.email n'est pas encore initialisé
        this.email = this.emailDataInput.emailData;
        this.userEmail = this.emailDataInput.userEmail;
        this.activeTabContext = this.emailDataInput.activeTabContext;
        this.emailId = this.email?.id;
        if (this.emailId) {
            this.processEmailContent();
        }
        this.isLoading = false;
    }
  }
  
  private fetchEmailDetails(emailId: string): void {
    const googleToken = this.googleAuthService.getAccessToken();

    if (!googleToken) {
      this.error = "Session Google expirée ou invalide.";
      this.isLoading = false;
      this.googleAuthService.initGoogleAuth(this.router.url);
      return;
    }
    if (!this.userEmail) {
        this.error = "Information utilisateur manquante pour charger l'email.";
        this.isLoading = false;
        return;
    }

    this.gmailService.getEmail(googleToken, emailId, this.userEmail, true)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (response) => {
          if (response && response.success && response.data) {
            this.email = response.data;
            this.processEmailContent();
          } else {
            this.error = response.message || "Format de données incorrect pour l'email.";
            this.email = null;
          }
        },
        error: (err) => {
          this.error = err.message || "Erreur lors du chargement de l'email.";
          if (err.status === 401) {
            this.googleAuthService.refreshToken()
                .then(() => this.fetchEmailDetails(emailId))
                .catch(() => this.googleAuthService.logout());
          }
        }
      });
  }

  private processEmailContent(): void {
    if (this.email && this.email.body && this.email.body.html) {
      this.emailHtmlBody = this.sanitizer.bypassSecurityTrustHtml(this.email.body.html);
    } else if (this.email && this.email.body && this.email.body.text) {
      const plainTextAsHtml = this.email.body.text.replace(/\n/g, '<br>');
      this.emailHtmlBody = this.sanitizer.bypassSecurityTrustHtml(plainTextAsHtml);
    } else if (this.email && this.email.snippet) {
        this.emailHtmlBody = this.sanitizer.bypassSecurityTrustHtml(this.email.snippet.replace(/\n/g, '<br>'));
    } else {
      this.emailHtmlBody = this.sanitizer.bypassSecurityTrustHtml('<p><i>Contenu de l\'email non disponible.</i></p>');
    }
  }

  goBack(): void {
  if (this.emailDataInput) {
    this.closeDetailView.emit();
  } else {
    if (this.activeTabContext) {
      this.router.navigate(['/emails'], { queryParams: { tab: this.activeTabContext } });
    } else {
      this.router.navigate(['/emails']);
    }
  }
}

  getSender(): string {
    if (!this.email || !this.email.headers) return 'N/A';
    return this.email.headers.from || 'N/A';
  }

  getRecipients(): string {
    if (!this.email || !this.email.headers) return 'N/A';
    const toHeader = this.email.headers.to;
    if (Array.isArray(toHeader)) return toHeader.join(', ');
    return toHeader || 'N/A';
  }
  
  getCc(): string {
    if (!this.email || !this.email.headers) return '';
    const ccHeader = this.email.headers.cc;
    if (Array.isArray(ccHeader)) return ccHeader.join(', ');
    return ccHeader || '';
  }

  onDelete(): void {
    if (!this.emailId || !this.userEmail) {
      this.error = "Impossible de supprimer l'email: informations manquantes.";
      return;
    }
    const googleToken = this.googleAuthService.getAccessToken();
    if (!googleToken) {
      this.error = "Session Google expirée.";
      return;
    }

    this.isLoading = true;
    this.gmailService.deleteEmail(googleToken, this.emailId, this.userEmail)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: () => {
          if (this.emailDataInput) {
            this.emailAction.emit({ action: 'delete', emailId: this.emailId!, tabContext: this.activeTabContext });
          } else {
            this.router.navigate(['/emails'], { 
              queryParams: { 
                tab: this.activeTabContext, 
                emailDeleted: this.emailId 
              } 
            });
          }
        },
        error: (err) => {
          this.error = `Erreur lors de la suppression: ${err.message || 'Veuillez réessayer.'}`;
          if (err.status === 401) {
             this.googleAuthService.refreshToken()
                .then(() => this.onDelete()) // Réessayer après refresh
                .catch(() => this.googleAuthService.logout());
          }
        }
      });
  }

  onReply(): void {
    // Logique pour répondre
    console.log('Répondre à:', this.emailId);
    // Exemple: this.router.navigate(['/compose'], { state: { mode: 'reply', originalEmail: this.email }});
  }

  onForward(): void {
    // Logique pour transférer
    console.log('Transférer:', this.emailId);
    // Exemple: this.router.navigate(['/compose'], { state: { mode: 'forward', originalEmail: this.email }});
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

type ActiveEmailTab = 'received' | 'sent' | 'draft';
