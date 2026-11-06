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
    name: 'dt.fdasilvagraca.pt',
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
  const from = process.env.SMTP_FROM || '"Farmácias F. da Silva Graça" <noreply@fdasilvagraca.pt>';
  const subject = `Farmácias F. da Silva Graça — Confirmação de Visita ao Stand (Código ${lead.pin})`;

  const contactEmail = 'farmaciamatamourisca@gmail.com';
  const whatsappPhone = '351966596267';

  const interestsText = lead.primary_interest ? `\nÁreas de interesse: ${lead.primary_interest}.` : '';
  const whatsappMessage = `Olá! Visitei o stand das Farmácias F. da Silva Graça na feira.\nSou ${lead.contact_name} (${lead.role}) da instituição ${lead.institution_name} (${lead.location}).${interestsText}\nGostaria de agendar uma breve apresentação para conhecer as soluções para a nossa instituição.`;
  const whatsappUrl = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(whatsappMessage)}`;

  const mailtoSubject = `Reunião Institucional - ${lead.institution_name} (${lead.location})`;
  const mailtoBody = `Olá equipa das Farmácias F. da Silva Graça,\n\nVisitei o vosso stand na feira e gostaria de agendar uma breve apresentação das vossas soluções para a nossa instituição.\n\nDados de contacto:\n- Instituição: ${lead.institution_name}\n- Localidade: ${lead.location}\n- Nome: ${lead.contact_name} (${lead.role})\n- Telefone: ${lead.phone}\n- Email: ${lead.email}${lead.primary_interest ? `\n- Áreas de interesse: ${lead.primary_interest}` : ''}\n\nMelhores cumprimentos,\n${lead.contact_name}`;
  const mailtoUrl = `mailto:${contactEmail}?subject=${encodeURIComponent(mailtoSubject)}&body=${encodeURIComponent(mailtoBody)}`;

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
    .cta-container { text-align: center; margin: 28px 0 20px 0; }
    .cta-button { display: inline-block; background-color: #825f96; color: #ffffff !important; text-decoration: none; font-weight: 600; font-size: 15px; padding: 14px 28px; border-radius: 30px; box-shadow: 0 4px 12px rgba(130, 95, 150, 0.35); margin: 6px; }
    .cta-whatsapp { display: inline-block; background-color: #25D366; color: #ffffff !important; text-decoration: none; font-weight: 600; font-size: 15px; padding: 14px 28px; border-radius: 30px; box-shadow: 0 4px 12px rgba(37, 211, 102, 0.35); margin: 6px; }
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
        <a href="${whatsappUrl}" target="_blank" rel="noopener noreferrer" class="cta-whatsapp">
          💬 Conversar no WhatsApp
        </a>
        <a href="${mailtoUrl}" class="cta-button">
          ✉️ Enviar Email
        </a>
      </div>
    </div>
    <div class="footer">
      <p>Farmácias F. da Silva Graça — Apoio Técnico Farmacêutico e Soluções para Estruturas Residenciais de Idosos.<br>
      Contacto direto: <a href="mailto:${contactEmail}" style="color: #825f96;">${contactEmail}</a> | WhatsApp: +351 966 596 267<br>
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

Fale connosco no WhatsApp: ${whatsappUrl}
Ou envie-nos um email para: ${contactEmail}
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

/**
 * Gera o conteúdo (HTML, Texto, Assunto e Destinatários) do email de proposta de reunião formal
 */
function generateMeetingProposalContent(lead) {
  const from = '"Gilda Seomara Graça — Farmácias F. da Silva Graça" <noreply@fdasilvagraca.pt>';
  const replyTo = 'farmaciamatamourisca@gmail.com';
  const cc = 'farmaciamatamourisca@gmail.com';
  const subject = `Reunião Institucional Farmácias F. da Silva Graça — ${lead.institution_name}`;

  const interestsList = lead.primary_interest 
    ? lead.primary_interest.split(',').map(s => s.trim()).filter(Boolean)
    : ['PIM - Preparação Individualizada da Medicação'];

  const interestsHtml = interestsList.map(item => `<li><strong>${item}</strong></li>`).join('');

  const html = `
