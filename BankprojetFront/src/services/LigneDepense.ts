// ligne-depense.model.ts
export interface LigneDepense {
  id?: number;
  designation: string;
  quantite: number;
  prix: number;
  total?: number; // Peut être calculé automatiquement
  depenseId?: number; // Optionnel car défini côté serveur
}