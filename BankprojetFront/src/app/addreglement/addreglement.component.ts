import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ModePaiement } from 'src/services/ModePaiement';
import { ReglementService } from 'src/services/reglement.service';
import { compain } from 'src/services/compain';

@Component({
  selector: 'app-addreglement',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './addreglement.component.html',
  styleUrl: './addreglement.component.css'
})
export class AddreglementComponent implements OnInit {
  reglementForm!: FormGroup;
  formSubmitted = false;
  modePaiementOptions: ModePaiement[] = Object.values(ModePaiement);
  isLoading = false;
  isEditMode: boolean = false;
  campaigns: compain[] = [];
  filteredCampaigns: compain[] = [];

  constructor(
    private reglementService: ReglementService,
    private router: Router,
    private dialogRef: MatDialogRef<AddreglementComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    this.loadCampaigns();
    this.initForm();
  }

  loadCampaigns(): void {
    this.reglementService.getAllCampaigns().subscribe({
      next: (campaigns) => {
        this.campaigns = campaigns;
        this.filteredCampaigns = [...this.campaigns];
      },
      error: (err) => console.error('Erreur de chargement des campagnes', err)
    });
  }

  onCampaignSelect(event: any): void {
    const campaignId = event.target.value;
    const campaign = this.campaigns.find(c => c.id == campaignId);
    
    if (campaign) {
      this.reglementForm.patchValue({
        nom: campaign.nom,
        email: campaign.email,
        address: `${campaign.address}, ${campaign.ville}, ${campaign.pays}`,
        telephone: campaign.telephone,
        type: campaign.type,
        pays: campaign.pays,
        ville: campaign.ville
      });
    }
  }
getTypeLabel(type: string): string {
  switch(type) {
    case 'CLIENT': return 'Client';
    case 'FOURNISSEUR': return 'Fournisseur';
    default: return type;
  }
}
  initForm(): void {
    this.reglementForm = new FormGroup({
      id: new FormControl(this.data?.id || ''),
      reference: new FormControl(this.data?.reference || '', [Validators.required]),
      montantReglemnt: new FormControl(this.data?.montantReglemnt || '', [Validators.required, Validators.min(0)]),
      dateReglement: new FormControl(this.data?.dateReglement || '', [Validators.required]),
      modePaiement: new FormControl(this.data?.modePaiement || '', [Validators.required]),
      description: new FormControl(this.data?.description || ''),
      idCompaign: new FormControl(this.data?.idCompaign || '', [Validators.required]),
      nom: new FormControl(this.data?.nom || ''),
      address: new FormControl(this.data?.address || ''),
      email: new FormControl(this.data?.email || ''),
      telephone: new FormControl(this.data?.telephone || ''),
      pays: new FormControl(this.data?.pays || ''),
      ville: new FormControl(this.data?.ville || ''),
      type: new FormControl(this.data?.type || '')
    });
  }

  close() {
    this.dialogRef.close();
  }

  onSubmit() {
    this.formSubmitted = true;
    if (this.reglementForm.invalid) {
      return;
    }
  
    const formValue = this.reglementForm.value;
      console.log('Données à envoyer:', formValue);
    
    if (formValue.id) {
      // Mise à jour si l'ID est présent
      this.reglementService.updateReglement(formValue.id, formValue).subscribe(
        () => {
          this.isEditMode = true;
          this.dialogRef.close(formValue);
          this.router.navigate(['/listereglements']);
          window.location.reload();
        },
        (error) => {
          console.error('Erreur lors de la mise à jour du règlement :', error);
        }
      );
    } else {
      // Ajout d'un nouveau règlement
      this.reglementService.createReglement(formValue).subscribe(
        () => {
          this.dialogRef.close(formValue);

          this.router.navigate(['/listereglements']);
          window.location.reload();
        },
        (error) => {
          console.error('Erreur lors de l\'ajout du règlement :', error);
        }
      );
    }
  }
}