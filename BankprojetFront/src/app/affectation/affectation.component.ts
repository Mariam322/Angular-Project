import { Component, OnInit } from '@angular/core';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { Affectation } from 'src/services/Affectation';
import { AffectationServiceService } from 'src/services/affectation-service.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ReglementService } from 'src/services/reglement.service';
import { Facture } from 'src/services/Facture';
import { OperationBancaire } from 'src/services/OperationBancaire';
import { Reglement } from 'src/services/Reglement';
import { Depense } from 'src/services/Depense';
import { catchError, forkJoin, Observable, of } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-affectation',
  standalone: true,
  imports: [SidebarComponent, CommonModule, RouterModule, FormsModule],
  templateUrl: './affectation.component.html',
  styleUrl: './affectation.component.css'
})
export class AffectationComponent implements OnInit {
  reglements: Reglement[] = [];
  operations: OperationBancaire[] = [];
  factures: Facture[] = [];
  depenses: Depense[] = [];
  affectations: Affectation[] = [];
  filterDate: string = '';
filterType: string = '';
  id!: any;
  recentAffectations: any[] = []; // À remplacer par votre modèle d'affectation
filteredRecentAffectations: any[] = [];
currentAffectationPage: number = 1;
totalAffectationPages: number = 1;

  // Filtres de recherche
  searchReglement: string = '';
  searchOperation: string = '';
  searchFacture: string = '';
  searchDepense: string = '';
  
  // Pagination
  currentReglementPage: number = 1;
  currentOperationPage: number = 1;
  currentFacturePage: number = 1;
  currentDepensePage: number = 1;
  itemsPerPage: number = 10;
  
  selectedReglement: Reglement | null = null;
  selectedItem: any = null;
  activeTab: 'operations' | 'factures' | 'depenses' = 'operations';
  montantAffectation: number = 0;
  isLoading: boolean = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
// Dans votre composant

dateAffectation: Date = new Date();
  constructor(
    private affectationService: AffectationServiceService,
    private reglementService: ReglementService
  ) {}

