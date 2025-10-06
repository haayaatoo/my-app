import React, { useState, useEffect } from "react";
import { useUser } from "../contexts/UserContext";

export default function Login({ onLogin, logoutMsg }) {
  const { setUser } = useUser();
  const [empId, setEmpId] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showLogoutMsg, setShowLogoutMsg] = useState(false);

  // ログアウトメッセージの表示制御
  useEffect(() => {
    if (logoutMsg) {
      setShowLogoutMsg(true);
      // 2.5秒後にフェードアウト開始
      const timer = setTimeout(() => {
        setShowLogoutMsg(false);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [logoutMsg]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (empId && password) {
      setIsLoading(true);
      // ログインアニメーション効果
      setTimeout(() => {
        setIsLoading(false);
        setUser({ name: empId }); // 社員番号をユーザー名としてセット
        onLogin();
      }, 1500);
    } else {
      alert("社員番号とパスワードを入力してください");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-amber-50/20 to-slate-100 flex items-center justify-center relative overflow-hidden">
      {/* 🎨 ブランド背景装飾 */}
      <div className="absolute inset-0 overflow-hidden">
        {/* 大きな装飾円 */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-gradient-to-br from-amber-100/30 to-stone-100/30 rounded-full blur-3xl animate-float"></div>
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-gradient-to-tr from-stone-100/40 to-amber-100/40 rounded-full blur-2xl animate-float" style={{animationDelay: '2s'}}></div>
        
        {/* パーティクル効果 */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-amber-200/20 rounded-full animate-pulse"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* 🏢 メインログインカード */}
      <div className="relative z-10 w-full max-w-md mx-4">
        {/* ログアウトメッセージ */}
        {showLogoutMsg && (
          <div className={`mb-6 p-4 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 text-emerald-700 text-center rounded-2xl transition-all duration-500 ${showLogoutMsg ? 'animate-bounce-in opacity-100' : 'opacity-0 transform scale-95'}`}>
            <i className="fas fa-check-circle mr-2"></i>
            ログアウトしました。
          </div>
        )}

        {/* メインカード */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-10 border border-white/60 relative overflow-hidden" style={{
          boxShadow: '0 30px 70px rgba(0,0,0,0.1), 0 15px 30px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)'
        }}>
          {/* カード内装飾 */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400"></div>
          <div className="absolute top-4 right-6 w-4 h-4 bg-amber-200/40 rounded-full animate-pulse"></div>
          <div className="absolute bottom-4 left-6 w-3 h-3 bg-stone-200/50 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>

          {/* ブランドヘッダー */}
          <div className="text-center mb-10">
            {/* ブランドタイトル */}
            <div className="mb-6">
              <h1 className="text-5xl font-medium text-slate-700 tracking-wide font-display mb-4">
                Prodia
              </h1>
              <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent mx-auto mb-4"></div>
              <p className="text-slate-500 font-normal text-lg">Professional Engineer Management</p>
              <p className="text-slate-400 text-sm mt-1">エンジニアリングの未来を創造する</p>
            </div>
          </div>

          {/* ログインフォーム */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 社員番号フィールド */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-600 ml-1">社員番号</label>
              <div className="relative">
                <i className="fas fa-id-card absolute left-5 top-1/2 transform -translate-y-1/2 text-slate-400 text-lg"></i>
                <input
                  type="text"
                  placeholder="例: EMP001"
                  value={empId}
                  onChange={(e) => setEmpId(e.target.value)}
                  className="w-full pl-14 pr-5 py-4 border-2 border-stone-200/80 rounded-2xl focus:border-amber-400 focus:ring-4 focus:ring-amber-100 transition-all duration-300 text-slate-700 placeholder-slate-400 bg-white/90 backdrop-blur-sm font-normal text-lg"
                  style={{
                    boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
                  }}
                />
              </div>
            </div>

            {/* パスワードフィールド */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-600 ml-1">パスワード</label>
              <div className="relative">
                <i className="fas fa-lock absolute left-5 top-1/2 transform -translate-y-1/2 text-slate-400 text-lg"></i>
                <input
                  type="password"
                  placeholder="パスワードを入力"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-14 pr-5 py-4 border-2 border-stone-200/80 rounded-2xl focus:border-amber-400 focus:ring-4 focus:ring-amber-100 transition-all duration-300 text-slate-700 placeholder-slate-400 bg-white/90 backdrop-blur-sm font-normal text-lg"
                  style={{
                    boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
                  }}
                />
              </div>
            </div>

            {/* ログインボタン */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full relative overflow-hidden bg-amber-400 hover:bg-amber-500 text-white py-4 rounded-2xl font-semibold text-lg transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed shadow-luxury"
              style={{
                boxShadow: '0 8px 32px 0 rgba(245, 158, 11, 0.18), 0 2px 8px 0 rgba(120, 113, 108, 0.10), 0 1.5px 0 rgba(255,255,255,0.7) inset'
              }}
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>ログイン中...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-3">
                  <i className="fas fa-sign-in-alt"></i>
                  <span>Prodiaにログイン</span>
                </div>
              )}
              
              {/* ボタンのシマー効果 */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:animate-shimmer opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          </form>

          {/* フッター情報 */}
          <div className="mt-8 text-center">
            <div className="flex items-center justify-center gap-4 text-slate-400 text-sm">
              <span className="flex items-center gap-1">
                <i className="fas fa-shield-alt"></i>
                セキュア認証
              </span>
              <span className="flex items-center gap-1">
                <i className="fas fa-clock"></i>
                24/7 対応
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-4">
              © 2025 Prodia Corporation. All rights reserved.
            </p>
          </div>
        </div>

        {/* サブ情報カード */}
        <div className="mt-6 text-center">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/40" style={{
            boxShadow: '0 10px 25px rgba(0,0,0,0.05)'
          }}>
            <p className="text-slate-600 text-sm mb-2">
              <i className="fas fa-info-circle mr-2"></i>
              初回ログインの方へ
            </p>
            <p className="text-slate-500 text-xs">
              社員番号とパスワードは人事部にお問い合わせください
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
