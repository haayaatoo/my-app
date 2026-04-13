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
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (logoutMsg) {
      setShowLogoutMsg(true);
      const timer = setTimeout(() => {
        setShowLogoutMsg(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [logoutMsg]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

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
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-amber-50/20 to-slate-100 flex items-center justify-center relative overflow-hidden">
      
      {/* 背景装飾 */}
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className="absolute w-96 h-96 bg-gradient-to-br from-amber-100/40 to-stone-100/40 rounded-full blur-3xl transition-all duration-1000"
          style={{
            top: `${mousePosition.y * 0.3}%`,
            right: `${100 - mousePosition.x * 0.2}%`
          }}
        />
      </div>

      {/* メインコンテナ - 横長レイアウト */}
      <div className="relative z-10 w-full max-w-6xl mx-4">
        
        {/* ログアウトメッセージ */}
        {(showLogoutMsg || logoutMsg) && (
          <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-[9999] p-4 bg-white border-2 border-emerald-400 shadow-xl text-center rounded-lg max-w-sm animate-slideDown">
            <div className="flex items-center justify-center gap-3">
              <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center">
                <i className="fas fa-check text-emerald-600 text-sm"></i>
              </div>
              <span className="font-bold text-slate-800">{logoutMsg || 'ログアウトしました'}</span>
            </div>
          </div>
        )}

        {/* 横並び2カラムグリッド */}
        <div className="grid lg:grid-cols-5 gap-12 items-center">
          
          {/* 左: ブランドエリア (3/5) */}
          <div className="lg:col-span-3 text-center lg:text-left animate-fadeInLeft">
            
            {/* ロゴ・ブランド */}
            <div className="mb-10">
              <div className="inline-block relative mb-6">
                <div className="bg-gradient-to-br from-white/90 to-white/70 rounded-3xl p-8 border border-white/60 backdrop-blur-sm animate-fadeInUp">
                  <h1 className="text-6xl lg:text-7xl font-black text-amber-500">
                    Prodia
                  </h1>
                </div>
              </div>
              
              <h2 className="text-4xl font-bold text-slate-700 mb-4 animate-fadeInUp animate-delay-300">
                チームの力を、
                <span className="bg-gradient-to-r from-amber-500 to-amber-400 bg-clip-text text-transparent">成果に変える</span>
              </h2>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto lg:mx-0 animate-fadeInUp animate-delay-500">
                営業チームの力を最大化する、ビジネスプラットフォーム
              </p>
            </div>

            {/* 対象チームバッジ */}
            <div className="flex flex-wrap gap-3 animate-fadeInUp animate-delay-700">
              <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200/60 rounded-full">
                <i className="fas fa-chart-line text-amber-500 text-sm"></i>
                <span className="text-sm font-medium text-amber-700">営業支援</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200/60 rounded-full">
                <i className="fas fa-tasks text-emerald-500 text-sm"></i>
                <span className="text-sm font-medium text-emerald-700">マネジメント</span>
              </div>
            </div>
          </div>

          {/* 右: ログインフォーム (2/5) */}
          <div className="lg:col-span-2 animate-fadeInRight">
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 border border-white/60 shadow-2xl animate-fadeInUp animate-delay-200">
              
              {/* フォームヘッダー */}
              <div className="text-center mb-8 animate-fadeInUp animate-delay-400">
                <h3 className="text-2xl font-bold text-slate-700 mb-2">ログイン</h3>
                <p className="text-slate-500">アカウントにサインイン</p>
                <div className="w-12 h-0.5 bg-amber-400 mx-auto mt-4 animate-expandWidth"></div>
              </div>

              {/* フォーム */}
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* メール */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-600">メールアドレス</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                      <i className="fas fa-envelope text-amber-600"></i>
                    </div>
                    <input
                      type="email"
                      placeholder="yamada@prodia.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 border-2 border-stone-200 rounded-xl focus:border-amber-400 focus:ring-4 focus:ring-amber-100/50 transition-all duration-300 text-slate-700 placeholder-slate-400 bg-white/95"
                    />
                  </div>
                </div>

                {/* パスワード */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-600">パスワード</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                      <i className="fas fa-lock text-amber-600"></i>
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="パスワードを入力"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-12 pr-12 py-4 border-2 border-stone-200 rounded-xl focus:border-amber-400 focus:ring-4 focus:ring-amber-100/50 transition-all duration-300 text-slate-700 placeholder-slate-400 bg-white/95"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </button>
                  </div>
                </div>

                {/* エラーメッセージ */}
                {loginError && (
                  <div className="flex items-center gap-2 px-4 py-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">
                    <i className="fas fa-exclamation-circle flex-shrink-0"></i>
                    <span>{loginError}</span>
                  </div>
                )}

                {/* ログインボタン */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white py-4 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-70"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>認証中...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-3">
                        <i className="fas fa-sign-in-alt"></i>
                        <span>Prodiaにログイン</span>
                      </div>
                    )}
                  </button>
                </div>
              </form>


            </div>
          </div>
        </div>
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