  ngOnInit(): void {
    this.loadInitialData();
    this.loadRecentAffectations();
    this.applyFilters();
  }
  // Méthode pour charger l'historique des affectations
// Dans la méthode loadRecentAffectations
loadRecentAffectations(): void {
  this.isLoading = true;
  this.errorMessage = null;
  
  this.affectationService.getAllAffectations().subscribe({
    next: (affectations) => {
      this.recentAffectations = affectations.map(aff => ({
        ...aff,
        dateAffectation: aff.dateAffectation ? new Date(aff.dateAffectation) : new Date(),
        reglementType: aff.reglement?.type || 'INCONNU',
        reglementId: aff.reglement?.id || 'N/A',
        reglementNom: aff.reglement?.nom || 'N/A',
        elementNom: this.getElementName(aff),
        montantAffectation: aff.montantAffectation || 0, // Assurez-vous que cette propriété est incluse
        typeaffect: aff.typeaffect || 'INCONNU',
        statut:aff.statut||'Confirme',
        idOperationBancaire: aff.idOperationBancaire,
        idPieceCommercial: aff.idPieceCommercial,
        idDepense: aff.idDepense,
        numeroFacture: aff.numeroFacture,
        numDepense: aff.numDepense,
        numCheque: aff.numCheque
      }));
      this.filterRecentAffectations();
      this.isLoading = false;
    },
    error: (err) => {
      console.error('Erreur chargement historique', err);
      this.errorMessage = 'Erreur lors du chargement de l\'historique';
      this.isLoading = false;
    }
  });
}
// Ajouter cette méthode pour obtenir le nom de l'élément affecté
private getElementName(affectation: Affectation): string {
  if (affectation.typeaffect === 'FACTURE' && affectation.numeroFacture) {
    return affectation.numeroFacture;
  } else if (affectation.typeaffect === 'DEPENSE' && affectation.numDepense) {
    return affectation.numDepense;
  } else if (affectation.typeaffect === 'OPERATION_BANCAIRE' && affectation.numCheque) {
    return affectation.numCheque;
  }
  return 'N/A';
}
isItemAffected(item: any): boolean {
  if (!this.selectedReglement) return false;
  
  return this.affectations.some(aff => {
    if (this.activeTab === 'operations') {
      return aff.idOperationBancaire === (item.idOperation || item.id);
    } else if (this.activeTab === 'factures') {
      return aff.idPieceCommercial === item.id;
    } else if (this.activeTab === 'depenses') {
      return aff.idDepense === item.id;
    }
    return false;
  });
}
applyFilters(): void {
  this.filteredRecentAffectations = this.recentAffectations.filter(affectation => {
    // Filtre par date
    const dateMatch = !this.filterDate || 
                     new Date(affectation.dateAffectation).toISOString().split('T')[0] === this.filterDate;
    
    // Filtre par type
    const typeMatch = !this.filterType || affectation.typeaffect === this.filterType;
    
    return dateMatch && typeMatch;
  });
  
  // Réinitialiser la pagination
  this.currentAffectationPage = 1;
  this.totalAffectationPages = Math.ceil(this.filteredRecentAffectations.length / this.itemsPerPage);
}
getRemainingAmount(item: any): number {
  if (this.activeTab === 'operations') {
    return (item.credit || item.debit || 0) - this.getAffectedAmount(item);
  } else if (this.activeTab === 'factures') {
    return (item.montantTtc || 0) - this.getAffectedAmount(item);
  } else if (this.activeTab === 'depenses') {
    return (item.montantTtcDepense || 0) - this.getAffectedAmount(item);
  }
  return 0;
}

// Méthode pour obtenir le montant déjà affecté à un élément
getAffectedAmount(item: any): number {
  if (!this.selectedReglement) return 0;
  
  const relevantAffectations = this.affectations.filter(aff => {
    if (this.activeTab === 'operations') {
      return aff.idOperationBancaire === (item.idOperation || item.id);
    } else if (this.activeTab === 'factures') {
      return aff.idPieceCommercial === item.id;
    } else if (this.activeTab === 'depenses') {
      return aff.idDepense === item.id;
    }
    return false;
  });
  
  return relevantAffectations.reduce((sum, aff) => sum + (aff.montantAffectation || 0), 0);
}
// Filtrage des affectations récentes
filterRecentAffectations(): void {
  this.filteredRecentAffectations = this.recentAffectations
    .filter(aff => {
      if (!this.filterDate) return true;
      return new Date(aff.dateAffectation).toISOString().split('T')[0] === this.filterDate;
    })
    .slice((this.currentAffectationPage - 1) * this.itemsPerPage, 
           this.currentAffectationPage * this.itemsPerPage);
}

// Changement de page pour l'historique
changeAffectationPage(page: number): void {
  this.currentAffectationPage = page;
  this.filterRecentAffectations();
}

// Rafraîchir l'historique
refreshHistory(): void {
  this.loadRecentAffectations();
}

// Pour la gestion de la barre de progression
getProgressWidth(): string {
  if (!this.selectedReglement) return '0%';
  const total = this.selectedReglement.montantReglemnt;
  const affecte = this.getTotalAffecte() + (this.montantAffectation || 0);
  return Math.min(100, (affecte / total) * 100) + '%';
}

// Pour le bouton "Max" qui remplit le montant maximum possible
setMaxAmount(): void {
  if (!this.selectedReglement || !this.selectedItem) return;
  
  const resteReglement = this.selectedReglement.montantReglemnt - this.getTotalAffecte();
  const resteElement = this.getRemainingAmount(this.selectedItem);
  
  this.montantAffectation = Math.min(resteReglement, resteElement);
}

// Pour la pagination générique
getPages(totalPages: number): number[] {
  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    pages.push(i);
  }
  return pages;
}

// Pour obtenir la page courante selon l'onglet actif
getCurrentPage(): number {
  switch(this.activeTab) {
    case 'operations': return this.currentOperationPage;
    case 'factures': return this.currentFacturePage;
    case 'depenses': return this.currentDepensePage;
    default: return 1;
  }
}

// Pour obtenir le nombre total de pages selon l'onglet actif
getTotalPages(): number {
  switch(this.activeTab) {
    case 'operations': return this.totalOperationPages;
    case 'factures': return this.totalFacturePages;
    case 'depenses': return this.totalDepensePages;
    default: return 1;
  }
}

