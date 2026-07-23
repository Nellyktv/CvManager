import { create } from "zustand";
import { jwtDecode } from "jwt-decode";

export type UserRole = 'CANDIDATE' | 'RECRUITER' | 'ADMIN';

interface User {
  id: number;
  email: string;
  role: UserRole | '';
}

interface JwtPayload {
  id: number;
  email: string;
  role: UserRole;
  exp: number;
}

const emptyUser: User = { id: 0, email: '', role: '' };

const getInitialAuth = () => {
    const token = localStorage.getItem("token");
    if (!token) {
        return { token: null, isAuth: false, user: emptyUser };
    }
    try {
        const decoded = jwtDecode<JwtPayload>(token);
        if (decoded.exp * 1000 < Date.now()) {
            localStorage.removeItem("token");
            return { token: null, isAuth: false, user: emptyUser };
        }
        return {
            token,
            isAuth: true,
            user: { id: decoded.id, email: decoded.email, role: decoded.role },
        };
    } catch {
        localStorage.removeItem("token");
        return { token: null, isAuth: false, user: emptyUser };
    }
};


interface UserState {
    isAuth: boolean;
    user: User;
    token: string | null;
    setIsAuth: (bool: boolean) => void;
    setUser: (user: User) => void;
    setToken: (token: string | null) => void;
    logout: () => void;
}

const initialAuth = getInitialAuth();

const useUserStore = create<UserState>((set) => ({
    isAuth: initialAuth.isAuth,
    user: initialAuth.user,
    token: initialAuth.token,
    setIsAuth: (bool) => set({ isAuth: bool }),
    setUser: (user) => set({ user }),
    setToken: (token) => {
        if (token) {
            localStorage.setItem("token", token);
        } else {
            localStorage.removeItem("token");
        }
        set({ token });
    },
    logout: () => {
        localStorage.removeItem("token");
        set({ isAuth: false, user: emptyUser, token: null });
    },
}));

export default useUserStore;
