import { Component } from '@angular/core';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { CompteBancaireService } from 'src/services/compte-bancaire.service';
import { compte } from 'src/services/compte';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from 'src/services/auth.service';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import { AddCompteComponent } from '../add-compte/add-compte.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-compte-list',
  standalone: true,
  imports: [SidebarComponent,CommonModule,RouterModule,FormsModule],
  templateUrl: './compte-list.component.html',
  styleUrl: './compte-list.component.css'
})
export class CompteListComponent {
ListeCompte:compte[]=[];
 searchQuery: string = ''; 
constructor(private compteServ:CompteBancaireService,private dialog:MatDialog,private route:Router,public authService:AuthService){}

ngOnInit(): void {
  if (this.authService.isAuthenticated()) {
    this.loadCompte();
  } else {
    console.log("User not authenticated yet!");
    // Tu peux aussi forcer une reconnexion ou attendre
  }
}
  clearSearch() {
    this.searchQuery = ''; // Réinitialise le champ
  }
loadCompte():void{
  this.compteServ.getComptes().subscribe(data=>{
    this.ListeCompte=data;
    console.log(this.ListeCompte)
    
  })
}
 open(){
  const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;
   
  
    dialogConfig.panelClass = 'custom-dialog-container';
  
   const dialogRef = this.dialog.open(AddCompteComponent, dialogConfig);
    dialogRef.afterClosed().subscribe(result => {
      if (result) { // Assuming AdduserComponent returns true or the new user on successful addition
        this.loadCompte(); // Refresh the list after adding a new user
        Swal.fire('Ajouté!', 'L\'utilisateur a été ajouté.', 'success');
      }
    });
    } 
    onedit(id:number){
  {
    // ouvrir le modal [ArticleFormComponent]
    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;
    this.compteServ.getCompteById(id).subscribe
    ((r)=>{dialogConfig.data = r // envoyer les donnes vers le modal
    this.dialog.open(AddCompteComponent, dialogConfig)
    })
    }
}

confirmDelete(id: number) {
  Swal.fire({
    title: 'Êtes-vous sûr?',
    text: "Voulez-vous vraiment supprimer ce compte?",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Oui, supprimer!',
    cancelButtonText: 'Annuler'
  }).then((result) => {
    if (result.isConfirmed) {
      this.compteServ.deleteCompte(id).subscribe({
        next: () => {
          // Si la suppression est réussie (statut 200)
          Swal.fire(
            'Supprimé!',
            'Le client a été supprimé avec succès.',
            'success'
          );
          this.loadCompte(); // Actualiser la liste des clients
          this.route.navigate(['/client']);
        },
        error: (err) => {
          // Si le serveur renvoie un statut 409, cela signifie que le client a des comptes associés
          if (err.status === 409) {
            Swal.fire(
              'Erreur!',
              'Impossible de supprimer le client car il possède des comptes associés.',
              'error'
            );
          } else {
            // Si une autre erreur se produit, afficher un message générique
            Swal.fire(
              'Erreur!',
              'Une erreur s\'est produite lors de la suppression du client.',
              'error'
            );
          }
        }
      });
    }
  });
}
}
