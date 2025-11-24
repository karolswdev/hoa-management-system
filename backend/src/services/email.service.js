// Enhanced email notification service with batching, retry, and audit logging
const crypto = require('crypto');
const logger = require('../config/logger');
const { EmailAudit, ResidentNotificationLog, sequelize } = require('../../models');

// Lazy load provider to allow for testing
let provider = null;
function getProvider() {
  if (provider === null && process.env.EMAIL_PROVIDER === 'sendgrid') {
    provider = require('./providers/sendgrid.provider');
    provider.init(process.env.SENDGRID_API_KEY);
  }
  return provider;
}

// Constants for batching and retry
const BATCH_SIZE = 50; // SendGrid recommended batch size
const RETRY_DELAYS = [250, 500]; // Exponential backoff: 250ms, 500ms
const MAX_RETRIES = RETRY_DELAYS.length;

/**
 * Legacy sendMail function - maintained for backward compatibility
 * @param {Object} payload - Email payload {to, subject, html, text}
 * @returns {Promise<void>}
 */
async function sendMail(payload) {
  const prov = getProvider();
  const configured = !!(prov && process.env.SENDGRID_API_KEY && process.env.EMAIL_FROM);
  if (!configured) {
    console.log('[email:log-only]', JSON.stringify(payload, null, 2));
    return;
  }
  return prov.send(payload);
}

/**
 * Compute SHA256 hash of payload for audit correlation
 * @param {Object} payload - Email payload
 * @returns {string} Hex hash
 */
