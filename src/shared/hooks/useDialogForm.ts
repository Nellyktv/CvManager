import { useState } from 'react';

export const useDialogForm = <F>(initialForm: F) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<F>(initialForm);
  const [editId, setEditId] = useState<number | null>(null);

  const openCreate = () => {
    setForm(initialForm);
    setEditId(null);
    setOpen(true);
  };

  const openEdit = (id: number, data: F) => {
    setForm(data);
    setEditId(id);
    setOpen(true);
  };

  const closeDialog = () => {
    setOpen(false);
    setEditId(null);
    setForm(initialForm);
  };

  return { open, form, setForm, editId, openCreate, openEdit, closeDialog };
};
