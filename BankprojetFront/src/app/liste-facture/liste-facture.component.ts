import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Facture, LignePieceCommerciale, StatutFacture } from 'src/services/Facture';
import { FactureService } from '../../services/facture-service.service';
import { AddFactureComponent } from '../add-facture/add-facture.component';
import { FacturePreviewComponent } from '../facture-preview/facture-preview.component';

// Modules
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { ViewFactureComponentComponent } from '../view-facture-component/view-facture-component.component';
import Swal from 'sweetalert2';
import { TypePieceCommerciale } from '../../services/Facture';

@Component({
  selector: 'app-liste-facture',
  standalone: true,
  imports: [
    SidebarComponent,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './liste-facture.component.html',
  styleUrls: ['./liste-facture.component.css'],
})
export class ListeFactureComponent implements OnInit {
  factures: Facture[] = [];
  filteredFactures: Facture[] = [];
  searchTerm = '';
   filteredPieces: Facture[] = [];
  statusFilter = '';
  currentPage = 1;
   searchQuery: string = ''; 
  itemsPerPage = 10;
    listfacture: Facture[] = [];
    filteredfacture: Facture[] = [];
  sortColumn: keyof Facture = 'dateFacture';
  sortDirection: 'asc' | 'desc' = 'desc';
 filterValue: 'tous' | 'CLIENT' | 'FOURNISSEUR' = 'tous';
 typeFilter: TypePieceCommerciale | '' = '';
 // Dans votre composant
  TypePieceCommerciale = TypePieceCommerciale; // Pour l'accès dans le template
  constructor(
    private factureService: FactureService,
    private dialog: MatDialog,
        private snackBar: MatSnackBar,
        private route:Router
    
  ) {}

  ngOnInit(): void {
    this.loadFactures();
  }
getTypeBadgeClass(type: TypePieceCommerciale): string {
    switch(type) {
        case TypePieceCommerciale.FACTURE:
            return 'bg-primary text-white'; // Facture en bleu
        case TypePieceCommerciale.DEVIS:
            return 'bg-warning text-dark'; // Devis en jaune/orange
        default:
            return 'bg-secondary text-white'; // Par défaut
    }
}
  
  loadFactures(): void {
    this.factureService.getFactures().subscribe({
      next: (factures) => {
        this.factures = factures;
        this.applyFilter();
      },
      error: (err) => {
        this.showError('Erreur lors du chargement des factures');
      }
    });
  }
showSuccess(message: string): void {
    this.snackBar.open(message, 'Fermer', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  showError(message: string): void {
    this.snackBar.open(message, 'Fermer', {
      duration: 3000,
      panelClass: ['error-snackbar']
    });
  }
 applyFilter(): void {
  this.filteredFactures = this.factures.filter(facture => {
    // Filtre par recherche
    const matchesSearch = !this.searchTerm || 
      facture.numeroFacture.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      (facture.nom && facture.nom.toLowerCase().includes(this.searchTerm.toLowerCase()));
    
    // Filtre par statut
    const matchesStatus = !this.statusFilter || facture.statut === this.statusFilter;
    
    // Filtre par type client/fournisseur
    const matchesClientType = !this.filterValue || 
      (this.filterValue === 'tous') ||
      (this.filterValue === 'CLIENT' && facture.type === 'CLIENT') ||
      (this.filterValue === 'FOURNISSEUR' && facture.type === 'FOURNISSEUR');
    
    // Filtre par type de pièce (Facture/Devis)
    const matchesPieceType = !this.typeFilter || 
      facture.typePieceCommerciale === this.typeFilter;
    
    return matchesSearch && matchesStatus && matchesClientType && matchesPieceType;
  });

  this.sortData();
  this.currentPage = 1;
}

 

  clearFilters(): void {
    this.searchTerm = '';
    this.statusFilter = '';
    this.typeFilter = '';
    this.applyFilter();
  }


  sort(column: keyof Facture): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.sortData();
  }

  sortData(): void {
    this.filteredFactures.sort((a, b) => {
      const valA = a[this.sortColumn];
      const valB = b[this.sortColumn];

      if (valA == null) return this.sortDirection === 'asc' ? 1 : -1;
      if (valB == null) return this.sortDirection === 'asc' ? -1 : 1;

      if (typeof valA === 'number' && typeof valB === 'number') {
        return this.sortDirection === 'asc' ? valA - valB : valB - valA;
      }

      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      
      return this.sortDirection === 'asc' 
        ? strA.localeCompare(strB) 
        : strB.localeCompare(strA);
    });
  }
 clearSearch() {
    this.searchQuery = ''; // Réinitialise le champ
  }
  // Pagination
  get totalPages(): number {
    return Math.ceil(this.filteredFactures.length / this.itemsPerPage);
  }

  get pages(): number[] {
    return Array.from({length: this.totalPages}, (_, i) => i + 1);
  }

  get startItem(): number {
    return (this.currentPage - 1) * this.itemsPerPage;
  }

  get endItem(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.filteredFactures.length);
  }

  get pagedFactures(): Facture[] {
    return this.filteredFactures.slice(this.startItem, this.endItem);
  }

   getPages(): number[] {
    const pages = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  }
  

  goToPage(page: number): void {
    this.currentPage = page;
  }

  previousPage(): void {
    if (this.currentPage > 1) this.currentPage--;
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) this.currentPage++;
  }

  // Stats
  getTotalAmount(): number {
    return this.factures.reduce((sum, facture) => sum + (facture.montantTtc || 0), 0);
  }

 getPaidCount(): number {
  return this.factures.filter(f => f.statut === StatutFacture.PAYEE).length;
}

getPendingCount(): number {
  return this.factures.filter(f => f.statut === StatutFacture.EN_ATTENTE).length;
}

 getStatusLabel(status: string): string {
  switch(status) {
    case StatutFacture.PAYEE: return 'Payée';
    case StatutFacture.PARTIELLEMENT_PAYEE: return 'Partiellement payée';
    case StatutFacture.EN_ATTENTE: return 'En attente';
    case StatutFacture.NON_PAYEE: return 'Non payée';
    default: return status;
  }
 }

  // Dialog functions
  openAddDialog(): void {
    const dialogRef = this.dialog.open(AddFactureComponent, {
      disableClose: true,
      autoFocus: true,
      panelClass: 'custom-dialog-container'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'success') this.loadFactures();
    });
  }

 openEditDialog(id: number): void {
  const dialogConfig = new MatDialogConfig();
  dialogConfig.disableClose = true;
  dialogConfig.autoFocus = true;
  
  this.factureService.getFactureById(id).subscribe({
    next: (facture) => {
      dialogConfig.data = facture;
      const dialogRef = this.dialog.open(AddFactureComponent, dialogConfig);
      
      dialogRef.afterClosed().subscribe(result => {
        if (result === 'success') {
          this.loadFactures(); // Rafraîchir la liste après édition
        }
      });
    },
    error: (err) => {
      this.showError('Erreur lors du chargement de la facture');
      console.error('Erreur:', err);
    }
  });
}

  openPreviewDialog(id: number): void {
  const dialogConfig = new MatDialogConfig();
  dialogConfig.disableClose = true;
  dialogConfig.autoFocus = true;
  dialogConfig.width = '80%'; // Ajustez la taille selon vos besoins
  dialogConfig.maxHeight = '90vh';
  
  this.factureService.getFactureById(id).subscribe((facture) => {
    dialogConfig.data = { facture }; // Structurez les données comme attendu par FacturePreviewComponent
    this.dialog.open(ViewFactureComponentComponent, dialogConfig);
  });
}
  // Actions
  deleteFacture(id: number): void {

       Swal.fire({
         title: 'Êtes-vous sûr?',
         text: "Vous ne pourrez pas récupérer cette facture!",
         icon: 'warning',
         showCancelButton: true,
         confirmButtonColor: '#3085d6',
         cancelButtonColor: '#d33',
         confirmButtonText: 'Oui, supprimer!',
         cancelButtonText: 'Annuler'
       }).then((result) => {
         if (result.isConfirmed) {
           this.factureService.deleteFacture(id).subscribe(() => {
             // Vous pouvez également actualiser la liste des catégories après la suppression
             // this.fetchCategories();
             Swal.fire(
               'Supprimé!',
               'Votre catégorie a été supprimée.',
               'success'
             )
             this.loadFactures();
             this.route.navigate(['/ListeCompany'])
              window.location.reload();
           });
         }
       })
     }

  downloadPdf(id: number): void {
    this.factureService.downloadPdf(id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `facture_${id}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        this.showError('Erreur lors du téléchargement du PDF');
      }
    });
  }

  exportToCSV(): void {
    this.showSuccess('Export CSV fonctionnalité à implémenter');
  }
 deletePiece(id: number): void {
    Swal.fire({
      title: 'Êtes-vous sûr?',
      text: "Vous ne pourrez pas récupérer cette pièce commerciale!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Oui, supprimer!',
      cancelButtonText: 'Annuler'
    }).then((result) => {
      if (result.isConfirmed) {
        this.factureService.deleteFacture(id).subscribe({
          next: () => {
            Swal.fire('Supprimé!', 'La pièce commerciale a été supprimée.', 'success');
            this.loadFactures();
          },
          error: (err) => {
            this.showError('Erreur lors de la suppression');
          }
        });
      }
    });
  }
formatMontant(montant: number): string {
  return new Intl.NumberFormat('fr-TN', {
    style: 'currency',
    currency: 'TND',
    minimumFractionDigits: 3
  }).format(montant);
}
}
