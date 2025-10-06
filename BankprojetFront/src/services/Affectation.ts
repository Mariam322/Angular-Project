import { TypePieceCommerciale } from "./Facture";
import { Reglement } from "./Reglement";
import { TypeClientFournisseur } from "./type-client-fournisseur";
import { AffectationType } from './AffectationType';

// affectation.model.ts
export interface Affectation {
  id?: number;
  montantAffectation: number;
  dateAffectation: Date;
  reglement?: Reglement;
  numeroFacture?: string;
  dateFacture?: Date;
  datePaiement?: Date;
  montantHt?: number;
  tva?: number;
  montantTtc?: number;
  remise?: number;
  statut?: string;
  type?: TypePieceCommerciale;
  dateOperation?: Date;
  numCheque?: string;
  debit?: number;
  credit?: number;
  numDepense?: string;
  dateDepense?: Date;
  typeaffect?: AffectationType ;
  datePaiementDepense?: Date;
  dateReceptionDepense?: Date;
  montantHtDepense?: number;
  tvaDepense?: number;
  montantTtcDepense?: number;
  totalGeneralDepense?: number;
   idPieceCommercial?:number;
    idOperationBancaire:number;
    idDepense:number;
  
}

