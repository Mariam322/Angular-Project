import { LigneDepense } from "./LigneDepense";
import { TypeClientFournisseur } from "./type-client-fournisseur";

export class Depense {
  id!: number;
  numDepense!: string;
  dateDepense!: Date;
  datePaiementDepense!: Date;
  dateReceptionDepense!: Date;
  montantHtDepense!: number;
  tvaDepense!: number;
  montantTtcDepense!: number;
  totalGeneralDepense!: number;
  idCompaign?: number;
  type?: TypeClientFournisseur;
  lignes: LigneDepense[] = [];
  nom?: string;
  address?: string;
  email?: string;
  telephone?: string;
  pays?: string;
  ville?: string;

  constructor(
    id: number,
    numDepense: string,
    dateDepense: Date,
    datePaiementDepense: Date,
    dateReceptionDepense: Date,
    montantHtDepense: number,
    tvaDepense: number,
    montantTtcDepense: number,
    totalGeneralDepense: number,
    lignes: LigneDepense[] = [],
    type?: TypeClientFournisseur,
    idCompaign?: number,
    
    nom?: string,
    address?: string,
    email?: string,
    telephone?: string,
    pays?: string,
    ville?: string
  ) {
    this.id = id;
    this.numDepense = numDepense;
    this.dateDepense = dateDepense;
    this.datePaiementDepense = datePaiementDepense;
    this.dateReceptionDepense = dateReceptionDepense;
    this.montantHtDepense = montantHtDepense;
    this.tvaDepense = tvaDepense;
    this.montantTtcDepense = montantTtcDepense;
    this.totalGeneralDepense = totalGeneralDepense;
    this.lignes = lignes;
    this.type = type;
    this.idCompaign = idCompaign;
    this.nom = nom;
    this.address = address;
    this.email = email;
    this.telephone = telephone;
    this.pays = pays;
    this.ville = ville;
  }
}