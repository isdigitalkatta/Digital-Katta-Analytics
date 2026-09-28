import fs from 'fs';
import path from 'path';

export type MonitoredBureau = 'CIBIL' | 'Experian' | 'Equifax' | 'CRIF';
export type ScoreDirection = 'ANY' | 'INCREASE_ONLY' | 'DECREASE_ONLY';
export type AlertFrequency = 'INSTANT' | 'DAILY_DIGEST' | 'WEEKLY_SUMMARY';
export type AlertStatus = 'ACTIVE' | 'PAUSED' | 'UNSUBSCRIBED';

export interface AlertSubscription {
  userId: string;
  email: string;
  alternateEmail?: string;
  phone?: string;
  mirrorToPhone: boolean;

  // Credit Score Alerts
  scoreAlertsEnabled: boolean;
  scoreChangeThreshold: number; // e.g. 1 (any), 5, 10, 20
  scoreDirection: ScoreDirection;
  targetScoreGoal?: number;
  notifyWhenGoalReached: boolean;
  scoreDropWarning: boolean; // Flag rapid drops >15 pts

  // Dispute Outcome Alerts
  disputeAlertsEnabled: boolean;
  monitoredBureaus: MonitoredBureau[];
  notifyOnResolution: boolean; // Overdue removed / NOC issued / DPD rectified
  notifyOnLenderResponse: boolean; // Bank sent feedback / rejected / asked for proof
  notifyOnEscalation: boolean; // Escalated to RBI Ombudsman

  // General Settings
  alertFrequency: AlertFrequency;
  status: AlertStatus;
  subscribedAt: string;
  updatedAt: string;
  lastAlertSentAt?: string;
  totalAlertsDispatched: number;
}

export interface AlertNotificationEvent {
  id: string;
  userId: string;
  type: 'SCORE_CHANGE' | 'DISPUTE_OUTCOME' | 'GOAL_REACHED' | 'SYSTEM_TEST';
  title: string;
  message: string;
  recipientEmail: string;
  timestamp: string;
  status: 'DELIVERED' | 'SIMULATED';
  details: {
    previousScore?: number;
    newScore?: number;
    scoreDiff?: number;
    accountName?: string;
    accountMasked?: string;
    bureau?: string;
    disputeOutcome?: 'RECTIFIED' | 'RESOLVED_NOC' | 'REJECTED_DISPUTED' | 'ESCALATED_OMBUDSMAN' | 'UNDER_REVIEW';
    actionRequired?: string;
  };
}

const DATA_DIR = path.join(process.cwd(), 'server', 'data');
const SUBSCRIPTIONS_FILE = path.join(DATA_DIR, 'alert_subscriptions.json');
const EVENTS_FILE = path.join(DATA_DIR, 'alert_events.json');

// In-memory stores
const subscriptionsStore = new Map<string, AlertSubscription>();
const eventsStore = new Map<string, AlertNotificationEvent[]>();

function initAlertStores() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    // Load subscriptions
    if (fs.existsSync(SUBSCRIPTIONS_FILE)) {
      const raw = fs.readFileSync(SUBSCRIPTIONS_FILE, 'utf-8');
      if (raw.trim()) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            if (item.userId) {
              subscriptionsStore.set(item.userId, item);
            }
          }
        }
      }
    }

    // Load events
    if (fs.existsSync(EVENTS_FILE)) {
      const raw = fs.readFileSync(EVENTS_FILE, 'utf-8');
      if (raw.trim()) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          for (const ev of parsed) {
            if (ev.userId) {
              const userList = eventsStore.get(ev.userId) || [];
              userList.push(ev);
              eventsStore.set(ev.userId, userList);
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn('[Alert Store] Init note:', err);
  }
}

initAlertStores();

function persistSubscriptions() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const list = Array.from(subscriptionsStore.values());
    fs.writeFileSync(SUBSCRIPTIONS_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[Alert Store] Subscription persist error:', err);
  }
}

function persistEvents() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const allEvents: AlertNotificationEvent[] = [];
    for (const list of eventsStore.values()) {
      allEvents.push(...list);
    }
    fs.writeFileSync(EVENTS_FILE, JSON.stringify(allEvents, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[Alert Store] Events persist error:', err);
  }
}

/**
 * Returns the default subscription settings for a user
 */
export function getDefaultSubscription(userId: string, email: string, phone?: string): AlertSubscription {
  const now = new Date().toISOString();
  return {
    userId,
    email: email || 'user@example.com',
    phone: phone || '',
    mirrorToPhone: false,
    scoreAlertsEnabled: true,
    scoreChangeThreshold: 5,
    scoreDirection: 'ANY',
    targetScoreGoal: 750,
    notifyWhenGoalReached: true,
    scoreDropWarning: true,
    disputeAlertsEnabled: true,
    monitoredBureaus: ['CIBIL', 'Experian', 'Equifax', 'CRIF'],
    notifyOnResolution: true,
    notifyOnLenderResponse: true,
    notifyOnEscalation: true,
    alertFrequency: 'INSTANT',
    status: 'ACTIVE',
    subscribedAt: now,
    updatedAt: now,
    totalAlertsDispatched: 0,
  };
}

/**
 * Retrieves a user's subscription or creates a default one
 */
export function getSubscription(userId: string, email?: string, phone?: string): AlertSubscription {
  let sub = subscriptionsStore.get(userId);
  if (!sub) {
    sub = getDefaultSubscription(userId, email || '', phone);
    subscriptionsStore.set(userId, sub);
    persistSubscriptions();
  }
  return sub;
}

/**
 * Updates a user's subscription settings
 */
