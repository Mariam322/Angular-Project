import { Component } from '@angular/core';

@Component({
  selector: 'app-test',
  standalone: true,
  imports: [],
  templateUrl: './test.component.html',
  styleUrl: './test.component.css'
})
export class TestComponent {
section: number = 1;

  setSection(section: number): void {
    this.section = section;
  }

  back(): void {
    this.section = 1;
  }

}
