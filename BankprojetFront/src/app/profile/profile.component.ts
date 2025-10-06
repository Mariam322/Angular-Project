import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';

import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { switchMap } from 'rxjs';
import { SidebarComponent } from '../sidebar/sidebar.component';

import { AuthService } from 'src/services/auth.service';
import { UserService } from 'src/services/user.service';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [SidebarComponent,CommonModule,FormsModule,MatIconModule,ReactiveFormsModule,MatSnackBarModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  currentUser!: any | null; 
  isLoading = false;
  isSaving = false;
  constructor(
    private fb: FormBuilder, 
    private userService: UserService, 
    private authService: AuthService,
        private snackBar: MatSnackBar
    
  ) {}

  ngOnInit(): void {
    this.initializeForms();
    this.loadUserProfile();
    // Initialiser le formulaire de profil
    

    
  }
initializeForms(): void {
    this.profileForm = this.fb.group({
      username: ['', [Validators.required]],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]]
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmNewPassword: ['', Validators.required]
    }, { validator: this.passwordsMatchValidator });
  }
  loadUserProfile(): void {
    this.isLoading = true;
        const userId = localStorage.getItem('user_id');
        if (!userId) {
          this.snackBar.open('Impossible de récupérer l\'identifiant utilisateur.', 'Fermer', { duration: 3000 });
          this.isLoading = false;
          return;
        }
        this.userService.getUserById(userId).subscribe({
      next: (user) => {
        this.currentUser = user;
        this.profileForm.patchValue({
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email
        });
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur:', err);
        this.snackBar.open('Erreur lors du chargement du profil', 'Fermer', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }
onProfileSubmit(): void {
    if (this.profileForm.valid && this.currentUser) {
      this.isSaving = true;
      const userId = this.currentUser.id;
      const updatedData = {
        username: this.profileForm.value.username,
        firstName: this.profileForm.value.firstName,
        lastName: this.profileForm.value.lastName,
        email: this.profileForm.value.email
      };

      this.userService.updateUser(userId, updatedData).subscribe({
        next: () => {
          this.snackBar.open('Profil mis à jour avec succès', 'Fermer', { duration: 3000 });
          this.isSaving = false;
          if (this.profileForm.value.username) {
            console.log("le nouveau username",this.profileForm.value.username )
          localStorage.setItem('username', this.profileForm.value.username);
        }
          this.loadUserProfile();
        },
        error: (err) => {
          console.error('Erreur lors de la mise à jour:', err);
          this.snackBar.open('Erreur lors de la mise à jour du profil', 'Fermer', { duration: 3000 });
          this.isSaving = false;
        }
      });
    }
  }

  onPasswordSubmit(): void {
    if (this.passwordForm.valid) {
      this.isSaving = true;
      const userId = this.currentUser.id;
      const newPassword = this.passwordForm.value.newPassword;

      this.userService.resetUserPassword(userId, newPassword, false).subscribe({
        next: () => {
          this.snackBar.open('Mot de passe mis à jour avec succès', 'Fermer', { duration: 3000 });
          this.isSaving = false;
          this.passwordForm.reset();
        },
        error: (err) => {
          console.error('Erreur lors du changement de mot de passe:', err);
          this.snackBar.open('Erreur lors du changement de mot de passe', 'Fermer', { duration: 3000 });
          this.isSaving = false;
        }
      });
    }
  }

  passwordsMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword')?.value;
    const confirmNewPassword = form.get('confirmNewPassword')?.value;
    return newPassword === confirmNewPassword ? null : { mismatch: true };
  }
}