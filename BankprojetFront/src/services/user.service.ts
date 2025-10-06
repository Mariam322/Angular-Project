import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, delay, map, Observable, retry, switchMap, tap, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {
private keycloakUrl = '/api';
  private realm = 'projectPFE';
constructor(private http: HttpClient,private authService: AuthService) {}

// Obtenir la liste des utilisateurs
  getUsers(): Observable<any[]> {
    const url = `${this.keycloakUrl}/admin/realms/${this.realm}/users`;
    const headers = this.getAdminHeaders();

    return this.http.get<any[]>(url, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  // Méthode complète pour créer un utilisateur avec rôle et groupe
createUserWithRole(userData: any, roleName: string): Observable<any> {
  console.log('Tentative de création utilisateur avec:', { userData, roleName });

  return this.createUser(userData).pipe(
    catchError(err => {
      if (err.status === 409) {
        return throwError(() => new Error('Un utilisateur avec ce nom ou email existe déjà'));
      }
      return throwError(() => new Error('Erreur lors de la création de l\'utilisateur'));
    }),
    delay(1000), // Attente pour la synchronisation Keycloak
    switchMap(() => {
      console.log('Recherche de l\'utilisateur créé...');
      return this.getUserByUsername(userData.username).pipe(
        retry(3), // 3 tentatives en cas d'échec
        catchError(err => {
          console.error('Erreur recherche utilisateur:', err);
          return throwError(() => new Error('L\'utilisateur a été créé mais n\'est pas encore accessible'));
        })
      );
    }),
    switchMap(user => {
      if (!user || !user.id) {
        return throwError(() => new Error('Données utilisateur incomplètes'));
      }
      
      return this.getRoles().pipe(
        switchMap(roles => {
          const role = roles.find(r => r.name === roleName);
          if (!role) {
            return throwError(() => new Error(`Rôle ${roleName} introuvable`));
          }
          return this.assignRoleToUser(user.id, role);
        }),
        catchError(err => {
          console.error('Erreur assignation rôle:', err);
          return throwError(() => new Error('Utilisateur créé mais échec de l\'assignation du rôle'));
        })
      );
    }),
    catchError(error => {
      console.error('Erreur globale:', error);
      return throwError(() => error); // Propagation de l'erreur originale
    })
  );
}
deleteUser(userId: string): Observable<any> {
    const url = `${this.keycloakUrl}/admin/realms/${this.realm}/users/${userId}`;
    const headers = this.getAdminHeaders();
    return this.http.delete(url, { headers }).pipe(
      catchError(this.handleError)
    );
}
// Trouver un utilisateur par son username
getUserByUsername(username: string): Observable<any> {
  const url = `${this.keycloakUrl}/admin/realms/${this.realm}/users?username=${encodeURIComponent(username)}`;
  const headers = this.getAdminHeaders();
  
  return this.http.get<any[]>(url, { headers }).pipe(
      map(users => {
          const user = users.find(u => u.username === username);
          if (!user) {
              throw new Error('Utilisateur non trouvé');
          }
          return user;
      }),
      catchError(this.handleError)
  );
}

 // Obtenir la liste des rôles
  getRoles(): Observable<any[]> {
    const url = `${this.keycloakUrl}/admin/realms/${this.realm}/roles`;
    const headers = this.getAdminHeaders();

    return this.http.get<any[]>(url, { headers }).pipe(
      catchError((error) => {
        console.error('Error fetching roles:', error);
        return throwError(() => new Error('Failed to load roles. Please check your permissions.'));
      })
    );
  }

  // Assigner un rôle à un utilisateur
  assignRoleToUser(userId: string, role: any): Observable<any> {
    const url = `${this.keycloakUrl}/admin/realms/${this.realm}/users/${userId}/role-mappings/realm`;
    const headers = this.getAdminHeaders();

    return this.http.post(url, [role], { headers }).pipe(
      catchError(this.handleError)
    );
  }

  
updateUser(
  userId: string,
  userData: {
    id?: string,
    username: string,
    firstName?: string,
    lastName?: string,
    email: string,
    enabled?: boolean
  },
  options?: {
    partialUpdate?: boolean,
    enabled?: boolean
  }): Observable<any> {
  const url = `${this.keycloakUrl}/admin/realms/${this.realm}/users/${userId}`;
  const headers = this.getAdminHeaders();

  // Si partialUpdate est true, on récupère d'abord les données existantes
  if (options?.partialUpdate) {
    return this.http.get<any>(url, { headers }).pipe(
      catchError(this.handleError),
      switchMap(existingUser => {
        const payload = {
          ...existingUser, // Conserve toutes les propriétés existantes
          ...userData,     // Écrase avec les nouvelles valeurs
          id: userId,     // Garantit que l'ID est correct
          enabled: options?.enabled !== undefined 
            ? options.enabled 
            : userData.enabled !== undefined 
              ? userData.enabled 
              : existingUser.enabled
        };

        return this.http.put(url, payload, { headers }).pipe(
          catchError(this.handleError)
        );
      })
    );
  }

  // Pour une mise à jour complète (non partielle)
  const payload = {
    ...userData,
    id: userId,
    username: userData.username,
    email: userData.email,
    enabled: options?.enabled !== undefined 
      ? options.enabled 
      : userData.enabled !== undefined 
        ? userData.enabled 
        : true
  };

  return this.http.put(url, payload, { headers }).pipe(
    catchError(this.handleError)
  );
}
 
//obtenir les roles d'un user 
  getUserRoles(userId: string): Observable<any[]> {
    const url = `${this.keycloakUrl}/admin/realms/${this.realm}/users/${userId}/role-mappings/realm`;
    const headers = this.getAdminHeaders();
    return this.http.get<any[]>(url, { headers }).pipe(
      catchError(this.handleError)
    );
  }
   // Méthode privée pour obtenir les headers avec le token d'admin
  private getAdminHeaders(): HttpHeaders {
    const token = this.authService.getAccessToken();
    if (!token) {
      throw new Error('No access token available');
    }

    return new HttpHeaders({
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`
      // Ne pas inclure 'Content-Type' pour les requêtes GET
    });
  }

  // Gestion des erreurs
  private handleError(error: any): Observable<never> {
    console.error('An error occurred:', error);
    return throwError(() => new Error('Something went wrong; please try again later.'));
  }
  // Créer un nouvel utilisateur
  createUser(userData: any): Observable<any> {
    const url = `${this.keycloakUrl}/admin/realms/${this.realm}/users`;
    const headers = this.getAdminHeaders();

    return this.http.post(url, userData, { headers }).pipe(
      catchError(this.handleError)
    );
  }
   getUserById(id: string): Observable<any> {
  const url = `${this.keycloakUrl}/admin/realms/${this.realm}/users/${id}`;
  const headers = this.getAdminHeaders();

  return this.http.get<any>(url, { headers }).pipe(
    catchError(this.handleError)
  );
}
resetUserPassword(userId: string, newPassword: string, temporary: boolean = true): Observable<any> {
  const url = `${this.keycloakUrl}/admin/realms/${this.realm}/users/${userId}/reset-password`;
  const headers = this.getAdminHeaders();

  const payload = {
    type: "password",
    value: newPassword,
    temporary: temporary
  };

  return this.http.put(url, payload, { headers }).pipe(
    catchError(this.handleError)
  );
}


}
