# MojoAuth Netlify Extension

This extension integrates MojoAuth's hosted login page with your Netlify site using the standard OIDC flow. It provides a clean, developer-friendly UI/UX for setting up and managing authentication on your Netlify sites.

## Features

- Easy integration with MojoAuth's hosted login page
- Standard OIDC flow support
- Automatic configuration of environment variables
- Function generation for authentication endpoints
- Intuitive UI for setting up and managing authentication

## Getting Started 🚀

Follow these steps to clone the repository and start using the app.

### Prerequisites

- An account on [MojoAuth](https://mojoauth.com/).
- Node.js v16+
- npm or yarn
- A Netlify account

### Clone the Repository

Start by cloning the repository to your local machine:

```bash
git clone https://github.com/MojoAuth/mojoauth-netlify-template
cd mojoauth-netlify-template
```

### TypeScript Support

This template now includes TypeScript support for the Netlify functions. See [TYPESCRIPT.md](TYPESCRIPT.md) for details on the TypeScript implementation.

### Installation

```bash
# Install dependencies
npm i

npm install netlify-cli -g

# Start development server
npm run dev:open
```

### Connect To Netlify

The Netlify initialization script will walk you through how to connect to a new or existing Netlify project.

```bash
netlify init
```
or, connect to Netlify by clicking the button below:

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/MojoAuth/mojoauth-netlify-template)


### Configuration

The extension requires the following environment variables:

- `MOJOAUTH_CLIENT_ID`: Your MojoAuth client ID
- `MOJOAUTH_CLIENT_SECRET`: Your MojoAuth client secret
- `MOJOAUTH_ISSUER`: MojoAuth OIDC issuer URL (typically https://{your project}.auth.mojoauth.com)
- `MOJOAUTH_REDIRECT_URI`: Your application's redirect URI


## How It Works

This extension creates three serverless functions in your Netlify site:

1. **auth.ts**: Initiates the authentication flow and redirects to MojoAuth's hosted login page
2. **auth-callback.ts**: Handles the callback from MojoAuth after successful authentication
3. **auth-user.ts**: Provides user profile information based on the access token

### Authentication Flow

1. User clicks "Login with MojoAuth" and is redirected to the hosted login page
2. After successful authentication, MojoAuth redirects back to your site
3. The access token is securely stored and used to fetch user information
4. User is redirected to your application with authentication complete

### Error Handling

The application includes built-in error handling for common issues:

1. **Configuration Errors**: If environment variables are missing, users will see a user-friendly error page explaining which variables need to be set up and how to fix the issue.
2. **Authentication Errors**: If authentication fails, users are redirected to an error page with details.
3. **Token Errors**: If the access token is invalid or expired, users are prompted to log in again.

## Resources

- [MojoAuth Documentation](https://docs.mojoauth.com/)
- [Netlify Documentation](https://docs.netlify.com/)
- [OpenID Connect Documentation](https://openid.net/connect/)
