import { request } from './core';
import type { ApiError } from './contracts';
import type {
  Announcement,
  AnnouncementDetail,
  LegalDocKey,
  LegalStatusResponse,
  PopupAnnouncement,
  PublicLegalDoc,
} from './types';

// The backend types every `lang` query param as Literal["zh", "en"], so a regional tag
// such as `zh-CN` (what the browser reports, and what i18n.language can hold) is a 422.
// Normalising here means no call site can get it wrong.
const toApiLang = (lang: string | undefined): 'zh' | 'en' =>
  (lang ?? '').toLowerCase().startsWith('zh') ? 'zh' : 'en';

// ===============================================
// Announcements API (Phase 6.1)
// ===============================================
export const announcementApi = {
  // List (default limit 10) - public read
  list: (lang: string, limit: number = 10) =>
    request<Announcement[]>(`/public/announcements?lang=${toApiLang(lang)}&limit=${limit}`),

  // Detail - public read
  get: async (id: number, lang: string) => {
    const preferred = toApiLang(lang);
    try {
      return await request<AnnouncementDetail>(`/public/announcements/${id}?lang=${preferred}`);
    } catch (error: unknown) {
      if ((error as Partial<ApiError>)?.status !== 404) throw error;
      // IDs are shared links; a language-scoped miss does not establish that the ID is missing.
      return request<AnnouncementDetail>(`/public/announcements/${id}?lang=${preferred === 'zh' ? 'en' : 'zh'}`);
    }
  },

  // Homepage popup - public read
  getPopup: (lang: string) =>
    request<PopupAnnouncement | null>(`/public/announcements/popup?lang=${toApiLang(lang)}`),
};

// ===============================================
// Legal API (Phase 6.2)
// ===============================================
export const legalApi = {
  getPublicDoc: (key: LegalDocKey, lang: string = 'zh') =>
    request<PublicLegalDoc>(`/public/legal/${key}?lang=${toApiLang(lang)}`),
  getStatus: (lang: string = 'zh') =>
    request<LegalStatusResponse>(`/legal/status?lang=${toApiLang(lang)}`),
  accept: (key: LegalDocKey, version: string) =>
    request<void>(`/legal/accept`, {
      method: 'POST',
      body: JSON.stringify({ key, version }),
    }),
};
