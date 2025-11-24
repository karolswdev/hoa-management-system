const sg = require('@sendgrid/mail');

function init(apiKey) {
  if (!apiKey) return; // leave uninitialized for log-only mode
  sg.setApiKey(apiKey);
}

/**
 * Send email via SendGrid with support for BCC batching
 * @param {Object} params - Email parameters
 * @param {string|string[]} params.to - Primary recipient(s)
 * @param {string|string[]} params.bcc - BCC recipient(s) (optional)
 * @param {string|string[]} params.cc - CC recipient(s) (optional)
 * @param {string} params.subject - Email subject
 * @param {string} params.html - HTML content
 * @param {string} params.text - Plain text content
 * @param {string} params.category - SendGrid category for tracking (optional)
 * @param {Object} params.customArgs - Custom arguments for tracking (optional)
 * @returns {Promise<Object>} SendGrid response
 */
async function send({ to, bcc, cc, subject, html, text, category, customArgs }) {
  const from = {
    email: process.env.EMAIL_FROM,
    name: process.env.EMAIL_FROM_NAME || 'HOA Community Hub',
  };

  const msg = {
    to,
    from,
    subject,
    html,
    text
  };

  // Add optional fields
  if (bcc) msg.bcc = bcc;
  if (cc) msg.cc = cc;
  if (category) msg.category = category;
  if (customArgs) msg.customArgs = customArgs;

  return sg.send(msg);
}

module.exports = { init, send };

