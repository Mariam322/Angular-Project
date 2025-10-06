import { Component, OnInit } from '@angular/core';
import { SidebarComponent } from "../sidebar/sidebar.component";
import { Reglement } from 'src/services/Reglement';
import { TypeClientFournisseur } from 'src/services/type-client-fournisseur';
import { ReglementService } from 'src/services/reglement.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModePaiement } from 'src/services/ModePaiement';
import { AffectationReglementComponent } from '../affectation-reglement/affectation-reglement.component';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { AddreglementComponent } from '../addreglement/addreglement.component';

@Component({
  selector: 'app-reglement',
  standalone: true,
  imports: [SidebarComponent,CommonModule,FormsModule],
  templateUrl: './reglement.component.html',
  styleUrl: './reglement.component.css'
})
export class ReglementComponent implements OnInit
 {
  allReglements: Reglement[] = []; 
  displayedReglements: Reglement[] = [];
   searchQuery: string = ''; 
  selectedType: string = '';
  selectedDate: string = '';
  selectedModePaiement: string = ''; // Nouvelle propriété pour le filtre
  types = ['', ...Object.values(TypeClientFournisseur)];
  modesPaiement = ['', ...Object.values(ModePaiement)]; // Liste des modes de paiement
  isLoading: boolean = false;

  constructor(private reglementService: ReglementService,private dialog: MatDialog) {}

  ngOnInit(): void {
    this.loadAllReglements();
  }

  loadAllReglements(): void {
    this.isLoading = true;
    this.reglementService.getAllReglements().subscribe({
      next: (data) => {
        this.allReglements = data;
        this.filterReglements();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading reglements:', err);
        this.isLoading = false;
      }
    });
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.selectedType = '';
    this.selectedDate = '';
    this.selectedModePaiement = '';
    this.filterReglements(); // Applique les filtres vides
  }

  filterReglements(): void {
    let filtered = [...this.allReglements];

    
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(reglement => 
        (reglement.reference?.toLowerCase().includes(query)) ||
        (reglement.nom?.toLowerCase().includes(query)) ||
        (reglement.description?.toLowerCase().includes(query))
      );
    }

    // Filtre par type
    if (this.selectedType) {
      filtered = filtered.filter(reglement => reglement.type === this.selectedType);
    }

    // Filtre par date
    if (this.selectedDate) {
      const selectedDateObj = new Date(this.selectedDate);
      filtered = filtered.filter(reglement => {
        const reglementDate = new Date(reglement.dateReglement);
        return reglementDate.toDateString() === selectedDateObj.toDateString();
      });
    }

    // Filtre par mode de paiement
    if (this.selectedModePaiement) {
      filtered = filtered.filter(reglement => reglement.modePaiement === this.selectedModePaiement);
    }

    this.displayedReglements = filtered;
  }

formatDate(date: Date | string | undefined): string {
  if (!date) return 'DD/MM/YYYY';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'DD/MM/YYYY';
  
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit'
  });
}
  onTypeChange(): void {
    this.filterReglements();
  }

  onDateChange(): void {
    this.filterReglements();
  }

  onModePaiementChange(): void { // Nouvelle méthode pour le changement de mode
    this.filterReglements();
  }
  // Modifiez la méthode openRapprochement
openRapprochement(id: number): void {
  this.reglementService.getReglementById(id).subscribe({
    next: (reglement) => {
      const dialogConfig = new MatDialogConfig();
      dialogConfig.disableClose = true;
      dialogConfig.autoFocus = true;
      dialogConfig.width = '90%';
      dialogConfig.maxWidth = '1200px';
      dialogConfig.data = { reglement }; // Passez l'objet reglement complet
      
      const dialogRef = this.dialog.open(AffectationReglementComponent, dialogConfig);
      
      dialogRef.afterClosed().subscribe(result => {
        if (result === 'success') {
          this.loadAllReglements(); // Rafraîchir la liste après affectation
        }
      });
    },
    error: (err) => {
      console.error('Erreur lors du chargement du règlement', err);
    }
  });
}
    open():void{
       const dialogRef = this.dialog.open(AddreglementComponent, {
        disableClose: true,
        autoFocus: true,
        panelClass: 'custom-dialog-container'
      });
  
      dialogRef.afterClosed().subscribe(result => {
        if (result === 'success') this.loadAllReglements();
      });
    }
    
}