import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { compain } from 'src/services/compain';
import { CompainService } from 'src/services/compain.service';
import { TypeClientFournisseur } from 'src/services/type-client-fournisseur';

@Component({
  selector: 'app-add-compte',
  templateUrl: './add-compain.component.html',
  styleUrls: ['./add-compain.component.css']
})
export class AddCompainComponent implements OnInit {
  internForm!: FormGroup;
  formSubmitted = false;
  listeCompain: compain[] = [];
 
  isEditMode: boolean = false;
 TypeClientFournisseur = TypeClientFournisseur;
  
  // Crée un tableau des valeurs de l'énumération
  typeClientFournisseurValues = Object.values(TypeClientFournisseur);
  constructor(
    private compainServ: CompainService,
   
    private router: Router,
    private dialogRef: MatDialogRef<AddCompainComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadCompte();

  }

  initForm(): void {
    const currentDate = new Date().toISOString().split('T')[0];
    this.internForm = new FormGroup({
      id: new FormControl(this.data?.id || ''),
      reference: new FormControl(this.data?.reference || '', [Validators.required, Validators.minLength(2)]),
      nom: new FormControl(this.data?.nom || '', [Validators.required]),
      email: new FormControl(this.data?.email || '', [Validators.required, Validators.email]),
      telephone: new FormControl(this.data?.telephone || '', [Validators.required]),
      pays: new FormControl(this.data?.pays || '', [Validators.required]),
      ville: new FormControl(this.data?.ville || '', [Validators.required]),
      address: new FormControl(this.data?.address || '', [Validators.required]),
     
      type: new FormControl(this.data?.type || '', [Validators.required]),
      createdAt: new FormControl(this.data?.createdAt || currentDate, [Validators.required]),
      UpdatedAt: new FormControl(this.data?.UpdatedAt || currentDate)
    });

    if (this.data?.id) {
      this.isEditMode = true;
    }
  }

  loadCompte(): void {
    this.compainServ.getCompains().subscribe(data => {
      this.listeCompain = data;
      console.log(this.listeCompain);
    });
  }
 
  close() {
    this.dialogRef.close();
  }

  onSubmit() {
    this.formSubmitted = true;
    if (this.internForm.invalid) {
      return;
    }
  
    const formValue = this.internForm.value;
    console.log('Client ID:', formValue.clientid);
  
    if (formValue.id) {
      // Mise à jour si l'ID est présent
      this.compainServ.updateCompain(formValue.id, formValue).subscribe(
        () => {
          this.isEditMode = true;
          this.dialogRef.close(formValue); // Ferme le dialogue
          this.router.navigate(['/ListeCompany']); // Redirection après mise à jour
          window.location.reload();
        },
        (error) => {
          console.error('Erreur lors de la mise à jour du client :', error);
        }
      );
    } else {
      // Ajout d'un nouveau compte
      this.compainServ.createCompain(formValue).subscribe(
        () => {
          this.dialogRef.close(formValue); // Ferme le dialogue
          this.router.navigate(['/ListeCompany']); // Redirection après ajout
          window.location.reload();
        },
        (error) => {
          console.error('Erreur lors de l’ajout du compte :', error);
        }
      );
    }
  }
}  