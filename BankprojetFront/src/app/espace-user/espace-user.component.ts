import { Component } from '@angular/core';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
  selector: 'app-espace-user',
  standalone: true,
  imports: [SidebarComponent],
  templateUrl: './espace-user.component.html',
  styleUrl: './espace-user.component.css'
})
export class EspaceUserComponent {

}
