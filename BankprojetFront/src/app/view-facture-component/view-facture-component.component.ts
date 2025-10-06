import { Component, ElementRef, Inject, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Facture, StatutFacture } from 'src/services/Facture';
import { DatePipe, CurrencyPipe, CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { FactureService } from 'src/services/facture-service.service';

@Component({
  selector: 'app-view-facture-component',
  standalone: true,
  imports: [CommonModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatCardModule,
    MatListModule],
  templateUrl: './view-facture-component.component.html',
  styleUrl: './view-facture-component.component.css',
  providers: [DatePipe, CurrencyPipe]
})



export class ViewFactureComponentComponent{
  @ViewChild('invoiceContent') invoiceContent!: ElementRef;

email: string = 'systeo.digital@gmail.com';

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { facture: Facture },
    private dialogRef: MatDialogRef<ViewFactureComponentComponent>,
    private datePipe: DatePipe,
    private currencyPipe: CurrencyPipe,
    private factureService: FactureService,
    
  ) {}

  closeDialog(): void {
    this.dialogRef.close();
  }
  getStatusLabel(status: string): string {
    switch(status) {
      case StatutFacture.PAYEE: return 'Payée';
      case StatutFacture.PARTIELLEMENT_PAYEE: return 'Partiellement payée';
      case StatutFacture.EN_ATTENTE: return 'En attente';
      case StatutFacture.NON_PAYEE: return 'Non payée';
      default: return status;
    }
   }

  formatDate(date: Date | string): string {
    return this.datePipe.transform(date, 'dd/MM/yyyy') || '';
  }

  formatCurrency(amount: number): string {
 const formatted = this.currencyPipe.transform(amount, 'TND', 'symbol', '1.2-2') || '';
     return formatted.replace('TND', '').trim() + ' TND';
  }
    // Fonction pour générer et sauvegarder le PDF
  /*generateAndSavePdf(): void {
    this.factureService.generatePdf(this.data.facture.id).subscribe({
      next: (response) => {
        console.log('PDF généré et sauvegardé avec succès', response);
        // Vous pouvez ajouter une notification ici
      },
      error: (err) => {
        console.error('Erreur lors de la génération du PDF', err);
      }
    });
  }*/
 async generateAndSavePdf(): Promise<void> {
  try {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const canvas = await html2canvas(this.invoiceContent.nativeElement, {
       scale: 1,
      useCORS: true,
      logging: true
    });

    const imgData = canvas.toDataURL('image/png',0.7);
    pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);

    // Convertir en blob
    const pdfBlob = pdf.output('blob');
    
    const formData = new FormData();
    formData.append('file', pdfBlob, `facture_${this.data.facture.numeroFacture}.pdf`);
    formData.append('factureId', this.data.facture.id.toString());
    formData.append('type', 'FACTURE');

    this.factureService.sendPdfToBackend(formData).subscribe({
      next: () => alert('PDF enregistré avec succès'),
      error: (err) => console.error('Erreur:', err)
    });

  } catch (error) {
    console.error('Erreur:', error);
  }
}
generateSavePdf(): void {
    this.factureService.generatePdf(this.data.facture.id).subscribe({
        next: (response) => {
            console.log('Réponse du serveur:', response);
            alert('PDF généré avec succès et en cours de stockage');
        },
        error: (err) => {
            console.error('Erreur:', err);
            alert('Erreur lors de la génération du PDF: ' + err?.error?.message || err.message);
        }
    });
}



