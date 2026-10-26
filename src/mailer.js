const nodemailer = require('nodemailer');

function createTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  if (!host || !user || !pass) {
    console.warn('⚠️  Configurações de SMTP incompletas no .env. Emails serão simulados no terminal.');
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === 'production',
    },
  });
}

const transporter = createTransporter();

/**
 * Envia email em HTML ao visitante com o seu PIN da roleta e apresentação institucional
 */
async function sendVisitorEmail(lead) {
  const from = process.env.SMTP_FROM || '"Farmácias F. da Silva Graça" <geral@farmaciasfsilvagraca.pt>';
  const subject = `O seu PIN para a Roleta de Prémios: ${lead.pin} — Farmácias F. da Silva Graça`;

  const html = `
<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Farmácias F. da Silva Graça</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7f5f9; margin: 0; padding: 20px; color: #2d3142; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
    .header { background: linear-gradient(135deg, #a581b9 0%, #825f96 100%); padding: 36px 24px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
    .header p { margin: 8px 0 0 0; font-size: 15px; opacity: 0.92; }
    .content { padding: 32px 28px; line-height: 1.6; }
    .greeting { font-size: 18px; font-weight: 600; color: #1f2937; margin-bottom: 12px; }
    .pin-card { background: #faf8fc; border: 2px dashed #a581b9; border-radius: 14px; padding: 24px; text-align: center; margin: 28px 0; }
    .pin-label { font-size: 13px; text-transform: uppercase; letter-spacing: 1.2px; font-weight: 700; color: #825f96; margin-bottom: 8px; }
    .pin-number { font-size: 44px; font-weight: 800; letter-spacing: 8px; color: #825f96; font-family: monospace; margin: 0; }
    .pin-note { font-size: 13px; color: #6b7280; margin-top: 10px; }
    .benefits-box { background: #fdfcff; border-left: 4px solid #a581b9; padding: 16px 20px; border-radius: 0 10px 10px 0; margin: 24px 0; }
    .benefits-box h3 { margin: 0 0 10px 0; font-size: 16px; color: #825f96; }
    .benefits-box ul { margin: 0; padding-left: 20px; color: #4b5563; font-size: 14px; }
    .benefits-box li { margin-bottom: 6px; }
    .cta-container { text-align: center; margin: 32px 0 20px 0; }
    .cta-button { display: inline-block; background-color: #825f96; color: #ffffff !important; text-decoration: none; font-weight: 600; font-size: 15px; padding: 14px 32px; border-radius: 30px; box-shadow: 0 4px 12px rgba(130, 95, 150, 0.35); }
    .footer { background: #f9fafb; padding: 24px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #f3f4f6; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Farmácias F. da Silva Graça</h1>
      <p>Parceiro de Confiança para Lares e ERPI</p>
    </div>
    <div class="content">
      <div class="greeting">Olá, ${lead.contact_name}!</div>
      <p>Agradecemos com simpatia a sua visita ao nosso stand na feira em representação de <strong>${lead.institution_name}</strong> (${lead.location}).</p>
      
      <div class="pin-card">
        <div class="pin-label">O seu Código de Acesso à Roleta</div>
        <div class="pin-number">${lead.pin}</div>
        <div class="pin-note">Apresente este código à nossa equipa no stand para rodar a roleta de prémios imediatos!</div>
      </div>

      <div class="benefits-box">
        <h3>Soluções Especializadas para a sua Instituição:</h3>
        <ul>
          <li><strong>PIM — Preparação Individualizada da Medicação:</strong> Maior segurança clínica e redução drástica do tempo despendido pelas equipas de enfermagem.</li>
          <li><strong>Apoio Técnico e Farmacêutico Dedicado:</strong> Revisão terapêutica, esclarecimento de interações e suporte regulamentar.</li>
          <li><strong>Logística e Entregas Programadas:</strong> Fornecimento pontual com rigorosa rastreabilidade e gestão de consumíveis clínicos.</li>
        </ul>
      </div>

      <p>Gostaria de agendar uma breve apresentação sem compromisso para conhecer as condições exclusivas para a <strong>${lead.institution_name}</strong>?</p>

      <div class="cta-container">
        <a href="mailto:${process.env.NOTIFICATION_EMAIL || 'geral@farmaciasfsilvagraca.pt'}?subject=Reunião%20Institucional%20-%20${encodeURIComponent(lead.institution_name)}" class="cta-button">
          Agendar Reunião / Falar Connosco
        </a>
      </div>
    </div>
    <div class="footer">
      <p>Farmácias F. da Silva Graça — Apoio Técnico Farmacêutico e Soluções para Estruturas Residenciais de Idosos.<br>
      Este email foi enviado na sequência do seu registo presencial no nosso stand.</p>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
Olá ${lead.contact_name},

Agradecemos a sua visita ao stand das Farmácias F. da Silva Graça em representação de ${lead.institution_name} (${lead.location}).

O SEU PIN PARA A ROLETA DE PRÉMIOS:
${lead.pin}

Apresente este código à nossa equipa no stand para rodar a roleta de prémios!

Estamos ao dispor para apresentar as nossas soluções dedicadas a Lares e ERPI (Preparação Individualizada da Medicação - PIM, entregas programadas e apoio técnico farmacêutico).

Contacte-nos através de geral@farmaciasfsilvagraca.pt.
  `;

  if (!transporter) {
    console.log(`[SIMULAÇÃO SMTP] Email para ${lead.email}:`);
    console.log(`Assunto: ${subject}`);
    console.log(`PIN: ${lead.pin}`);
    return { messageId: 'simulated-' + Date.now() };
  }

  return transporter.sendMail({
    from,
    to: lead.email,
    subject,
    text,
    html,
  });
}

/**
 * Envia notificação interna para a equipa comercial das Farmácias F. da Silva Graça
 */
async function sendInternalNotification(lead) {
  const to = process.env.NOTIFICATION_EMAIL;
  if (!to) return; // Notificação interna não configurada

  const from = process.env.SMTP_FROM || '"Feira Leads" <noreply@farmaciasfsilvagraca.pt>';
  const subject = `[Nova Lead Feira] ${lead.institution_name} (${lead.location}) - PIN ${lead.pin}`;

  const html = `
    <h2>Nova Lead Registada na Feira</h2>
    <p><strong>Instituição:</strong> ${lead.institution_name}</p>
    <p><strong>Localidade:</strong> ${lead.location}</p>
    <p><strong>Contacto:</strong> ${lead.contact_name} (${lead.role})</p>
    <p><strong>Email:</strong> <a href="mailto:${lead.email}">${lead.email}</a></p>
    <p><strong>Telefone:</strong> <a href="tel:${lead.phone}">${lead.phone}</a></p>
    <p><strong>Área de Interesse:</strong> ${lead.primary_interest || 'Não especificada'}</p>
    <p><strong>PIN Atribuído:</strong> <code>${lead.pin}</code></p>
    <p><strong>Data/Hora:</strong> ${new Date().toLocaleString('pt-PT', { timeZone: 'Europe/Lisbon' })}</p>
  `;

  if (!transporter) {
    console.log(`[SIMULAÇÃO SMTP] Notificação interna para ${to}: ${subject}`);
    return;
  }

  return transporter.sendMail({
    from,
    to,
    subject,
    html,
  });
}

module.exports = {
  sendVisitorEmail,
  sendInternalNotification,
};
