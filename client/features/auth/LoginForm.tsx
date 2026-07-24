import { useState } from 'react';
import {
  Stack,
  TextField,
  Button,
  Typography,
  IconButton,
  InputAdornment,
  Paper,
  Alert,
  Link,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { jwtDecode } from 'jwt-decode';
import {
  GoogleLogin,
  GoogleOAuthProvider,
  type CredentialResponse,
} from '@react-oauth/google';
import { FormSchemaLogin, type LoginFormFields } from '../../shared/utils/shemas';
import { api } from '../../api/axios.api';
import useUserStore, { type UserRole } from '../../store/UserStore';
import { PUBLIC_ROUTE } from '../../shared/utils/constsLinks';

type Props = {
  title: string;
  btnName: string;
  textForLink: string;
  linkName: string;
  linkTo: string;
};

const LoginForm = ({
  title,
  btnName,
  textForLink,
  linkName,
  linkTo,
}: Props) => {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const navigate = useNavigate();
  const setToken = useUserStore((state) => state.setToken);
  const setIsAuth = useUserStore((state) => state.setIsAuth);
  const setUser = useUserStore((state) => state.setUser);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LoginFormFields>({
    resolver: zodResolver(FormSchemaLogin),
  });

  const applyAuthToken = (token: string) => {
    const decoded = jwtDecode<{ id: number; email: string; role: UserRole }>(
      token,
    );
    setToken(token);
    setUser({ id: decoded.id, email: decoded.email, role: decoded.role });
    setIsAuth(true);
    navigate(PUBLIC_ROUTE);
  };

  const onSubmit: SubmitHandler<LoginFormFields> = async (data) => {
    setSubmitError(null);
    try {
      const response = await api.post('/user/login', data);
      applyAuthToken(response.data.token);
      reset();
    } catch (error) {
      console.error('Login error:', error);
      setSubmitError(t('auth.loginError'));
    }
  };

  const handleGoogleSuccess = async (
    credentialResponse: CredentialResponse,
  ) => {
    setSubmitError(null);
    try {
      const response = await api.post('/user/google', {
        credential: credentialResponse.credential,
      });
      applyAuthToken(response.data.token);
    } catch (error) {
      console.error('Google login error:', error);
      setSubmitError(t('auth.googleLoginError'));
    }
  };

  const viewPassword = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <Paper
      elevation={6}
      component="form"
      onSubmit={handleSubmit(onSubmit)}
      sx={{
        width: '100%',
        maxWidth: 400,
        p: 4,
        borderRadius: 3,
      }}
    >
      <Stack spacing={2.5}>
        <Typography variant="h5">{title}</Typography>
        {submitError && <Alert severity="error">{submitError}</Alert>}
        <TextField
          label={t('auth.email')}
          type="email"
          autoComplete="email"
          error={!!errors.email}
          helperText={errors.email?.message}
          {...register('email')}
        />

        <TextField
          fullWidth
          label={t('auth.password')}
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          error={!!errors.password}
          helperText={errors.password?.message}
          {...register('password')}
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={viewPassword} edge="end">
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />

        <Button type="submit" variant="contained">
          {btnName}
        </Button>

        <Stack spacing={2} alignItems="center">
          <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setSubmitError(t('auth.googleLoginError'))}
              text="continue_with"
            />
          </GoogleOAuthProvider>
        </Stack>

        <Typography variant="body2">
          {textForLink}
          <Link
            component={RouterLink}
            to={linkTo}
            underline="none"
            sx={{ '&:hover': { color: 'primary.main' } }}
          >
            {linkName}
          </Link>
        </Typography>
      </Stack>
    </Paper>
  );
};

export default LoginForm;
