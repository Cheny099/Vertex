import { request } from './core';
import type {
  Announcement,
  AnnouncementDetail,
  LegalDocKey,
  LegalStatusResponse,
  PopupAnnouncement,
  PublicLegalDoc,
} from './types';

// ===============================================
// Announcements API (Phase 6.1)
// ===============================================
export const announcementApi = {
  // List (default limit 10) - public read
  list: (lang: string, limit: number = 10) =>
    request<Announcement[]>(`/public/announcements?lang=${lang}&limit=${limit}`),

  // Detail - public read
  get: (id: number, lang: string) =>
    request<AnnouncementDetail>(`/public/announcements/${id}?lang=${lang}`),

  // Homepage popup - public read
  getPopup: (lang: string) =>
    request<PopupAnnouncement | null>(`/public/announcements/popup?lang=${lang}`),
};

// ===============================================
// Legal API (Phase 6.2)
// ===============================================
export const legalApi = {
  getPublicDoc: (key: LegalDocKey, lang: string = 'zh') =>
    request<PublicLegalDoc>(`/public/legal/${key}?lang=${lang}`),
  getStatus: (lang: string = 'zh') => request<LegalStatusResponse>(`/legal/status?lang=${lang}`),
  accept: (key: LegalDocKey, version: string) =>
    request<void>(`/legal/accept`, {
      method: 'POST',
      body: JSON.stringify({ key, version }),
    }),
};
