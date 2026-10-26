const express = require('express');
const crypto = require('crypto');
const validator = require('validator');
const { pool } = require('../db');
const { sendVisitorEmail, sendInternalNotification } = require('../mailer');

const router = express.Router();

/**
 * Gera um PIN aleatório de 4 dígitos seguro
 */
function generatePin() {
  return crypto.randomInt(1000, 10000).toString();
}

/**
 * POST /api/submit
 * Recebe e valida os dados do formulário, gera o PIN e agenda envio de emails
 */
router.post('/submit', async (req, res) => {
  try {
    const {
      institution_name,
      location,
      contact_name,
      role,
      email,
      phone,
      primary_interest,
      rgpd_consent,
    } = req.body;

    // 1. Validação dos campos obrigatórios
    const errors = [];

    if (!institution_name || typeof institution_name !== 'string' || institution_name.trim().length < 2) {
      errors.push('O nome da instituição é obrigatório.');
    }
    if (!location || typeof location !== 'string' || location.trim().length < 2) {
      errors.push('A localidade/concelho é obrigatória.');
    }
    if (!contact_name || typeof contact_name !== 'string' || contact_name.trim().length < 2) {
      errors.push('O nome do responsável é obrigatório.');
    }
    if (!role || typeof role !== 'string' || role.trim().length < 2) {
      errors.push('O cargo/função é obrigatório.');
    }
    if (!email || !validator.isEmail(email)) {
      errors.push('Por favor insira um endereço de email válido.');
    }
    if (!phone || typeof phone !== 'string' || phone.replace(/\D/g, '').length < 9) {
      errors.push('Por favor insira um número de telefone com pelo menos 9 dígitos.');
    }
    if (rgpd_consent !== true && rgpd_consent !== 'true') {
      errors.push('É necessário aceitar os termos de consentimento RGPD para submeter.');
    }

    if (errors.length > 0) {
      return res.status(400).json({ success: false, errors });
    }

    // 2. Limpeza e normalização (sem entidades HTML na BD, proteção SQL já garantida por queries parametrizadas)
    const cleanString = (str) => (str ? String(str).trim().replace(/[\u0000-\u001F\u007F-\u009F]/g, '') : '');
    const sanitizedInstitution = cleanString(institution_name);
    const sanitizedLocation = cleanString(location);
    const sanitizedContact = cleanString(contact_name);
    const sanitizedRole = cleanString(role);
    const cleanEmail = validator.normalizeEmail(email.trim().toLowerCase());
    const sanitizedPhone = cleanString(phone);

    // Tratamento de interesses (suporte a multiselect)
    let processedInterest = '';
    const rawInterest = primary_interest || req.body.interests;
    if (Array.isArray(rawInterest)) {
      processedInterest = rawInterest.map(cleanString).filter(Boolean).join(', ');
    } else if (typeof rawInterest === 'string' && rawInterest.trim()) {
      processedInterest = cleanString(rawInterest);
    }
    const sanitizedInterest = processedInterest;

    // 3. Geração do PIN
    const pin = generatePin();

    // 4. Captura de metadados para auditoria RGPD
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
    const userAgent = req.headers['user-agent'] || '';

    // 5. Inserção na Base de Dados PostgreSQL
    const insertQuery = `
      INSERT INTO leads (
        institution_name,
        location,
        contact_name,
        role,
        email,
        phone,
        primary_interest,
        pin,
        rgpd_consent,
        ip_address,
        user_agent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id, pin, created_at;
    `;

    const values = [
      sanitizedInstitution,
      sanitizedLocation,
      sanitizedContact,
      sanitizedRole,
      cleanEmail,
      sanitizedPhone,
      sanitizedInterest,
      pin,
      true,
      ipAddress.toString().substring(0, 100),
      userAgent.substring(0, 500),
    ];

    const result = await pool.query(insertQuery, values);
    const newLead = result.rows[0];

    const leadData = {
      id: newLead.id,
      institution_name: sanitizedInstitution,
      location: sanitizedLocation,
      contact_name: sanitizedContact,
      role: sanitizedRole,
      email: cleanEmail,
      phone: sanitizedPhone,
      primary_interest: sanitizedInterest,
      pin: newLead.pin,
    };

    // 6. Disparo assíncrono dos emails por SMTP (não bloqueia a resposta ao utilizador)
    setImmediate(async () => {
      try {
        await sendVisitorEmail(leadData);
      } catch (err) {
        console.error('Falha no envio de email ao visitante:', err.message);
      }

      try {
        await sendInternalNotification(leadData);
      } catch (err) {
        console.error('Falha no envio de notificação interna:', err.message);
      }
    });

    // 7. Resposta imediata com o PIN gerado
    return res.status(201).json({
      success: true,
      pin: newLead.pin,
      leadId: newLead.id,
      message: 'Registo concluído com sucesso!',
    });
  } catch (error) {
    console.error('Erro ao processar submissão:', error);
    return res.status(500).json({
      success: false,
      message: 'Ocorreu um erro no servidor ao guardar os dados. Por favor tente novamente.',
    });
  }
});

/**
 * GET /api/health
 */
router.get('/health', async (req, res) => {
  try {
    const dbRes = await pool.query('SELECT NOW() as now');
    return res.json({
      status: 'healthy',
      database: 'connected',
      dbTime: dbRes.rows[0].now,
      uptime: process.uptime(),
    });
  } catch (err) {
    return res.status(500).json({
      status: 'degraded',
      database: err.message,
      uptime: process.uptime(),
    });
  }
});

module.exports = router;
