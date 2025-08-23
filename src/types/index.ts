export interface MojoAuthConfig {
  clientId: string;
  clientSecret: string;
  issuer: string;
  redirectUri: string;
  scope?: string;
}

export interface MojoAuthState {
  isConfigured: boolean;
  isEnabled: boolean;
  clientId: string;
  clientSecret: string;
  issuer: string;
  redirectUri: string;
  scope: string;
}

export interface UserInfo {
  sub: string;
  name?: string;
  email?: string;
  picture?: string;
  email_verified?: boolean;
}
