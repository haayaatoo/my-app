import React, { createContext, useContext, useState } from 'react';

// ユーザー情報を管理するContext
export const UserContext = createContext(null);

// Providerコンポーネント
export const UserProvider = ({ children }) => {
  // デフォルトのログインユーザー（開発・テスト用）
  const [user, setUser] = useState({
    id: 1,
    name: '山田太郎',
    email: 'yamada@prodia.com',
    role: 'admin'
  });

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

// 簡単に使うためのカスタムフック
export const useUser = () => useContext(UserContext);
