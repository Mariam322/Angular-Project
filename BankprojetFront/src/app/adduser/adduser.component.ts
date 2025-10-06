import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, Validators,ReactiveFormsModule, FormControl  } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { UserService } from 'src/services/user.service';
import Swal from 'sweetalert2';


@Component({
  selector: 'app-adduser',
  standalone: true,
  imports: [ReactiveFormsModule ,FormsModule,CommonModule
  ],
  templateUrl: './adduser.component.html',
  styleUrl: './adduser.component.css'
})
export class AdduserComponent implements OnInit {
  formSubmitted = false;
  listeUsers: any[] = [];
  isEditMode: boolean = false;

  userForm!: FormGroup;
  roles: string[] = [];
  isLoading = false;
  constructor(   private router: Router,
    
      private dialogRef: MatDialogRef<AdduserComponent>,
    private userService: UserService,
  private fb: FormBuilder) {
    this.userForm = new FormGroup({
      username: new FormControl('', Validators.required),
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [Validators.required, Validators.minLength(8)]),
      role: new FormControl('', Validators.required)
      
    });
    }

  ngOnInit(): void {
    this.loadRoles();
    this.initForm();
    this.loadUsers();
  }
loadRoles(): void {
    this.userService.getRoles().subscribe({
      next: (roles) => {
        console.log('Roles:', roles);
        this.roles = roles.map((r: any) => r.name);
      },
      error: (err) => console.error('Failed to load roles', err)
    });
  }
  initForm(): void {
    // Initialize your form here
  }

  loadUsers(): void {
    // Load users from the service
  }

  close() {
   this.dialogRef.close();
  }


onSubmit() {
    console.log("Données du formulaire:", this.userForm.value);

    if (this.userForm.valid) {
        this.isLoading = true;
        const formValue = this.userForm.value;

        const userData = {
            username: formValue.username,
            email: formValue.email,
            enabled: true,
            credentials: [{
                type: 'password',
                value: formValue.password,
                temporary: false
            }]
        };

        console.log('Envoi des données à Keycloak:', userData);
        console.log('Le rôle choisi:', formValue.role);
        
        this.userService.createUserWithRole(
            userData, 
            formValue.role
        ).subscribe({
            next: () => {
                console.log('Utilisateur créé avec succès avec rôle et groupe');
                this.isLoading = false;
                
                // 🔥 SweetAlert pour le succès
                Swal.fire({
                    title: 'Succès !',
                    text: 'Utilisateur ajouté avec succès',
                    icon: 'success',
                    confirmButtonText: 'OK'
                }).then(() => {
                    this.router.navigate(['/user']);
                    this.loadUsers();
                     window.location.reload(); // Rechargement de la page
                     // Redirection après confirmation
                });
            },
            error: (err) => {
                console.error('Erreur lors de la création de l\'utilisateur:', err);
                this.isLoading = false;
                
                // SweetAlert pour l'erreur
                Swal.fire({
                    title: 'Erreur !',
                    text: err.error?.message || err.message || 'Échec de la création',
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
            }
        });
    } else {
        console.error('Formulaire invalide');
        
        // SweetAlert si le formulaire est invalide
        Swal.fire({
            title: 'Formulaire invalide',
            text: 'Veuillez remplir correctement tous les champs requis',
            icon: 'warning',
            confirmButtonText: 'OK'
        });
    }
}
}
