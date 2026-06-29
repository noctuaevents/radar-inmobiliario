exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let email;
  try {
    ({ email } = JSON.parse(event.body || '{}'));
  } catch {
    return { statusCode: 400, body: 'Bad Request' };
  }

  if (!email) return { statusCode: 400, body: 'Email required' };

  const PUB_ID  = process.env.BEEHIIV_PUB_ID;
  const API_KEY = process.env.BEEHIIV_API_KEY;

  try {
    const res = await fetch(
      `https://api.beehiiv.com/v2/publications/${PUB_ID}/subscriptions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `ApiKey ${API_KEY}`,
        },
        body: JSON.stringify({ email, reactivate_existing: false, send_welcome_email: true }),
      }
    );
    return { statusCode: res.ok ? 200 : 502, body: res.ok ? 'ok' : 'upstream_error' };
  } catch {
    return { statusCode: 502, body: 'fetch_error' };
  }
};
