import { adminAnnouncementsApi, adminLegalApi } from './admin/content';
import { adminInvitesApi } from './admin/invites';
import {
  adminAuditApi,
  adminOpsApi,
  adminStatsApi,
  adminSubscriptionsApi,
  adminTurboFlowAuditApi,
} from './admin/operations';
import { adminStrategiesApi } from './admin/strategies';
import { adminStrategySwitchApi } from './admin/strategy-switch';

export const adminApi = {
  strategies: adminStrategiesApi,
  announcements: adminAnnouncementsApi,
  legal: adminLegalApi,
  ops: adminOpsApi,
  audit: adminAuditApi,
  subscriptions: adminSubscriptionsApi,
  auditTurboflow: adminTurboFlowAuditApi,
  stats: adminStatsApi,
  strategySwitch: adminStrategySwitchApi,
  invites: adminInvitesApi,
};
