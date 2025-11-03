import React, { useState, useEffect } from "react";
import { useUser } from "../contexts/UserContext";

export default function Login({ onLogin, logoutMsg }) {
  const { setUser } = useUser();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showLogoutMsg, setShowLogoutMsg] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isFormFocused, setIsFormFocused] = useState(false);

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
        const response = await fetch("http://localhost:8000/api/auth/login/", {
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
          setUser(data.user);
          setTimeout(() => {
            setIsLoading(false);
            onLogin();
          }, 1500);
        } else {
          setIsLoading(false);
          alert(data.error || "ログインに失敗しました");
        }
      } catch (error) {
        setIsLoading(false);
        alert("ネットワークエラーが発生しました");
        console.error("Login error:", error);
      }
    } else {
      alert("メールアドレスとパスワードを入力してください");
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
                  <h1 className="text-6xl lg:text-7xl font-black bg-gradient-to-r from-amber-600 via-amber-500 to-stone-600 bg-clip-text text-transparent">
                    Prodia
                  </h1>
                </div>
              </div>
              
              <h2 className="text-4xl font-bold text-slate-700 mb-4 animate-fadeInUp animate-delay-300">
                エンジニア管理の
                <span className="bg-gradient-to-r from-amber-500 to-amber-400 bg-clip-text text-transparent"> 未来 </span>
              </h2>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto lg:mx-0 animate-fadeInUp animate-delay-500">
                革新的なテクノロジーで、チーム管理とプロジェクトの効率を最大化
              </p>
            </div>

            {/* 特徴カード */}
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="bg-emerald-50 border border-emerald-200/50 rounded-2xl p-6 animate-fadeInUp animate-delay-700 transform hover:scale-105 transition-all duration-300">
                <i className="fas fa-rocket text-emerald-600 text-xl mb-3"></i>
                <p className="font-semibold text-emerald-800">高速処理</p>
                <p className="text-sm text-emerald-600">リアルタイム管理</p>
              </div>
              
              <div className="bg-blue-50 border border-blue-200/50 rounded-2xl p-6 animate-fadeInUp animate-delay-800 transform hover:scale-105 transition-all duration-300">
                <i className="fas fa-shield-alt text-blue-600 text-xl mb-3"></i>
                <p className="font-semibold text-blue-800">セキュア</p>
                <p className="text-sm text-blue-600">最高レベル暗号化</p>
              </div>
              
              <div className="bg-purple-50 border border-purple-200/50 rounded-2xl p-6 animate-fadeInUp animate-delay-900 transform hover:scale-105 transition-all duration-300">
                <i className="fas fa-users text-purple-600 text-xl mb-3"></i>
                <p className="font-semibold text-purple-800">チーム連携</p>
                <p className="text-sm text-purple-600">シームレス協働</p>
              </div>
              
              <div className="bg-amber-50 border border-amber-200/50 rounded-2xl p-6 animate-fadeInUp animate-delay-1000 transform hover:scale-105 transition-all duration-300">
                <i className="fas fa-chart-line text-amber-600 text-xl mb-3"></i>
                <p className="font-semibold text-amber-800">AI分析</p>
                <p className="text-sm text-amber-600">スマート洞察</p>
              </div>
            </div>

            {/* ステータス */}
            <div className="flex items-center justify-center lg:justify-start gap-6">
              <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200/50 rounded-full">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-emerald-700">システム正常</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200/50 rounded-full">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span className="text-sm font-medium text-blue-700">99.9% 稼働</span>
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
                      onFocus={() => setIsFormFocused(true)}
                      onBlur={() => setIsFormFocused(false)}
                      className="w-full pl-12 pr-4 py-4 border-2 border-stone-200 rounded-xl focus:border-amber-400 focus:ring-4 focus:ring-amber-100/50 transition-all duration-300 text-slate-700 placeholder-slate-400 bg-white/95"
                    />
                  </div>
                </div>

                {/* パスワード */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-600">パスワード</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                      <i className="fas fa-lock text-slate-600"></i>
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="パスワードを入力"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setIsFormFocused(true)}
                      onBlur={() => setIsFormFocused(false)}
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

                {/* ログインボタン */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 hover:from-amber-500 hover:via-amber-600 hover:to-amber-500 text-white py-4 rounded-xl font-bold text-lg transition-all duration-500 transform hover:scale-105 disabled:opacity-70"
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

              {/* サポート情報 */}
              <div className="mt-8 text-center">
                <div className="flex items-center justify-center text-xs text-slate-500 gap-2 mb-4">
                  <i className="fas fa-shield-alt text-emerald-500"></i>
                  <span>SSL暗号化通信で保護</span>
                </div>
                
                <div className="bg-blue-50/50 border border-blue-200/30 rounded-xl p-4">
                  <div className="flex items-center justify-center gap-2 text-blue-700 mb-2">
                    <i className="fas fa-info-circle text-sm"></i>
                    <span className="text-sm font-medium">ログインでお困りですか？</span>
                  </div>
                  <div className="text-xs text-blue-600 space-y-1">
                    <div>📧 support@prodia.com</div>
                    <div>📞 内線: 1001 (平日 9:00-18:00)</div>
                  </div>
                </div>
              </div>
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