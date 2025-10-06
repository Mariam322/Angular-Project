import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { FactureService } from 'src/services/facture-service.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Facture, TypePieceCommerciale, StatutFacture } from 'src/services/Facture';
import { MatSnackBar } from '@angular/material/snack-bar';
import { compain } from 'src/services/compain';
import { TypeClientFournisseur } from 'src/services/type-client-fournisseur';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-add-facture',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    FormsModule,
  ],
  templateUrl: './add-facture.component.html',
  styleUrls: ['./add-facture.component.css']
})
export class AddFactureComponent implements OnInit {
  docForm!: FormGroup;
  selectedType!: TypePieceCommerciale;
  campaigns: compain[] = [];
  filteredCampaigns: compain[] = [];
  isSaving = false;
  formSubmitted = false;

  // Enum access for template
  StatutFactureEnum = StatutFacture;
  TypePieceCommercialeEnum = TypePieceCommerciale;
  TypeClientFournisseurEnum = TypeClientFournisseur;

  constructor(
    private fb: FormBuilder,
    private factureService: FactureService,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<AddFactureComponent>, @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    this.loadCampaigns();
  }

  onTypeSelected(): void {
    if (this.selectedType) {
      this.initForm();
      this.filterCampaigns();
    }
  }

  initForm(): void {
    const isFacture = this.selectedType === TypePieceCommerciale.FACTURE;
    const today = new Date();
    const dueDate = new Date();
    dueDate.setDate(today.getDate() + 30);

    this.docForm = this.fb.group({
      campaignId: ['', Validators.required],
      clientName: [{value:'', disabled: true}, Validators.required],
      clientEmail: [{value:'', disabled: true}, [Validators.required, Validators.email]],
      clientAddress: [{value:'', disabled: true}, Validators.required],
      clientPhone: [{value: '', disabled: true},],
      clientType: [{value: TypeClientFournisseur.CLIENT, disabled: true}, Validators.required,],
      documentDate: [today.toISOString().substring(0, 10), Validators.required],
      items: this.fb.array([this.createItem()]),
      tva: [20, [Validators.required, Validators.min(0), Validators.max(100)]],
      discount: [0, [Validators.min(0)]],
      notes: [''],
      status: [isFacture ? StatutFacture.EN_ATTENTE : StatutFacture.NON_PAYEE, Validators.required]
    });

    // Ajouter un premier item par défaut
    this.addItem();

    if (isFacture) {
      this.docForm.addControl('dueDate', 
        this.fb.control(dueDate.toISOString().substring(0, 10), Validators.required));
    } else {
      this.docForm.addControl('validityDays', 
        this.fb.control(30, [Validators.required, Validators.min(1)]));
    }
  }

  createItem(): FormGroup {
    return this.fb.group({
      description: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      unitPrice: [0, [Validators.required, Validators.min(0)]],
      total: [{value: 0, disabled: true}]
    });
  }

  get items(): FormArray {
    return this.docForm.get('items') as FormArray;
  }

  addItem(): void {
    this.items.push(this.createItem());
    this.calculateTotal();
  }

  removeItem(index: number): void {
    if (this.items.length > 1) {
      this.items.removeAt(index);
      this.calculateTotal();
    }
  }

  loadCampaigns(): void {
    this.factureService.getAllCampaigns().subscribe({
      next: (campaigns) => {
        this.campaigns = campaigns;
        this.filterCampaigns();
      },
      error: (err) => this.showError('Erreur de chargement des campagnes')
    });
  }

  filterCampaigns(): void {
    this.filteredCampaigns = this.campaigns.filter(c => 
      this.selectedType === TypePieceCommerciale.FACTURE 
        ? c.type === TypeClientFournisseur.CLIENT 
        : true
    );
  }

  onCampaignSelect(event: any): void {
    const campaignId = event.target.value;
    const campaign = this.campaigns.find(c => c.id == campaignId);
    
    if (campaign) {
      this.docForm.patchValue({
        clientName: campaign.nom,
        clientEmail: campaign.email,
        clientAddress: `${campaign.address}, ${campaign.ville}, ${campaign.pays}`,
        clientPhone: campaign.telephone,
        clientType: campaign.type
      });
    }
  }

  calculateLineTotal(index: number): void {
    const item = this.items.at(index);
    const quantity = item.get('quantity')?.value || 0;
    const unitPrice = item.get('unitPrice')?.value || 0;
    const total = quantity * unitPrice;
    
    item.get('total')?.setValue(total.toFixed(2));
    this.calculateTotal();
  }

