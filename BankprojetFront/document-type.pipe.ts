import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'documentType'
})
export class DocumentTypePipe implements PipeTransform {
  transform(value: string): string {
    const types: {[key: string]: string} = {
      'OPERATION_BANCAIRE': 'Opération Bancaire',
      'PIECE_COMMERCIALE': 'Pièce Commerciale',
      'DEPENSE': 'Dépense'
    };
    return types[value] || value;
  }
}