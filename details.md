# MojoAuth OIDC Authentication for Netlify

![MojoAuth Logo](/assets/mojoauth-logo.png)

## What is MojoAuth?

MojoAuth is a modern authentication service that provides secure, passwordless authentication options for your applications. With MojoAuth, you can easily implement email otp,magiclink social logins,passkeys, and more without managing complex authentication infrastructure.

## Features

- **Simple Integration**: Implement secure authentication in minutes
- **Hosted Login Pages**: Customizable UI that works on any device
- **Standard OIDC Support**: Uses industry-standard OpenID Connect protocols
- **Developer-Friendly**: Clean APIs and comprehensive documentation
- **Multiple Authentication Methods**: Email, Social, and more

## Getting Started

1. Create a MojoAuth account at [https://mojoauth.com](https://mojoauth.com)
2. Set up your OIDC application in the MojoAuth dashboard
3. Install this extension and configure your Client ID, Client Secret, and Redirect URI
4. Deploy your site with MojoAuth authentication enabled


### Authentication Flow

1. User clicks "Login with MojoAuth" and is redirected to the hosted login page
2. After successful authentication, MojoAuth redirects back to your site
3. The access token is securely stored and used to fetch user information
4. User is redirected to your application with authentication complete

## Documentation

For detailed documentation, visit [https://docs.mojoauth.com/hosted-login-page/](https://docs.mojoauth.com/hosted-login-page/)