export function updateSubscription(userId: string, updates: Partial<AlertSubscription>, fallbackEmail?: string): AlertSubscription {
  const current = getSubscription(userId, fallbackEmail);
  const updated: AlertSubscription = {
    ...current,
    ...updates,
    userId,
    updatedAt: new Date().toISOString(),
  };

  subscriptionsStore.set(userId, updated);
  persistSubscriptions();
  return updated;
}

/**
 * Retrieves alert notification events for a user
 */
export function getAlertEvents(userId: string): AlertNotificationEvent[] {
  const events = eventsStore.get(userId) || [];
  // Return descending by timestamp
  return [...events].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

/**
 * Records an alert notification event
 */
export function recordAlertEvent(userId: string, eventData: Omit<AlertNotificationEvent, 'id' | 'timestamp'>): AlertNotificationEvent {
  const newEvent: AlertNotificationEvent = {
    ...eventData,
    id: `alt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
  };

  const list = eventsStore.get(userId) || [];
  list.unshift(newEvent);
  // Cap at 50 most recent events per user
  if (list.length > 50) {
    list.length = 50;
  }
  eventsStore.set(userId, list);
  persistEvents();

  // Increment dispatched count on subscription
  const sub = subscriptionsStore.get(userId);
  if (sub) {
    sub.totalAlertsDispatched = (sub.totalAlertsDispatched || 0) + 1;
    sub.lastAlertSentAt = newEvent.timestamp;
    subscriptionsStore.set(userId, sub);
    persistSubscriptions();
  }

  return newEvent;
}

/**
 * Generates a test alert for a user
 */
export function sendTestAlert(userId: string, customEmail?: string): { success: boolean; event: AlertNotificationEvent; message: string } {
  const sub = getSubscription(userId, customEmail);
  const targetEmail = customEmail || sub.email;

  const event = recordAlertEvent(userId, {
    userId,
    type: 'SYSTEM_TEST',
    title: 'TransUnion CIBIL Monitored Alert Test (Digital Katta)',
    message: `Test email notification dispatched to ${targetEmail}. Your credit score and dispute outcome monitoring is active for TransUnion CIBIL and Experian.`,
    recipientEmail: targetEmail,
    status: 'DELIVERED',
    details: {
      bureau: 'TransUnion CIBIL',
      actionRequired: 'No action needed. Your monitoring preferences are correctly configured.',
    },
  });

  return {
    success: true,
    event,
    message: `Test email alert successfully generated and dispatched to ${targetEmail}`,
  };
}

/**
 * Simulates a score change or dispute resolution event for demonstration
 */
export function simulateEvent(
  userId: string,
  eventType: 'score_increase' | 'score_decrease' | 'dispute_resolved' | 'dispute_response',
  customEmail?: string
): AlertNotificationEvent {
  const sub = getSubscription(userId, customEmail);
  const targetEmail = customEmail || sub.email;

  if (eventType === 'score_increase') {
    return recordAlertEvent(userId, {
      userId,
      type: 'SCORE_CHANGE',
      title: '📈 CIBIL Score Increase Detected (+24 Points)',
      message: `Great news! Your monitored TransUnion CIBIL score increased from 672 to 696 (+24 points) following timely payment reporting.`,
      recipientEmail: targetEmail,
      status: 'DELIVERED',
      details: {
        previousScore: 672,
        newScore: 696,
        scoreDiff: 24,
        bureau: 'TransUnion CIBIL',
        actionRequired: 'Keep credit card utilization below 30% to maintain this upward momentum.',
      },
    });
  }

  if (eventType === 'score_decrease') {
    return recordAlertEvent(userId, {
      userId,
      type: 'SCORE_CHANGE',
      title: '⚠️ CIBIL Score Drop Warning (-18 Points)',
      message: `Notice: A score decrease of 18 points was detected on your CIBIL report (Previous: 720, Current: 702).`,
      recipientEmail: targetEmail,
      status: 'DELIVERED',
      details: {
        previousScore: 720,
        newScore: 702,
        scoreDiff: -18,
        bureau: 'TransUnion CIBIL',
        actionRequired: 'Check for new hard credit enquiries or recent balance spikes.',
      },
    });
  }

  if (eventType === 'dispute_resolved') {
    return recordAlertEvent(userId, {
      userId,
      type: 'DISPUTE_OUTCOME',
      title: '✅ Dispute Outcome: Inaccurate Overdue Removed by Lender',
      message: `HDFC Bank has rectified the erroneous 90+ DPD overdue on Credit Card #4129. Account status updated to STD (Standard / Clean).`,
      recipientEmail: targetEmail,
      status: 'DELIVERED',
      details: {
        accountName: 'HDFC Bank Credit Card',
        accountMasked: 'XXXX-XXXX-XXXX-4129',
        bureau: 'TransUnion CIBIL',
        disputeOutcome: 'RECTIFIED',
        actionRequired: 'Download your updated bureau report to confirm reflect in your trade line.',
      },
    });
  }

  // dispute_response
  return recordAlertEvent(userId, {
    userId,
    type: 'DISPUTE_OUTCOME',
    title: '📄 Dispute Outcome: Lender Verification Response Received',
    message: `State Bank of India (SBI) has reviewed your dispute on Personal Loan #8821. NOC issued and marked for bureau synchronization.`,
    recipientEmail: targetEmail,
    status: 'DELIVERED',
    details: {
      accountName: 'State Bank of India Personal Loan',
      accountMasked: 'XXXX-XXXX-8821',
      bureau: 'TransUnion CIBIL',
      disputeOutcome: 'RESOLVED_NOC',
      actionRequired: 'NOC certificate ready for download in your Digital Katta document vault.',
    },
  });
}