// Pour changer de page selon l'onglet actif
changePage(page: number): void {
  switch(this.activeTab) {
    case 'operations': this.changeOperationPage(page); break;
    case 'factures': this.changeFacturePage(page); break;
    case 'depenses': this.changeDepensePage(page); break;
  }
}

// Pour effacer la recherche
clearSearch(): void {
  switch(this.activeTab) {
    case 'operations': this.searchOperation = ''; break;
    case 'factures': this.searchFacture = ''; break;
    case 'depenses': this.searchDepense = ''; break;
  }
  this.resetPagination();
}

// Pour afficher les détails d'une affectation
showAffectationDetails(affectationId: number): void {
  // Implémentez la logique pour afficher les détails
  console.log('Détails de l\'affectation:', affectationId);
  // Vous pouvez ouvrir un modal ou naviguer vers une autre vue
}

cancelAffectation(affectationId: number): void {
  Swal.fire({
    title: 'Confirmation',
    text: 'Êtes-vous sûr de vouloir supprimer cette affectation ?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Oui, supprimer',
    cancelButtonText: 'Annuler'
  }).then((result) => {
    if (result.isConfirmed) {
      this.isLoading = true;
      this.affectationService.deleteAffectation(affectationId).subscribe({
        next: () => {
          this.successMessage = 'Affectation supprimée avec succès';
          Swal.fire('Supprimé !', 'L\'affectation a été supprimée.', 'success');
          this.loadRecentAffectations();
          if (this.selectedReglement) {
            this.loadAffectations(this.selectedReglement.id);
          }
        },
        error: (err) => {
          console.error('Erreur lors de la suppression:', err);
          this.errorMessage = 'Erreur lors de la suppression de l\'affectation';
          Swal.fire('Erreur', 'Impossible de supprimer l\'affectation.', 'error');
          this.isLoading = false;
        }
      });
    }
  });
}



  loadInitialData(): void {
    this.isLoading = true;
    this.errorMessage = null;
    
    forkJoin([
      this.reglementService.getAllReglements().pipe(
        catchError(err => this.handleError(err, 'règlements'))
      ),
      this.affectationService.getAllOperations().pipe(
        catchError(err => this.handleError(err, 'opérations'))
      ),
      this.affectationService.getAllfacture().pipe(
        catchError(err => this.handleError(err, 'factures'))
      ),
      this.affectationService.getAllDepenses().pipe(
        catchError(err => this.handleError(err, 'dépenses'))
      )
    ]).subscribe({
      next: ([reglements, operations, factures, depenses]) => {
        this.reglements = Array.isArray(reglements) ? reglements : [];
        this.operations = Array.isArray(operations) ? operations : [];
        this.factures = Array.isArray(factures) ? factures : [];
        this.depenses = Array.isArray(depenses) ? depenses : [];
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = 'Erreur lors du chargement des données';
        this.isLoading = false;
      }
    });
  }
  getSearchValue(): string {
  switch(this.activeTab) {
    case 'operations': return this.searchOperation;
    case 'factures': return this.searchFacture;
    case 'depenses': return this.searchDepense;
    default: return '';
  }
}

onSearchChange(value: string): void {
  switch(this.activeTab) {
    case 'operations': 
      this.searchOperation = value;
      break;
    case 'factures': 
      this.searchFacture = value;
      break;
    case 'depenses': 
      this.searchDepense = value;
      break;
  }
  // Réinitialiser la pagination à la première page lors d'une nouvelle recherche
  this.resetPagination();
}

