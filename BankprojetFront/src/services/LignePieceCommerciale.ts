// ligne-piece-commerciale.model.ts
export interface LignePieceCommerciale {
  id?: number;
  description: string;
  quantite: number;
  prixUnitaire: number;
  total: number;
  factureId?: number;
}