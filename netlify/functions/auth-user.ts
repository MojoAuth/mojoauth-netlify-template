import { Issuer } from 'openid-client';
import type { Handler } from '@netlify/functions';

// Helper function to validate required environment variables
function validateEnvVars(): { valid: boolean; missing: string[] } {
  const requiredVars = [
    { key: 'MOJOAUTH_CLIENT_ID', value: process.env.MOJOAUTH_CLIENT_ID },
    { key: 'MOJOAUTH_CLIENT_SECRET', value: process.env.MOJOAUTH_CLIENT_SECRET },
    { key: 'MOJOAUTH_REDIRECT_URI', value: process.env.MOJOAUTH_REDIRECT_URI }
  ];
  
  const missingVars = requiredVars
    .filter(v => !v.value)
    .map(v => v.key.toLowerCase().replace('mojoauth_', ''));
  
  return {
    valid: missingVars.length === 0,
    missing: missingVars
  };
}

export const handler: Handler = async (event, context) => {
  // Validate environment variables
  const envCheck = validateEnvVars();
  if (!envCheck.valid) {
    console.error('Missing required environment variables:', envCheck.missing);
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        error: 'Configuration error', 
        message: 'Missing required environment variables', 
        missing: envCheck.missing,
        redirect: `/config-error.html?missing=${envCheck.missing.join(',')}` 
      })
    };
  }

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
