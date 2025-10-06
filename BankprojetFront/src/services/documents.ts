import { TypeDocument } from "./TypeDocument";

export class compte {
   id!: number;
    nomfichier!: string;
    contenuPdf!: Uint8Array;  // équivalent à byte[] en Java
    type!: TypeDocument;
    filepath!: string;
    dateAjout!: Date;
    driveFileId!: string;
    factureId!: number;
    depsneId!: number;
    operationId!: number;

    constructor(
        id: number,
        nomfichier: string,
        contenuPdf: Uint8Array,
        type: TypeDocument,
        dateAjout: Date,
        filepath: string,
        
        driveFileId: string,
        factureId: number,
        depsneId: number,
        operationId: number
    ) {
        this.id = id;
        this.nomfichier = nomfichier;
        this.contenuPdf = contenuPdf;
        this.type = type;
        this.filepath = filepath;
        this.dateAjout = dateAjout;
        this.driveFileId = driveFileId;
        this.factureId = factureId;
        this.depsneId = depsneId;
        this.operationId = operationId;
    }
}