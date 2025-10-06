import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { forkJoin, map, of, Subject, switchMap, takeUntil } from 'rxjs';
import { CompainService } from 'src/services/compain.service';
import { FactureService } from 'src/services/facture-service.service';
import { DepenseService } from 'src/services/depense.service';
import { CompteBancaireService } from 'src/services/compte-bancaire.service';
import { Chart, registerables } from 'chart.js';
import { TypeClientFournisseur } from 'src/services/type-client-fournisseur';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { StatutFacture } from 'src/services/Facture';
import { Depense } from 'src/services/Depense';

Chart.register(...registerables);

interface InvoiceStatus {
  statut: StatutFacture;
  count: number;
  percentage: number;
}
  // Dans home.component.ts
interface MonthlyData {
  months: string[];
  amounts: number[];
}


interface BankAccount {
  idCompte: number;
  solde: number;
  libelle: string;
  [key: string]: any;
}

interface BankOperation {
  dateOperation: string | Date;
  debit: number;
  credit: number;
  solde: number;
  description?: string;
  numCheque?: string;
  [key: string]: any;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    SidebarComponent,
    CommonModule,
    FormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatSelectModule,
    MatFormFieldModule,
    MatListModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {
  // Statistics
  clientsCount: number = 0;
  suppliersCount: number = 0;
  invoicesCount: number = 0;
  expensesCount: number = 0;
  totalRevenue: number = 0;
  totalExpenses: number = 0;
  bankAccounts: BankAccount[] = [];
  recentOperations: BankOperation[] = [];
  totalBalance: number = 0;
  isLoadingBankData: boolean = false;
  isLoadingInvoiceStats: boolean = false;

  // Recent data
  recentInvoices: any[] = [];
  recentExpenses: Depense[] = [];

  // Charts
  monthlyTrendsChart: Chart | undefined;
  chartType: 'line' | 'bar' = 'line';

  invoiceStatusData: InvoiceStatus[] = [];
  activeStatuses: Set<StatutFacture> = new Set();

  // Trends
  clientTrend: number = 5.2;
  supplierTrend: number = -2.1;
  invoiceTrend: number = 12.7;
  expenseTrend: number = 8.3;
  balanceTrend: number = 4.5;

  // UI state
  selectedPeriod: string = '30';
  selectedAccountId: number | null = null;
  isDarkMode: boolean = false;

  private destroy$ = new Subject<void>();

  constructor(
    private compainService: CompainService,
    private factureService: FactureService,
    private depenseService: DepenseService,
    private compteBancaireService: CompteBancaireService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.loadStatistics();
    this.loadRecentActivities();
    this.loadBankData();
    this.loadInvoiceStats();
  }

  ngAfterViewInit(): void {
    this.createMonthlyTrendsChart();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.monthlyTrendsChart?.destroy();
  }

  // Helper methods
  abs(value: number): number {
    return Math.abs(value);
  }

  isStatusActive(status: StatutFacture): boolean {
    return this.activeStatuses.has(status);
  }

  toggleInvoiceStatus(status: StatutFacture): void {
    if (this.activeStatuses.has(status)) {
      this.activeStatuses.delete(status);
    } else {
      this.activeStatuses.add(status);
    }
  }

  getInvoiceStatusLabel(status: StatutFacture): string {
    const statusMap: Record<StatutFacture, string> = {
      [StatutFacture.PAYEE]: 'Payée',
      [StatutFacture.NON_PAYEE]: 'Non payée',
      [StatutFacture.PARTIELLEMENT_PAYEE]: 'Part. payée',
      [StatutFacture.EN_ATTENTE]: 'En attente'
    };
    return statusMap[status] || status;
  }

  getStatusColor(status: StatutFacture): string {
    const colors: Record<StatutFacture, string> = {
      [StatutFacture.PAYEE]: '#10b981',
      [StatutFacture.NON_PAYEE]: '#ef4444',
      [StatutFacture.PARTIELLEMENT_PAYEE]: '#f59e0b',
      [StatutFacture.EN_ATTENTE]: '#3b82f6'
    };
    return colors[status] || '#64748b';
  }

  getTotalInvoices(): number {
    return this.invoiceStatusData.reduce((sum, item) => sum + item.count, 0);
  }

  loadInvoiceStats(): void {
    this.isLoadingInvoiceStats = true;
    this.factureService.getFactureStats().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (stats) => {
        const total = Object.values(stats).reduce((sum, count) => sum + count, 0);
        
        this.invoiceStatusData = Object.entries(stats)
          .filter(([statut]) => statut in StatutFacture)
          .map(([statut, count]) => ({
            statut: StatutFacture[statut as keyof typeof StatutFacture],
            count,
            percentage: total > 0 ? Math.round((count / total) * 100) : 0
          }));
        
        this.activeStatuses = new Set(this.invoiceStatusData.map(s => s.statut));
        this.isLoadingInvoiceStats = false;
      },
      error: (err) => {
        console.error('Error loading invoice stats:', err);
        this.snackBar.open('Erreur lors du chargement des statistiques', 'Fermer', { duration: 3000 });
        this.isLoadingInvoiceStats = false;
      }
    });
  }

  formatBalance(amount: number): string {
    return new Intl.NumberFormat('fr-TN', {
      style: 'currency',
      currency: 'TND',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
  }

  isNewInvoice(date: Date): boolean {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return new Date(date) > oneWeekAgo;
  }

  // Data loading methods
  loadBankData(): void {
    this.isLoadingBankData = true;
    
    this.compteBancaireService.getComptes().pipe(
      takeUntil(this.destroy$),
      switchMap(accounts => {
        this.bankAccounts = accounts;
        this.totalBalance = accounts.reduce((sum, account) => sum + (account.solde || 0), 0);
        
        if (accounts.length > 0) {
          this.selectedAccountId = accounts[0].idCompte;
          return this.compteBancaireService.getOperationsByCompteId(accounts[0].idCompte);
        }
        return of([]);
      })
    ).subscribe({
      next: operations => {
        this.recentOperations = operations
          .map(op => ({
            ...op,
            dateOperation: new Date(op.dateOperation)
          }))
          .sort((a, b) => new Date(b.dateOperation).getTime() - new Date(a.dateOperation).getTime())
          .slice(0, 10);
      },
      error: err => {
        console.error('Error loading bank data:', err);
        this.snackBar.open('Error loading bank data', 'Close', { duration: 3000 });
        this.isLoadingBankData = false;
      },
      complete: () => this.isLoadingBankData = false
    });
  }

  loadAccountOperations(): void {
    if (!this.selectedAccountId) return;
    
    this.isLoadingBankData = true;
    this.compteBancaireService.getOperationsByCompteId(this.selectedAccountId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: operations => {
          this.recentOperations = operations
            .map(op => ({
              ...op,
              dateOperation: new Date(op.dateOperation)
            }))
            .sort((a, b) => new Date(b.dateOperation).getTime() - new Date(a.dateOperation).getTime())
            .slice(0, 10);
        },
        error: err => {
          console.error('Error loading account operations:', err);
          this.snackBar.open('Error loading account operations', 'Close', { duration: 3000 });
          this.isLoadingBankData = false;
        },
        complete: () => this.isLoadingBankData = false
      });
  }

  loadStatistics(): void {
    // Load clients
    this.compainService.getCompainsByType(TypeClientFournisseur.CLIENT)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: clients => this.clientsCount = clients.length,
        error: err => console.error('Error loading clients:', err)
      });

    // Load suppliers
    this.compainService.getCompainsByType(TypeClientFournisseur.FOURNISSEUR)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: suppliers => this.suppliersCount = suppliers.length,
        error: err => console.error('Error loading suppliers:', err)
      });

    // Load invoices
    this.factureService.getFactures()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: invoices => {
          this.invoicesCount = invoices.length;
          this.totalRevenue = invoices.reduce((sum, inv) => sum + (inv.montantTtc || 0), 0);
        },
        error: err => console.error('Error loading invoices:', err)
      });

    // Load expenses
    this.depenseService.getAllDepenses()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (expenses: Depense[]) => {
          this.expensesCount = expenses.length;
          this.totalExpenses = expenses.reduce((sum, exp) => sum + (exp.totalGeneralDepense || 0), 0);
        },
        error: err => console.error('Error loading expenses:', err)
      });
  }

  loadRecentActivities(): void {
    // Recent invoices
    this.factureService.getFactures()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: invoices => {
          this.recentInvoices = invoices
            .map(inv => ({
              ...inv,
              dateFacture: new Date(inv.dateFacture)
            }))
            .sort((a, b) => b.dateFacture.getTime() - a.dateFacture.getTime())
            .slice(0, 5);
        },
        error: err => console.error('Error loading recent invoices:', err)
      });

    // Recent expenses
    this.depenseService.getAllDepenses()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (expenses: Depense[]) => {
          this.recentExpenses = expenses
            .map(exp => ({
              ...exp,
              dateDepense: new Date(exp.dateDepense)
            }))
            .sort((a, b) => b.dateDepense.getTime() - a.dateDepense.getTime())
            .slice(0, 5);
        },
        error: err => console.error('Error loading recent expenses:', err)
      });
  }

  // Chart methods
  createMonthlyTrendsChart(): void {
    const ctx = document.getElementById('monthlyTrendsChart') as HTMLCanvasElement;
    if (!ctx) return;

    this.monthlyTrendsChart = new Chart(ctx, {
      type: this.chartType,
      data: {
        labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'],
        datasets: [
          {
            label: 'Chiffre d\'Affaires',
            data: [12000, 19000, 15000, 18000, 22000, 25000, 28000, 26000, 24000, 21000, 23000, 27000],
            borderColor: '#41B3A3',
            backgroundColor: 'rgba(65, 179, 163, 0.1)',
            tension: 0.3,
            fill: true
          },
          {
            label: 'Dépenses',
            data: [8000, 10000, 12000, 9000, 11000, 13000, 15000, 14000, 12000, 10000, 11000, 13000],
            borderColor: '#E27D60',
            backgroundColor: 'rgba(226, 125, 96, 0.1)',
            tension: 0.3,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                return `${context.dataset.label}: ${context.parsed.y.toLocaleString('fr-FR', {
                  style: 'currency',
                  currency: 'TND'
                })}`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => {
                return value.toLocaleString('fr-FR', {
                  style: 'currency',
                  currency: 'TND'
                });
              }
            }
          }
        }
      }
    });
  }

  toggleChartType(): void {
    this.chartType = this.chartType === 'line' ? 'bar' : 'line';
    this.monthlyTrendsChart?.destroy();
    this.createMonthlyTrendsChart();
  }

  // UI interaction methods
  onPeriodChange(): void {
    console.log('Period changed to:', this.selectedPeriod);
    this.loadStatistics();
    this.loadRecentActivities();
  }

  refreshBankData(): void {
    this.loadBankData();
  }

  toggleDarkMode(): void {
    this.isDarkMode = !this.isDarkMode;
    document.body.classList.toggle('dark-mode', this.isDarkMode);
  }

  // Navigation methods
  createNewInvoice(): void {
    console.log('Navigate to create new invoice');
  }

  recordNewExpense(): void {
    console.log('Navigate to record new expense');
  }

  addNewClient(): void {
    console.log('Navigate to add new client');
  }

  viewReports(): void {
    console.log('Navigate to view reports');
  }

  viewInvoiceDetails(): void {
    console.log('Navigate to invoice details');
  }

  viewAllOperations(): void {
    console.log('Navigate to all operations');
  }
