import { Component } from '@angular/core';
import { SidebarComponent } from '../sidebar/sidebar.component';
import {  OnInit } from '@angular/core';

import { saveAs } from 'file-saver';
import { DocumentsService } from 'src/services/documents.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { TypeDocument } from 'src/services/TypeDocument';
import Swal from 'sweetalert2';
@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [SidebarComponent,CommonModule,RouterModule,FormsModule],
  templateUrl: './documents.component.html',
  styleUrl: './documents.component.css'
})
export class DocumentsComponent implements OnInit {
  driveUrls: {[key: number]: string} = {}
  documents: any[] = [];
  filteredDocuments: any[] = [];
  selectedFile: File | null = null;
  selectedCategory: TypeDocument | '' = '';
filterCategory: TypeDocument | '' = '';
  searchTerm: string = '';
// Ajoutez cette propriété dans votre classe DocumentsComponent
TypeDocument = TypeDocument;
  uploadProgress: number = 0;
  isUploading: boolean = false;
  isLoading: boolean = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  documentForm = {
    title: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: null as number | null,
    status: 'en_attente'
  };

  constructor(private documentsService: DocumentsService) {}

  ngOnInit(): void {
    this.loadDocuments();
  }
// Ajoutez ces méthodes à votre composant
getBankingCount(): number {
  return this.documents.filter(d => d.type === TypeDocument.OPERATIONBANCAIRE).length;
}

getFactureCount(): number {
  return this.documents.filter(d => d.type === TypeDocument.FACTURE).length;
}

getFactureFournisseurCount(): number {
  return this.documents.filter(d => d.type === TypeDocument.FACTUREFOURNISSEUR).length;
}

getDevisCount(): number {
  return this.documents.filter(d => d.type === TypeDocument.DEVIS).length;
}
  // Modifiez loadDocuments()
loadDocuments(): void {
  this.isLoading = true;
  this.errorMessage = null;
  
  this.documentsService.getAllDocuments().pipe(
    finalize(() => this.isLoading = false)
  ).subscribe({
    next: (docs) => {
      this.documents = docs;
      this.filteredDocuments = [...docs];
      
      // Récupérer les URLs Google Drive pour chaque document
      docs.forEach(doc => {
        if (doc.driveFileId) {
          this.documentsService.getDriveUrl(doc.id).subscribe({
            next: (response) => {
              this.driveUrls[doc.id] = response.driveUrl;
            },
            error: (err) => console.error('Failed to get drive URL', err)
          });
        }
      });
    },
    error: (err) => {
      this.errorMessage = 'Erreur lors du chargement des documents';
      console.error(err);
    }
  });
}

  // Gestion de la sélection de fichier
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Vérification de la taille (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        this.errorMessage = 'Le fichier est trop volumineux (max 10MB)';
        return;
      }
      
      // Vérification du type de fichier
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        this.errorMessage = 'Type de fichier non supporté';
        return;
      }

      this.selectedFile = file;
      this.errorMessage = null;
      
      // Pré-remplir le titre avec le nom du fichier (sans extension)
      this.documentForm.title = file.name.replace(/\.[^/.]+$/, "");
    }
  }

  selectCategory(category: TypeDocument): void {
  this.selectedCategory = category;
  this.errorMessage = null;
}
  // documents.component.ts

