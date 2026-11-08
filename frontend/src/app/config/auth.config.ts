import { PassedInitialConfig } from 'angular-auth-oidc-client';

// Cognito emule par Floci, vu depuis le navigateur : tout passe par Nginx (location /cognito/),
// meme domaine => pas de CORS. Nginx retire le prefixe /cognito/ et transmet a Floci (floci-floci-1:4566).
// On donne les endpoints a la main : le document de decouverte de Floci annonce des URLs
// en https://floci:4566/... que le navigateur ne sait pas joindre.
const origin = window.location.origin;
const issuer = 'https://floci:4566/us-east-1_20e166391'; // = champ "iss" des jetons (a confirmer avec un vrai jeton)

export const authConfig: PassedInitialConfig = {
  config: {
    authority: issuer,
    authWellknownEndpoints: {
      issuer: issuer,
      authorizationEndpoint: origin + '/cognito/cognito-idp/oauth2/authorize',
      tokenEndpoint:         origin + '/cognito/cognito-idp/oauth2/token',
      userInfoEndpoint:      origin + '/cognito/cognito-idp/oauth2/userInfo',
      jwksUri:               origin + '/cognito/us-east-1_20e166391/.well-known/jwks.json',
      // pas de endSessionEndpoint : Floci n'en annonce pas
    },

    // Doit etre declaree dans Terraform : callback_urls et logout_urls = https://www.websitetemplate.test
    redirectUrl: origin,
    postLogoutRedirectUri: origin,

    // Sortie Terraform : cognito_client_id
    clientId: '81ac8883c17c4f8b834d71e901',

    // Cognito ne connait pas "offline_access" (invalid_scope)
    scope: 'openid profile email',

    responseType: 'code',
    silentRenew: true,
    useRefreshToken: true,
    renewTimeBeforeTokenExpiresInSeconds: 30,
  }
}
