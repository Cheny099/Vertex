import type { JsonObject } from '../contracts';
import { request } from '../core';
import type {
  AdminLegalDocListResponse,
  AdminLegalDocResponse,
  AnnouncementAdminListResponse,
  AnnouncementAdminResponse,
} from '../types';

export const adminAnnouncementsApi = {
  list: (params?: {
    lang?: 'zh' | 'en' | 'all';
    include_deleted?: boolean;
    include_unpublished?: boolean;
    limit?: number;
    offset?: number;
  }) => {
    const query = new URLSearchParams();
    if (params?.lang && params.lang !== 'all') query.append('lang', params.lang);
    if (params?.include_deleted !== undefined) query.append('include_deleted', String(params.include_deleted));
    if (params?.include_unpublished !== undefined) query.append('include_unpublished', String(params.include_unpublished));
    if (params?.limit !== undefined) query.append('limit', String(params.limit));
    if (params?.offset !== undefined) query.append('offset', String(params.offset));
    const qs = query.toString();
    return request<AnnouncementAdminListResponse>(`/admin/announcements/${qs ? `?${qs}` : ''}`);
  },
  get: (id: number, params?: { include_deleted?: boolean }) => {
    const query = new URLSearchParams();
    if (params?.include_deleted !== undefined) query.append('include_deleted', String(params.include_deleted));
    const qs = query.toString();
    return request<AnnouncementAdminResponse>(`/admin/announcements/${id}${qs ? `?${qs}` : ''}`);
  },
  create: (data: JsonObject) =>
    request<AnnouncementAdminResponse>('/admin/announcements/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: JsonObject) =>
    request<AnnouncementAdminResponse>(`/admin/announcements/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => request<void>(`/admin/announcements/${id}`, { method: 'DELETE' }),
  publish: (id: number) => request<AnnouncementAdminResponse>(`/admin/announcements/${id}/publish`, { method: 'POST' }),
  unpublish: (id: number) =>
    request<AnnouncementAdminResponse>(`/admin/announcements/${id}/unpublish`, { method: 'POST' }),
};

export const adminLegalApi = {
  list: (params?: { key?: string; lang?: string; is_active?: boolean; limit?: number; offset?: number }) => {
    const query = new URLSearchParams();
    if (params?.key) query.append('key', params.key);
    if (params?.lang) query.append('lang', params.lang);
    if (params?.is_active !== undefined) query.append('is_active', String(params.is_active));
    if (params?.limit !== undefined) query.append('limit', String(params.limit));
    if (params?.offset !== undefined) query.append('offset', String(params.offset));
    const qs = query.toString();
    return request<AdminLegalDocListResponse>(`/admin/legal/${qs ? `?${qs}` : ''}`);
  },
  get: (id: number) => request<AdminLegalDocResponse>(`/admin/legal/${id}`),
  create: (data: JsonObject) =>
    request<AdminLegalDocResponse>('/admin/legal/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: JsonObject) =>
    request<AdminLegalDocResponse>(`/admin/legal/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  activate: (id: number) => request<AdminLegalDocResponse>(`/admin/legal/${id}/activate`, { method: 'POST' }),
};