uploadDocument(): void {
  if (!this.selectedFile || !this.selectedCategory) {
    this.errorMessage = 'Veuillez sélectionner un fichier et une catégorie';
    return;
  }

  this.isUploading = true;
  this.uploadProgress = 0;
  this.errorMessage = null;
  this.successMessage = null;

  this.documentsService.uploadDocument(
    this.selectedFile,
    this.selectedCategory as TypeDocument,

  ).subscribe({
    next: (event) => {
      if (event.progress) {
        this.uploadProgress = event.progress;
      }
      
      if (event.response) {
        this.successMessage = 'Document uploadé avec succès';
        
        // Mettre à jour l'URL Google Drive pour ce document
        if (event.response.id) {
          this.documentsService.getDriveUrl(event.response.id).subscribe({
            next: (driveResponse) => {
              this.driveUrls[event.response.id] = driveResponse.driveUrl;
            }
          });
        }
        
        this.loadDocuments();
        this.resetForm();
      }
    },
    error: (err) => {
      this.errorMessage = 'Erreur lors de l\'upload du document';
      console.error(err);
      this.isUploading = false;
    },
    complete: () => {
      this.isUploading = false;
    }
  });
}

 viewDocument(id: number): void {
  if (this.driveUrls[id]) {
    window.open(this.driveUrls[id], '_blank');
  } else {
    this.documentsService.viewDocument(id).subscribe({
      next: (blob) => {
        try {
          const fileURL = URL.createObjectURL(blob);
          const pdfWindow = window.open(fileURL, '_blank');
          if (!pdfWindow) {
            throw new Error('Popup blocked or window failed to open');
          }
        } catch (error) {
          this.errorMessage = 'Impossible d\'afficher le document. Essayez de le télécharger.';
          console.error('PDF viewing error:', error);
        }
      },
      error: (err) => {
        this.errorMessage = 'Erreur lors de l\'ouverture du document';
        if (err.status === 404) {
          this.errorMessage = 'Document introuvable';
        } else if (err.status === 403) {
          this.errorMessage = 'Accès non autorisé';
        }
        console.error(err);
      }
    });
  }
}

  // Télécharger un document
  downloadDocument(id: number, filename: string): void {
    this.documentsService.downloadDocument(id).subscribe({
      next: (blob) => {
        this.documentsService.saveFile(blob, filename);
      },
      error: (err) => {
        this.errorMessage = 'Erreur lors du téléchargement';
        console.error(err);
      }
    });
  }

  deleteDocument(id: number): void {
  Swal.fire({
    title: 'Êtes-vous sûr ?',
    text: 'Voulez-vous vraiment supprimer ce document ?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Oui, supprimer',
    cancelButtonText: 'Annuler',
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6'
  }).then((result) => {
    if (result.isConfirmed) {
      this.documentsService.deleteDocument(id).subscribe({
        next: () => {
          Swal.fire(
            'Supprimé !',
            'Le document a été supprimé avec succès.',
            'success'
          );
          this.loadDocuments();
        },
        error: (err) => {
          Swal.fire(
            'Erreur !',
            'Une erreur est survenue lors de la suppression.',
            'error'
          );
          console.error(err);
        }
      });
    }
  });
}

  filterDocuments(): void {
    if (!this.filterCategory && !this.searchTerm) {
        this.filteredDocuments = [...this.documents];
        return;
    }

    this.filteredDocuments = this.documents.filter(doc => {
        const matchesCategory = !this.filterCategory || doc.type === this.filterCategory;
        const matchesSearch = !this.searchTerm || 
            doc.nomfichier.toLowerCase().includes(this.searchTerm.toLowerCase()) || 
            (doc.description && doc.description.toLowerCase().includes(this.searchTerm.toLowerCase()));
        
        return matchesCategory && matchesSearch;
    });
}

  // Réinitialiser le formulaire
  resetForm(): void {
    this.selectedFile = null;
    this.selectedCategory = '';
    this.uploadProgress = 0;
    this.documentForm = {
      title: '',
      date: new Date().toISOString().split('T')[0],
      description: '',
      amount: null,
      status: 'en_attente'
    };
    this.errorMessage = null;
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }

 getCategoryIcon(category: string): string {
    const icons: {[key: string]: string} = {
        'OPERATIONBANCAIRE': 'fas fa-university text-primary',
        'FACTURE': 'fas fa-file-invoice text-success',
        'DEVIS': 'fas fa-file-signature text-info',
        'FACTUREFOURNISSEUR': 'fas fa-truck text-warning'
    };
    return icons[category] || 'fas fa-file';
}
  getStatusBadge(status: string): string {
    const badges: {[key: string]: string} = {
      'en_attente': 'badge bg-warning ms-2',
      'traite': 'badge bg-info ms-2',
      'approuve': 'badge bg-success ms-2',
      'rejete': 'badge bg-danger ms-2'
    };
    return badges[status] || 'badge bg-secondary ms-2';
  }

  getStatusText(status: string): string {
    const texts: {[key: string]: string} = {
      'en_attente': 'En attente',
      'traite': 'Traité',
      'approuve': 'Approuvé',
      'rejete': 'Rejeté'
    };
    return texts[status] || status;
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR');
  }

  // Fermer les messages d'alerte
  closeAlert(): void {
    this.errorMessage = null;
    this.successMessage = null;
  }
}