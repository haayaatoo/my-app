import React, { useState } from "react";
import { UserProvider, useUser } from "./contexts/UserContext";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import EngineerList from "./components/EngineerList";
import SkillSheetManager from "./components/SkillSheetManager";
import InterviewManager from "./components/InterviewManager";
import HREvaluation from "./components/HREvaluation";
import Settings from "./components/Settings";

function MainLayout({ page, setPage, handleLogout }) {
  const { user } = useUser();
  
  // 権限チェック：面談履歴・人事評価ページにアクセス権限がない場合はダッシュボードにリダイレクト
  React.useEffect(() => {
    if ((page === "interviews" || page === "hr-evaluation") && user && user.email !== 'kamiya@1dr.co.jp' && user.email !== 'asai@1dr.co.jp') {
      setPage("dashboard");
    }
  }, [page, user, setPage]);
  
  return (
    <div className="flex h-screen bg-gradient-to-br from-stone-50 via-amber-50/20 to-slate-100">
      {/* 🎨 モダン・ラグジュアリーサイドバー */}
      <aside className="w-80 bg-gradient-to-b from-white/90 via-stone-50/80 to-amber-50/60 backdrop-blur-xl border-r border-white/60 flex flex-col relative animate-slide-in" style={{
        boxShadow: '4px 0 30px rgba(0,0,0,0.08), 2px 0 15px rgba(0,0,0,0.04)'
      }}>
        {/* 装飾的な背景要素 */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-100/20 to-transparent rounded-full -mr-16 -mt-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-stone-100/30 to-transparent rounded-full -ml-12 -mb-12"></div>
        
        {/* ブランドヘッダー */}
        <div className="p-8 border-b border-amber-200/30 relative z-10">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-stone-500 rounded-2xl flex items-center justify-center">
              <span className="text-xl font-bold text-white">P</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-wider">Prodia</h1>
            </div>
          </div>
          <p className="text-slate-500 text-sm font-normal">Management System</p>
          <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-amber-300 to-transparent rounded-full mt-4"></div>
        </div>

        {user?.name && (
          <div className="px-8 pt-4 text-sm font-bold text-amber-600">ようこそ {user.name} さん</div>
        )}

        {/* ナビゲーション */}
        <nav className="flex-1 overflow-y-auto p-6 space-y-3 relative z-10 scrollbar-thin scrollbar-thumb-amber-200 scrollbar-track-transparent hover:scrollbar-thumb-amber-300">
          {/* ダッシュボード */}
          <button
            className={`group w-full text-left p-5 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] ${
              page === "dashboard" 
                ? "bg-gradient-to-r from-amber-100 to-stone-100 text-slate-700 shadow-lg border border-amber-200/50" 
                : "text-slate-600 hover:bg-white/60 hover:text-slate-700 hover:shadow-md"
            }`}
            onClick={() => setPage("dashboard")}
          >
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                page === "dashboard" 
                  ? "bg-gradient-to-br from-amber-400 to-stone-400 text-white shadow-lg" 
                  : "bg-slate-100 text-slate-500 group-hover:bg-amber-100 group-hover:text-amber-600"
              }`}>
                <i className="fas fa-tachometer-alt text-lg"></i>
              </div>
              <div>
                <span className="font-medium text-lg">ダッシュボード</span>
                <p className="text-xs opacity-70 mt-0.5">リアルタイム分析</p>
              </div>
            </div>
            {page === "dashboard" && (
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-amber-400 to-stone-400 rounded-full"></div>
            )}
          </button>

          {/* エンジニア管理 */}
          <button
            className={`group w-full text-left p-5 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] ${
              page === "engineers" 
                ? "bg-gradient-to-r from-amber-100 to-stone-100 text-slate-700 shadow-lg border border-amber-200/50" 
                : "text-slate-600 hover:bg-white/60 hover:text-slate-700 hover:shadow-md"
            }`}
            onClick={() => setPage("engineers")}
          >
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                page === "engineers" 
                  ? "bg-gradient-to-br from-amber-400 to-stone-400 text-white shadow-lg" 
                  : "bg-slate-100 text-slate-500 group-hover:bg-amber-100 group-hover:text-amber-600"
              }`}>
                <i className="fas fa-users text-lg"></i>
              </div>
              <div>
                <span className="font-medium text-lg">エンジニア管理</span>
                <p className="text-xs opacity-70 mt-0.5">人材管理・配置</p>
              </div>
            </div>
            {page === "engineers" && (
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-amber-400 to-stone-400 rounded-full"></div>
            )}
          </button>

          {/* スキルシート */}
          <button
            className={`group w-full text-left p-5 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] ${
              page === "skill-sheets" 
                ? "bg-gradient-to-r from-amber-100 to-stone-100 text-slate-700 shadow-lg border border-amber-200/50" 
                : "text-slate-600 hover:bg-white/60 hover:text-slate-700 hover:shadow-md"
            }`}
            onClick={() => setPage("skill-sheets")}
          >
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                page === "skill-sheets" 
                  ? "bg-gradient-to-br from-amber-400 to-stone-400 text-white shadow-lg" 
                  : "bg-slate-100 text-slate-500 group-hover:bg-amber-100 group-hover:text-amber-600"
              }`}>
                <i className="fas fa-file-alt text-lg"></i>
              </div>
              <div>
                <span className="font-medium text-lg">スキルシート管理</span>
                <p className="text-xs opacity-70 mt-0.5">登録・検索</p>
              </div>
            </div>
            {page === "skill-sheets" && (
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-amber-400 to-stone-400 rounded-full"></div>
            )}
          </button>

          {/* お客様面談履歴（権限チェック付き） */}
          {user && (user.email === 'kamiya@1dr.co.jp' || user.email === 'asai@1dr.co.jp') && (
            <button
              className={`group w-full text-left p-5 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] ${
                page === "interviews" 
                  ? "bg-gradient-to-r from-amber-100 to-stone-100 text-slate-700 shadow-lg border border-amber-200/50" 
                  : "text-slate-600 hover:bg-white/60 hover:text-slate-700 hover:shadow-md"
              }`}
              onClick={() => setPage("interviews")}
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                  page === "interviews" 
                    ? "bg-gradient-to-br from-amber-400 to-stone-400 text-white shadow-lg" 
                    : "bg-slate-100 text-slate-500 group-hover:bg-amber-100 group-hover:text-amber-600"
                }`}>
                  <i className="fas fa-handshake text-lg"></i>
                </div>
                <div>
                  <span className="font-medium text-lg">お客様面談履歴</span>
                  <p className="text-xs opacity-70 mt-0.5">客先面談記録</p>
                </div>
              </div>
              {page === "interviews" && (
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-amber-400 to-stone-400 rounded-full"></div>
              )}
            </button>
          )}

          {/* 人事評価（権限チェック付き） */}
          {user && (user.email === 'kamiya@1dr.co.jp' || user.email === 'asai@1dr.co.jp') && (
            <button
              className={`group w-full text-left p-5 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] ${
                page === "hr-evaluation" 
                  ? "bg-gradient-to-r from-purple-100 to-indigo-100 text-slate-700 shadow-lg border border-purple-200/50" 
                  : "text-slate-600 hover:bg-white/60 hover:text-slate-700 hover:shadow-md"
              }`}
              onClick={() => setPage("hr-evaluation")}
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                  page === "hr-evaluation" 
                    ? "bg-gradient-to-br from-purple-400 to-indigo-500 text-white shadow-lg" 
                    : "bg-slate-100 text-slate-500 group-hover:bg-purple-100 group-hover:text-purple-600"
                }`}>
                  <i className="fas fa-star text-lg"></i>
                </div>
                <div>
                  <span className="font-medium text-lg">人事評価</span>
                  <p className="text-xs opacity-70 mt-0.5">社内評価・査定</p>
                </div>
              </div>
              {page === "hr-evaluation" && (
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-purple-400 to-indigo-500 rounded-full"></div>
              )}
            </button>
          )}

          {/* 設定 */}
          <button
            className={`group w-full text-left p-5 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] ${
              page === "settings" 
                ? "bg-gradient-to-r from-amber-100 to-stone-100 text-slate-700 shadow-lg border border-amber-200/50" 
                : "text-slate-600 hover:bg-white/60 hover:text-slate-700 hover:shadow-md"
            }`}
            onClick={() => setPage("settings")}
          >
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                page === "settings" 
                  ? "bg-gradient-to-br from-amber-400 to-stone-400 text-white shadow-lg" 
                  : "bg-slate-100 text-slate-500 group-hover:bg-amber-100 group-hover:text-amber-600"
              }`}>
                <i className="fas fa-cog text-lg"></i>
              </div>
              <div>
                <span className="font-medium text-lg">設定</span>
                <p className="text-xs opacity-70 mt-0.5">アカウント・セキュリティ</p>
              </div>
            </div>
            {page === "settings" && (
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-amber-400 to-stone-400 rounded-full"></div>
            )}
          </button>


        </nav>
        
        {/* フッター・ログアウト */}
        <div className="p-6 border-t border-amber-200/30 relative z-10">
          <button
            className="w-full bg-gradient-to-r from-red-400 to-rose-500 hover:from-red-500 hover:to-rose-600 text-white p-4 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] font-medium shadow-lg flex items-center justify-center gap-3"
            style={{
              boxShadow: '0 10px 25px rgba(239, 68, 68, 0.25)'
            }}
            onClick={handleLogout}
          >
            <i className="fas fa-sign-out-alt"></i>
            <span>ログアウト</span>
          </button>
          
          {/* バージョン情報 */}
          <div className="mt-4 text-center">
            <p className="text-xs text-slate-400">Version 1.0.0</p>
            <p className="text-xs text-slate-400 mt-1">© 2025 Prodia Corp.</p>
          </div>
        </div>
      </aside>

      {/* メイン画面 */}
      <main className="flex-1 overflow-auto">
        {page === "dashboard" && <Dashboard />}
        {page === "engineers" && <EngineerList />}
        {page === "skill-sheets" && <SkillSheetManager />}
        {page === "interviews" && <InterviewManager />}
        {page === "hr-evaluation" && <HREvaluation />}
        {page === "settings" && <Settings />}
      </main>
    </div>
  );
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [page, setPage] = useState("dashboard");
  const [showLogoutMsg, setShowLogoutMsg] = useState(false);

  const handleLogin = () => {
    setIsLoggedIn(true);
    setShowLogoutMsg(false);
    setPage("dashboard"); // ログイン時にダッシュボードに戻る
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setShowLogoutMsg(true);
    setPage("dashboard"); // ログアウト時にダッシュボードにリセット
    // 3秒後にログアウトメッセージを自動的に非表示にする
    setTimeout(() => {
      setShowLogoutMsg(false);
    }, 3000);
  };

  return (
    <UserProvider>
      {!isLoggedIn ? (
        <Login onLogin={handleLogin} logoutMsg={showLogoutMsg} />
      ) : (
        <MainLayout page={page} setPage={setPage} handleLogout={handleLogout} />
      )}
    </UserProvider>
  );
}

export default App;
