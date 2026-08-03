import { useRef, useState } from 'react';

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

  // Identifies the editor's current "load intent". Any transition that changes what the editor is
  // for - opening a different record, resetting to create, closing - invalidates whatever detail
  // fetch is still in flight, so a late response cannot write into an editor that has moved on.
  const editRequestRef = useRef(0);
  const invalidatePendingEdit = () => {
    editRequestRef.current += 1;
    // The abandoned request will now fail its id check and skip its own cleanup, so the loading
    // flag has to be released here. Otherwise the spinner overlay never clears and the submit
    // guard keeps rejecting silently - the create form becomes unusable for the rest of the mount.
    setIsLoadingDetail(false);
    return editRequestRef.current;
  };

  const resetEditor = () => {
    invalidatePendingEdit();
    setEditingId(null);
    setFormData(DEFAULT_FORM);
    setEditorTab('edit');
  };

  const openCreate = () => {
    resetEditor();
    setIsCreateOpen(true);
  };

  return {
    editRequestRef,
    invalidatePendingEdit,
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
