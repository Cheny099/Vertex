import type { LucideIcon } from 'lucide-react';
import {
  ArrowRightLeft,
  BarChart,
  Bot,
  ClipboardCheck,
  FileText,
  HelpCircle,
  History,
  LayoutDashboard,
  Megaphone,
  Scale,
  Settings,
  Sparkles,
  Terminal,
  Ticket,
  Workflow,
} from 'lucide-react';

export interface NavItemConfig {
  titleKey: string;
  defaultValue?: string;
  url: string;
  icon: LucideIcon;
}

export const MAIN_NAV_ITEMS: NavItemConfig[] = [
  { titleKey: 'common:nav.dashboard', url: '/dashboard', icon: LayoutDashboard },
  { titleKey: 'common:nav.ai_assistant', url: '/ai-assistant', icon: Sparkles },
  { titleKey: 'common:nav.strategies', url: '/strategies', icon: Bot },
  { titleKey: 'common:nav.announcements', url: '/announcements', icon: Megaphone },
  { titleKey: 'common:nav.history', url: '/history', icon: History },
  { titleKey: 'common:nav.settings', url: '/settings', icon: Settings },
  { titleKey: 'common:nav.help', url: '/help', icon: HelpCircle },
];

export const ADMIN_NAV_ITEMS: NavItemConfig[] = [
  { titleKey: 'admin:announcements', url: '/admin/announcements', icon: Megaphone },
  { titleKey: 'admin:legal', url: '/admin/legal', icon: Scale },
  { titleKey: 'admin:strategies', url: '/admin/strategies', icon: Workflow },
  { titleKey: 'admin:strategy_switch.title', url: '/admin/strategy-switch', icon: ArrowRightLeft },
  { titleKey: 'admin:ops', url: '/admin/ops', icon: Terminal },
  { titleKey: 'admin:system_logs', url: '/admin/system-logs', icon: FileText },
  { titleKey: 'admin:trade_audit', url: '/admin/trade-audit', icon: ClipboardCheck },
  { titleKey: 'admin:trade_performance', url: '/admin/trade-performance', icon: BarChart },
  { titleKey: 'admin:invites.title', defaultValue: 'Invite Codes', url: '/admin/invites', icon: Ticket },
];

export const isRouteActive = (pathname: string, url: string) =>
  url === '/dashboard' ? pathname === url : pathname.startsWith(url);

