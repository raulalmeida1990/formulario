const express = require('express');
const basicAuth = require('express-basic-auth');
const path = require('path');
const { pool } = require('../db');
const { generateMeetingProposalContent, sendMeetingProposalEmail } = require('../mailer');

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

// Permitir parsing de JSON nas rotas admin
router.use(express.json());

/**
 * GET /admin
 * Página de gestão e CRM de leads
 */
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/admin.html'));
});

/**
 * GET /admin/api/stats
 * Métricas do funil de conversão pós-feira
 */
router.get('/api/stats', async (req, res) => {
  try {
    const query = `
      SELECT 
        count(*) as total,
        count(*) FILTER (WHERE coalesce(status, 'Pendente') = 'Pendente') as pendente,
        count(*) FILTER (WHERE status = 'Email Enviado') as email_enviado,
        count(*) FILTER (WHERE status = 'Chamada Efetuada') as chamada_efetuada,
        count(*) FILTER (WHERE status = 'Reunião Agendada') as reuniao_agendada,
        count(*) FILTER (WHERE status = 'Parceria Fechada') as parceria_fechada,
        count(*) FILTER (WHERE status = 'Não Interessado') as nao_interessado
      FROM leads
    `;
    const result = await pool.query(query);
    res.json({ success: true, stats: result.rows[0] });
  } catch (error) {
    console.error('Erro ao obter métricas:', error);
    res.status(500).json({ success: false, message: 'Erro ao consultar estatísticas' });
  }
});

/**
 * GET /admin/api/leads
 * Retorna lista de leads em JSON com filtros de pesquisa e estado
 */
router.get('/api/leads', async (req, res) => {
  try {
    const { search, status } = req.query;
    let query = `
      SELECT 
        id, 
        institution_name, 
        location, 
        contact_name, 
        role, 
        email, 
        phone, 
        primary_interest, 
        pin, 
        coalesce(status, 'Pendente') as status, 
        coalesce(notes, '') as notes, 
        email_sent_at, 
        meeting_date, 
        created_at
      FROM leads
    `;
    const whereClauses = [];
    const params = [];

    if (search && typeof search === 'string' && search.trim() !== '') {
      params.push(`%${search.trim()}%`);
      whereClauses.push(`(
        institution_name ILIKE $${params.length} 
        OR contact_name ILIKE $${params.length} 
        OR location ILIKE $${params.length} 
        OR pin ILIKE $${params.length} 
        OR email ILIKE $${params.length}
        OR phone ILIKE $${params.length}
      )`);
    }

    if (status && typeof status === 'string' && status !== 'Todos') {
      params.push(status.trim());
      whereClauses.push(`coalesce(status, 'Pendente') = $${params.length}`);
    }

    if (whereClauses.length > 0) {
      query += ` WHERE ${whereClauses.join(' AND ')}`;
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
 * PATCH /admin/api/leads/:id
 * Atualiza estado, notas ou data de reunião de uma lead
 */
router.patch('/api/leads/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, meeting_date } = req.body;

    const updates = [];
    const params = [id];

    if (status !== undefined) {
      params.push(status);
      updates.push(`status = $${params.length}`);
    }

    if (notes !== undefined) {
      params.push(notes);
      updates.push(`notes = $${params.length}`);
    }

    if (meeting_date !== undefined) {
      params.push(meeting_date || null);
      updates.push(`meeting_date = $${params.length}`);
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'Nenhum campo fornecido para atualização.' });
    }

    const query = `
      UPDATE leads 
      SET ${updates.join(', ')} 
      WHERE id = $1 
      RETURNING id, institution_name, status, notes, meeting_date, email_sent_at
    `;

    const result = await pool.query(query, params);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Lead não encontrada.' });
    }

    res.json({ success: true, lead: result.rows[0] });
  } catch (error) {
    console.error('Erro ao atualizar lead:', error);
    res.status(500).json({ success: false, message: 'Erro ao atualizar dados na base de dados' });
  }
});

/**
 * GET /admin/api/leads/:id/preview-email
 * Pré-visualiza o email personalizado de proposta de reunião sem o enviar
 */
