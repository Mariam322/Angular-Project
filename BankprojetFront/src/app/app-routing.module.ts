import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { CompainComponent } from './compain/compain.component';
import { AccessDeniedComponent } from './access-denied/access-denied.component';
import { AddCompainComponent } from './add-compain/add-compain.component';

import { AdmintemplateComponent } from './admintemplate/admintemplate.component';
import { AuthGuard } from './guards/auth.guard';

import { MapComponent } from './map/map.component';
import { InvoiceComponent } from './invoice/invoice.component';
import { AnalyticsChartComponent } from './analytics-chart/analytics-chart.component';
import { LoginComponent } from './login/login.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { UserComponent } from './user/user.component';
import { TestComponent } from './test/test.component';
import { UtilisateurComponent } from './utilisateur/utilisateur.component';
import { HomeComponent } from './home/home.component';
import { CompteListComponent } from './compte-list/compte-list.component';
import { OperationBancaireComponent } from './operation-bancaire/operation-bancaire.component';
import { OmpaignListComponent } from './ompaign-list/ompaign-list.component';
import { ListeFactureComponent } from './liste-facture/liste-facture.component';
import { AddFactureComponent } from './add-facture/add-facture.component';
import { DocumentsComponent } from './documents/documents.component';
import { ReglementComponent } from './reglement/reglement.component';
import { AffectationComponent } from './affectation/affectation.component';
import { AffectationReglementComponent } from './affectation-reglement/affectation-reglement.component';
import { EmailsComponent } from './emails/emails.component';
import { GoogleCallbackComponent } from './google-callback/google-callback.component';
import { LoadingComponent } from './loading/loading.component';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { ListeDepenseComponent } from './liste-depense/liste-depense.component';
import { ProfileComponent } from './profile/profile.component';
import { EspaceUserComponent } from './espace-user/espace-user.component';




export const routes: Routes = [
 
    
{
      path:'admin',
      component:AdmintemplateComponent, 
},

     
        
        {
          path:'compain',
          component:CompainComponent,canActivate: [AuthGuard]
        },
    
        {
          path:'addCompain',
          component:AddCompainComponent,
        },
        {
          path:'Facture',
          component:InvoiceComponent,
        },
      
        {
          path: 'access-denied',
          component: AccessDeniedComponent,
          
        },
        {
          path: 'analytics',
          component:AnalyticsChartComponent,
          
        },
      
     
   
  
  {
      path:'login',
      component:LoginComponent, 
},
  {
      path:'listecompte',
      component:CompteListComponent ,canActivate: [AuthGuard]
},
{
      path:'forgot-password',
      component:ForgotPasswordComponent, 
},
  {
    path:'',
    component:HomeComponent
  },
   {
    path:'sidebar',
    component:SidebarComponent

  },
        {
    path:'test',
    component:TestComponent

  },
  {
    path:'map',
    component:MapComponent
  },
  {
path: 'comptes/:idCompte/operations',
component:OperationBancaireComponent
  },
  {
    path:'user',
    component:UtilisateurComponent,canActivate: [AuthGuard]
  },
     {
    path:'ListeCompany',
    component:OmpaignListComponent,canActivate: [AuthGuard]
  },
       {
    path:'ListeFacture',
    component:ListeFactureComponent,canActivate: [AuthGuard]
  },
     {
    path:'ListeDepense',
    component:ListeDepenseComponent,canActivate: [AuthGuard]
  },
   
      {
    path:'addFacture',
    component:AddFactureComponent,canActivate: [AuthGuard]
  },
       {
    path:'ListeDocuments',
    component:DocumentsComponent,canActivate: [AuthGuard]
  },
  {
    path: 'auth/google/callback',
    component: GoogleCallbackComponent
  },
  {
    path: 'emails',
    component: EmailsComponent
    
  },
  {
    path: 'loading',
    component: LoadingComponent
  },
       {
    path:'affectation',
    component:AffectationComponent
  },
   {
    path:'Reglement',
    component:ReglementComponent,canActivate: [AuthGuard]
  },
   {
    path:'espaceuser',
    component:EspaceUserComponent
  },
    {
    path:'ReglementAffectation',
    component:AffectationReglementComponent,
  },
     {
    path:'invoice',
    component:InvoiceComponent,
  },
    {
    path:'Profile',
    component:ProfileComponent,canActivate: [AuthGuard]
  },
  

 
  
 
 
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
