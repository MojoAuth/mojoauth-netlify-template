import { Issuer } from 'openid-client';
import type { Handler } from '@netlify/functions';

export const handler: Handler = async (event, context) => {
  console.log('Auth Callback Event:', JSON.stringify(event, null, 2));
  
  try {
    const issuer = await Issuer.discover(process.env.MOJOAUTH_ISSUER || 'https://api.mojoauth.com');
    const client = new issuer.Client({
      client_id: process.env.MOJOAUTH_CLIENT_ID as string,
      client_secret: process.env.MOJOAUTH_CLIENT_SECRET as string,
      redirect_uris: [process.env.MOJOAUTH_REDIRECT_URI as string],
      response_types: ['code'],
    });
    
    // Get the callback parameters directly from the event
    const params = event.queryStringParameters || {};
    const code = params.code;
    const state = params.state;
    
    console.log('Auth Callback Parameters:', { code, state });
    
    if (!code) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing code parameter' })
      };
    }
    
    // Exchange code for tokens
    const tokenSet = await client.callback(
      process.env.MOJOAUTH_REDIRECT_URI as string,
      params as Record<string, string>
    );
    
    console.log('Token Set:', JSON.stringify(tokenSet, null, 2));
    
    // Set the access token as a cookie
    // You can adjust the expiration time as needed
    const cookie = `mojoauth_token=${tokenSet.access_token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=3600;`;
    
    // Check for custom redirection after successful authentication
    const redirectTo = params.redirect_to || '/profile.html';
    
    // Redirect to the profile page with token in query (just for demo purposes)
    // In a production application, you should rely only on the secure HttpOnly cookie
    return {
      statusCode: 302,
      headers: {
        // Type assertion to fix the Set-Cookie type issue
        'Set-Cookie': cookie,
        'Cache-Control': 'no-cache',
        'Location': `${redirectTo}?token=${tokenSet.access_token}`
      } as Record<string, string>,
      body: ''
    };
  } catch (error) {
    console.error('Error in auth-callback function:', error);
    return {
      statusCode: 302,
      headers: {
        'Location': '/error.html?error=auth_error&error_description=' + encodeURIComponent('Failed to authenticate with MojoAuth')
      },
      body: ''
    };
  }
};
