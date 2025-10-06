import { ModePaiement } from "./ModePaiement";
import { TypeClientFournisseur } from "./type-client-fournisseur";


export interface Reglement {
  id: number;
  dateReglement: string; // ou Date si vous préférez
  montantReglemnt: number;
  modePaiement: ModePaiement;
  description: string;
  reference: string;
  nom: string;
  address: string;
  email: string;
  telephone: string;
  pays: string;
  ville: string;
  type: TypeClientFournisseur;
  createdAt: string; // ou Date
    idCompaign?: number;
 
}