import { Component, OnInit } from '@angular/core';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { CommonModule } from '@angular/common';
import { CompteBancaireService } from 'src/services/compte-bancaire.service';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { AuthService } from 'src/services/auth.service';
import { OperationBancaire } from 'src/services/OperationBancaire';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-operation-bancaire',
  standalone: true,
  imports: [SidebarComponent,CommonModule],
  templateUrl: './operation-bancaire.component.html',
  styleUrl: './operation-bancaire.component.css'
})
export class OperationBancaireComponent  implements OnInit {
ListeOperation: OperationBancaire[] = []; // ou un type précis si tu as un model Operation
  idCompte!: number;
  operations: any[] = []; // ou un type précis si tu as un model Operation
compte: any = {}; // Ajoutez cette propriété pour stocker les infos du compte
  nomBanque: string = ''; // Propriété pour le nom de la banque
  constructor(private route: ActivatedRoute, private compteServ: CompteBancaireService,private dialog:MatDialog,private router:Router,public authService:AuthService) {}

  ngOnInit(): void {
    // récupérer l'idCompte de la route
    this.idCompte = this.route.snapshot.params['idCompte'];
// charger les détails du compte pour obtenir le nom de la banque
    this.compteServ.getCompteById(this.idCompte).subscribe(
      (data) => {
        this.compte = data;
        this.nomBanque = data.nomBanque; // Stockez le nom de la banque
      },
      (error) => {
        console.error('Erreur lors du chargement des détails du compte:', error);
      }
    );

    // charger les opérations associées via le service
    this.compteServ.getOperationsByCompteId(this.idCompte).subscribe(data => {
      this.operations = data;
      
    });
    this.loadOperation(); // Charger les opérations au démarrage
  }
  loadOperation():void{
  this.compteServ.getOperationsByCompteId(this.idCompte).subscribe(data=>{
    this.ListeOperation=data;

    
  })
}

  /*open(){
    const dialogConfig = new MatDialogConfig();
      dialogConfig.disableClose = true;
      dialogConfig.autoFocus = true;
     
    
      dialogConfig.panelClass = 'custom-dialog-container';
    
     const dialogRef = this.dialog.open(AddOperationsComponent, dialogConfig);
      dialogRef.afterClosed().subscribe(result => {
        if (result) { // Assuming AdduserComponent returns true or the new user on successful addition
          this.loadOperation(); // Refresh the list after adding a new user
          Swal.fire('Ajouté!', 'L\'utilisateur a été ajouté.', 'success');
        }
      });
      } */
}
