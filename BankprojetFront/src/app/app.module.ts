import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { OAuthModule, OAuthStorage } from 'angular-oauth2-oidc';
import { JwtModule } from '@auth0/angular-jwt';

// Supprimez l'import KeycloakAngularModule si vous utilisez angular-oauth2-oidc
// import { KeycloakAngularModule } from 'keycloak-angular';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CompainComponent } from './compain/compain.component';
import { MatDialogModule } from '@angular/material/dialog';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AddCompainComponent } from './add-compain/add-compain.component';
import { AdmintemplateComponent } from './admintemplate/admintemplate.component';
import { AuthGuard } from './guards/auth.guard';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { GoogleAuthService } from 'src/services/googleAuthSerivce';
import { DatePipe } from '@angular/common';
import { GoogleAuthInterceptor } from './core/interceptors/google-auth.interceptor';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

export function storageFactory(): OAuthStorage {
  return localStorage;
}

@NgModule({
  declarations: [
    AppComponent,
   
    CompainComponent,

   
    AddCompainComponent,
    AdmintemplateComponent,
  
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    MatDialogModule,
    FormsModule,
    ReactiveFormsModule,
     BrowserAnimationsModule,
    
    // KeycloakAngularModule, // À supprimer si vous n'utilisez pas keycloak-angular
    MatProgressSpinnerModule,
    OAuthModule.forRoot({
      resourceServer: {
        allowedUrls: ['https://m1.systeo.tn'],
        sendAccessToken: true
      }
    }),


    
  ],
  providers: [
    AuthGuard,
    DatePipe,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: GoogleAuthInterceptor,
      multi: true
    },
    GoogleAuthService
 
    
    // Ajoutez votre intercepteur dans les deux cas
  ],

  bootstrap: [AppComponent]
})
export class AppModule { }