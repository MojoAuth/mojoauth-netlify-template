import { Issuer } from 'openid-client';

export async function handler(event) {
  try {
    const issuer = await Issuer.discover(process.env.MOJOAUTH_ISSUER || 'https://api.mojoauth.com');
    const client = new issuer.Client({
      client_id: process.env.MOJOAUTH_CLIENT_ID,
      client_secret: process.env.MOJOAUTH_CLIENT_SECRET,
      redirect_uris: [process.env.MOJOAUTH_REDIRECT_URI],
      response_types: ['code'],
    });

    const url = client.authorizationUrl({
      scope: process.env.MOJOAUTH_SCOPE || 'openid profile email',
      state: event.queryStringParameters?.state || 'random-state',
    });

    return {
      statusCode: 302,
      headers: {
        Location: url,
      },
      body: '',
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}
