import { compte } from './compte';

export class OperationBancaire {
  idOperation!: number;
  dateOperation!: Date;
  numCheque!: string;
  debit!: number;
  credit!: number;
  solde!: number;
  compte!: compte;

  constructor(
    idOperation: number,
    dateOperation: Date,
    numCheque: string,
    debit: number,
    credit: number,
    solde: number,
    compte: compte
  ) {
    this.idOperation = idOperation;
    this.dateOperation = dateOperation;
    this.numCheque = numCheque;
    this.debit = debit;
    this.credit = credit;
    this.solde = solde;
    this.compte = compte;
  }
}
