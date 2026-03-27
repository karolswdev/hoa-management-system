const logger = require('../config/logger');
const { CommitteeMember, User } = require('../../models');

// Lazy-load email service to avoid circular deps
let emailService = null;
function getEmailService() {
  if (!emailService) {
    emailService = require('./email.service');
  }
  return emailService;
}

const SITE_URL = process.env.SITE_URL || 'http://localhost:5173';
const EMAIL_FROM = process.env.EMAIL_FROM || 'board@hoa.example.com';

/**
 * Get committee member emails for notifications.
 */
async function getCommitteeRecipients(committeeId) {
  const members = await CommitteeMember.findAll({
    where: { committee_id: committeeId },
    include: [{
      model: User,
      as: 'user',
      attributes: ['id', 'name', 'email'],
      where: { status: 'approved', email_verified: true }
    }]
  });
  return members.map(m => ({ id: m.user.id, name: m.user.name, email: m.user.email }));
}

/**
 * Get submitter info for notifications.
 */
async function getSubmitterInfo(userId) {
  const user = await User.findByPk(userId, { attributes: ['id', 'name', 'email'] });
  return user ? { id: user.id, name: user.name, email: user.email } : null;
}

/**
 * Notify committee members when a new request is submitted.
 */
async function notifyRequestSubmitted({ workflowId, committeeId, requestType, submitterName, summary }) {
  try {
    const recipients = await getCommitteeRecipients(committeeId);
    if (recipients.length === 0) return;

    const subject = `New ${formatRequestType(requestType)} Request Submitted`;
    const html = `
      <h2>New Request Requires Review</h2>
      <p>A new ${formatRequestType(requestType)} request has been submitted by <strong>${submitterName}</strong>.</p>
      ${summary ? `<p><strong>Summary:</strong> ${summary}</p>` : ''}
      <p><a href="${SITE_URL}/workflows/${workflowId}">View Request</a></p>
      <hr>
      <p style="font-size: 12px; color: #666;">
        You are receiving this because you are a member of the reviewing committee.
        Contact ${EMAIL_FROM} with questions.
      </p>
    `;

    for (const recipient of recipients) {
      await getEmailService().sendMail({
        to: recipient.email,
        subject,
        html
      });
    }

    logger.info('Workflow submission notification sent', { workflowId, recipientCount: recipients.length });
  } catch (error) {
    logger.error('Failed to send submission notification', { workflowId, error: error.message });
  }
}

/**
 * Notify submitter when their request status changes.
 */
async function notifyStatusChanged({ workflowId, submitterId, fromStatus, toStatus, comment }) {
  try {
    const submitter = await getSubmitterInfo(submitterId);
    if (!submitter) return;

    const subject = `Your Request Status Updated: ${formatStatus(toStatus)}`;
    const html = `
      <h2>Request Status Update</h2>
      <p>Your request has been updated from <strong>${formatStatus(fromStatus)}</strong> to <strong>${formatStatus(toStatus)}</strong>.</p>
      ${comment ? `<p><strong>Reviewer Note:</strong> ${comment}</p>` : ''}
      <p><a href="${SITE_URL}/workflows/${workflowId}">View Your Request</a></p>
      <hr>
      <p style="font-size: 12px; color: #666;">
        This notification was sent in accordance with HOA governance procedures.
        Contact ${EMAIL_FROM} with questions.
      </p>
    `;

    await getEmailService().sendMail({
      to: submitter.email,
      subject,
      html
    });

    logger.info('Workflow status change notification sent', { workflowId, toStatus, submitterId });
  } catch (error) {
    logger.error('Failed to send status change notification', { workflowId, error: error.message });
  }
}

/**
 * Notify relevant parties when a comment is added.
 */
