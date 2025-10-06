import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/services/auth.service';
import { TestComponent } from "../test/test.component";
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent implements OnInit {
  username: string | null = null;
    constructor(private authService:AuthService,
    private router:Router,private dialog: MatDialog 
    
  ){}
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


  logout(){
    this.authService.logout();
    this.router.navigate(['/login']);
  }

 
}
