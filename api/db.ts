import { Pool } from 'pg';

// Configuração do pool PostgreSQL para Vercel Functions
const pool = new Pool({
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || '4c6c4d5fb548a9cb',
  host: process.env.POSTGRES_HOST || 'postgres.platform.sinesys.app',
  port: parseInt(process.env.POSTGRES_PORT || '15432'),
  database: process.env.POSTGRES_DB || 'postgres',
  ssl: false,
  // Configurações para Vercel Functions
  max: 1,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

export { pool };