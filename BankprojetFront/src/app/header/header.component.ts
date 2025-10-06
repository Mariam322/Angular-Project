import { Component,Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit{
 @Input() title: string = 'Tableau de bord';
  username: string | null = null;
  ngOnInit(): void {
    const userProfileString = localStorage.getItem("user_profile");

    if (userProfileString) {
      
        const userProfile = JSON.parse(userProfileString);
        this.username = userProfile?.preferred_username || null;
        if(this.username){
        localStorage.setItem("username",this.username);}
       
    } else {
      console.warn("User profile not found in localStorage.");
      this.username = null; 
    }
  }
}