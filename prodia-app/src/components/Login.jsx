import React, { useState, useEffect } from "react";
import { useUser } from "../contexts/UserContext";

export default function Login({ onLogin, logoutMsg }) {
  const { setUser } = useUser();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [showLogoutMsg, setShowLogoutMsg] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (logoutMsg) {
      setShowLogoutMsg(true);
      const timer = setTimeout(() => {
        setShowLogoutMsg(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [logoutMsg]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (email && password) {
      setIsLoading(true);
      
      try {
        const response = await fetch("/api/auth/login/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email,
            password: password,
          }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setUser(data.user, { access: data.access, refresh: data.refresh });
          setTimeout(() => {
            setIsLoading(false);
            onLogin();
          }, 1500);
        } else {
          setIsLoading(false);
          setLoginError(data.error || "ログインに失敗しました");
        }
      } catch (error) {
        setIsLoading(false);
        setLoginError("ネットワークエラーが発生しました");
        console.error("Login error:", error);
      }
    } else {
      setLoginError("メールアドレスとパスワードを入力してください");
    }
  };

  return (
    <div className="min-h-screen bg-amber-50 flex items-center justify-center px-4 py-12">

      {/* ログアウトメッセージ */}
      {showLogoutMsg && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-[9999] p-4 bg-white border-2 border-emerald-400 shadow-xl text-center rounded-lg max-w-sm animate-slideDown">
          <div className="flex items-center justify-center gap-3">
            <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center">
              <i className="fas fa-check text-emerald-600 text-sm"></i>
            </div>
            <span className="font-bold text-slate-800">{logoutMsg || 'ログアウトしました'}</span>
          </div>
        </div>
      )}

      {/* 縦型カード */}
      <div className="w-full max-w-md animate-fadeInUp">

        {/* ロゴ・タイトルエリア */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-black text-amber-500 tracking-tight mb-2">Prodia</h1>
          <p className="text-slate-500 text-sm">営業チームの力を最大化するビジネスプラットフォーム</p>
        </div>

        {/* フォームカード */}
        <div className="bg-white rounded-2xl shadow-lg border border-amber-100 p-8">

          {/* カードヘッダー */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-700">ログイン</h2>
            <p className="text-sm text-slate-400 mt-0.5">アカウント情報を入力してください</p>
          </div>

          {/* フォーム */}
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* メール */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-600">メールアドレス</label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
                  <i className="fas fa-envelope text-amber-400 text-sm"></i>
                </div>
                <input
                  type="email"
                  placeholder="yamada@prodia.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none transition-all text-slate-700 placeholder-slate-300 bg-slate-50 focus:bg-white"
                />
              </div>
            </div>

            {/* パスワード */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-600">パスワード</label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
                  <i className="fas fa-lock text-amber-400 text-sm"></i>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="パスワードを入力"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 border border-slate-200 rounded-xl focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none transition-all text-slate-700 placeholder-slate-300 bg-slate-50 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-sm`}></i>
                </button>
              </div>
            </div>

            {/* エラーメッセージ */}
            {loginError && (
              <div className="flex items-center gap-2 px-4 py-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-sm">
                <i className="fas fa-exclamation-circle flex-shrink-0"></i>
                <span>{loginError}</span>
              </div>
            )}

            {/* ログインボタン */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white py-3 rounded-xl font-bold text-base transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>認証中...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <i className="fas fa-sign-in-alt"></i>
                  <span>ログイン</span>
                </div>
              )}
            </button>
          </form>
        </div>

        {/* フッター */}
        <p className="text-center text-xs text-slate-400 mt-6">
          © 2026 Prodia. All rights reserved.
        </p>
      </div>
    </div>
  );
}

// アニメーション用CSS
const existingStyle = document.head.querySelector('[data-login-page-animations]');

if (!existingStyle) {
  const style = document.createElement('style');
  style.setAttribute('data-login-page-animations', 'true');
  style.textContent = `
    /* ログアウトメッセージアニメーション */
    @keyframes slideDown {
      0% { 
        opacity: 0; 
        transform: translateX(-50%) translateY(-30px); 
      }
      100% { 
        opacity: 1; 
        transform: translateX(-50%) translateY(0px); 
      }
    }

    /* フェードイン系アニメーション */
    @keyframes fadeInLeft {
      0% { 
        opacity: 0; 
        transform: translateX(-50px); 
      }
      100% { 
        opacity: 1; 
        transform: translateX(0px); 
      }
    }

    @keyframes fadeInRight {
      0% { 
        opacity: 0; 
        transform: translateX(50px); 
      }
      100% { 
        opacity: 1; 
        transform: translateX(0px); 
      }
    }

    @keyframes fadeInUp {
      0% { 
        opacity: 0; 
        transform: translateY(30px); 
      }
      100% { 
        opacity: 1; 
        transform: translateY(0px); 
      }
    }

    @keyframes expandWidth {
      0% { 
        width: 0px; 
      }
      100% { 
        width: 3rem; 
      }
    }

    /* アニメーションクラス */
    .animate-slideDown {
      animation: slideDown 0.5s ease-out forwards;
    }

    .animate-fadeInLeft {
      animation: fadeInLeft 0.8s ease-out forwards;
    }

    .animate-fadeInRight {
      animation: fadeInRight 0.8s ease-out forwards;
    }

    .animate-fadeInUp {
      animation: fadeInUp 0.6s ease-out forwards;
      opacity: 0;
    }

    .animate-expandWidth {
      animation: expandWidth 0.8s ease-out 1.2s forwards;
      width: 0px;
    }

    /* 遅延クラス */
    .animate-delay-200 {
      animation-delay: 0.2s;
    }

    .animate-delay-300 {
      animation-delay: 0.3s;
    }

    .animate-delay-400 {
      animation-delay: 0.4s;
    }

    .animate-delay-500 {
      animation-delay: 0.5s;
    }

    .animate-delay-700 {
      animation-delay: 0.7s;
    }

    .animate-delay-800 {
      animation-delay: 0.8s;
    }

    .animate-delay-900 {
      animation-delay: 0.9s;
    }

    .animate-delay-1000 {
      animation-delay: 1.0s;
    }
  `;
  
  document.head.appendChild(style);
}