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

import {
  FormSchema,
  type SignupFormFields,
} from '../../shared/utils/shemas';
import { fieldsRegistration } from './dataAuth/signupFields';
import { api } from '../../api/axios.api';
import useUserStore, { type UserRole } from '../../store/UserStore';
import { PUBLIC_ROUTE } from '../../shared/utils/constsLinks';
import { jwtDecode } from 'jwt-decode';

type Props = {
  title: string;
  btnName: string;
  textForLink: string;
  linkName: string;
  linkTo: string;
};

const SignupForm = ({
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
  } = useForm<SignupFormFields>({
    resolver: zodResolver(FormSchema),
  });

  const onSubmit: SubmitHandler<SignupFormFields> = async (data) => {
    setSubmitError(null);
    try {
      const response = await api.post('/user/registration', {
        firstName: data.name,
        lastName: data.surName,
        email: data.email,
        password: data.password,
      });
      const token = response.data.token;
      const decoded = jwtDecode<{ id: number; email: string; role: UserRole }>(token);
      setToken(token);
      setUser({ id: decoded.id, email: decoded.email, role: decoded.role });
      setIsAuth(true);
      reset();
      navigate(PUBLIC_ROUTE);
    } catch (error) {
      console.error('Registration error:', error);
      setSubmitError(t('auth.signupError'));
    }
  };

  const togglePassword = () => {
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
        <Typography variant="h5" fontWeight={600} textAlign="center">
          {title}
        </Typography>

        {submitError && <Alert severity="error">{submitError}</Alert>}

        {fieldsRegistration
          .filter((el) => !el.isPassword)
          .map((el) => (
            <TextField
              key={el.name}
              label={t(el.labelKey)}
              type={el.type}
              autoComplete={el.autoComplete}
              error={!!errors[el.name]}
              helperText={errors[el.name]?.message}
              {...register(el.name)}
            />
          ))}

        <TextField
          label={t('auth.password')}
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          error={!!errors.password}
          helperText={errors.password?.message}
          {...register('password')}
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={togglePassword} edge="end">
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />

        <TextField
          label={t('auth.confirmPassword')}
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          error={!!errors.confirmPassword}
          helperText={errors.confirmPassword?.message}
          {...register('confirmPassword')}
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={togglePassword} edge="end">
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />

        <Button type="submit" variant="contained" size="large" fullWidth>
          {btnName}
        </Button>

        <Typography variant="body2" textAlign="center">
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

export default SignupForm;
