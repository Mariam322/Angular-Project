import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from 'src/services/auth.service';
import { GmailService } from 'src/services/gmailService';
import { GoogleAuthService } from 'src/services/googleAuthSerivce';

@Component({
  selector: 'app-email-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './email-form.component.html',
  styleUrl: './email-form.component.css'
})
export class EmailFormComponent implements OnInit, OnChanges {
  @Input() draftEmail: any;
  @Output() closeForm = new EventEmitter<void>();
  @Output() emailSent = new EventEmitter<any>();
  @Output() draftSaved = new EventEmitter<any>();

  emailForm: FormGroup;
  currentUserEmail: string = '';
  isDraft: boolean = false;
  isEditMode: boolean = false;
attachments: File[] = [];
  constructor(
    private fb: FormBuilder,
    private gmailService: GmailService,
    private googleAuthService: GoogleAuthService,
    private authService: AuthService
  ) {
    this.emailForm = this.fb.group({
      to: ['', [Validators.required, Validators.email]],
      subject: ['', Validators.required],
      content: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    const userProfile = this.authService.getDecodedToken();
    this.currentUserEmail = userProfile?.email || '';
    this.initializeForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['draftEmail'] && changes['draftEmail'].currentValue) {
      this.initializeForm();
    } else if (changes['draftEmail'] && !changes['draftEmail'].currentValue) {
      this.resetForm();
    }
  }

  initializeForm(): void {
    this.resetForm();
    if (this.draftEmail && this.draftEmail.id) {
     this.isEditMode = true; // We are editing something
      this.isDraft = true;    // If draftEmail is provided, we are editing a draft
        this.emailForm.patchValue({
        to: this.extractEmailAddress(this.draftEmail.headers?.to || ''),
        subject: this.draftEmail.headers?.subject,
       content: this.draftEmail.text || this.draftEmail.body?.text || (typeof this.draftEmail.body === 'string' ? this.draftEmail.body : null) || this.draftEmail.snippet || ''

      });
    }
  }

  resetForm(): void {
    this.isEditMode = false;
    this.isDraft = false;
    this.emailForm.reset();
  }

  extractEmailAddress(fullString: string): string {
    if (!fullString) return '';
    const matches = fullString.match(/<([^>]+)>/);
    return matches ? matches[1] : fullString;
  }

  onClose(): void {
    this.closeForm.emit();
  }
onFileSelected(event: any): void {
    if (event.target.files && event.target.files.length > 0) {
      this.attachments = [...this.attachments, ...Array.from(event.target.files as FileList)];

    }
  }

  removeAttachment(file: File): void {
    this.attachments = this.attachments.filter(f => f !== file);
  }
  onSend(): void {
   if (this.emailForm.valid) {
      const googleToken = this.googleAuthService.getAccessToken();

if (!googleToken) {
        console.error('No Google access token available');
        alert('Aucun token d\'accès Google disponible. Veuillez vous reconnecter à Google.');
        // Optionally, trigger Google re-authentication
        // this.googleAuthService.initGoogleAuth(this.router.url); // Assuming you have Router injected
        return;
      }
      console.log("currecnt email",this.currentUserEmail);
      console.log('to', this.emailForm.value.to);
      console.log('subject', this.emailForm.value.subject);
      console.log('text', this.emailForm.value.content);
      const formData = new FormData();
      formData.append('accessToken', googleToken);
      formData.append('from', this.currentUserEmail);
      formData.append('to', this.emailForm.value.to);
      formData.append('subject', this.emailForm.value.subject);
      formData.append('text', this.emailForm.value.content);
      
      /* for (const file of this.attachments) {
        formData.append('files', file, file.name); // 'files' should match the field name expected by your backend (e.g., multer)
      } */

      this.gmailService.sendEmail(googleToken,this.currentUserEmail, this.emailForm.value.to, this.emailForm.value.subject, this.emailForm.value.content, this.attachments).subscribe({
        next: (response) => {
          console.log('Email sent successfully', response);
          this.emailSent.emit({
          emailData: response,
          shouldReload: true // Indicateur pour déclencher le rechargement
        });
          this.onClose();
        },
        error: (error) => {
          console.error('Error sending email', error);
          alert(`Erreur lors de l'envoi: ${error.message || 'Une erreur inconnue est survenue.'}`);
        }
      });
    }
  }


  onSaveDraft(): void {
  if (this.emailForm.valid) {
    const draftData = {
      from: this.currentUserEmail, // Ajout de l'expéditeur
      to: this.emailForm.value.to,
      subject: this.emailForm.value.subject,
      text: this.emailForm.value.content,
      html: `<p>${this.emailForm.value.content.replace(/\n/g, '<br>')}</p>`
    };

    const token = this.googleAuthService.getAccessToken();
    if (token) {
      this.gmailService.createDraft(token, draftData,this.currentUserEmail)
        .subscribe({
          next: (response) => {
            console.log('Draft saved successfully', response);
            this.draftSaved.emit(response);
            this.onClose();
          },
          error: (error) => {
            console.error('Error saving draft', error);
            // Afficher plus de détails d'erreur
            if (error.error) {
              console.error('Server error details:', error.error);
            }
            alert(`Erreur lors de la sauvegarde du brouillon: ${error.message}`);
          }
        });
    } else {
      console.error('No access token available');
      alert('Token d\'accès non disponible. Veuillez vous reconnecter.');
    }
  }
}
}