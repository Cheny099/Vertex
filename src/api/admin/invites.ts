import { request } from '../core';
import type {
  AdminInviteCreateRequest,
  AdminInviteCreateResponse,
  AdminInviteListItem,
  AdminInviteListResponse,
} from '../types';

export const adminInvitesApi = {
  create: async (data: AdminInviteCreateRequest) => {
    return request<AdminInviteCreateResponse>('/admin/invites/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  list: async (params?: { channel?: string; include_revoked?: boolean; page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.channel) query.append('channel', params.channel);
    if (params?.include_revoked !== undefined) query.append('include_revoked', String(params.include_revoked));
    if (params?.page !== undefined) query.append('page', String(params.page));
    if (params?.limit !== undefined) query.append('limit', String(params.limit));
    const qs = query.toString();
    return request<AdminInviteListResponse>(`/admin/invites/${qs ? `?${qs}` : ''}`);
  },
  revoke: async (id: number) => {
    return request<AdminInviteListItem>(`/admin/invites/${id}/revoke`, {
      method: 'POST',
    });
  },
};
