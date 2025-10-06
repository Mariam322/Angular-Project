import { Component, EventEmitter, Inject, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { Affectation } from 'src/services/Affectation';
import { AffectationServiceService } from 'src/services/affectation-service.service';
import { Depense } from 'src/services/Depense';
import { Facture } from 'src/services/Facture';
import { OperationBancaire } from 'src/services/OperationBancaire';
import { Reglement } from 'src/services/Reglement';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-affectation-reglement',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './affectation-reglement.component.html',
  styleUrls: ['./affectation-reglement.component.css']
})
export class AffectationReglementComponent {
  @Input() reglement!: Reglement;
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  activeTab: 'facture' | 'depense' | 'operation' = 'facture';
  items: any[] = [];
  selectedItems: any[] = [];
  searchText = '';
  isLoading = false;
  montantRestant: number = 0;
  errorMessage: string | null = null;
  successMessage: string | null = null;


  constructor(
    private affectationService: AffectationServiceService,
    @Inject(MAT_DIALOG_DATA) public data: { reglement: Reglement },
    private dialogRef: MatDialogRef<AffectationReglementComponent>
  ) {
    this.reglement = data.reglement;
  }
  ngOnInit(): void {
    this.montantRestant = this.reglement.montantReglemnt;
    this.loadItems();
  }

  loadItems(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.items = [];

    switch(this.activeTab) {
      case 'facture':
        this.loadAllFactures();
        break;
      case 'depense':
        this.loadAllDepenses();
        break;
      case 'operation':
        this.loadAllOperations();
        break;
    }
  }

  loadAllFactures(): void {
    this.affectationService.getAllfacture().subscribe({
      next: (factures) => {
        this.items = factures;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur:', err);
        this.errorMessage = 'Erreur lors du chargement des factures';
        this.isLoading = false;
      }
    });
  }

  loadAllDepenses(): void {
    this.affectationService.getAllDepenses().subscribe({
      next: (depenses) => {
        this.items = depenses;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur:', err);
        this.errorMessage = 'Erreur lors du chargement des dépenses';
        this.isLoading = false;
      }
    });
  }

  loadAllOperations(): void {
    this.affectationService.getAllOperations().subscribe({
      next: (operations) => {
        this.items = operations;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur:', err);
        this.errorMessage = 'Erreur lors du chargement des opérations';
        this.isLoading = false;
      }
    });
  }

  onTabChange(tab: 'facture' | 'depense' | 'operation'): void {
    this.activeTab = tab;
    this.selectedItems = [];
    this.searchText = '';
    this.loadItems();
    this.calculateRestant();
  }

   filteredItems(): any[] {
    if (!this.searchText) return this.items;
    
    const searchLower = this.searchText.toLowerCase();
    return this.items.filter(item => {
      if (this.activeTab === 'facture') {
        return (item.numeroFacture?.toLowerCase().includes(searchLower) ||
               item.nom?.toLowerCase().includes(searchLower) ||
               item.montantTtc?.toString().includes(searchLower));
      } else if (this.activeTab === 'depense') {
        return (item.numDepense?.toLowerCase().includes(searchLower) ||
               item.description?.toLowerCase().includes(searchLower) ||
               item.montantTtcDepense?.toString().includes(searchLower));
      } else {
        return (item.numCheque?.toLowerCase().includes(searchLower) ||
               item.description?.toLowerCase().includes(searchLower) ||
               item.montant?.toString().includes(searchLower));
      }
    });
  }

  // Ajoutez cette méthode pour fermer le modal avec un résultat
  closeWithResult(result?: any): void {
    this.dialogRef.close(result);
  }

  // Modifiez saveAffectations pour utiliser closeWithResult
  saveAffectations(): void {
    if (this.montantRestant < 0) {
      this.errorMessage = 'Le montant affecté ne peut pas dépasser le montant du règlement';
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;
    
    const requests = this.selectedItems.map(item => {
      if (this.activeTab === 'facture') {
        return this.affectationService.affecterAFacture(
          this.reglement.id, 
          item.id, 
          item.montantAffectation
        );
      } else if (this.activeTab === 'depense') {
        return this.affectationService.affecterADepense(
          this.reglement.id, 
          item.id, 
          item.montantAffectation
        );
      } else {
        return this.affectationService.affecterAOperation(
          this.reglement.id, 
          item.id, 
          item.montantAffectation
        );
      }
    });

    forkJoin(requests).subscribe({
      next: () => {
        this.successMessage = 'Affectations enregistrées avec succès';
        this.isLoading = false;
        setTimeout(() => this.closeWithResult('success'), 1500);
      },
      error: (err) => {
        console.error('Erreur lors des affectations', err);
        this.errorMessage = 'Une erreur est survenue lors de l\'enregistrement';
        this.isLoading = false;
      }
    });
  }


  toggleSelection(item: any): void {
    const index = this.selectedItems.findIndex(i => i.id === item.id);
    
    if (index >= 0) {
      this.selectedItems.splice(index, 1);
    } else {
      const newItem = {
        ...item,
        montantAffectation: this.getMontantMax(item)
      };
      this.selectedItems.push(newItem);
    }
    
    this.calculateRestant();
  }

  getMontantMax(item: any): number {
    switch(this.activeTab) {
      case 'facture': return item.montantTtc || 0;
      case 'depense': return item.montantTtcDepense || 0;
      case 'operation': return item.montant || 0;
      default: return 0;
    }
  }

  updateAmount(item: any): void {
    const montantMax = this.getMontantMax(item);
    
    if (item.montantAffectation > montantMax) {
      item.montantAffectation = montantMax;
    } else if (item.montantAffectation < 0) {
      item.montantAffectation = 0;
    }
    
    this.calculateRestant();
  }

  calculateRestant(): void {
    const totalAffecte = this.selectedItems.reduce((sum, item) => sum + (item.montantAffectation || 0), 0);
    this.montantRestant = this.reglement.montantReglemnt - totalAffecte;
  }

  isSelected(item: any): boolean {
    return this.selectedItems.some(selected => selected.id === item.id);
  }

  

    

  close(): void {
    this.closed.emit();
  }
  getItemIdentifier(item: any): string {
  switch(this.activeTab) {
    case 'facture': return item.numeroFacture || 'Facture sans numéro';
    case 'depense': return item.numDepense || 'Dépense sans numéro';
    case 'operation': return item.numCheque || 'Opération sans référence';
    default: return '';
  }
}

getItemDate(item: any): Date {
  switch(this.activeTab) {
    case 'facture': return item.dateFacture;
    case 'depense': return item.dateDepense;
    case 'operation': return item.dateOperation;
    default: return new Date();
  }
}

getItemAmount(item: any): number {
  switch(this.activeTab) {
    case 'facture': return item.montantTtc;
    case 'depense': return item.montantTtcDepense;
    case 'operation': return item.montant;
    default: return 0;
  }
}
}