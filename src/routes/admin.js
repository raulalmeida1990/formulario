const express = require('express');
const basicAuth = require('express-basic-auth');
const path = require('path');
const { pool } = require('../db');

const router = express.Router();

const adminUser = process.env.ADMIN_USER || 'admin';
const adminPass = process.env.ADMIN_PASSWORD || 'FarmaciaFeira2026!';

// Middleware de autenticação básica para todas as rotas /admin
router.use(
  basicAuth({
    users: { [adminUser]: adminPass },
    challenge: true,
    realm: 'Painel de Administracao Farmacias F. da Silva Graca',
  })
);

/**
 * GET /admin
 * Página de gestão e consulta de leads
 */
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/admin.html'));
});

/**
 * GET /admin/api/leads
 * Retorna lista de leads em JSON
 */
router.get('/api/leads', async (req, res) => {
  try {
    const { search } = req.query;
    let query = `
      SELECT id, institution_name, location, contact_name, role, email, phone, primary_interest, pin, created_at
      FROM leads
    `;
    const params = [];

    if (search && typeof search === 'string' && search.trim() !== '') {
      query += `
        WHERE institution_name ILIKE $1 
           OR contact_name ILIKE $1 
           OR location ILIKE $1 
           OR pin ILIKE $1 
           OR email ILIKE $1
      `;
      params.push(`%${search.trim()}%`);
    }

    query += ' ORDER BY created_at DESC LIMIT 500';

    const result = await pool.query(query, params);
    res.json({ success: true, count: result.rows.length, leads: result.rows });
  } catch (error) {
    console.error('Erro ao listar leads:', error);
    res.status(500).json({ success: false, message: 'Erro ao consultar base de dados' });
  }
});

/**
 * GET /admin/export-csv
 * Exporta todas as leads para ficheiro CSV formatado com BOM UTF-8 para Excel
 */
router.get('/export-csv', async (req, res) => {
  try {
    const query = `
      SELECT 
        created_at,
        institution_name,
        location,
        contact_name,
        role,
        email,
        phone,
        primary_interest,
        pin
      FROM leads
      ORDER BY created_at ASC;
    `;

    const result = await pool.query(query);

    const headers = [
      'Data/Hora',
      'Instituição / Lar',
      'Localidade / Concelho',
      'Nome do Responsável',
      'Cargo',
      'Email',
      'Telefone',
      'Área de Interesse',
      'PIN da Roleta',
    ];

    const escapeCsv = (str) => {
      if (str === null || str === undefined) return '""';
      const text = String(str).replace(/"/g, '""');
      return `"${text}"`;
    };

    let csvContent = '\uFEFF'; // UTF-8 BOM para garantir correta abertura no Microsoft Excel
    csvContent += headers.map(escapeCsv).join(';') + '\r\n';

    result.rows.forEach((row) => {
      const formattedDate = new Date(row.created_at).toLocaleString('pt-PT', {
        timeZone: 'Europe/Lisbon',
      });

      const line = [
        escapeCsv(formattedDate),
        escapeCsv(row.institution_name),
        escapeCsv(row.location),
        escapeCsv(row.contact_name),
        escapeCsv(row.role),
        escapeCsv(row.email),
        escapeCsv(row.phone),
        escapeCsv(row.primary_interest || 'N/A'),
        escapeCsv(row.pin),
      ].join(';');

      csvContent += line + '\r\n';
    });

    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `leads_feira_farmacias_silva_graca_${timestamp}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csvContent);
  } catch (error) {
    console.error('Erro ao exportar CSV:', error);
    res.status(500).send('Erro ao exportar dados para CSV');
  }
});

module.exports = router;
