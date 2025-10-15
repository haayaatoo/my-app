import React, { createContext, useContext, useState } from 'react';

// ユーザー情報を管理するContext
export const UserContext = createContext(null);

// Providerコンポーネント
export const UserProvider = ({ children }) => {
  // ユーザー情報（ログイン後に設定される）
  const [user, setUser] = useState(null);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

// 簡単に使うためのカスタムフック
export const useUser = () => useContext(UserContext);
