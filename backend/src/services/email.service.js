// Simple provider-agnostic email service
const providerName = process.env.EMAIL_PROVIDER || 'log';

let provider = null;
if (providerName === 'sendgrid') {
  provider = require('./providers/sendgrid.provider');
  provider.init(process.env.SENDGRID_API_KEY);
}

async function sendMail(payload) {
  // Fallback to console logging if not configured
  const configured = !!(provider && process.env.SENDGRID_API_KEY && process.env.EMAIL_FROM);
  if (!configured) {
    console.log('[email:log-only]', JSON.stringify(payload, null, 2));
    return;
  }
  return provider.send(payload);
}

module.exports = { sendMail };

