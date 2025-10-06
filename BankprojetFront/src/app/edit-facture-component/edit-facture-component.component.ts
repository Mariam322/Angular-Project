import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Facture, LignePieceCommerciale } from 'src/services/Facture';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { FactureService } from '../../services/facture-service.service';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-edit-facture-component',
  standalone: true,
  imports: [  CommonModule,RouterModule,FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatSnackBarModule],
  templateUrl: './edit-facture-component.component.html',
  styleUrl: './edit-facture-component.component.css'
})
export class EditFactureComponentComponent implements OnInit {
  factureForm: FormGroup;
  lignes: LignePieceCommerciale[] = [];
  types = ['FACTURE', 'DEVIS'];
  statuts = ['PAYE', 'IMPAYE', 'PARTIEL'];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { facture: Facture },
    private fb: FormBuilder,
    private factureService: FactureService,
    private dialogRef: MatDialogRef<EditFactureComponentComponent>,
    private snackBar: MatSnackBar
  ) {
    this.factureForm = this.fb.group({
      numeroFacture: ['', Validators.required],
      dateFacture: ['', Validators.required],
      datePaiement: [''],
      montantHt: [0, [Validators.required, Validators.min(0)]],
      tva: [20, [Validators.required, Validators.min(0)]],
      montantTtc: [0, [Validators.required, Validators.min(0)]],
      remise: [0, [Validators.min(0), Validators.max(100)]],
      statut: ['IMPAYE', Validators.required],
      type: ['FACTURE', Validators.required],
      idCompaign: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.factureForm.patchValue(this.data.facture);
    this.lignes = [...this.data.facture.lignes];
    this.calculateTotals();
  }

  addLigne(): void {
    this.lignes.push({
      description: '',
      quantite: 1,
      prixUnitaire: 0,
      total: 0
    });
  }

  removeLigne(index: number): void {
    this.lignes.splice(index, 1);
    this.calculateTotals();
  }

  updateLigne(index: number, field: string, value: any): void {
    const ligne = this.lignes[index];
    (ligne as any)[field] = field === 'quantite' || field === 'prixUnitaire' ? +value : value;
    ligne.total = ligne.quantite * ligne.prixUnitaire;
    this.calculateTotals();
  }

  calculateTotals(): void {
    const totalHt = this.lignes.reduce((sum, ligne) => sum + (ligne.total || 0), 0);
    const remise = this.factureForm.get('remise')?.value || 0;
    const montantHt = totalHt * (1 - remise / 100);
    const tva = this.factureForm.get('tva')?.value || 0;
    const montantTtc = montantHt * (1 + tva / 100);

    this.factureForm.patchValue({
      montantHt: montantHt,
      montantTtc: montantTtc
    }, { emitEvent: false });
  }

  onSubmit(): void {
    if (this.factureForm.valid && this.lignes.length > 0) {
      const facture: Facture = {
        ...this.data.facture,
        ...this.factureForm.value,
        lignes: this.lignes
      };

      this.factureService.updateFacture(facture.id, facture).subscribe({
        next: () => {
          this.snackBar.open('Facture mise à jour avec succès', 'Fermer', { duration: 3000 });
          this.dialogRef.close(true);
        },
        error: (err) => {
          console.error('Erreur mise à jour facture:', err);
          this.snackBar.open('Échec de la mise à jour', 'Fermer', { duration: 3000 });
        }
      });
    } else {
      this.snackBar.open('Veuillez remplir tous les champs et ajouter au moins une ligne', 'Fermer', { duration: 3000 });
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}