async downloadPdf(): Promise<void> {
    try {
        // Créer un clone de l'élément pour manipulation
        const element = this.invoiceContent.nativeElement;
        const clone = element.cloneNode(true) as HTMLElement;
        
        // Supprimer les boutons dans le clone
        const actionButtons = clone.querySelector('.action-buttons');
        if (actionButtons) {
            actionButtons.remove();
        }

        // Appliquer les styles nécessaires au clone
        clone.style.width = '210mm';
        clone.style.height = 'auto';
        clone.style.position = 'absolute';
        clone.style.left = '-9999px';
        clone.style.padding = '15mm';
        clone.style.boxSizing = 'border-box';
        
        document.body.appendChild(clone);

        // Configuration pour html2canvas
        const options = {
            scale: 2,
            useCORS: true,
            scrollY: 0,
            width: 794, // 210mm en pixels
            height: clone.scrollHeight,
            windowWidth: 794,
            windowHeight: clone.scrollHeight
        };

        const canvas = await html2canvas(clone, options);
        document.body.removeChild(clone);

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        
        // Calcul des dimensions
        const imgWidth = 210;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
        pdf.save(`Facture_${this.data.facture.numeroFacture}.pdf`);
    } catch (error) {
        console.error("Erreur lors de la génération du PDF:", error);
        alert("Erreur lors de la génération du PDF.");
    }
}
printInvoice(): void {
    try {
        // Créer un clone profond de l'élément
        const printContent = this.invoiceContent.nativeElement.cloneNode(true);
        
        // Supprimer les boutons d'action
        const actionButtons = printContent.querySelector('.action-buttons');
        if (actionButtons) {
            actionButtons.remove();
        }

        // Créer un conteneur spécifique pour l'impression
        const printContainer = document.createElement('div');
        printContainer.style.width = '210mm';
        printContainer.style.margin = '0 auto';
        printContainer.style.padding = '15mm';
        printContainer.appendChild(printContent);

        // Créer une nouvelle fenêtre
        const printWindow = window.open('', '_blank');
        
        if (!printWindow) {
            // Solution de secours si les popups sont bloqués
            alert('Veuillez autoriser les fenêtres popup pour imprimer. Vous pouvez utiliser Ctrl+P après avoir autorisé les popups.');
            return;
        }

        // Styles optimisés pour l'impression
        const styles = `
            <style>
                @page {
                    size: A4;
                    margin: 15mm;
                }
                body {
                    font-family: Arial;
                    font-size: 12pt;
                    line-height: 1.5;
                    margin: 0;
                    padding: 0;
                    color: #000;
                    background: #fff;
                }
                     * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Arial', sans-serif;
            background: #f5f5f5;
            color: #333;
        }

        /* Styles pour la fenêtre modale */
        .modal.show {
            display: block; /* Affiche le modal quand il est activé */
        }
        @media print {
    body, .invoice-container {
        width: 210mm !important;
        height: 297mm !important;
        margin: 0 !important;
        padding: 0 !important;
        background: white !important;
    }
    
    .invoice-container {
        padding: 15mm !important;
        box-shadow: none !important;
        border: none !important;
    }
    
    .no-print, .action-buttons {
        display: none !important;
    }
}

.invoice-container {
    width: 210mm;
    min-height: 297mm;
    padding: 15mm;
    margin: 0 auto;
    box-sizing: border-box;
    background: white;
    font-family: Arial, sans-serif;
    position: relative;
}
        /* Container pour la modal */
        .modal-backdrop {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            z-index: 1000;
            display: flex;
            justify-content: center;
            align-items: center;
            overflow: hidden; /* Désactive tout défilement externe */
            padding: 20px;
        }
        
        /* Style du conteneur du modal */
        .container {
            background-color: white;
            border-radius: 10px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
            padding: 20px;
            width: 90%; /* Plus responsive */
            max-width: 800px; /* Largeur maximale */
            max-height: 90vh; /* Hauteur maximale de 90% de la vue */
            overflow-y: auto; /* Défilement interne si nécessaire */
            margin: 20px 0; /* Marge pour éviter de coller aux bords */
        }

        /* Désactive le défilement du body quand le modal est ouvert */
        body.modal-open {
            overflow: hidden;
        }

        .text {
            text-align: center; 
            font-size: 41px; 
            font-family: 'Times New Roman', Times, serif;
            margin-bottom: 20px;
        }

        /* Styles pour le formulaire et les champs */
        form {
            display: flex;
            flex-direction: column;
            gap: 16px;
        }

        .form-group {
            margin-bottom: 15px;
        }

        label {
            display: block;
            margin-bottom: 5px;
            font-weight: 500;
        }

        input, textarea, select, button {
            padding: 8px 15px;
            border-radius: 5px;
            margin: 5px 0;
            box-sizing: border-box;
            border: 1px solid #ccc;
            font-size: 18px;
            font-weight: 300;
            width: 100%;
        }

        .btn {
            padding: 12px 24px;
            border: none;
            border-radius: 4px;
            font-weight: 500;
            font-size: 0.9rem;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            text-decoration: none;
            margin: 5px;
        }

        .btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .btn-success {
            background: #28a745;
            color: white;
        }

        .btn-primary {
            background: #007bff;
            color: white;
        }

        .btn-info {
            background: #17a2b8;
            color: white;
        }

        .btn-secondary {
            background: #6c757d;
            color: white;
        }

        .action-buttons {
            display: flex;
            justify-content: center;
            margin-top: 20px;
        }

        /* Facture styles */
        .invoice-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 20px;
            padding-bottom: 20px;

        }
        .inv{
             display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 20px;
            padding-bottom: 20px;
                    border-bottom: 2px solid #e0e0e0;
        }

        .company-info {
            flex: 1;
            margin-top: -40px;
        }

        .logo {
            width: 80px;
            height: 80px;
            background: #efecec;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 1.2rem;
            margin-bottom: 15px;
        }

        .company-details {
            font-size: 1rem;
            line-height: 1.4;
            color: #575353;
        }

        .invoice-title {
            text-align: center;
            flex: 1;
        }

        .invoice-title h1 {
            font-size: 2rem;
            font-weight: 300;
            letter-spacing: 4px;
            color: #333;
            margin-bottom: 10px;
        }

        .client-info {
            flex: 1;
            text-align: right;
        }

        .client-details {
            font-size: 0.9rem;
            line-height: 1.4;
            color: #666;
            margin-top: -70px;
        }

        .status-container {
            text-align: right;
            margin-bottom: 20px;
        }

        .status-badge {
            display: inline-block;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 0.85rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .status-paid { background: #d4edda; color: #155724; }
        .status-unpaid { background: #f8d7da; color: #721c24; }
        .status-partial { background: #fff3cd; color: #856404; }
        .status-pending { background: #d1ecf1; color: #0c5460; }

        .invoice-meta {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
        }

        .meta-section h3 {
            font-size: 1rem;
            font-weight: 600;
            color: #333;
            margin-bottom: 15px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .meta-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px solid #f0f0f0;
        }

        .meta-item:last-child {
            border-bottom: none;
        }

        .meta-label {
            font-weight: 500;
            color: #666;
        }

        .meta-value {
            font-weight: 600;
            color: #333;
        }

        .invoice-number {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 6px;
            text-align: center;
            margin-bottom: 20px;
        }

        .invoice-number .number {
            font-size: 1.2rem;
            font-weight: bold;
            color: #333;
        }

        .invoice-table-section {
            margin: 20px 0;
        }

        .table-header {
            font-size: 1rem;
            font-weight: 600;
            color: #333;
            margin-bottom: 20px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .invoice-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }

        .invoice-table thead th {
            background: #f8f9fa;
            padding: 12px;
            text-align: left;
            font-weight: 600;
            color: #333;
            border-bottom: 2px solid #dee2e6;
            font-size: 0.9rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .invoice-table tbody td {
            padding: 12px;
            border-bottom: 1px solid #f0f0f0;
            color: #555;
        }

        .invoice-table tbody tr:hover {
            background: #f8f9fa;
        }

        .text-right {
            text-align: right;
        }

        .totals-section {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 2px solid #e0e0e0;
        }

        .totals-grid {
            display: grid;
            grid-template-columns: 1fr 300px;
            gap: 20px;
        }

        .payment-info {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 6px;
             border: 1px solid #e0e0e0;
        }
 @media print {
            .no-print, .action-buttons {
                display: none !important;
            }
        }
        .payment-info h4 {
            font-size: 0.95rem;
            font-weight: 600;
            color: #2f2d2d;
            margin-bottom: 15px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .payment-details {
            font-size: 0.85rem;
            line-height: 1.6;
            color: #4f4d4dec;
        }

        .totals-card {
            background: white;
            border: 1px solid #e0e0e0;
            border-radius: 6px;
            overflow: hidden;
        }

        .total-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 15px;
            border-bottom: 1px solid #f0f0f0;
        }

        .total-row:last-child {
            background: #333;
            color: white;
            font-weight: bold;
            font-size: 1.1rem;
            border-bottom: none;
        }

        .total-label {
            font-weight: 500;
        }

        .total-value {
            font-weight: 600;
        }

        /* Badge styles */
        .badge {
            display: inline-block;
            padding: 0.25em 0.4em;
            font-size: 75%;
            font-weight: 700;
            line-height: 1;
            text-align: center;
            white-space: nowrap;
            vertical-align: baseline;
            border-radius: 0.25rem;
        }

        .badge-success {
            color: #fff;
            background-color: #28a745;
        }

        .badge-danger {
            color: #fff;
            background-color: #dc3545;
        }

        .badge-warning {
            color: #212529;
            background-color: #ffc107;
        }

        .badge-info {
            color: #fff;
            background-color: #17a2b8;
        }

        /* Responsive */
        @media (max-width: 768px) {
            .container {
                padding: 15px;
            }

            .text {
                font-size: 30px;
            }

            .invoice-header {
                flex-direction: column;
                gap: 20px;
                text-align: center;
            }

            .invoice-title h1 {
                font-size: 1.8rem;
                letter-spacing: 2px;
            }

            .client-info {
                text-align: center;
            }

            .invoice-meta {
                grid-template-columns: 1fr;
                gap: 15px;
            }

            .totals-grid {
                grid-template-columns: 1fr;
                gap: 15px;
            }

            .action-buttons {
                flex-direction: column;
                align-items: center;
            }

            .btn {
                width: 100%;
                max-width: 250px;
            }
        }

        @media print {
            body * { visibility: hidden; }
            .container, .container * { visibility: visible; }
            .container { 
                position: absolute; 
                left: 0; 
                top: 0; 
                width: 100%; 
                box-shadow: none;
                border-radius: 0;
                max-height: none;
                padding: 0;
                margin: 0;
            }
            .action-buttons { display: none !important; }
            .modal-backdrop { 
                background: white; 
                position: static; 
                padding: 0;
            }
        }
                table {
                    width: 100%;
                    border-collapse: collapse;
                }
                th, td {
                    border: 1px solid #ddd;
                    padding: 8px;
                }
            </style>
        `;

        // Écrire le contenu dans la nouvelle fenêtre
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Facture ${this.data.facture.numeroFacture}</title>
                    ${styles}
                </head>
                <body>
                    ${printContainer.innerHTML}
                    <script>
                        // Lancer l'impression automatiquement
                        setTimeout(function() {
                            window.print();
                            window.close();
                        }, 200);
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();

    } catch (error) {
        console.error("Erreur lors de l'impression:", error);
        alert("Erreur lors de l'ouverture de l'impression. Voir la console pour plus de détails.");
    }
}
}

