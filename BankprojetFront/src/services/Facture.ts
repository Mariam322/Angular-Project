import { TypeClientFournisseur } from "./type-client-fournisseur";

export class Facture {
  id: number;
  numeroFacture: string;
  dateFacture: Date;
  datePaiement: Date;
  montantHt!: number;
  tva: number;
  montantTtc!: number;
  remise?: number;
  statut: StatutFacture;
  pdfPath?: string;
  pdfGenerated: boolean;
  typePieceCommerciale: TypePieceCommerciale;
  idCompaign?: number;
  
  // Champs de la campagne (optionnels)
  reference?: string;
  nom?: string;
  address?: string;
  email?: string;
  telephone?: string;
  pays?: string;
  ville?: string;
  type?: TypeClientFournisseur;
  
  lignes: LignePieceCommerciale[];

  constructor(
    id: number,
    numeroFacture: string,
    dateFacture: Date,
    tva: number,
    statut: StatutFacture,
    typePieceCommerciale: TypePieceCommerciale,
    lignes: LignePieceCommerciale[] = [],
    datePaiement: Date,
    remise?: number,
    idCompaign?: number,
    pdfPath?: string,
    // Champs optionnels de la campagne
    reference?: string,
    nom?: string,
    address?: string,
    email?: string,
    telephone?: string,
    pays?: string,
    ville?: string,
    type?: TypeClientFournisseur
  ) {
    this.id = id;
    this.numeroFacture = numeroFacture;
    this.dateFacture = dateFacture;
    this.tva = tva;
    this.statut = statut;
    this.typePieceCommerciale = typePieceCommerciale;
    this.lignes = lignes;
    this.datePaiement = datePaiement;
    this.remise = remise;
    this.idCompaign = idCompaign;
    this.pdfPath = pdfPath;
    this.pdfGenerated = !!pdfPath;
    
    // Champs de la campagne
    this.reference = reference;
    this.nom = nom;
    this.address = address;
    this.email = email;
    this.telephone = telephone;
    this.pays = pays;
    this.ville = ville;
    this.type = type;
  }

}
export enum TypePieceCommerciale {
  FACTURE = 'FACTURE',
  DEVIS = 'DEVIS'
}

// ligne-piece-commerciale.model.ts
export interface LignePieceCommerciale {
  id?: number;
  description: string;
  quantite: number;
  prixUnitaire: number;
  total?: number; // Peut être calculé automatiquement
  factureId?: number; // Optionnel car défini côté serveur
}
export enum StatutFacture {
  NON_PAYEE = 'NON_PAYEE',
  PARTIELLEMENT_PAYEE = 'PARTIELLEMENT_PAYEE',
  PAYEE = 'PAYEE',
  EN_ATTENTE = 'EN_ATTENTE'
}