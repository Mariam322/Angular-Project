import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Depense } from 'src/services/Depense';
import { DepenseService } from '../../services/depense.service';
import { AddDepenseComponent } from '../add-depense/add-depense.component';

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
import { ViewDepenseComponent } from '../view-depense/view-depense.component';
import Swal from 'sweetalert2';
@Component({
  selector: 'app-liste-depense',
  standalone: true,
  imports:  [
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
  templateUrl: './liste-depense.component.html',
  styleUrl: './liste-depense.component.css'
})
export class ListeDepenseComponent  implements OnInit {
  depenses: Depense[] = [];
  statusFilter: string = '';
  filteredDepenses: Depense[] = [];
  searchTerm = '';
  currentPage = 1;
  searchQuery: string = ''; 
  itemsPerPage = 10;
  listDepense: Depense[] = [];
  filteredDepense: Depense[] = [];
  sortColumn: keyof Depense = 'dateDepense';
  sortDirection: 'asc' | 'desc' = 'desc';
  filterValue: 'tous' | 'FRAIS' | 'ACHAT' = 'tous';
  dateFrom: string = '';
  dateTo: string = '';

  constructor(
    private depenseService: DepenseService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private route: Router
  ) {}

  ngOnInit(): void {
    this.loadDepenses();
  }

  loadDepenses(): void {
    this.depenseService.getAllDepenses().subscribe({
      next: (depenses) => {
        this.depenses = depenses;
        this.applyFilter();
      },
      error: (err) => {
        this.showError('Erreur lors du chargement des dépenses');
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
// Méthodes pour les statistiques
getPaidCount(): number {
    return this.depenses.filter(d => d.datePaiementDepense).length;
}

getPendingCount(): number {
    return this.depenses.filter(d => !d.datePaiementDepense).length;
}

getStatusLabel(depense: Depense): string {
    return depense.datePaiementDepense ? 'Payée' : 'En attente';
}

  applyFilter(): void {
    this.filteredDepenses = this.depenses.filter(depense => {
      // 1. Filtre de recherche texte
      const searchTermLower = this.searchTerm.toLowerCase();
      const matchesSearch = this.searchTerm === '' || 
                          (depense.numDepense?.toLowerCase().includes(searchTermLower) ||
                           depense.montantTtcDepense?.toString().includes(this.searchTerm) ||
                           (depense.idCompaign?.toString() === this.searchTerm));
      
      // 2. Filtre par statut (payé/en attente)
     
      
      // 3. Filtre par période
      let matchesDate = true;
      if (this.dateFrom && this.dateTo) {
        const depenseDate = new Date(depense.dateDepense);
        const fromDate = new Date(this.dateFrom);
        const toDate = new Date(this.dateTo);
        toDate.setDate(toDate.getDate() + 1); // Pour inclure le jour entier
        
        matchesDate = depenseDate >= fromDate && depenseDate < toDate;
      }
      
      return matchesSearch && matchesDate;
    });

    this.sortData();
    this.currentPage = 1;
}
  sort(column: keyof Depense): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.sortData();
  }

  sortData(): void {
    this.filteredDepenses.sort((a, b) => {
      const valA = a[this.sortColumn];
      const valB = b[this.sortColumn];

      if (valA == null) return this.sortDirection === 'asc' ? 1 : -1;
      if (valB == null) return this.sortDirection === 'asc' ? -1 : 1;

      if (typeof valA === 'number' && typeof valB === 'number') {
        return this.sortDirection === 'asc' ? valA - valB : valB - valA;
      }

      if (valA instanceof Date && valB instanceof Date) {
        return this.sortDirection === 'asc' 
          ? valA.getTime() - valB.getTime()
          : valB.getTime() - valA.getTime();
      }

      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      
      return this.sortDirection === 'asc' 
        ? strA.localeCompare(strB) 
        : strB.localeCompare(strA);
    });
  }

  clearSearch() {
    this.searchQuery = '';
    this.searchTerm = '';
    this.applyFilter();
  }

  // Pagination
  get totalPages(): number {
    return Math.ceil(this.filteredDepenses.length / this.itemsPerPage);
  }

  get pages(): number[] {
    return Array.from({length: this.totalPages}, (_, i) => i + 1);
  }

  get startItem(): number {
    return (this.currentPage - 1) * this.itemsPerPage;
  }

  get endItem(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.filteredDepenses.length);
  }

  get pagedDepenses(): Depense[] {
    return this.filteredDepenses.slice(this.startItem, this.endItem);
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

  // Dialog functions
  openAddDialog(): void {
    const dialogRef = this.dialog.open(AddDepenseComponent, {
      disableClose: true,
      autoFocus: true,
      panelClass: 'custom-dialog-container'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'success') this.loadDepenses();
    });
  }

  openEditDialog(id: number): void {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;
    this.depenseService.getDepenseById(id).subscribe(
      (r) => {
        dialogConfig.data = r;
        this.dialog.open(AddDepenseComponent, dialogConfig)
      }
    );
  }

  // Actions
  deleteDepense(id: number): void {
    Swal.fire({
      title: 'Êtes-vous sûr?',
      text: "Vous ne pourrez pas récupérer cette dépense!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Oui, supprimer!',
      cancelButtonText: 'Annuler'
    }).then((result) => {
      if (result.isConfirmed) {
        this.depenseService.deleteDepense(id).subscribe(() => {
          Swal.fire(
            'Supprimé!',
            'Votre dépense a été supprimée.',
            'success'
          )
          this.loadDepenses();
        });
      }
    });
  }

  exportToCSV(): void {
    this.showSuccess('Export CSV fonctionnalité à implémenter');
  }
}