import 'dotenv/config';

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  opensky: {
    clientId: process.env.OPENSKY_CLIENT_ID || '',
    clientSecret: process.env.OPENSKY_CLIENT_SECRET || '',
    baseUrl: 'https://opensky-network.org/api',
  },

  acled: {
    apiKey: process.env.ACLED_API_KEY || '',
    email: process.env.ACLED_EMAIL || '',
    baseUrl: 'https://api.acleddata.com/acled/read',
  },

  aviationstack: {
    apiKey: process.env.AVIATIONSTACK_API_KEY || '',
    baseUrl: 'https://api.aviationstack.com/v1',
  },
} as const;
