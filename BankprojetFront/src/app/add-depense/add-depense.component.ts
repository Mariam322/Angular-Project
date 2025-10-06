import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { DepenseService } from 'src/services/depense.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Depense } from 'src/services/Depense';
import { MatSnackBar } from '@angular/material/snack-bar';
import { compain } from 'src/services/compain';
import { TypeClientFournisseur } from 'src/services/type-client-fournisseur';

@Component({
  selector: 'app-add-depense',
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
  templateUrl: './add-depense.component.html',
  styleUrls: ['./add-depense.component.css']
})
export class AddDepenseComponent implements OnInit {
  depenseForm!: FormGroup;
  campaigns: compain[] = [];
  filteredCampaigns: compain[] = [];
  isSaving = false;
  formSubmitted = false;

  // Enum access for template
  TypeClientFournisseurEnum = TypeClientFournisseur;

  constructor(
    private fb: FormBuilder,
    private depenseService: DepenseService,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<AddDepenseComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Depense
  ) {}

  ngOnInit(): void {
    console.log('Data received in dialog:', this.data); // Debug log
    this.loadCampaigns();
    this.initForm();
  }

  initForm(): void {
    const today = new Date();
    const paymentDate = new Date();
    paymentDate.setDate(today.getDate() + 30);

    this.depenseForm = this.fb.group({
      campaignId: [this.data?.idCompaign || '', Validators.required],
      fournisseurName: [this.data?.nom || '', Validators.required],
      fournisseurEmail: [this.data?.email || '', [Validators.required, Validators.email]],
      fournisseurAddress: [this.data?.address || '', Validators.required],
      fournisseurPhone: [this.data?.telephone || ''],
      fournisseurType: [this.data?.type || TypeClientFournisseur.FOURNISSEUR],
      dateDepense: [this.data?.dateDepense ? this.formatDate(this.data.dateDepense) : today.toISOString().substring(0, 10), Validators.required],
      datePaiementDepense: [this.data?.datePaiementDepense ? this.formatDate(this.data.datePaiementDepense) : paymentDate.toISOString().substring(0, 10), Validators.required],
      dateReceptionDepense: [this.data?.dateReceptionDepense ? this.formatDate(this.data.dateReceptionDepense) : today.toISOString().substring(0, 10), Validators.required],
      tvaDepense: [this.data?.tvaDepense || 20, [Validators.required, Validators.min(0), Validators.max(100)]],
     
      lignes: this.fb.array([])
    });

    // Charger les lignes existantes si en mode édition
    if (this.data?.id) {
      this.loadExistingLignes();
    } else {
      this.addLigne(); // Ajouter un premier item par défaut seulement en création
    }
  }

  private formatDate(date: any): string {
    if (date instanceof Date) {
      return date.toISOString().substring(0, 10);
    } else if (typeof date === 'string') {
      return date.split('T')[0];
    }
    return new Date(date).toISOString().substring(0, 10);
  }

  private loadExistingLignes(): void {
    if (this.data?.lignes && this.data.lignes.length > 0) {
      this.data.lignes.forEach(ligne => {
        const ligneGroup = this.fb.group({
          description: ['', Validators.required],
          quantite: [ligne.quantite, [Validators.required, Validators.min(1)]],
          prix: [ligne.prix, [Validators.required, Validators.min(0)]],
          total: [{value: ligne.total, disabled: true}]
        });
        this.lignes.push(ligneGroup);
      });
    }
  }

  createLigne(): FormGroup {
    return this.fb.group({
      description: ['', Validators.required],
      quantite: [1, [Validators.required, Validators.min(1)]],
      prix: [0, [Validators.required, Validators.min(0)]],
      total: [{value: 0, disabled: true}]
    });
  }

  get lignes(): FormArray {
    return this.depenseForm.get('lignes') as FormArray;
  }

  addLigne(): void {
    this.lignes.push(this.createLigne());
    this.calculateTotal();
  }

  removeLigne(index: number): void {
    if (this.lignes.length > 1) {
      this.lignes.removeAt(index);
      this.calculateTotal();
    }
  }

