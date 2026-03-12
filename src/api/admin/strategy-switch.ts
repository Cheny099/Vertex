import { request } from '../core';
import type {
  StrategySwitchBulkExecuteRequest,
  StrategySwitchBulkExecuteResponse,
  StrategySwitchBulkPreviewRequest,
  StrategySwitchBulkPreviewResponse,
  StrategySwitchCampaign,
  StrategySwitchPreviewRequest,
  StrategySwitchPreviewResponse,
  StrategySwitchRequest,
  StrategySwitchResponse,
  StrategySwitchRun,
} from '../types';

export const adminStrategySwitchApi = {
  preview: (data: StrategySwitchPreviewRequest) =>
    request<StrategySwitchPreviewResponse>('/admin/strategy-switch/preview', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  execute: (data: StrategySwitchRequest) =>
    request<StrategySwitchResponse>('/admin/strategy-switch/execute', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getRun: (id: number) => request<StrategySwitchRun>(`/admin/strategy-switch/runs/${id}`),
  cancelRun: (id: number) => request<void>(`/admin/strategy-switch/runs/${id}/cancel`, { method: 'POST' }),
  bulkPreview: (data: StrategySwitchBulkPreviewRequest) =>
    request<StrategySwitchBulkPreviewResponse>('/admin/strategy-switch/bulk/preview', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  bulkExecute: (data: StrategySwitchBulkExecuteRequest) =>
    request<StrategySwitchBulkExecuteResponse>('/admin/strategy-switch/bulk/execute', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getCampaign: (id: number) => request<StrategySwitchCampaign>(`/admin/strategy-switch/bulk/${id}`),
};
