import type { AdminInviteCreateRequest } from '@/api';

export const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
} as const;

export const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 15,
    },
  },
} as const;

export interface CreatedInviteCode {
  plainCode: string;
  channel: string | null;
}

export interface InviteActionConfirmState {
  open: boolean;
  title: string;
  desc: string;
  onConfirm: () => void;
}

export const DEFAULT_NEW_INVITE: AdminInviteCreateRequest = {
  channel: '',
  notes: '',
  max_uses: 1,
};

export const DEFAULT_ACTION_CONFIRM: InviteActionConfirmState = {
  open: false,
  title: '',
  desc: '',
  onConfirm: () => {},
};