function computePayloadHash(payload) {
  const normalized = JSON.stringify(payload, Object.keys(payload).sort());
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

/**
 * Sleep for specified milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Send email with retry logic and exponential backoff
 * @param {Object} payload - Email payload
 * @param {number} attempt - Current attempt number (1-indexed)
 * @returns {Promise<Object>} SendGrid response
 */
async function sendWithRetry(payload, attempt = 1) {
  try {
    const prov = getProvider();
    const configured = !!(prov && process.env.SENDGRID_API_KEY && process.env.EMAIL_FROM);
    if (!configured) {
      logger.info('[email:log-only] Simulating email send', { payload });
      return { simulated: true, messageId: 'log-only-' + Date.now() };
    }

    const result = await prov.send(payload);
    logger.info('Email sent successfully', {
      to: payload.to,
      subject: payload.subject,
      attempt
    });
    return result;
  } catch (error) {
    if (attempt <= MAX_RETRIES) {
      const delay = RETRY_DELAYS[attempt - 1];
      logger.warn(`Email send failed, retrying in ${delay}ms (attempt ${attempt}/${MAX_RETRIES})`, {
        error: error.message,
        to: payload.to,
        subject: payload.subject
      });
      await sleep(delay);
      return sendWithRetry(payload, attempt + 1);
    }

    logger.error('Email send failed after all retries', {
      error: error.message,
      to: payload.to,
      subject: payload.subject,
      attempts: MAX_RETRIES
    });
    throw error;
  }
}

/**
 * Chunk array into batches
 * @param {Array} array - Array to chunk
 * @param {number} size - Batch size
 * @returns {Array<Array>} Array of batches
 */
function chunkArray(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Send poll notification email to multiple recipients with batching
 * @param {Object} params - Notification parameters
 * @param {string} params.pollTitle - Poll title
 * @param {string} params.pollDescription - Poll description
 * @param {Date} params.startAt - Poll start time
 * @param {Date} params.endAt - Poll end time
 * @param {string} params.pollType - Poll type (informal, binding, straw-poll)
 * @param {Array<{id: number, email: string, name: string}>} params.recipients - List of recipients
 * @param {string} params.correlationId - Optional correlation ID for audit trail
 * @returns {Promise<Object>} Result object with success/failure counts
 */
async function sendPollNotificationEmail({
  pollTitle,
  pollDescription,
  startAt,
  endAt,
  pollType,
  recipients,
  correlationId = null
}) {
  const transaction = await sequelize.transaction();

  try {
    // Prepare email content
    const subject = `New Poll: ${pollTitle}`;
    const html = `
      <h2>New Poll Available</h2>
      <h3>${pollTitle}</h3>
      ${pollDescription ? `<p>${pollDescription}</p>` : ''}
      <p><strong>Type:</strong> ${pollType}</p>
      <p><strong>Voting Period:</strong> ${new Date(startAt).toLocaleString()} - ${new Date(endAt).toLocaleString()}</p>
      <p>Please log in to the HOA portal to cast your vote.</p>
    `;
    const text = `New Poll: ${pollTitle}\n\n${pollDescription || ''}\n\nType: ${pollType}\nVoting Period: ${new Date(startAt).toLocaleString()} - ${new Date(endAt).toLocaleString()}\n\nPlease log in to the HOA portal to cast your vote.`;

    const payload = {
      subject,
      html,
      text,
      recipients: recipients.map(r => r.email),
      correlationId
    };

    const payloadHash = computePayloadHash(payload);

    // Create EmailAudit record
    const emailAudit = await EmailAudit.create({
      template: 'poll-notify',
      recipient_count: recipients.length,
      request_payload_hash: correlationId || payloadHash,
      sent_at: new Date(),
      status: 'pending'
    }, { transaction });

    let successCount = 0;
    let failureCount = 0;
    const results = [];

    // Batch recipients for SendGrid
    const batches = chunkArray(recipients, BATCH_SIZE);

    for (const batch of batches) {
      const batchEmails = batch.map(r => r.email);

      try {
        // Send as BCC batch
        await sendWithRetry({
          to: process.env.EMAIL_FROM, // Primary recipient (ourselves)
          bcc: batchEmails,
          subject,
          html,
          text
        });

        successCount += batch.length;

        // Log individual recipient notifications
        for (const recipient of batch) {
          await ResidentNotificationLog.create({
            user_id: recipient.id,
            email_audit_id: emailAudit.id,
            subject,
            sent_at: new Date(),
            status: 'sent'
          }, { transaction });
        }

        results.push({ batch: batchEmails, status: 'success' });
      } catch (error) {
        failureCount += batch.length;

        // Log failures
        for (const recipient of batch) {
          await ResidentNotificationLog.create({
            user_id: recipient.id,
            email_audit_id: emailAudit.id,
            subject,
            sent_at: new Date(),
            status: 'failed'
          }, { transaction });
        }

        results.push({ batch: batchEmails, status: 'failed', error: error.message });
      }
    }

    // Update EmailAudit with final status
    await emailAudit.update({
      status: failureCount === 0 ? 'sent' : (successCount === 0 ? 'failed' : 'partial')
    }, { transaction });

    await transaction.commit();

    logger.info('Poll notification email completed', {
      emailAuditId: emailAudit.id,
      successCount,
      failureCount,
      totalRecipients: recipients.length,
      correlationId: correlationId || payloadHash
    });

    return {
      emailAuditId: emailAudit.id,
      successCount,
      failureCount,
      totalRecipients: recipients.length,
      results
    };
  } catch (error) {
    await transaction.rollback();
    logger.error('Poll notification email failed', {
      error: error.message,
      stack: error.stack,
      recipients: recipients.length
    });
    throw error;
  }
}

/**
 * Send vendor submission alert to admins
 * @param {Object} params - Vendor submission parameters
 * @param {number} params.vendorId - Vendor ID
 * @param {string} params.vendorName - Vendor name
 * @param {string} params.serviceCategory - Service category
 * @param {string} params.submitterName - Name of user who submitted
 * @param {Array<{id: number, email: string, name: string}>} params.adminRecipients - List of admin recipients
 * @param {string} params.correlationId - Optional correlation ID for audit trail
 * @returns {Promise<Object>} Result object with success/failure counts
 */
async function sendVendorSubmissionAlert({
  vendorId,
  vendorName,
  serviceCategory,
  submitterName,
  adminRecipients,
  correlationId = null
}) {
  const transaction = await sequelize.transaction();

  try {
    // Prepare email content per board tone guidelines
    const subject = 'New Vendor Submission Requires Review';
    const html = `
      <h2>New Vendor Submission</h2>
      <p>A new vendor has been submitted to our community directory and requires your review.</p>

      <h3>Vendor Details</h3>
      <p><strong>Business Name:</strong> ${vendorName}</p>
      <p><strong>Service Category:</strong> ${serviceCategory}</p>
      <p><strong>Submitted By:</strong> ${submitterName}</p>

      <p>Please log in to the HOA admin panel to review this submission and update its moderation status.</p>

      <hr>
      <p style="font-size: 12px; color: #666;">
        This notification was sent in accordance with HOA governance procedures.
        To manage your notification preferences or for questions, contact the HOA board at ${process.env.EMAIL_FROM || 'board@hoa.example.com'}.
      </p>
    `;
    const text = `New Vendor Submission Requires Review\n\nA new vendor has been submitted to our community directory and requires your review.\n\nVendor Details:\nBusiness Name: ${vendorName}\nService Category: ${serviceCategory}\nSubmitted By: ${submitterName}\n\nPlease log in to the HOA admin panel to review this submission and update its moderation status.\n\n---\nThis notification was sent in accordance with HOA governance procedures. To manage your notification preferences or for questions, contact the HOA board.`;

    const payload = {
      subject,
      html,
      text,
      recipients: adminRecipients.map(r => r.email),
      correlationId: correlationId || `vendor-${vendorId}-submission`
    };

    const payloadHash = computePayloadHash(payload);

    // Create EmailAudit record
    const emailAudit = await EmailAudit.create({
      template: 'vendor-submission-alert',
      recipient_count: adminRecipients.length,
      request_payload_hash: correlationId || payloadHash,
      sent_at: new Date(),
      status: 'pending'
    }, { transaction });

    let successCount = 0;
    let failureCount = 0;
    const results = [];

    // Batch recipients for SendGrid
    const batches = chunkArray(adminRecipients, BATCH_SIZE);

    for (const batch of batches) {
      const batchEmails = batch.map(r => r.email);

      try {
        // Send as BCC batch
        await sendWithRetry({
          to: process.env.EMAIL_FROM,
          bcc: batchEmails,
          subject,
          html,
          text
        });

        successCount += batch.length;

        // Log individual recipient notifications
        for (const recipient of batch) {
          await ResidentNotificationLog.create({
            user_id: recipient.id,
            email_audit_id: emailAudit.id,
            subject,
            sent_at: new Date(),
            status: 'sent'
          }, { transaction });
        }

        results.push({ batch: batchEmails, status: 'success' });
      } catch (error) {
        failureCount += batch.length;

        // Log failures
        for (const recipient of batch) {
          await ResidentNotificationLog.create({
            user_id: recipient.id,
            email_audit_id: emailAudit.id,
            subject,
            sent_at: new Date(),
            status: 'failed'
          }, { transaction });
        }

        results.push({ batch: batchEmails, status: 'failed', error: error.message });
      }
    }

    // Update EmailAudit with final status
    await emailAudit.update({
      status: failureCount === 0 ? 'sent' : (successCount === 0 ? 'failed' : 'partial')
    }, { transaction });

    await transaction.commit();

    logger.info('Vendor submission alert completed', {
      emailAuditId: emailAudit.id,
      vendorId,
      successCount,
      failureCount,
      totalRecipients: adminRecipients.length,
      correlationId: correlationId || payloadHash
    });

    return {
      emailAuditId: emailAudit.id,
      successCount,
      failureCount,
      totalRecipients: adminRecipients.length,
      results
    };
  } catch (error) {
    await transaction.rollback();
    logger.error('Vendor submission alert failed', {
      error: error.message,
      stack: error.stack,
      vendorId,
      recipients: adminRecipients.length
    });
    throw error;
  }
}

/**
 * Send vendor approval broadcast to residents
 * @param {Object} params - Vendor approval parameters
 * @param {number} params.vendorId - Vendor ID
 * @param {string} params.vendorName - Vendor name
 * @param {string} params.serviceCategory - Service category
 * @param {string} params.contactInfo - Vendor contact information
 * @param {Array<{id: number, email: string, name: string}>} params.recipients - List of resident recipients
 * @param {string} params.correlationId - Optional correlation ID for audit trail
 * @returns {Promise<Object>} Result object with success/failure counts
 */
async function sendVendorApprovalBroadcast({
  vendorId,
  vendorName,
  serviceCategory,
  contactInfo,
  recipients,
  correlationId = null
}) {
  const transaction = await sequelize.transaction();

  try {
    // Prepare email content per board tone guidelines
    const subject = `New Vendor Approved: ${vendorName}`;
    const html = `
      <h2>New Vendor Added to Our Directory</h2>
      <p>Great news! We've added a new vendor to our community directory.</p>

      <h3>${vendorName}</h3>
      <p><strong>Service Category:</strong> ${serviceCategory}</p>
      ${contactInfo ? `<p><strong>Contact:</strong> ${contactInfo}</p>` : ''}

      <p>This vendor has been reviewed and approved by the HOA board. You can view more details and explore other vetted local providers in the vendor directory on our HOA portal.</p>

      <p><strong>Thanks for strengthening our HOA governance!</strong></p>

      <hr>
      <p style="font-size: 12px; color: #666;">
        You're receiving this because you're a member of our HOA community.
        To manage your notification preferences or unsubscribe from vendor announcements, please contact the HOA board at ${process.env.EMAIL_FROM || 'board@hoa.example.com'}
        or reference Section 4.7 of the HOA bylaws for communication preferences.
      </p>
    `;
    const text = `New Vendor Added to Our Directory\n\nGreat news! We've added a new vendor to our community directory.\n\n${vendorName}\nService Category: ${serviceCategory}\n${contactInfo ? `Contact: ${contactInfo}\n` : ''}\nThis vendor has been reviewed and approved by the HOA board. You can view more details and explore other vetted local providers in the vendor directory on our HOA portal.\n\nThanks for strengthening our HOA governance!\n\n---\nYou're receiving this because you're a member of our HOA community. To manage your notification preferences or unsubscribe from vendor announcements, please contact the HOA board or reference Section 4.7 of the HOA bylaws for communication preferences.`;

    const payload = {
      subject,
      html,
      text,
      recipients: recipients.map(r => r.email),
      correlationId: correlationId || `vendor-${vendorId}-approval`
    };

    const payloadHash = computePayloadHash(payload);

    // Create EmailAudit record
    const emailAudit = await EmailAudit.create({
      template: 'vendor-approval-broadcast',
      recipient_count: recipients.length,
      request_payload_hash: correlationId || payloadHash,
      sent_at: new Date(),
      status: 'pending'
    }, { transaction });

    let successCount = 0;
    let failureCount = 0;
    const results = [];

    // Batch recipients for SendGrid
    const batches = chunkArray(recipients, BATCH_SIZE);

    for (const batch of batches) {
      const batchEmails = batch.map(r => r.email);

      try {
        // Send as BCC batch
        await sendWithRetry({
          to: process.env.EMAIL_FROM,
          bcc: batchEmails,
          subject,
          html,
          text
        });

        successCount += batch.length;

        // Log individual recipient notifications
        for (const recipient of batch) {
          await ResidentNotificationLog.create({
            user_id: recipient.id,
            email_audit_id: emailAudit.id,
            subject,
            sent_at: new Date(),
            status: 'sent'
          }, { transaction });
        }

        results.push({ batch: batchEmails, status: 'success' });
      } catch (error) {
        failureCount += batch.length;

        // Log failures
        for (const recipient of batch) {
          await ResidentNotificationLog.create({
            user_id: recipient.id,
            email_audit_id: emailAudit.id,
            subject,
            sent_at: new Date(),
            status: 'failed'
          }, { transaction });
        }

        results.push({ batch: batchEmails, status: 'failed', error: error.message });
      }
    }

    // Update EmailAudit with final status
    await emailAudit.update({
      status: failureCount === 0 ? 'sent' : (successCount === 0 ? 'failed' : 'partial')
    }, { transaction });

    await transaction.commit();

    logger.info('Vendor approval broadcast completed', {
      emailAuditId: emailAudit.id,
      vendorId,
      successCount,
      failureCount,
      totalRecipients: recipients.length,
      correlationId: correlationId || payloadHash
    });

    return {
      emailAuditId: emailAudit.id,
      successCount,
      failureCount,
      totalRecipients: recipients.length,
      results
    };
  } catch (error) {
    await transaction.rollback();
    logger.error('Vendor approval broadcast failed', {
      error: error.message,
      stack: error.stack,
      vendorId,
      recipients: recipients.length
    });
    throw error;
  }
}

/**
 * Send poll receipt email to a single voter
 * @param {Object} params - Receipt parameters
 * @param {number} params.userId - User ID
 * @param {string} params.userEmail - User email
 * @param {string} params.userName - User name
 * @param {string} params.pollTitle - Poll title
 * @param {string} params.receiptCode - Unique receipt code
 * @param {string} params.voteHash - Cryptographic vote hash
 * @param {Date} params.timestamp - Vote timestamp
 * @param {string} params.correlationId - Optional correlation ID
 * @returns {Promise<Object>} Result object
 */
async function sendPollReceiptEmail({
  userId,
  userEmail,
  userName,
  pollTitle,
  receiptCode,
  voteHash,
  timestamp,
  correlationId = null
}) {
  const transaction = await sequelize.transaction();

  try {
    const subject = `Vote Receipt: ${pollTitle}`;
    const html = `
      <h2>Your Vote Receipt</h2>
      <p>Dear ${userName},</p>
      <p>Thank you for voting in: <strong>${pollTitle}</strong></p>
      <p><strong>Receipt Code:</strong> ${receiptCode}</p>
      <p><strong>Vote Hash:</strong> <code>${voteHash}</code></p>
      <p><strong>Timestamp:</strong> ${new Date(timestamp).toLocaleString()}</p>
      <p>You can use your receipt code to verify your vote was recorded correctly in the HOA portal.</p>
      <p><em>Keep this email for your records.</em></p>
    `;
    const text = `Your Vote Receipt\n\nDear ${userName},\n\nThank you for voting in: ${pollTitle}\n\nReceipt Code: ${receiptCode}\nVote Hash: ${voteHash}\nTimestamp: ${new Date(timestamp).toLocaleString()}\n\nYou can use your receipt code to verify your vote was recorded correctly in the HOA portal.\n\nKeep this email for your records.`;

    const payload = {
      to: userEmail,
      subject,
      html,
      text,
      correlationId
    };

    const payloadHash = computePayloadHash(payload);

    // Create EmailAudit record
    const emailAudit = await EmailAudit.create({
      template: 'poll-receipt',
      recipient_count: 1,
      request_payload_hash: correlationId || payloadHash,
      sent_at: new Date(),
      status: 'pending'
    }, { transaction });

    try {
      await sendWithRetry(payload);

      await emailAudit.update({ status: 'sent' }, { transaction });

      await ResidentNotificationLog.create({
        user_id: userId,
        email_audit_id: emailAudit.id,
        subject,
        sent_at: new Date(),
        status: 'sent'
      }, { transaction });

      await transaction.commit();

      logger.info('Poll receipt email sent', {
        emailAuditId: emailAudit.id,
        userId,
        correlationId: correlationId || payloadHash
      });

      return { emailAuditId: emailAudit.id, status: 'sent' };
    } catch (error) {
      await emailAudit.update({ status: 'failed' }, { transaction });

      await ResidentNotificationLog.create({
        user_id: userId,
        email_audit_id: emailAudit.id,
        subject,
        sent_at: new Date(),
        status: 'failed'
      }, { transaction });

      await transaction.commit();

      logger.error('Poll receipt email failed', {
        emailAuditId: emailAudit.id,
        userId,
        error: error.message
      });

      throw error;
    }
  } catch (error) {
    await transaction.rollback();
    logger.error('Poll receipt email transaction failed', {
      error: error.message,
      userId
    });
    throw error;
  }
}

module.exports = {
  sendMail, // Legacy function for backward compatibility
  sendPollNotificationEmail,
  sendPollReceiptEmail,
  sendVendorSubmissionAlert,
  sendVendorApprovalBroadcast,
  // Export for testing
  computePayloadHash,
  sendWithRetry,
  chunkArray
};

