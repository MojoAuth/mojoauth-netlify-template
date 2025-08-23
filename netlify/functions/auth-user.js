import { Issuer } from 'openid-client';

export async function handler(event) {
  try {
    // Try to get token from various sources
    let token = null;
    
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
    
    // 3. From query parameter (less secure, but useful for testing)
    if (!token && event.queryStringParameters?.token) {
      token = event.queryStringParameters.token;
    }
    
    if (!token) {
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'No authentication token provided' }),
      };
    }

    const issuer = await Issuer.discover(process.env.MOJOAUTH_ISSUER || 'https://api.mojoauth.com');
    const client = new issuer.Client({
      client_id: process.env.MOJOAUTH_CLIENT_ID,
      client_secret: process.env.MOJOAUTH_CLIENT_SECRET,
      redirect_uris: [process.env.MOJOAUTH_REDIRECT_URI],
      response_types: ['code'],
    });

    const userinfo = await client.userinfo(token);
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify(userinfo),
    };
  } catch (error) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: error.message || 'Failed to retrieve user information' }),
    };
  }
}