async function notifyCommentAdded({ workflowId, committeeId, submitterId, commentAuthorId, isInternal }) {
  try {
    // Internal comments: don't notify submitter
    if (isInternal) return;

    const author = await getSubmitterInfo(commentAuthorId);
    const authorName = author?.name || 'Someone';

    // If comment is from committee member -> notify submitter
    // If comment is from submitter -> notify committee
    const isMember = await CommitteeMember.findOne({
      where: { committee_id: committeeId, user_id: commentAuthorId }
    });

    if (isMember) {
      // Notify submitter
      const submitter = await getSubmitterInfo(submitterId);
      if (submitter) {
        await getEmailService().sendMail({
          to: submitter.email,
          subject: 'New Comment on Your Request',
          html: `
            <h2>New Comment on Your Request</h2>
            <p><strong>${authorName}</strong> has added a comment to your request.</p>
            <p><a href="${SITE_URL}/workflows/${workflowId}">View Comment</a></p>
            <hr>
            <p style="font-size: 12px; color: #666;">Contact ${EMAIL_FROM} with questions.</p>
          `
        });
      }
    } else {
      // Notify committee
      const recipients = await getCommitteeRecipients(committeeId);
      for (const r of recipients) {
        if (r.id === commentAuthorId) continue; // Don't notify the author
        await getEmailService().sendMail({
          to: r.email,
          subject: 'New Comment on a Request Under Review',
          html: `
            <h2>New Comment</h2>
            <p><strong>${authorName}</strong> has added a comment to a request you are reviewing.</p>
            <p><a href="${SITE_URL}/workflows/${workflowId}">View Comment</a></p>
            <hr>
            <p style="font-size: 12px; color: #666;">Contact ${EMAIL_FROM} with questions.</p>
          `
        });
      }
    }

    logger.info('Workflow comment notification sent', { workflowId, commentAuthorId });
  } catch (error) {
    logger.error('Failed to send comment notification', { workflowId, error: error.message });
  }
}

/**
 * Notify committee members when an appeal is filed.
 */
async function notifyAppealFiled({ workflowId, committeeId, submitterName }) {
  try {
    const recipients = await getCommitteeRecipients(committeeId);
    if (recipients.length === 0) return;

    for (const r of recipients) {
      await getEmailService().sendMail({
        to: r.email,
        subject: 'Appeal Filed on a Previously Denied Request',
        html: `
          <h2>Appeal Filed</h2>
          <p><strong>${submitterName}</strong> has filed an appeal on a previously denied request.</p>
          <p><a href="${SITE_URL}/workflows/${workflowId}">Review Appeal</a></p>
          <hr>
          <p style="font-size: 12px; color: #666;">Contact ${EMAIL_FROM} with questions.</p>
        `
      });
    }

    logger.info('Appeal notification sent', { workflowId, recipientCount: recipients.length });
  } catch (error) {
    logger.error('Failed to send appeal notification', { workflowId, error: error.message });
  }
}

/**
 * Notify committee members when a request is withdrawn.
 */
async function notifyRequestWithdrawn({ workflowId, committeeId, submitterName }) {
  try {
    const recipients = await getCommitteeRecipients(committeeId);
    if (recipients.length === 0) return;

    for (const r of recipients) {
      await getEmailService().sendMail({
        to: r.email,
        subject: 'Request Withdrawn',
        html: `
          <h2>Request Withdrawn</h2>
          <p><strong>${submitterName}</strong> has withdrawn their request.</p>
          <p><a href="${SITE_URL}/workflows/${workflowId}">View Details</a></p>
          <hr>
          <p style="font-size: 12px; color: #666;">Contact ${EMAIL_FROM} with questions.</p>
        `
      });
    }

    logger.info('Withdrawal notification sent', { workflowId, recipientCount: recipients.length });
  } catch (error) {
    logger.error('Failed to send withdrawal notification', { workflowId, error: error.message });
  }
}

// --- Helpers ---

function formatRequestType(requestType) {
  return requestType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function formatStatus(status) {
  return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

module.exports = {
  notifyRequestSubmitted,
  notifyStatusChanged,
  notifyCommentAdded,
  notifyAppealFiled,
  notifyRequestWithdrawn,
  getCommitteeRecipients,
  getSubmitterInfo
};
