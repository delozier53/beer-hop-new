// drizzle.config.ts
import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error('Missing DATABASE_URL in <project root>/.env');
}

export default defineConfig({
  dialect: 'postgresql',              // <-- required in new API
  schema: './shared/schema.ts',
  out: './drizzle',
  dbCredentials: {
    url,                              // expects ?sslmode=require in the URL
    // If your network still injects a self-signed cert, keep this line:
    ssl: { rejectUnauthorized: false },
  },
  strict: true,
  verbose: true,
});
