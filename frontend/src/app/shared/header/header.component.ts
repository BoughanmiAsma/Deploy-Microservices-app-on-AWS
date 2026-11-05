import {Component, inject, OnInit} from '@angular/core';
import {OidcSecurityService} from "angular-auth-oidc-client";
import {RouterLink} from "@angular/router";
import {CommonModule} from "@angular/common";

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit {

  private readonly oidcSecurityService = inject(OidcSecurityService);
  isAuthenticated = false;
  username = "";
  displayName = "";
  mobileMenuOpen = false;
  isSeller = false;
  isBuyer = false;
  roles: string[] = [];

  ngOnInit(): void {
    this.oidcSecurityService.isAuthenticated$.subscribe(
      ({isAuthenticated}) => {
        this.isAuthenticated = isAuthenticated;
      }
    );
    this.oidcSecurityService.userData$.subscribe(
      ({userData}) => {
        this.username = userData?.preferred_username ?? '';
        this.displayName = userData?.given_name 
          ? `${userData.given_name} ${userData?.family_name ?? ''}`.trim() 
          : (userData?.preferred_username ?? 'Membre');
        
        // Extract realm roles or resource roles
        const realmRoles: string[] = userData?.realm_access?.roles || [];
        const clientRoles: string[] = userData?.resource_access?.['angular-client']?.roles || [];
        this.roles = [...realmRoles, ...clientRoles];
        
        // User is seller if they have SELLER role, or if username is boughanmiasma (admin/seller)
        this.isSeller = this.roles.includes('SELLER') || this.username === 'boughanmiasma';
        this.isBuyer = this.roles.includes('BUYER') || !this.isSeller || this.roles.length === 0;
      }
    );
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  login(): void {
    this.oidcSecurityService.authorize();
  }

  logout(): void {
    this.oidcSecurityService
      .logoff()
      .subscribe((result) => console.log(result));
  }
}
