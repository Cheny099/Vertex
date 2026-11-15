import { request } from '../core';
import { z } from 'zod';
import { decodeResponse } from '../response-validation';
import type {
  StrategySwitchBulkExecuteRequest,
  StrategySwitchBulkPreviewRequest,
  StrategySwitchBulkPreviewResponse,
  StrategySwitchCampaign,
  StrategySwitchPreviewRequest,
  StrategySwitchPreviewResponse,
  StrategySwitchRequest,
  StrategySwitchRun,
} from '../types';

const receipt = z.object({ status: z.string(), idempotent_reused: z.boolean() });
const singleReceipt = receipt.extend({ run_id: z.number().int().positive().safe() });
const bulkReceipt = receipt.extend({ campaign_id: z.number().int().positive().safe() });

export const adminStrategySwitchApi = {
  preview: (data: StrategySwitchPreviewRequest) =>
    request<StrategySwitchPreviewResponse>('/admin/strategy-switch/preview', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  execute: (data: StrategySwitchRequest) =>
    request<unknown>('/admin/strategy-switch/execute', {
      method: 'POST',
      body: JSON.stringify(data),
    }).then(value => decodeResponse(singleReceipt, value)),
  getRun: (id: number) => request<StrategySwitchRun>(`/admin/strategy-switch/runs/${id}`),
  cancelRun: (id: number) => request<void>(`/admin/strategy-switch/runs/${id}/cancel`, { method: 'POST' }),
  bulkPreview: (data: StrategySwitchBulkPreviewRequest) =>
    request<StrategySwitchBulkPreviewResponse>('/admin/strategy-switch/bulk/preview', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  bulkExecute: (data: StrategySwitchBulkExecuteRequest) =>
    request<unknown>('/admin/strategy-switch/bulk/execute', {
      method: 'POST',
      body: JSON.stringify(data),
    }).then(value => decodeResponse(bulkReceipt, value)),
  getCampaign: (id: number) => request<StrategySwitchCampaign>(`/admin/strategy-switch/bulk/${id}`),
};