  loadCampaigns(): void {
    this.depenseService.getAllCampaigns().subscribe({
      next: (campaigns) => {
        this.campaigns = campaigns;
        this.filterCampaigns();
        
        // Si en mode édition et une campagne est sélectionnée, charger les infos fournisseur
        if (this.data?.idCompaign) {
          const campaign = this.campaigns.find(c => c.id == this.data.idCompaign);
          if (campaign) {
            this.depenseForm.patchValue({
              fournisseurName: campaign.nom,
              fournisseurEmail: campaign.email,
              fournisseurAddress: campaign.address,
              fournisseurPhone: campaign.telephone,
              fournisseurType: campaign.type
            });
          }
        }
      },
      error: (err) => this.showError('Erreur de chargement des campagnes')
    });
  }

  filterCampaigns(): void {
    this.filteredCampaigns = this.campaigns.filter(c => 
      c.type === TypeClientFournisseur.FOURNISSEUR
    );
  }

  onCampaignSelect(event: any): void {
    const campaignId = event.target.value;
    const campaign = this.campaigns.find(c => c.id == campaignId);
    
    if (campaign) {
      this.depenseForm.patchValue({
        fournisseurName: campaign.nom,
        fournisseurEmail: campaign.email,
        fournisseurAddress: campaign.address,
        fournisseurPhone: campaign.telephone,
        fournisseurType: campaign.type
      });
    }
  }

  calculateLineTotal(index: number): void {
    const ligne = this.lignes.at(index);
    const quantite = ligne.get('quantite')?.value || 0;
    const prix = ligne.get('prix')?.value || 0;
    const total = quantite * prix;
    
    ligne.get('total')?.setValue(total.toFixed(2));
    this.calculateTotal();
  }

  calculateTotal(): void {
    const lignes = this.lignes.controls;
    lignes.forEach((ligne, index) => {
      const quantite = ligne.get('quantite')?.value || 0;
      const prix = ligne.get('prix')?.value || 0;
      const total = quantite * prix;
      ligne.get('total')?.setValue(total.toFixed(2), {emitEvent: false});
    });
  }

  calculateMontantHT(): number {
    return this.lignes.controls.reduce((sum, ligne) => {
      const total = parseFloat(ligne.get('total')?.value);
      return sum + (isNaN(total) ? 0 : total);
    }, 0);
  }

  calculateTVA(): number {
    const montantHT = this.calculateMontantHT();
    const tva = this.depenseForm.get('tvaDepense')?.value || 0;
    return montantHT * (tva / 100);
  }

  calculateMontantTTC(): number {
    return this.calculateMontantHT() + this.calculateTVA();
  }

  onSubmit(): void {
    this.formSubmitted = true;
    
    if (this.depenseForm.invalid) {
      this.depenseForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    const formValue = this.depenseForm.getRawValue();
    
    const depense = new Depense(
      this.data?.id || 0,
      this.data?.numDepense || this.generateDepenseNumber(),
      new Date(formValue.dateDepense),
      new Date(formValue.datePaiementDepense),
      new Date(formValue.dateReceptionDepense),
      this.calculateMontantHT(),
      formValue.tvaDepense,
      this.calculateMontantTTC(),
      this.calculateMontantTTC(),
      formValue.lignes.map((ligne: any) => ({
        description: ligne.description,
        quantite: ligne.quantite,
        prix: ligne.prix,
        total: ligne.total
      })),
      formValue.fournisseurType,
      formValue.campaignId,
      formValue.fournisseurName,
      formValue.fournisseurAddress,
      formValue.fournisseurEmail,
      formValue.fournisseurPhone,
      undefined, // pays
      undefined  // ville
    );

    const serviceCall = this.data?.id 
      ? this.depenseService.updateDepense(this.data.id, depense)
      : this.depenseService.createDepense(depense);

    serviceCall.subscribe({
      next: (result) => this.handleSuccess(result),
      error: (err) => this.handleError(err)
    });
  }

  private generateDepenseNumber(): string {
    const now = new Date();
    return `DEP-${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
  }

  private handleSuccess(createdDepense: Depense): void {
    const message = this.data?.id 
      ? `Dépense ${createdDepense.numDepense} mise à jour avec succès`
      : `Dépense ${createdDepense.numDepense} créée avec succès`;
    
    this.showSuccess(message);
    this.dialogRef.close(createdDepense);
  }

  private handleError(error: any): void {
    console.error('Erreur:', error);
    const message = this.data?.id
      ? 'Erreur lors de la mise à jour de la dépense'
      : 'Erreur lors de la création de la dépense';
    
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
}