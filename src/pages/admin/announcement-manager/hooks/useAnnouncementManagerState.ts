import { useState } from 'react';

import { DEFAULT_FORM, type AnnouncementFilters, type AnnouncementFormData } from '../utils';

export function useAnnouncementManagerState() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState<AnnouncementFormData>(DEFAULT_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editorTab, setEditorTab] = useState<'edit' | 'preview'>('edit');
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isSimulateOpen, setIsSimulateOpen] = useState(false);
  const [filters, setFilters] = useState<AnnouncementFilters>({
    lang: 'all',
    include_unpublished: true,
    include_deleted: false,
    limit: 50,
    offset: 0,
  });

  const resetEditor = () => {
    setEditingId(null);
    setFormData(DEFAULT_FORM);
    setEditorTab('edit');
  };

  const openCreate = () => {
    resetEditor();
    setIsCreateOpen(true);
  };

  return {
    isCreateOpen,
    setIsCreateOpen,
    formData,
    setFormData,
    editingId,
    setEditingId,
    editorTab,
    setEditorTab,
    isLoadingDetail,
    setIsLoadingDetail,
    isSimulateOpen,
    setIsSimulateOpen,
    filters,
    setFilters,
    resetEditor,
    openCreate,
  };
}