<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7f5f9; margin: 0; padding: 20px; color: #2d3142; }
    .container { max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
    .header { background: linear-gradient(135deg, #a581b9 0%, #825f96 100%); padding: 32px 26px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.3px; }
    .header p { margin: 6px 0 0 0; font-size: 14px; opacity: 0.94; }
    .content { padding: 32px 28px; line-height: 1.65; font-size: 15px; color: #374151; }
    .greeting { font-size: 16px; font-weight: 600; color: #111827; margin-bottom: 14px; }
    .highlight-box { background: #faf8fc; border-left: 4px solid #825f96; padding: 18px 20px; border-radius: 0 10px 10px 0; margin: 24px 0; }
    .highlight-box h3 { margin: 0 0 10px 0; font-size: 15px; color: #825f96; }
    .highlight-box ul { margin: 0; padding-left: 20px; font-size: 14px; }
    .highlight-box li { margin-bottom: 6px; }
    .cta-box { text-align: center; margin: 32px 0 20px 0; padding: 20px; background: #fdfcff; border: 1px dashed #a581b9; border-radius: 12px; }
    .cta-button { display: inline-block; background-color: #825f96; color: #ffffff !important; text-decoration: none; font-weight: 600; font-size: 15px; padding: 14px 30px; border-radius: 30px; box-shadow: 0 4px 12px rgba(130, 95, 150, 0.35); }
    .signature { margin-top: 32px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #4b5563; }
    .signature-name { font-size: 16px; font-weight: 700; color: #825f96; }
    .signature-title { font-size: 13px; color: #6b7280; margin-bottom: 8px; }
    .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #f3f4f6; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Farmácias F. da Silva Graça</h1>
      <p>Apoio Dedicado e Parcerias para Lares e ERPI</p>
    </div>
    <div class="content">
      <div class="greeting">Exmo.(a) Sr.(a) ${lead.contact_name},<br><span style="font-size: 14px; font-weight: 400; color: #6b7280;">${lead.role} — ${lead.institution_name}</span></div>
      
      <p>Escrevo-lhe na sequência do nosso contacto e visita ao stand das <strong>Farmácias F. da Silva Graça</strong> na feira, onde registámos com muito gosto a participação de <strong>${lead.institution_name}</strong> (${lead.location}).</p>

      <p>Tendo em conta as necessidades abordadas e o interesse manifestado nas nossas soluções institucionais, venho por este meio solicitar a disponibilidade de V. Exa. para uma breve reunião presencial nas vossas instalações em ${lead.location}.</p>

      <div class="highlight-box">
        <h3>Objetivos desta Reunião Técnica (duração prevista: 25 a 30 min):</h3>
        <ul>
          <li><strong>Apresentação do Circuito PIM (Preparação Individualizada da Medicação):</strong> Demonstração do sistema de embalagem selada/unidose e do seu impacto direto no aumento da segurança clínica e na poupança drástica de horas de enfermagem.</li>
          <li><strong>Levantamento Prático de Necessidades:</strong> Avaliação sem qualquer compromisso da realidade e volume de utentes da ${lead.institution_name}.</li>
          <li><strong>Proposta de Condições Especiais:</strong> Apresentação das condições de parceria, logística e apoio técnico farmacêutico continuado através da farmácia do nosso grupo mais conveniente para a vossa instituição.</li>
        </ul>
      </div>

      <p>Gostaria de agendar este encontro presencial nos próximos dias. Terá disponibilidade para nos receber numa das seguintes opções, ou num horário que considere mais conveniente?</p>

      <div class="cta-box">
        <p style="margin: 0 0 14px 0; font-weight: 600; color: #1f2937;">Pode responder diretamente a este email ou agendar por contacto direto:</p>
        <a href="mailto:${replyTo}?subject=${encodeURIComponent(`Reunião Presencial - ${lead.institution_name}`)}&body=${encodeURIComponent(`Olá Dr.ª Gilda Seomara Graça,\n\nConfirmamos a disponibilidade da ${lead.institution_name} para a reunião presencial sobre o serviço de PIM.\n\nSugestão de dia e hora: \nContacto: ${lead.contact_name} (${lead.phone})\n\nCom os melhores cumprimentos,\n${lead.contact_name}`)}" class="cta-button">
          ✉️ Responder e Indicar Disponibilidade
        </a>
      </div>

      <div class="signature">
        <div class="signature-name">Gilda Seomara Graça</div>
        <div class="signature-title">Direção de Parcerias e Relações Institucionais<br>Farmácias F. da Silva Graça</div>
        <p style="margin: 4px 0;">📞 <strong>Contacto direto:</strong> <a href="tel:+351966596267" style="color: #825f96; text-decoration: none;">+351 966 596 267</a></p>
        <p style="margin: 4px 0;">✉️ <strong>Email:</strong> <a href="mailto:${replyTo}" style="color: #825f96; text-decoration: none;">${replyTo}</a></p>
        <p style="margin: 8px 0 0 0; font-size: 12px; color: #6b7280;">Farmácia Nova da Vila &bull; Farmácia Ilha &bull; Farmácia Colmeias &bull; Farmácia Souto da Carpalhosa</p>
      </div>
    </div>
    <div class="footer">
      <p>Farmácias F. da Silva Graça — Soluções Farmacêuticas e Apoio Técnico para Estruturas Residenciais de Idosos.<br>
      Contacto enviado na sequência da visita ao stand da feira.</p>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
Exmo.(a) Sr.(a) ${lead.contact_name},
${lead.role} — ${lead.institution_name}

Escrevo-lhe na sequência do nosso encontro e visita ao stand das Farmácias F. da Silva Graça na feira, onde registámos a participação de ${lead.institution_name} (${lead.location}).

Tendo em conta o interesse manifestado nas nossas soluções (em particular PIM - Preparação Individualizada da Medicação), venho por este meio solicitar a disponibilidade de V. Exa. para uma breve reunião presencial nas vossas instalações em ${lead.location} (cerca de 25-30 minutos).

Objetivo:
1. Apresentar o nosso circuito certificado de PIM (unidose/blister selado) e a redução drástica de tempo de enfermagem;
2. Conhecer as necessidades específicas dos utentes da ${lead.institution_name};
3. Avaliar, sem compromisso, uma proposta de condições de fornecimento e apoio farmacêutico dedicado.

Poderá responder a este email indicando a vossa melhor disponibilidade ou contactar-me diretamente pelo telefone +351 966 596 267.

Com os melhores cumprimentos,

Gilda Seomara Graça
Direção de Parcerias e Relações Institucionais
Farmácias F. da Silva Graça
(Farmácia Nova da Vila • Farmácia Ilha • Farmácia Colmeias • Farmácia Souto da Carpalhosa)
Tel: +351 966 596 267
Email: ${replyTo}
  `;

  return {
    from,
    to: lead.email,
    cc,
    replyTo,
    subject,
    html,
    text,
  };
}

/**
 * Envia o email de proposta de reunião formal para a lead
 */
async function sendMeetingProposalEmail(lead) {
  const content = generateMeetingProposalContent(lead);

  if (!transporter) {
    console.log(`[SIMULAÇÃO SMTP] Email de reunião para ${lead.email}: ${content.subject}`);
    return { messageId: 'simulated-' + Date.now(), ...content };
  }

  return transporter.sendMail(content);
}

module.exports = {
  sendVisitorEmail,
  sendInternalNotification,
  generateMeetingProposalContent,
  sendMeetingProposalEmail,
};
