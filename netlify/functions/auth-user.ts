import { Issuer } from 'openid-client';
import type { Handler } from '@netlify/functions';

export const handler: Handler = async (event, context) => {
  try {
    // Try to get token from various sources
    let token: string | null = null;
    
    // 1. From Authorization header
    if (event.headers.authorization && event.headers.authorization.startsWith('Bearer ')) {
      token = event.headers.authorization.substring(7);
    }
    
    // 2. From cookies
    if (!token && event.headers.cookie) {
      const cookieMatch = event.headers.cookie.match(/mojoauth_token=([^;]+)/);
      if (cookieMatch) {
        token = cookieMatch[1];
      }
    }
    
    // 3. From query parameter (not recommended for production)
    if (!token && event.queryStringParameters?.token) {
      token = event.queryStringParameters.token;
    }
    
    if (!token) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'No authentication token provided' })
      };
    }
    
    // Fetch userinfo using the token
    const issuer = await Issuer.discover(process.env.MOJOAUTH_ISSUER || 'https://api.mojoauth.com');
    const client = new issuer.Client({
      client_id: process.env.MOJOAUTH_CLIENT_ID as string,
      client_secret: process.env.MOJOAUTH_CLIENT_SECRET as string,
      redirect_uris: [process.env.MOJOAUTH_REDIRECT_URI as string],
      response_types: ['code'],
    });
    
    const userinfo = await client.userinfo(token);
    
    // Add the issuer info to the response
    const enrichedUserInfo = {
      ...userinfo,
      _issuer: {
        name: issuer.name,
        issuer: issuer.issuer,
        authorization_endpoint: issuer.authorization_endpoint,
        token_endpoint: issuer.token_endpoint,
        userinfo_endpoint: issuer.userinfo_endpoint
      }
    };
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(enrichedUserInfo)
    };
  } catch (error) {
    console.error('Error fetching user data:', error);
    return {
      statusCode: 401,
      body: JSON.stringify({ 
        error: 'Failed to authenticate token',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};
