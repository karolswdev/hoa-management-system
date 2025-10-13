const sg = require('@sendgrid/mail');

function init(apiKey) {
  if (!apiKey) return; // leave uninitialized for log-only mode
  sg.setApiKey(apiKey);
}

async function send({ to, subject, html, text }) {
  const from = {
    email: process.env.EMAIL_FROM,
    name: process.env.EMAIL_FROM_NAME || 'HOA Community Hub',
  };
  const msg = { to, from, subject, html, text };
  return sg.send(msg);
}

module.exports = { init, send };

