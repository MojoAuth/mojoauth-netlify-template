import { withNetlifySDKContext } from "@netlify/sdk/ui/functions";
import { Issuer } from 'openid-client';

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

export default withNetlifySDKContext(async (req, context) => {
  console.log('Auth Callback Request:', req.url);
  
  // Validate environment variables
  const envCheck = validateEnvVars();
  if (!envCheck.valid) {
    console.error('Missing required environment variables:', envCheck.missing);
    return new Response(null, {
      status: 302,
      headers: {
        'Location': `/config-error.html?missing=${envCheck.missing.join(',')}`
      }
    });
  }
  
  try {
    const issuer = await Issuer.discover(process.env.MOJOAUTH_ISSUER || 'https://api.mojoauth.com');
    const client = new issuer.Client({
      client_id: process.env.MOJOAUTH_CLIENT_ID as string,
      client_secret: process.env.MOJOAUTH_CLIENT_SECRET as string,
      redirect_uris: [process.env.MOJOAUTH_REDIRECT_URI as string],
      response_types: ['code'],
    });
    
    // Get the callback parameters from URL
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    
    console.log('Auth Callback Parameters:', { code, state });
    
    if (!code) {
      return new Response(JSON.stringify({ error: 'Missing code parameter' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    // Convert URL search params to object for callback
    const params: Record<string, string> = {};
    url.searchParams.forEach((value, key) => {
      params[key] = value;
    });
    
    // Exchange code for tokens
    const tokenSet = await client.callback(
      process.env.MOJOAUTH_REDIRECT_URI as string,
      params
    );
    
    console.log('Token Set:', JSON.stringify(tokenSet, null, 2));
    
    // Set the access token as a cookie
    const cookie = `mojoauth_token=${tokenSet.access_token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=3600;`;
    
    // Check for custom redirection after successful authentication
    const redirectTo = url.searchParams.get('redirect_to') || '/profile.html';
    
    // Redirect to the profile page
    return new Response(null, {
      status: 302,
      headers: {
        'Location': redirectTo,
        'Set-Cookie': cookie
      }
    });

  } catch (error) {
    console.error('Callback error:', error);
    return new Response(null, {
      status: 302,
      headers: {
        'Location': `/error.html?error=${encodeURIComponent(error instanceof Error ? error.message : 'Authentication failed')}`
      }
    });
  }
});