import { TypeClientFournisseur } from "./type-client-fournisseur";

export class compain {
    id!: number;
    reference!: string;
    nom!: string;
    address!: string;
    email!: string;
    telephone!: string;
    pays!: string;
    ville!: string;
    type!: TypeClientFournisseur;  
    createdAt!: Date;
    updatedAt!: Date;

    constructor(
        id: number,
        reference: string,
        nom: string,
        address: string,
        email: string,
        telephone: string,
        pays: string,
        ville: string,
        type: TypeClientFournisseur,
        createdAt: Date,
        updatedAt: Date
    ) {
        this.id = id;
        this.reference = reference;
        this.nom = nom;
        this.address = address;
        this.email = email;
        this.telephone = telephone;
        this.pays = pays;
        this.ville = ville;
        this.type = type;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}
