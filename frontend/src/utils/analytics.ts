/**
 * Analytics Utility
 *
 * Minimal event schema for capturing user interactions.
 * Follows observability spec from UI_UX_Architecture.md:4-6
 *
 * Privacy-first design:
 * - No user identifiers
 * - Anonymized data only
 * - Respects user privacy guidelines
 */

/**
 * Base analytics event structure
 */
export interface AnalyticsEvent {
  /** The action performed (e.g., 'toggle', 'click', 'submit') */
  action: string;
  /** The entity type (e.g., 'accessibility', 'form', 'navigation') */
  entity: string;
  /** The context where action occurred (e.g., 'navbar', 'modal', 'page') */
  context: string;
  /** Optional feature flag states at time of event */
  featureFlagState?: Record<string, boolean | string | number>;
  /** Optional metadata for additional context */
  metadata?: Record<string, unknown>;
}

/**
 * Log an analytics event
 *
 * In development: logs to console in grouped format
 * In production: only logs warnings/errors (per observability spec)
 *
 * @param event - The analytics event to log
 */
export const logAnalyticsEvent = (event: AnalyticsEvent): void => {
  if (process.env.NODE_ENV === 'development') {
    console.group(`📊 Analytics Event: ${event.entity}.${event.action}`);
    console.log('Action:', event.action);
    console.log('Entity:', event.entity);
    console.log('Context:', event.context);
    if (event.featureFlagState) {
      console.log('Feature Flags:', event.featureFlagState);
    }
    if (event.metadata) {
      console.log('Metadata:', event.metadata);
    }
    console.groupEnd();
  }

  // In production, events would be sent to a lightweight endpoint
  // For now, we only log anonymized preference changes per spec
  // Future: POST to /api/analytics with proper batching
};

/**
 * Track accessibility toggle event
 *
 * Specialized helper for accessibility toggle interactions.
 * Only logs anonymized preference changes.
 *
 * @param context - Where the toggle was activated ('navbar' or 'drawer')
 * @param highVisEnabled - The new high visibility state
 */
export const trackAccessibilityToggle = (
  context: 'navbar' | 'drawer',
  highVisEnabled: boolean
): void => {
  logAnalyticsEvent({
    action: 'toggle',
    entity: 'accessibility',
    context,
    featureFlagState: {
      highVis: highVisEnabled,
    },
  });
};

export default {
  logAnalyticsEvent,
  trackAccessibilityToggle,
};
