import React, { createContext, useContext, useState } from 'react';
import { saveTokens, clearTokens } from '../utils/api';

// ユーザー情報を管理するContext
export const UserContext = createContext(null);

const STORAGE_KEY = 'prodia_user';

// Providerコンポーネント
export const UserProvider = ({ children }) => {
  // localStorageから初期値を復元（リロード後もログイン維持）
  const [user, setUserState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const setUser = (newUser, tokens) => {
    if (newUser) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
      if (tokens) saveTokens(tokens.access, tokens.refresh);
    } else {
      clearTokens();
    }
    setUserState(newUser);
  };

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

// 簡単に使うためのカスタムフック
export const useUser = () => useContext(UserContext);