router.get('/api/leads/:id/preview-email', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM leads WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Lead não encontrada.' });
    }

    const lead = result.rows[0];
    const emailData = generateMeetingProposalContent(lead);

    res.json({
      success: true,
      lead: {
        id: lead.id,
        institution_name: lead.institution_name,
        contact_name: lead.contact_name,
        email: lead.email,
        phone: lead.phone,
        status: lead.status || 'Pendente',
      },
      email: emailData,
    });
  } catch (error) {
    console.error('Erro ao gerar pré-visualização:', error);
    res.status(500).json({ success: false, message: 'Erro ao gerar pré-visualização de email' });
  }
});

/**
 * POST /admin/api/leads/:id/send-email
 * Dispara o email de proposta de reunião e atualiza o estado para "Email Enviado"
 */
router.post('/api/leads/:id/send-email', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM leads WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Lead não encontrada.' });
    }

    const lead = result.rows[0];

    // Disparar o email formal assinado pela Dr.ª Gilda
    const mailResult = await sendMeetingProposalEmail(lead);

    // Atualizar base de dados
    const updateResult = await pool.query(
      `UPDATE leads 
       SET status = 'Email Enviado', email_sent_at = CURRENT_TIMESTAMP 
       WHERE id = $1 
       RETURNING id, status, email_sent_at`,
      [id]
    );

    res.json({
      success: true,
      message: `Email enviado com sucesso para ${lead.email}!`,
      mailResult,
      lead: updateResult.rows[0],
    });
  } catch (error) {
    console.error('Erro ao enviar email de proposta:', error);
    res.status(500).json({ success: false, message: 'Erro ao enviar email através do servidor SMTP' });
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
        pin,
        coalesce(status, 'Pendente') as status,
        coalesce(notes, '') as notes,
        email_sent_at,
        meeting_date
      FROM leads
      ORDER BY created_at ASC;
    `;

    const result = await pool.query(query);

    const headers = [
      'Data Registo',
      'Instituição / Lar',
      'Localidade / Concelho',
      'Nome do Responsável',
      'Cargo',
      'Email',
      'Telefone',
      'Área de Interesse',
      'PIN da Roleta',
      'Estado Comercial (CRM)',
      'Email Enviado Em',
      'Data da Reunião',
      'Notas / Observações',
    ];

    const escapeCsv = (str) => {
      if (str === null || str === undefined) return '""';
      const text = String(str).replace(/"/g, '""');
      return `"${text}"`;
    };

    let csvContent = '\uFEFF'; // UTF-8 BOM para garantir correta abertura no Microsoft Excel
    csvContent += headers.map(escapeCsv).join(';') + '\r\n';

    result.rows.forEach((row) => {
      const formattedCreatedDate = new Date(row.created_at).toLocaleString('pt-PT', {
        timeZone: 'Europe/Lisbon',
      });

      const formattedEmailDate = row.email_sent_at
        ? new Date(row.email_sent_at).toLocaleString('pt-PT', { timeZone: 'Europe/Lisbon' })
        : 'Pendente';

      const formattedMeetingDate = row.meeting_date
        ? new Date(row.meeting_date).toLocaleString('pt-PT', { timeZone: 'Europe/Lisbon' })
        : '';

      const line = [
        escapeCsv(formattedCreatedDate),
        escapeCsv(row.institution_name),
        escapeCsv(row.location),
        escapeCsv(row.contact_name),
        escapeCsv(row.role),
        escapeCsv(row.email),
        escapeCsv(row.phone),
        escapeCsv(row.primary_interest || 'N/A'),
        escapeCsv(row.pin),
        escapeCsv(row.status),
        escapeCsv(formattedEmailDate),
        escapeCsv(formattedMeetingDate),
        escapeCsv(row.notes),
      ].join(';');

      csvContent += line + '\r\n';
    });

    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `leads_crm_farmacias_silva_graca_${timestamp}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csvContent);
  } catch (error) {
    console.error('Erro ao exportar CSV:', error);
    res.status(500).send('Erro ao exportar dados para CSV');
  }
});

module.exports = router;
