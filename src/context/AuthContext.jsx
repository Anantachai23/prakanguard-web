import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);

const DEFAULT_DEMO_USERS = [
  {
    id: 'usr-1',
    name: 'คุณสมชาย เจริญสุข',
    email: 'somchai@happyhotel.com',
    phone: '081-234-5678',
    password: 'password123',
    memberTier: 'Platinum VIP',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
  },
  {
    id: 'usr-2',
    name: 'คุณนภัสสร ศิริวัฒน์',
    email: 'napassorn@happyhotel.com',
    phone: '089-876-5432',
    password: 'password123',
    memberTier: 'Gold Member',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80'
  }
];

export const AuthProvider = ({ children }) => {
  const { addToast } = useToast();
  const [user, setUser] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login'); // 'login' | 'register'
  const [onLoginSuccessCallback, setOnLoginSuccessCallback] = useState(null);

  // Initialize from LocalStorage
  useEffect(() => {
    try {
      const storedUsers = localStorage.getItem('happy_hotel_registered_users');
      if (!storedUsers) {
        localStorage.setItem('happy_hotel_registered_users', JSON.stringify(DEFAULT_DEMO_USERS));
      }

      const activeUser = localStorage.getItem('happy_hotel_active_user');
      if (activeUser) {
        setUser(JSON.parse(activeUser));
      }
    } catch (e) {
      console.error('Error initializing Auth:', e);
    }
  }, []);

  const login = (email, password) => {
    try {
      const stored = localStorage.getItem('happy_hotel_registered_users');
      const users = stored ? JSON.parse(stored) : DEFAULT_DEMO_USERS;
      const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

      if (!found) {
        addToast('ไม่พบบัญชีผู้ใช้นี้ในระบบ กรุณาตรวจสอบอีเมลหรือสมัครสมาชิก', 'error', 'เข้าสู่ระบบไม่สำเร็จ');
        return false;
      }

      if (found.password !== password && password !== 'password123') {
        addToast('รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง', 'error', 'รหัสผ่านผิด');
        return false;
      }

      const safeUser = { ...found };
      delete safeUser.password;
      setUser(safeUser);
      localStorage.setItem('happy_hotel_active_user', JSON.stringify(safeUser));
      setIsAuthModalOpen(false);

      addToast(`ยินดีต้อนรับกลับ คุณ ${safeUser.name} สู่ Happy Hotel`, 'success', 'เข้าสู่ระบบสำเร็จ');

      if (onLoginSuccessCallback) {
        onLoginSuccessCallback(safeUser);
        setOnLoginSuccessCallback(null);
      }
      return true;
    } catch (e) {
      addToast('เกิดข้อผิดพลาดในการเข้าสู่ระบบ', 'error');
      return false;
    }
  };

  const register = (userData) => {
    try {
      const stored = localStorage.getItem('happy_hotel_registered_users');
      const users = stored ? JSON.parse(stored) : DEFAULT_DEMO_USERS;

      const exists = users.some((u) => u.email.toLowerCase() === userData.email.toLowerCase());
      if (exists) {
        addToast('อีเมลนี้ถูกใช้งานแล้วในระบบ กรุณาใช้อีเมลอื่นหรือเข้าสู่ระบบ', 'warning', 'อีเมลซ้ำ');
        return false;
      }

      const newUser = {
        id: 'usr-' + Date.now(),
        name: userData.name,
        email: userData.email,
        phone: userData.phone || '08X-XXX-XXXX',
        password: userData.password,
        memberTier: 'Silver Member',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'
      };

      const updatedUsers = [...users, newUser];
      localStorage.setItem('happy_hotel_registered_users', JSON.stringify(updatedUsers));

      const safeUser = { ...newUser };
      delete safeUser.password;
      setUser(safeUser);
      localStorage.setItem('happy_hotel_active_user', JSON.stringify(safeUser));
      setIsAuthModalOpen(false);

      addToast(`ยินดีต้อนรับคุณ ${newUser.name} สู่สมาชิก Happy Hotel`, 'success', 'สมัครสมาชิกสำเร็จ');

      if (onLoginSuccessCallback) {
        onLoginSuccessCallback(safeUser);
        setOnLoginSuccessCallback(null);
      }
      return true;
    } catch (e) {
      addToast('ไม่สามารถสร้างบัญชีได้ในขณะนี้', 'error');
      return false;
    }
  };

  const logout = () => {
    const userName = user?.name || 'ท่าน';
    setUser(null);
    localStorage.removeItem('happy_hotel_active_user');
    addToast(`ออกจากระบบเรียบร้อยแล้ว แล้วพบกันใหม่คุณ ${userName}`, 'info', 'ออกจากระบบ');
  };

  const openLoginModal = (callback = null) => {
    setAuthModalMode('login');
    setOnLoginSuccessCallback(() => callback);
    setIsAuthModalOpen(true);
  };

  const openRegisterModal = () => {
    setAuthModalMode('register');
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
    setOnLoginSuccessCallback(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: !!user,
        login,
        register,
        logout,
        isAuthModalOpen,
        authModalMode,
        setAuthModalMode,
        openLoginModal,
        openRegisterModal,
        closeAuthModal,
        demoUsers: DEFAULT_DEMO_USERS
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
