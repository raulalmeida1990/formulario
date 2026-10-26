const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || `postgres://${process.env.DB_USER || 'postgres'}:${process.env.DB_PASSWORD || 'postgres'}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'farmacia_leads'}`,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('Erro inesperado no cliente PostgreSQL inativo:', err);
});

async function initDb() {
  const query = `
    CREATE TABLE IF NOT EXISTS leads (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      institution_name VARCHAR(255) NOT NULL,
      location VARCHAR(255) NOT NULL,
      contact_name VARCHAR(255) NOT NULL,
      role VARCHAR(100) NOT NULL,
      email VARCHAR(255) NOT NULL,
      phone VARCHAR(50) NOT NULL,
      primary_interest VARCHAR(100),
      pin VARCHAR(10) NOT NULL,
      rgpd_consent BOOLEAN NOT NULL DEFAULT TRUE,
      user_agent TEXT,
      ip_address VARCHAR(100),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_leads_pin ON leads(pin);
    CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
  `;

  try {
    const client = await pool.connect();
    try {
      await client.query(query);
      console.log('✓ Base de dados PostgreSQL inicializada (tabela "leads" pronta).');
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Aviso ao inicializar a BD PostgreSQL:', error.message);
    console.log('A aplicação continuará a aguardar que a BD esteja acessível.');
  }
}

module.exports = {
  pool,
  initDb,
};
