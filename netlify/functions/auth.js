import { Issuer } from 'openid-client';

export async function handler(event) {
  console.log('Auth Initiation Event:', JSON.stringify(event, null, 2));
  
  try {
    const issuer = await Issuer.discover(process.env.MOJOAUTH_ISSUER || 'https://api.mojoauth.com');
    const client = new issuer.Client({
      client_id: process.env.MOJOAUTH_CLIENT_ID,
      client_secret: process.env.MOJOAUTH_CLIENT_SECRET,
      redirect_uris: [process.env.MOJOAUTH_REDIRECT_URI],
      response_types: ['code'],
    });
    
    // Get the redirect_uri from query parameters or use the default
    const customRedirectUri = event.queryStringParameters?.redirect_uri;

    // Generate authorization URL without a state parameter to simplify the flow
    // In production, you should use a state parameter for security
    const url = client.authorizationUrl({
      scope: process.env.MOJOAUTH_SCOPE || 'openid profile email',
      // Don't specify state, letting MojoAuth handle it
    });

    console.log('Authorization URL:', url);

    return {
      statusCode: 302,
      headers: {
        Location: url,
        'Cache-Control': 'no-cache, no-store'
      },
      body: '',
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'Failed to initialize authentication' }),
    };
  }
}
