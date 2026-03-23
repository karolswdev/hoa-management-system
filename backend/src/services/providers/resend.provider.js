const { Resend } = require('resend');

let resend = null;

function init(apiKey) {
  if (!apiKey) return; // leave uninitialized for log-only mode
  resend = new Resend(apiKey);
}

/**
 * Send email via Resend with support for BCC batching
 * @param {Object} params - Email parameters
 * @param {string|string[]} params.to - Primary recipient(s)
 * @param {string|string[]} params.bcc - BCC recipient(s) (optional)
 * @param {string|string[]} params.cc - CC recipient(s) (optional)
 * @param {string} params.subject - Email subject
 * @param {string} params.html - HTML content
 * @param {string} params.text - Plain text content
 * @returns {Promise<Object>} Resend response
 */
async function send({ to, bcc, cc, subject, html, text }) {
  const from = `${process.env.EMAIL_FROM_NAME || 'HOA Community Hub'} <${process.env.EMAIL_FROM}>`;

  const msg = {
    from,
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
    text
  };

  // Add optional fields
  if (bcc) msg.bcc = Array.isArray(bcc) ? bcc : [bcc];
  if (cc) msg.cc = Array.isArray(cc) ? cc : [cc];

  const { data, error } = await resend.emails.send(msg);

  if (error) {
    const err = new Error(error.message);
    err.statusCode = error.statusCode;
    throw err;
  }

  return data;
}

module.exports = { init, send };
