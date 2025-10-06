import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

import { DatePipe } from '@angular/common';
import { FactureService } from 'src/services/facture-service.service';
import { Facture } from 'src/services/Facture';

@Component({
  selector: 'app-facture-preview',
  standalone: true,
  imports: [],
  templateUrl: './facture-preview.component.html',
  styleUrl: './facture-preview.component.css'
})
export class FacturePreviewComponent implements OnInit {
  facture: Facture;
  isLoading = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { facture: Facture },
    private datePipe: DatePipe,
    private factureService: FactureService
  ) {
    this.facture = data.facture;
  }

  ngOnInit(): void {
    if (!this.facture.lignes) {
      this.facture.lignes = [];
    }
  }

  print(): void {
    window.print();
  }

  /*downloadPdf(): void {
    this.isLoading = true;
    this.factureService.downloadPdf(this.facture.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `facture_${this.facture.numeroFacture}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
      }
    });
  }*/

  formatDate(date: string): string {
    return this.datePipe.transform(date, 'dd/MM/yyyy') || '';
  }

  calculateTotalHT(): number {
    return this.facture.lignes.reduce((sum, ligne) => sum + (ligne.total || 0), 0);
  }

  calculateTVA(): number {
    return this.calculateTotalHT() * (this.facture.tva / 100);
  }
}