private resetPagination(): void {
  this.currentOperationPage = 1;
  this.currentFacturePage = 1;
  this.currentDepensePage = 1;
}

  loadAffectations(reglementId: number): void {
    this.isLoading = true;
    this.affectationService.getAffectationsByReglement(reglementId).subscribe({
      next: (affectations) => {
        this.affectations = affectations || [];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur chargement affectations', err);
        this.errorMessage = 'Erreur lors du chargement des affectations';
        this.isLoading = false;
      }
    });
  }

  private handleError(error: any, context: string): Observable<any[]> {
    console.error(`Erreur lors du chargement des ${context}:`, error);
    return of([]);
  }

  selectReglement(reglement: Reglement): void {
    if (this.isReglementAffected(reglement)) return;
    
    this.selectedReglement = reglement;
    this.montantAffectation = 0;
    this.errorMessage = null;
    this.successMessage = null;
    this.loadAffectations(reglement.id);
  }

  isReglementAffected(reglement: Reglement): boolean {
    // Vérifie si le règlement est complètement affecté
    const totalAffecte = this.affectations
      .filter(a => a.id === reglement.id)
      .reduce((sum, aff) => sum + (aff.montantAffectation || 0), 0);
    
    return totalAffecte >= reglement.montantReglemnt;
  }

  selectItem(item: any): void {
    this.selectedItem = item;
    this.errorMessage = null;
    this.successMessage = null;
    
    if (this.selectedReglement) {
      const reste = this.selectedReglement.montantReglemnt - this.getTotalAffecte();
      this.montantAffectation = Math.min(
        reste,
        this.activeTab === 'operations' ? (item.credit || item.debit || 0) :
        this.activeTab === 'factures' ? (item.montantTtc || 0) :
        (item.montantTtcDepense || 0)
      );
    }
  }

  onTabChange(tab: 'operations' | 'factures' | 'depenses'): void {
    this.activeTab = tab;
    this.selectedItem = null;
    this.montantAffectation = 0;
  }

  getTotalAffecte(): number {
    return this.affectations.reduce((sum, aff) => sum + (aff.montantAffectation || 0), 0);
  }
  formatMontant(montant: number): string {
  // Convertit en nombre entier si c'est un nombre rond (ex: 1500.00 → 1500)
  return montant % 1 === 0 ? montant.toString() : montant.toString();
}
confirmAffectation(): void {
    if (!this.selectedReglement || !this.selectedItem) {
      this.errorMessage = 'Veuillez sélectionner un règlement et un élément à affecter';
      return;
    }

    const montantRestant = this.selectedReglement.montantReglemnt - this.getTotalAffecte();
    
    if (this.montantAffectation <= 0) {
      this.errorMessage = 'Le montant doit être positif';
      return;
    }

    if (this.montantAffectation > montantRestant) {
      this.errorMessage = `Le montant ne peut pas dépasser ${montantRestant.toFixed(2)} €`;
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;
    this.successMessage = null;

    try {
      const affectationObservable = this.prepareAffectationRequest();
      if (!affectationObservable) {
        this.isLoading = false;
        return;
      }

      affectationObservable.subscribe({
        next: (newAffectation) => {
          // 1. Ajouter la nouvelle affectation à la liste
          this.affectations.push(newAffectation);
          
          // 2. Mettre à jour l'historique
          this.recentAffectations.unshift({
            ...newAffectation,
            dateAffectation: new Date(),
            reglementType: this.selectedReglement?.type || '',
            reglementId: this.selectedReglement?.id || 0,
            reglementNom: this.selectedReglement?.nom || '',
            elementNom: this.getElementNameForSelectedItem(),
            montantAffectation: this.montantAffectation
          });
          
          // 3. Afficher message de succès
          this.successMessage = `Affectation de ${this.montantAffectation}€ réussie`;
          
          // 4. Recharger les données
          this.loadAffectations(this.selectedReglement!.id);
          this.loadRecentAffectations();
          
          // 5. Réinitialiser
          this.resetSelection();
          this.isLoading = false;
        },
        error: (err) => this.handleAffectationError(err)
      });
    } catch (error) {
      this.handleAffectationError(error);
    }
  }

  private getElementNameForSelectedItem(): string {
    if (!this.selectedItem) return '';
    
    if (this.activeTab === 'operations') {
      return this.selectedItem.numCheque || `OP-${this.selectedItem.idOperation || this.selectedItem.id}`;
    } else if (this.activeTab === 'factures') {
      return this.selectedItem.numeroFacture;
    } else if (this.activeTab === 'depenses') {
      return this.selectedItem.numDepense;
    }
    return '';
  }

  private prepareAffectationRequest(): Observable<any> | null {
    switch(this.activeTab) {
      case 'factures':
        return this.affectationService.affecterAFacture(
          this.selectedReglement!.id,
          this.selectedItem!.id,
          this.montantAffectation
        );
      case 'depenses':
        return this.affectationService.affecterADepense(
          this.selectedReglement!.id,
          this.selectedItem!.id,
          this.montantAffectation
        );
      case 'operations':
        const operationId = this.selectedItem!.idOperation || this.selectedItem!.id;
        if (!operationId) {
          this.errorMessage = 'ID d\'opération invalide';
          return null;
        }
        return this.affectationService.affecterAOperation(
          this.selectedReglement!.id,
          operationId,
          this.montantAffectation
        );
      default:
        this.errorMessage = 'Type d\'affectation non supporté';
        return null;
    }
  }

private handleAffectationSuccess(): void {
  this.successMessage = 'Affectation réussie';
  this.loadAffectations(this.selectedReglement!.id);
  this.loadRecentAffectations(); // Ajoutez cette ligne
  this.resetSelection();
  this.isLoading = false;
}

  private handleAffectationError(error: any): void {
    console.error('Erreur lors de l\'affectation:', error);
    this.errorMessage = error.error?.message || error.message || 'Une erreur est survenue lors de l\'affectation';
    this.isLoading = false;
    
    if (error.status === 401) {
      this.loadInitialData();
    }
  }

  deleteAffectation(affectationId: number| undefined): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette affectation ?')) {
      this.isLoading = true;
      this.affectationService.deleteAffectation(affectationId!).subscribe({
        next: () => {
          this.successMessage = 'Affectation supprimée';
          if (this.selectedReglement) {
            this.loadAffectations(this.selectedReglement.id);
          }
        },
        error: (err) => {
          console.error('Erreur lors de la suppression:', err);
          this.errorMessage = 'Erreur lors de la suppression';
          this.isLoading = false;
        }
      });
    }
  }

  resetSelection(): void {
    this.selectedItem = null;
    this.montantAffectation = 0;
    this.isLoading = false;
  }

  // Méthodes de filtrage
  get filteredReglements(): Reglement[] {
    return this.reglements
      .filter(r => 
        r.nom.toLowerCase().includes(this.searchReglement.toLowerCase()) ||
        r.id.toString().includes(this.searchReglement) ||
        r.type.toLowerCase().includes(this.searchReglement.toLowerCase())
      )
      .slice((this.currentReglementPage - 1) * this.itemsPerPage, this.currentReglementPage * this.itemsPerPage);
  }

  get filteredOperations(): OperationBancaire[] {
    return this.operations
      .filter(o => 
        o.numCheque?.toLowerCase().includes(this.searchOperation.toLowerCase()) ||
        o.idOperation.toString().includes(this.searchOperation) ||
        o.dateOperation.toString().includes(this.searchOperation)
      )
      .slice((this.currentOperationPage - 1) * this.itemsPerPage, this.currentOperationPage * this.itemsPerPage);
  }

  get filteredFactures(): Facture[] {
    return this.factures
      .filter(f => 
        f.numeroFacture.toLowerCase().includes(this.searchFacture.toLowerCase()) ||
        f.nom?.toLowerCase().includes(this.searchFacture.toLowerCase()) ||
        f.reference?.toLowerCase().includes(this.searchFacture.toLowerCase())
      )
      .slice((this.currentFacturePage - 1) * this.itemsPerPage, this.currentFacturePage * this.itemsPerPage);
  }

  get filteredDepenses(): Depense[] {
    return this.depenses
      .filter(d => 
        d.numDepense.toLowerCase().includes(this.searchDepense.toLowerCase()) ||
        d.dateDepense.toString().includes(this.searchDepense) ||
        d.montantTtcDepense.toString().includes(this.searchDepense)
      )
      .slice((this.currentDepensePage - 1) * this.itemsPerPage, this.currentDepensePage * this.itemsPerPage);
  }

  // Méthodes de pagination
  changeReglementPage(page: number): void {
    this.currentReglementPage = page;
  }

  changeOperationPage(page: number): void {
    this.currentOperationPage = page;
  }

  changeFacturePage(page: number): void {
    this.currentFacturePage = page;
  }

  changeDepensePage(page: number): void {
    this.currentDepensePage = page;
  }

  get totalReglementPages(): number {
    return Math.ceil(this.reglements.length / this.itemsPerPage);
  }

  get totalOperationPages(): number {
    return Math.ceil(this.operations.length / this.itemsPerPage);
  }

  get totalFacturePages(): number {
    return Math.ceil(this.factures.length / this.itemsPerPage);
  }

  get totalDepensePages(): number {
    return Math.ceil(this.depenses.length / this.itemsPerPage);
  }
}