  calculateTotal(): void {
    const items = this.items.controls;
    items.forEach((item, index) => {
      const quantity = item.get('quantity')?.value || 0;
      const unitPrice = item.get('unitPrice')?.value || 0;
      const total = quantity * unitPrice;
      item.get('total')?.setValue(total.toFixed(2), {emitEvent: false});
    });
  }

  calculateMontantHT(): number {
    const itemsTotal = this.items.controls.reduce((sum, item) => {
      const total = parseFloat(item.get('total')?.value);
      return sum + (isNaN(total) ? 0 : total);
    }, 0);
    
    const discount = this.docForm.get('discount')?.value || 0;
    return itemsTotal - discount;
  }

  calculateTVA(): number {
    const montantHT = this.calculateMontantHT();
    const tva = this.docForm.get('tva')?.value || 0;
    return montantHT * (tva / 100);
  }

  calculateMontantTTC(): number {
    return this.calculateMontantHT() + this.calculateTVA();
  }

  onSubmit(): void {
    this.formSubmitted = true;
    
    if (this.docForm.invalid) {
      this.docForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    const formValue = this.docForm.getRawValue();
    
    const document = new Facture(
  0, // id
  this.generateDocumentNumber(),
  new Date(formValue.documentDate),
  formValue.tva,
  formValue.status,
  this.selectedType,
 formValue.items.map((item: any) => ({ // Ajout du type explicite
      description: item.description,
      quantite: item.quantity,
      prixUnitaire: item.unitPrice,
      total: item.total
  })),
  this.selectedType === TypePieceCommerciale.FACTURE 
    ? new Date(formValue.dueDate) 
    : new Date(formValue.documentDate), // datePaiement
  formValue.discount,
  formValue.campaignId,
  undefined, // pdfPath
  // Champs optionnels de la campagne
  undefined, // reference
  formValue.clientName,
  formValue.clientAddress,
  formValue.clientEmail,
  formValue.clientPhone,
  undefined, // pays
  undefined, // ville
  formValue.clientType
);

// Calcul des montants
document.montantHt = this.calculateMontantHT();
document.montantTtc = this.calculateMontantTTC();

    const serviceCall = this.factureService.createFacture(document);

    serviceCall.subscribe({
      next: (createdDoc) => {
        this.handleSuccess(createdDoc);
        // Affichage de la notification SweetAlert
        Swal.fire({
          title: 'Succès!',
          text: 'La facture a été ajoutée avec succès',
          icon: 'success',
          confirmButtonText: 'OK'
         }).then(() => {
      window.location.reload(); // Recharge la page après clic sur OK
    });
  },
      error: (err) => {
        this.handleError(err);
        // Optionnel: afficher une alerte d'erreur
        Swal.fire({
          title: 'Erreur!',
          text: 'Une erreur est survenue lors de l\'ajout du document',
          icon: 'error',
          confirmButtonText: 'OK'
        });
      }
    });
  }

  private generateDocumentNumber(): string {
    const now = new Date();
    const prefix = this.selectedType === TypePieceCommerciale.FACTURE ? 'FAC' : 'DEV';
    return `${prefix}-${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
  }

  private handleSuccess(createdDoc: Facture): void {
    const message = this.selectedType === TypePieceCommerciale.FACTURE 
      ? `Facture ${createdDoc.numeroFacture} créée avec succès` 
      : `Devis ${createdDoc.numeroFacture} créé avec succès`;
    
    this.showSuccess(message);
    this.dialogRef.close(createdDoc);
  }

  private handleError(error: any): void {
    console.error('Erreur:', error);
    const message = this.selectedType === TypePieceCommerciale.FACTURE
      ? 'Erreur lors de la création de la facture'
      : 'Erreur lors de la création du devis';
    
    this.showError(`${message}: ${error.message}`);
    this.isSaving = false;
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Fermer', { 
      duration: 3000,
      panelClass: ['success-snackbar'] 
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Fermer', { 
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  close(): void {
    this.dialogRef.close();
  }

  getStatusOptions(): string[] {
    if (this.selectedType === TypePieceCommerciale.FACTURE) {
      return [
        StatutFacture.EN_ATTENTE,
        StatutFacture.NON_PAYEE,
        StatutFacture.PARTIELLEMENT_PAYEE,
        StatutFacture.PAYEE
      ];
    } else {
      return [StatutFacture.NON_PAYEE];
    }
  }

  getTypeClientOptions(): string[] {
    return Object.values(TypeClientFournisseur);
  }
}