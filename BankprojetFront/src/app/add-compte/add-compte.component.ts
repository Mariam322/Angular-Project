import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { compte } from 'src/services/compte';
import { CompteBancaireService } from 'src/services/compte-bancaire.service';

@Component({
  selector: 'app-add-compte',
  standalone: true,
  imports: [CommonModule,ReactiveFormsModule],
  templateUrl: './add-compte.component.html',
  styleUrl: './add-compte.component.css'
})
export class AddCompteComponent implements OnInit {
  internForm!: FormGroup;
  formSubmitted = false;
  listeCompte: compte[] = [];
  isLoading = false;
  isEditMode: boolean = false;

  constructor(
    private compteServ: CompteBancaireService,
   
    private router: Router,
    private dialogRef: MatDialogRef<AddCompteComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadCompte();
    
  }

  initForm(): void {
    this.internForm = new FormGroup({
       idCompte: new FormControl(this.data?.idCompte || ''),
      numeroCompte: new FormControl(this.data?.numeroCompte || '', [Validators.required, Validators.minLength(2)]),
      nomBanque: new FormControl(this.data?.nomBanque || '', [Validators.required]),
    });
  }

  loadCompte(): void {
    this.compteServ.getComptes().subscribe(data => {
      this.listeCompte = data;
      console.log(this.listeCompte);
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
    
  
    if (formValue.id) {
      // Mise à jour si l'ID est présent
      this.compteServ.updateCompte(formValue.id, formValue).subscribe(
        () => {
          this.isEditMode = true;
          this.dialogRef.close(formValue); // Ferme le dialogue
          this.router.navigate(['/listecompte']); // Redirection après mise à jour
          window.location.reload();
        },
        (error) => {
          console.error('Erreur lors de la mise à jour du client :', error);
        }
      );
    } else {
      // Ajout d'un nouveau compte
      this.compteServ.addCompte(formValue).subscribe(
        () => {
          this.dialogRef.close(formValue); // Ferme le dialogue
          this.router.navigate(['/listecompte']); // Redirection après ajout
          window.location.reload();
        },
        (error) => {
          console.error('Erreur lors de l’ajout du compte :', error);
        }
      );
    }
  }
}  