import { withNetlifySDKContext } from "@netlify/sdk/ui/functions";
import { Issuer, Client } from 'openid-client';

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
  console.log('Auth Initiation Request:', req.url);
  
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
    
    // Get the redirect_uri from URL parameters or use the default
    const url = new URL(req.url);
    const customRedirectUri = url.searchParams.get('redirect_uri');

    const authUrl = client.authorizationUrl({
      scope: 'openid profile email',
      redirect_uri: customRedirectUri || process.env.MOJOAUTH_REDIRECT_URI,
    });
    
    console.log('Redirecting to authorization URL:', authUrl);

    return new Response(null, {
      status: 302,
      headers: {
        'Location': authUrl
      }
    });
  } catch (error) {
    console.error('Error initiating auth:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to initiate authentication',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
});