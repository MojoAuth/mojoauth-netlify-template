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
  // Validate environment variables
  const envCheck = validateEnvVars();
  if (!envCheck.valid) {
    console.error('Missing required environment variables:', envCheck.missing);
    return new Response(JSON.stringify({ 
      error: 'Configuration error', 
      message: 'Missing required environment variables', 
      missing: envCheck.missing,
      redirect: `/config-error.html?missing=${envCheck.missing.join(',')}` 
    }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  try {
    // Try to get token from various sources
    let token: string | null = null;
    
    // 1. From Authorization header
    const authHeader = req.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
    
    // 2. From cookies
    if (!token) {
      const cookieHeader = req.headers.get('Cookie');
      if (cookieHeader) {
        const cookieMatch = cookieHeader.match(/mojoauth_token=([^;]+)/);
        if (cookieMatch) {
          token = cookieMatch[1];
        }
      }
    }
    
    // 3. From query parameter (not recommended for production)
    if (!token) {
      const url = new URL(req.url);
      const queryToken = url.searchParams.get('token');
      if (queryToken) {
        token = queryToken;
      }
    }
    
    if (!token) {
      return new Response(JSON.stringify({ error: 'No authentication token provided' }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json'
        }
      });
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
    
    return new Response(JSON.stringify({ 
      user: userinfo,
      message: 'User profile retrieved successfully'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Error fetching user info:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch user information',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
});