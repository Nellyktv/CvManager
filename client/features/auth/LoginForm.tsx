import { useEffect, useState } from 'react';
import { Alert, CircularProgress, Paper, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { jwtDecode } from 'jwt-decode';
import { GoogleLogin, GoogleOAuthProvider, type CredentialResponse } from '@react-oauth/google';
import { api } from '../../api/axios.api';
import useUserStore, { type UserRole } from '../../store/UserStore';
import { PUBLIC_ROUTE } from '../../shared/utils/constsLinks';

const LoginForm = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { setToken, setUser, setIsAuth } = useUserStore();
  const [clientId, setClientId] = useState<string | null>();
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    api.get<{ clientId: string | null }>('/user/google-config', { signal: controller.signal })
      .then(({ data }) => setClientId(data.clientId))
      .catch(() => {
        if (!controller.signal.aborted) setClientId(null);
      });
    return () => controller.abort();
  }, []);

  const signIn = async ({ credential }: CredentialResponse) => {
    setError(false);
    setSubmitting(true);
    try {
      if (!credential) throw new Error('Google credential unavailable');
      const { data } = await api.post<{ token: string }>('/user/google', { credential });
      const { id, email, role } = jwtDecode<{ id: number; email: string; role: UserRole }>(data.token);
      setToken(data.token);
      setUser({ id, email, role });
      setIsAuth(true);
      navigate(PUBLIC_ROUTE);
    } catch {
      setError(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Paper variant="outlined" sx={{ width: '100%', maxWidth: 420, p: 3 }}>
      <Stack alignItems="center" spacing={2}>
        <Typography component="h1" variant="h5">{t('auth.loginTitle')}</Typography>
        {(clientId === undefined || submitting) && <CircularProgress size={24} />}
        {clientId === null && <Alert severity="warning">{t('auth.googleUnavailable')}</Alert>}
        {error && <Alert severity="error">{t('auth.googleLoginError')}</Alert>}
        {clientId && !submitting && (
          <GoogleOAuthProvider
            clientId={clientId}
            locale={i18n.language.startsWith('ru') ? 'ru' : 'en'}
            onScriptLoadError={() => setClientId(null)}
          >
            <GoogleLogin
              onSuccess={(response) => void signIn(response)}
              onError={() => setError(true)}
            />
          </GoogleOAuthProvider>
        )}
      </Stack>
    </Paper>
  );
};

export default LoginForm;
