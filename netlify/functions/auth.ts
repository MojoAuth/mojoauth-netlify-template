import { Issuer, Client } from 'openid-client';
import type { Handler } from '@netlify/functions';

export const handler: Handler = async (event, context) => {
  console.log('Auth Initiation Event:', JSON.stringify(event, null, 2));
  
  try {
    const issuer = await Issuer.discover(process.env.MOJOAUTH_ISSUER || 'https://api.mojoauth.com');
    const client = new issuer.Client({
      client_id: process.env.MOJOAUTH_CLIENT_ID as string,
      client_secret: process.env.MOJOAUTH_CLIENT_SECRET as string,
      redirect_uris: [process.env.MOJOAUTH_REDIRECT_URI as string],
      response_types: ['code'],
    });
    
    // Get the redirect_uri from query parameters or use the default
    const customRedirectUri = event.queryStringParameters?.redirect_uri;

    // Generate authorization URL without a state parameter to simplify the flow
    // In production, you should use a state parameter for security
    const url = client.authorizationUrl({
      scope: 'openid email profile',
      ...(customRedirectUri && { redirect_uri: customRedirectUri })
    });
    
    return {
      statusCode: 302,
      headers: {
        Location: url
      },
      body: ''
    };
  } catch (error) {
    console.error('Error in auth function:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to initiate authentication' })
    };
  }
};
