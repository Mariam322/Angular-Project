import { Component, OnInit } from '@angular/core';
import { SidebarComponent } from '../sidebar/sidebar.component';

import { Router } from '@angular/router';
import { UserService } from 'src/services/user.service';
import { AuthService } from 'src/services/auth.service';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { AdduserComponent } from '../adduser/adduser.component';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { catchError, finalize, from, map, mergeMap, of, timeout, toArray } from 'rxjs';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-utilisateur',
  standalone: true,
  imports: [SidebarComponent,CommonModule,FormsModule],
  templateUrl: './utilisateur.component.html',
  styleUrl: './utilisateur.component.css'
})
export class UtilisateurComponent  implements OnInit {
users: any[] = [];
isLoadingUsers = false;
editingUserId: string | null = null;
isDeletingUser=false;
editedUserData: any = {};
isSavingUser = false;
 searchQuery: string = ''; 
  constructor(private userserv:UserService, 
    private router: Router, 
    private authService: AuthService,
    private dialog:MatDialog,
  private modalService: NgbModal) {}
   ngOnInit(): void {
    this.loadUsers();
  }
   clearSearch() {
    this.searchQuery = ''; // Réinitialise le champ
  }
   open(){
  const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;
   
  
    dialogConfig.panelClass = 'custom-dialog-container';
  
   const dialogRef = this.dialog.open(AdduserComponent, dialogConfig);
    dialogRef.afterClosed().subscribe(result => {
      if (result) { // Assuming AdduserComponent returns true or the new user on successful addition
        this.loadUsers(); // Refresh the list after adding a new user
        Swal.fire('Ajouté!', 'L\'utilisateur a été ajouté.', 'success');
      }
    });
    } 
  
 
  
  loadUsers(): void {
    this.isLoadingUsers = true; // Set loading state
    const ROLE_HIERARCHY = ['SUPER-ADMIN', 'ADMIN', 'USER','COMPTABLE','USER_ACHAT','USER_VENTE']; // Define role hierarchy

    this.userserv.getUsers().pipe(
      // Use finalize to ensure isLoadingUsers is set to false regardless of success/error
      finalize(() => this.isLoadingUsers = false),
      // Handle potential error from getMembersByGroupName itself
      catchError(err => {
        console.error('Failed to get group members', err);
        this.users = []; // Clear users on error
        // Optional: Show error message
        // this.toastr.error(`Erreur chargement membres: ${err.message || 'Erreur inconnue'}`);
        return of([]); // Return empty array to prevent breaking the stream
      }),
      // If members are found, proceed to get roles
      mergeMap(users => {
        if (!users || users.length === 0) {
          return of([]); // No users, return empty array observable
        }
        return from(users); // Process users one by one
      }),
      mergeMap(user => {
        // Fetch roles for each user
        return this.userserv.getUserRoles(user.id).pipe(
          map(roles => {
            // Find the highest role based on the defined hierarchy
            const userRoles = roles.map(r => r.name.toUpperCase()); // Ensure case-insensitivity
            const highestRole = ROLE_HIERARCHY.find(role =>
              userRoles.includes(role)
            ) ;// Default to 'USER' or 'Aucun rôle' if preferred

            return {
              ...user,
              role: highestRole // Add the determined role to the user object
            };
          }),
          // Handle errors fetching roles for a specific user
          catchError(() => of({
            ...user,
            role: 'Erreur Rôle' // Indicate role fetching error
          })),
          timeout(8000) // Add a slightly longer timeout for role fetching
        );
      }, 5), // Concurrency limit for fetching roles
      toArray() // Collect all processed users back into an array
    ).subscribe({
      next: (usersWithRoles) => {
        this.users = usersWithRoles;
        console.log("Users avec rôles:", this.users);
      },
      error: (err) => {
        // This error would likely be from the final toArray or timeout
        console.error('Failed to load users with roles', err);
        // Optional: Show error message
        // this.toastr.error(`Erreur finale chargement utilisateurs: ${err.message || 'Erreur inconnue'}`);
        this.users = []; // Clear users on final error
      }
      // No need for complete block if using finalize for loading state
    });
  }
editUser(user: any) {
    // If another user is already being edited, cancel that first (optional)
    if (this.editingUserId && this.editingUserId !== user.id) {
        this.cancelEdit();
    }
    this.editingUserId = user.id;
    // Copy necessary properties for editing, including the ID
    this.editedUserData = {
        id: user.id, // Keep the id
        username: user.username,
        email: user.email,
        enabled: user.enabled // Include enabled status
        // We don't need firstName/lastName here if using partial update
    };
  }
cancelEdit() {
    this.editingUserId = null;
    this.editedUserData = {};
    // No need to reset isSavingUser here, it's handled by saveUser or component init/load
  }
   saveUser() {
    if (!this.editingUserId || !this.editedUserData) {
      console.error('Cannot save, no user is being edited or data is missing.');
      return;
    }

    this.isSavingUser = true;
    const userIdToSave = this.editingUserId; // Capture ID before potential async reset
    const dataToSave = { ...this.editedUserData }; // Create a copy of the data to send
    const payload = {
        username: dataToSave.username,
        email: dataToSave.email,
        enabled: dataToSave.enabled
    };

    this.userserv.updateUser(
        userIdToSave,
        payload,
        { partialUpdate: true } // Use partial update
      )
      .pipe(
        finalize(() => this.isSavingUser = false) // Ensure loading state is turned off
      )
      .subscribe({
        next: (/* updatedUserResponse */) => { // Keycloak PUT /users/{id} often returns 204 No Content
          console.log('User updated successfully');
          // Find the index of the user in the local array
          const index = this.users.findIndex(u => u.id === userIdToSave);
          if (index !== -1) {
            this.users[index] = {
                ...this.users[index], // Keep existing properties (like role)
                ...payload            // Apply the changes from the payload
            };
          }
          this.cancelEdit(); // Exit editing mode
          
        },
        error: (err) => {
          console.error('Failed to update user', err);
      
        }
      });
  }
   
 confirmDelete(user: any) {
    if (!user || !user.id) {
        console.error('User object or user.id is missing');
        return;
    }

    Swal.fire({
        title: 'Êtes-vous sûr?',
        text: "Voulez-vous supprimer l'utilisateur!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Oui, supprimer!',
        cancelButtonText: 'Annuler'
    }).then((result) => {
        if (result.isConfirmed) {
            // Passer user.id au lieu de user
            this.userserv.deleteUser(user.id).subscribe({
                next: () => {
                    Swal.fire(
                        'Supprimé!',
                        'Utilisateur a été supprimé.',
                        'success'
                    );
                    this.loadUsers();
                    // Pas besoin de reload et navigation en même temps
                    this.router.navigate(['/user']);
                },
                error: (err) => {
                    console.error('Erreur lors de la suppression:', err);
                    Swal.fire(
                        'Erreur!',
                        'La suppression a échoué.',
                        'error'
                    );
                }
            });
        }
    });
}
  
}

