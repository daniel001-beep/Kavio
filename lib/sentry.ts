import * as Sentry from "@sentry/nextjs";

type EventName =
  | "worker_created"
  | "payment_created"
  | "receipt_uploaded"
  | "workspace_switched"
  | "invoice_created"
  | "employer_workspace_created"
  | "freelancer_workspace_created";

/**
 * Tracks a custom event in Sentry by adding a breadcrumb and capturing a message.
 * This can be used to track critical business flows.
 */
export const trackEvent = (eventName: EventName, metadata?: Record<string, any>) => {
  // Add as a breadcrumb so it's attached to any future errors in this session
  Sentry.addBreadcrumb({
    category: "custom_event",
    message: eventName,
    level: "info",
    data: metadata,
  });

  // Also capture it as a distinct message for event tracking and dashboards
  Sentry.captureMessage(`Event: ${eventName}`, {
    level: "info",
    tags: {
      event_type: eventName,
    },
    extra: metadata,
  });
};

/**
 * Manually capture a handled exception
 */
export const captureError = (error: unknown, context?: Record<string, any>) => {
  Sentry.captureException(error, {
    extra: context,
  });
};
