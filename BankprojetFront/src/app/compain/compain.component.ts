import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';

import { compain } from 'src/services/compain';
import { CompainService } from 'src/services/compain.service';
import Swal from 'sweetalert2';
import { AddCompainComponent} from 'src/app/add-compain/add-compain.component'
import { Router, RouterModule } from '@angular/router';

import { OAuthService } from 'angular-oauth2-oidc';
import { AuthService } from 'src/services/auth.service';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-compain',
  
  templateUrl: './compain.component.html',
  styleUrls: ['./compain.component.css']
})
export class CompainComponent implements OnInit {
  listcompain:compain[]=[];
constructor(private compaiServ:CompainService,private dialog:MatDialog,private route:Router,public authService:AuthService){}

ngOnInit(): void {
  if (this.authService.isAuthenticated()) {
    this.loadCompain();
  } else {
    console.log("User not authenticated yet!");
    // Tu peux aussi forcer une reconnexion ou attendre
  }
}
loadCompain():void{
  this.compaiServ.getCompains().subscribe(data=>{
    this.listcompain=data;
    console.log(this.listcompain)
    
  })
}

open(){
const dialogConfig = new MatDialogConfig();
  dialogConfig.disableClose = true;
  dialogConfig.autoFocus = true;
 

  dialogConfig.panelClass = 'custom-dialog-container';

  this.dialog.open(AddCompainComponent, dialogConfig);
}
confirmDelete(id: number) {
   Swal.fire({
      title: 'Êtes-vous sûr?',
      text: "Voulez-vous supprimer comptes!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Oui, supprimer!',
      cancelButtonText: 'Annuler'
    }).then((result) => {
      if (result.isConfirmed) {
        this.compaiServ.deleteCompain(id).subscribe(() => {
          // Vous pouvez également actualiser la liste des catégories après la suppression
          // this.fetchCategories();
          Swal.fire(
            'Supprimé!',
            'Votre comptes a été supprimée.',
            'success'
          )
          this.loadCompain();
          this.route.navigate(['/comptes'])
          // window.location.reload();
        });
      }
    })
}
onedit(id:number){
 {
    // ouvrir le modal [ArticleFormComponent]
    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;
    this.compaiServ.getCompain(id).subscribe
    ((r)=>{dialogConfig.data = r // envoyer les donnes vers le modal
    this.dialog.open(AddCompainComponent, dialogConfig)
    })
    }
}
}
