import { Component } from '@angular/core';
import { Router } from '@angular/router';
@Component({
  selector: 'app-loading',
  template: `<p>Redirection en cours...</p>`
})
export class LoadingComponent {
 constructor(private router: Router) {}

  ngOnInit() {
    setTimeout(() => {
      this.router.navigate(['/']);
    }, 2000);
  }
}