private updateChartData(
  labels: string[], 
  revenueData: number[], 
  expenseData: number[]
): void {
  if (!this.monthlyTrendsChart) {
    console.error('Chart not initialized');
    return;
  }

  this.monthlyTrendsChart.data.labels = labels;
  this.monthlyTrendsChart.data.datasets[0].data = revenueData;
  this.monthlyTrendsChart.data.datasets[1].data = expenseData;
  this.monthlyTrendsChart.update();
}

loadMonthlyTrends(): void {
  forkJoin({
    expenses: this.depenseService.getAllDepenses().pipe(
      map(depenses => this.processMonthlyData(depenses, 'dateDepense', 'totalGeneralDepense'))
    ),
    // revenues: this.factureService.getFactures().pipe(
    //   map(invoices => this.processMonthlyData(invoices, 'dateFacture', 'montantTtc'))
    // )
  }).pipe(
    takeUntil(this.destroy$)
  ).subscribe({
    next: ({expenses}) => {
      const months = expenses.months;
      const expenseData = expenses.amounts;
      
      // Simulation des revenus (à remplacer par des données réelles)
      const revenueData = expenseData.map(exp => exp * 1.5);
      
      this.updateChartData(months, revenueData, expenseData);
    },
    error: (err) => {
      console.error('Error loading monthly trends:', err);
      this.snackBar.open('Erreur lors du chargement des tendances', 'Fermer', {duration: 3000});
    }
  });
}

