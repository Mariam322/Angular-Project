import { AuthConfig } from 'angular-oauth2-oidc';

export const authConfig: AuthConfig = {
  issuer: 'https://esmm.systeo.tn/realms/projectPFE',
  clientId: 'app-pfeFront',
  redirectUri: window.location.origin ,
  responseType: 'code',
  strictDiscoveryDocumentValidation: true,
  scope: 'openid profile roles email',
  requireHttps: true,
  disablePKCE: false, // PKCE activé
  tokenEndpoint: 'https://esmm.systeo.tn/realms/projectPFE/protocol/openid-connect/token',
 // userinfoEndpoint: 'https://key.systeo.tn/realms/projectPFE/protocol/openid-connect/userinfo',
  //logoutUrl: 'https://key.systeo.tn/realms/projectPFE/protocol/openid-connect/logout',
 customQueryParams: {
    audience: 'app-projectPFE' // Force l'audience
  }
};