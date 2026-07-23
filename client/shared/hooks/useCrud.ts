import { useEffect, useState } from 'react';
import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';

import { api } from '../../api/axios.api';

export const useCrud = <T>(route: string, responseKey: string, enabled: boolean = true) => {
  const { enqueueSnackbar } = useSnackbar();
  const { t } = useTranslation();

  const [items, setItems] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchItems = () => {
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
  };

  useEffect(() => {
    if (!enabled) return;

    fetchItems();
  }, [enabled]);

  const createItem = async (data: unknown) => {
    try {
      await api.post(route, data);

      enqueueSnackbar(t('common.saved'), {
        variant: 'success',
      });

      fetchItems();
    } catch (error) {
      console.error(error);

      enqueueSnackbar(t('common.error'), {
        variant: 'error',
      });
    }
  };

  const updateItem = async (id: number, data: unknown) => {
    try {
      await api.put(`${route}/${id}`, data);

      enqueueSnackbar(t('common.saved'), {
        variant: 'success',
      });

      fetchItems();
    } catch (error) {
      console.error(error);

      enqueueSnackbar(t('common.error'), {
        variant: 'error',
      });
    }
  };

  const deleteItems = async (ids: number[]) => {
    let hasError = false;

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
  };

  return {
    items,
    isLoading,
    createItem,
    updateItem,
    deleteItems,
  };
};