private processMonthlyData(items: any[], dateField: string, amountField: string): MonthlyData {
  const monthlyMap = new Map<string, number>();
  
  items.forEach(item => {
    const date = new Date(item[dateField]);
    const monthYear = `${date.getMonth()+1}/${date.getFullYear()}`;
    
    const current = monthlyMap.get(monthYear) || 0;
    monthlyMap.set(monthYear, current + (item[amountField] || 0));
  });
  
  const sortedEntries = Array.from(monthlyMap.entries())
    .sort((a, b) => {
      const [aMonth, aYear] = a[0].split('/').map(Number);
      const [bMonth, bYear] = b[0].split('/').map(Number);
      return aYear === bYear ? aMonth - bMonth : aYear - bYear;
    });
  
  return {
    months: sortedEntries.map(([monthYear]) => {
      const [month, year] = monthYear.split('/');
      return new Date(Number(year), Number(month)-1, 1)
        .toLocaleDateString('fr-FR', {month: 'short', year: 'numeric'});
    }),
    amounts: sortedEntries.map(([_, amount]) => amount)
  };
}


  viewActivityHistory(): void {
    console.log('Navigate to activity history');
  }

  viewInvoice(id: number): void {
    console.log('View invoice with id:', id);
  }

  viewExpense(id: number): void {
    console.log('View expense with id:', id);
  }

  exportChartData(): void {
  if (!this.monthlyTrendsChart) {
    console.error('Aucun graphique à exporter');
    return;
  }
  
  // 1. Solution simple : Télécharger comme image
  const url = this.monthlyTrendsChart.toBase64Image();
  const link = document.createElement('a');
  link.href = url;
  link.download = `statistiques-${new Date().toISOString().slice(0,10)}.png`;
  link.click();

  // 2. Solution avancée : Exporter les données (CSV/JSON)
  const data = {
    labels: this.monthlyTrendsChart.data.labels,
    datasets: this.monthlyTrendsChart.data.datasets.map(d => ({
      label: d.label,
      data: d.data
    }))
  };
  this.downloadAsJson(data, 'statistiques.json');
}

private downloadAsJson(data: any, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
}