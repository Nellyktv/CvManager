import { useCallback, useEffect, useState } from 'react';
import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';

import { api } from '../../api/axios.api';

export const useCrud = <T>(route: string, responseKey: string, enabled: boolean = true) => {
  const { enqueueSnackbar } = useSnackbar();
  const { t } = useTranslation();

  const [items, setItems] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchItems = useCallback(() => {
    api
      .get(route)
      .then((response) => {
        setItems(response.data[responseKey]);
      })
      .catch((error) => {
        console.error(error);
        enqueueSnackbar(t('common.error'), {
          variant: 'error',
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [enqueueSnackbar, responseKey, route, t]);

  useEffect(() => {
    if (!enabled) return;

    fetchItems();
  }, [enabled, fetchItems]);

  const createItem = async (data: unknown) => {
    try {
      setSaving(true);
      await api.post(route, data);

      enqueueSnackbar(t('common.saved'), {
        variant: 'success',
      });

      fetchItems();
      return true;
    } catch (error) {
      console.error(error);

      enqueueSnackbar(t('common.error'), {
        variant: 'error',
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const updateItem = async (id: number, data: unknown) => {
    try {
      setSaving(true);
      await api.put(`${route}/${id}`, data);

      enqueueSnackbar(t('common.saved'), {
        variant: 'success',
      });

      fetchItems();
      return true;
    } catch (error) {
      console.error(error);

      enqueueSnackbar(t('common.error'), {
        variant: 'error',
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const deleteItems = async (ids: number[]) => {
    let hasError = false;

    try {
      setSaving(true);

      for (const id of ids) {
        try {
          await api.delete(`${route}/${id}`);
        } catch (error) {
          console.error(error);
          hasError = true;
        }
      }

      if (hasError) {
        enqueueSnackbar(t('common.error'), {
          variant: 'error',
        });
      } else {
        enqueueSnackbar(t('common.deleted'), {
          variant: 'success',
        });
      }

      fetchItems();
      return !hasError;
    } finally {
      setSaving(false);
    }
  };

  return {
    items,
    isLoading,
    saving,
    createItem,
    updateItem,
    deleteItems,
  };
};
