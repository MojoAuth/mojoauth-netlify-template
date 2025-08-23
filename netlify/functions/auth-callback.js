import { Issuer } from 'openid-client';

export async function handler(event) {
  console.log('Auth Callback Event:', JSON.stringify(event, null, 2));
  
  try {
    const issuer = await Issuer.discover(process.env.MOJOAUTH_ISSUER || 'https://api.mojoauth.com');
    const client = new issuer.Client({
      client_id: process.env.MOJOAUTH_CLIENT_ID,
      client_secret: process.env.MOJOAUTH_CLIENT_SECRET,
      redirect_uris: [process.env.MOJOAUTH_REDIRECT_URI],
      response_types: ['code'],
    });
    
    // Get the callback parameters directly from the event
    const params = event.queryStringParameters || {};
    const code = params.code;
    const state = params.state;
    
    console.log('Auth Callback Parameters:', { code, state });
    
    if (!code) {
      throw new Error('Authorization code not found in the callback');
    }
    
    // Use the state parameter if available, otherwise skip validation
    // In production, you should validate the state parameter properly
    const tokenSet = await client.callback(
      process.env.MOJOAUTH_REDIRECT_URI,
      { code, state }, 
      { state: state || undefined } // Use the state if available
    );
    const userinfo = await client.userinfo(tokenSet.access_token);
    
    // Store token in cookie or session
    const redirectUrl = new URL(event.queryStringParameters?.redirect_uri || 'https://mojoauth.netlify.app/profile');
    redirectUrl.searchParams.set('token', tokenSet.access_token);
    
    // Clear the state cookie since we don't need it anymore
    return {
      statusCode: 302,
      headers: {
        Location: redirectUrl.toString(),
        'Set-Cookie': [
          `mojoauth_token=${tokenSet.access_token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=3600`,
          `mojoauth_state=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0` // Clear the state cookie
        ].join(', '),
        'Cache-Control': 'no-cache, no-store'
      },
      body: '',
    };
  } catch (error) {
    console.error('Auth callback error:', error);
    
    // Redirect to error page with error information
    const errorCode = error.name || 'AuthError';
    const errorDescription = error.message || 'Failed to process authentication callback';
    const redirectUrl = new URL('/error.html', process.env.URL || 'https://mojoauth.netlify.app');
    redirectUrl.searchParams.set('error', errorCode);
    redirectUrl.searchParams.set('error_description', errorDescription);
    
    return {
      statusCode: 302,
      headers: {
        Location: redirectUrl.toString(),
        'Cache-Control': 'no-cache, no-store'
      },
      body: '',
    };
  }
}
