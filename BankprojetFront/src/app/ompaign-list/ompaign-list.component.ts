import { Component, OnInit } from '@angular/core';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { compain } from 'src/services/compain';
import { CompainService } from 'src/services/compain.service';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { AuthService } from 'src/services/auth.service';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { AddCompainComponent } from '../add-compain/add-compain.component';

@Component({
  selector: 'app-ompaign-list',
  standalone: true,
  imports: [SidebarComponent, CommonModule, RouterModule, FormsModule],
  templateUrl: './ompaign-list.component.html',
  styleUrls: ['./ompaign-list.component.css']
})
export class OmpaignListComponent implements OnInit {
  listcompain: compain[] = [];
  filteredCompain: compain[] = [];
   searchQuery: string = ''; 
  filterValue: 'tous' | 'CLIENT' | 'FOURNISSEUR' = 'tous';
  
  stats = {
    total: 0,
    clients: 0,
    fournisseurs: 0
  };

  constructor(
    private compaiServ: CompainService,
    private dialog: MatDialog,
    private route: Router,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.loadCompain();
    } else {
      console.log("User not authenticated yet!");
      this.route.navigate(['/login']);
    }
  }
   clearSearch() {
    this.searchQuery = ''; // Réinitialise le champ
  }
  
open(){
  const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;
   
  
    dialogConfig.panelClass = 'custom-dialog-container';
  
   const dialogRef = this.dialog.open(AddCompainComponent, dialogConfig);
   
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
  loadCompain(): void {
    this.compaiServ.getCompains().subscribe({
      next: (data) => {
        this.listcompain = data;
        this.filteredCompain = [...data];
        this.updateStats();
      },
      error: (err) => {
        console.error('Error loading compains:', err);
      }
    });
  }

 filterProfiles(): void {
  // Filtrage par type
  let filtered = this.listcompain;
  if (this.filterValue !== 'tous') {
    filtered = filtered.filter(item => item.type === this.filterValue);
  }

  // Filtrage par recherche textuelle
  if (this.searchQuery) {
    const query = this.searchQuery.toLowerCase();
    filtered = filtered.filter(item => 
      item.nom.toLowerCase().includes(query) || 
      item.reference.toLowerCase().includes(query) ||
      (item.email && item.email.toLowerCase().includes(query)) ||
      (item.telephone && item.telephone.includes(query))
    );
  }

  this.filteredCompain = filtered;
}
// Ajoutez cette méthode à votre classe
getInitial(name: string): string {
  return name?.charAt(0)?.toUpperCase() || '?';
}

getRandomColor(name: string): string {
  const colors = ['#1d4ed8',  '#93c5fd',  '#94a3b8', '#64748b','rgb(167, 110, 41)'];
  const index = name?.charCodeAt(0) % colors.length || 0;
  return colors[index];
}
  updateStats(): void {
    this.stats = {
      total: this.listcompain.length,
      clients: this.listcompain.filter(p => p.type === 'CLIENT').length,
      fournisseurs: this.listcompain.filter(p => p.type === 'FOURNISSEUR').length
    };
  }
   confirmDelete(id: number) {
    Swal.fire({
      title: 'Êtes-vous sûr?',
      text: "Vous ne pourrez pas récupérer cette compagnie!",
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
            'Votre compagnie a été supprimée.',
            'success'
          )
          this.loadCompain();
          this.route.navigate(['/ListeCompany'])
           window.location.reload();
        });
      }
    })
  }
}