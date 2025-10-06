

export class compte {
    idCompte!: number;
    numeroCompte!: string;
    nomBanque!: string;
    

    constructor(
        idCompte: number,
        numeroCompte: string,
        nomBanque: string,
       
    ) {
        this.idCompte = idCompte;
        this.numeroCompte = numeroCompte;
        this.nomBanque = nomBanque;
       
    }
}
