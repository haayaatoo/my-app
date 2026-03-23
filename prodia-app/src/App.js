import React, { useState } from "react";
import { UserProvider, useUser } from "./contexts/UserContext";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import EngineerList from "./components/EngineerList";
import SkillSheetManager from "./components/SkillSheetManager";
import InterviewManager from "./components/InterviewManager";
import HREvaluation from "./components/HREvaluation";
import RecruitmentMarketing from "./components/RecruitmentMarketing";
import Settings from "./components/Settings";
import AnalyticsDashboard from "./components/AnalyticsDashboard";
import CsCaseManager from "./components/CsCaseManager";
import Calendar from "./components/Calendar";

const ANALYTICS_ALLOWED = [
  'kamiya@1dr.co.jp',
  'asai@1dr.co.jp',
  't-nukumizu@1dr.co.jp',
  'h-imamura@1dr.co.jp'
];

const CS_CASE_ALLOWED = ['y-okada@1dr.co.jp'];

const INTERVIEWS_ALLOWED = ['kamiya@1dr.co.jp', 'asai@1dr.co.jp', 'h-setoyama@1dr.co.jp', 'i-uemae@1dr.co.jp', 't-nukumizu@1dr.co.jp'];

function MainLayout({ page, setPage, handleLogout }) {
  const { user } = useUser();
  const canViewAnalytics = user && ANALYTICS_ALLOWED.includes(user.email);
  const canViewCsCases = user && CS_CASE_ALLOWED.includes(user.email);
  
  // 権限チェック：面談履歴・人事評価・採用マーケティングページにアクセス権限がない場合はダッシュボードにリダイレクト
  React.useEffect(() => {
    if (page === "interviews" && user && !INTERVIEWS_ALLOWED.includes(user.email)) {
      setPage("dashboard");
    }
    if (page === "hr-evaluation" && user && user.email !== 'kamiya@1dr.co.jp' && user.email !== 'asai@1dr.co.jp') {
      setPage("dashboard");
    }
    if (page === "recruitment-marketing" && user && user.email !== 'kamiya@1dr.co.jp' && user.email !== 'asai@1dr.co.jp' && user.email !== 'a-inagaki@1dr.co.jp') {
      setPage("dashboard");
    }
    if (page === "analytics" && !canViewAnalytics) {
      setPage("dashboard");
    }
    if (page === "cs-cases" && !canViewCsCases) {
      setPage("dashboard");
    }
  }, [page, user, setPage, canViewAnalytics, canViewCsCases]);
  
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
          <div className="text-center">
            <h1 className="text-4xl font-bold text-slate-800 tracking-wider">Prodia</h1>
            <p className="text-slate-500 text-sm font-normal mt-2">Management System</p>
          </div>
          <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-amber-300 to-transparent rounded-full mt-4"></div>
        </div>

        {user?.name && (
          <div className="px-8 pt-4 text-sm font-bold text-amber-600 text-center">ようこそ {user.name} さん</div>
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

          {/* アナリティクスダッシュボード */}
          {canViewAnalytics && (
            <button
              className={`group w-full text-left p-5 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] ${
                page === "analytics" 
                  ? "bg-gradient-to-r from-emerald-200/30 to-blue-200/20 text-white shadow-lg border border-emerald-200/40" 
                  : "text-slate-200 hover:bg-white/5 hover:text-white/90 hover:shadow-md"
              }`}
              onClick={() => setPage("analytics")}
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                  page === "analytics" 
                    ? "bg-gradient-to-br from-emerald-400 to-blue-500 text-white shadow-lg" 
                    : "bg-slate-800 text-slate-300 group-hover:bg-emerald-500/20 group-hover:text-emerald-200"
                }`}>
                  <i className="fas fa-chart-line text-lg"></i>
                </div>
                <div>
                  <span className="font-medium text-lg">Analytics</span>
                  <p className="text-xs opacity-70 mt-0.5">経営指標ビュー</p>
                </div>
              </div>
              {page === "analytics" && (
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-emerald-400 to-blue-500 rounded-full"></div>
              )}
            </button>
          )}

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
          {user && !['h-setoyama@1dr.co.jp', 'i-uemae@1dr.co.jp'].includes(user.email) && (
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
          )}

          {/* お客様面談履歴（権限チェック付き） */}
          {user && (['kamiya@1dr.co.jp', 'asai@1dr.co.jp', 'h-setoyama@1dr.co.jp', 'i-uemae@1dr.co.jp', 't-nukumizu@1dr.co.jp'].includes(user.email)) && (
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

          {/* 採用マーケティング（権限チェック付き） */}
          {user && (user.email === 'kamiya@1dr.co.jp' || user.email === 'asai@1dr.co.jp' || user.email === 'a-inagaki@1dr.co.jp') && (
            <button
              className={`group w-full text-left p-5 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] ${
                page === "recruitment-marketing" 
                  ? "bg-gradient-to-r from-blue-100 to-purple-100 text-slate-700 shadow-lg border border-blue-200/50" 
                  : "text-slate-600 hover:bg-white/60 hover:text-slate-700 hover:shadow-md"
              }`}
              onClick={() => setPage("recruitment-marketing")}
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                  page === "recruitment-marketing" 
                    ? "bg-gradient-to-br from-blue-400 to-purple-500 text-white shadow-lg" 
                    : "bg-slate-100 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600"
                }`}>
                  <i className="fas fa-bullhorn text-lg"></i>
                </div>
                <div>
                  <span className="font-medium text-lg">採用マーケティング</span>
                  <p className="text-xs opacity-70 mt-0.5">SNS・採用経路分析</p>
                </div>
              </div>
              {page === "recruitment-marketing" && (
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-blue-400 to-purple-500 rounded-full"></div>
              )}
            </button>
          )}

          {/* CS案件管理（岡田さん専用） */}
          {canViewCsCases && (
            <button
              className={`group w-full text-left p-5 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] ${
                page === "cs-cases" 
                  ? "bg-gradient-to-r from-emerald-100 to-teal-100 text-slate-700 shadow-lg border border-emerald-200/50" 
                  : "text-slate-600 hover:bg-white/60 hover:text-slate-700 hover:shadow-md"
              }`}
              onClick={() => setPage("cs-cases")}
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                  page === "cs-cases" 
                    ? "bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-lg" 
                    : "bg-slate-100 text-slate-500 group-hover:bg-emerald-100 group-hover:text-emerald-600"
                }`}>
                  <i className="fas fa-clipboard-list text-lg"></i>
                </div>
                <div>
                  <span className="font-medium text-lg">CS案件管理</span>
                  <p className="text-xs opacity-70 mt-0.5">CS専用案件ボード</p>
                </div>
              </div>
              {page === "cs-cases" && (
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-emerald-400 to-teal-500 rounded-full"></div>
              )}
            </button>
          )}

          {/* カレンダー */}
          <button
            className={`group w-full text-left p-5 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] ${
              page === "calendar" 
                ? "bg-gradient-to-r from-blue-100 to-cyan-100 text-slate-700 shadow-lg border border-blue-200/50" 
                : "text-slate-600 hover:bg-white/60 hover:text-slate-700 hover:shadow-md"
            }`}
            onClick={() => setPage("calendar")}
          >
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                page === "calendar" 
                  ? "bg-gradient-to-br from-blue-400 to-cyan-500 text-white shadow-lg" 
                  : "bg-slate-100 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600"
              }`}>
                <i className="fas fa-calendar-alt text-lg"></i>
              </div>
              <div>
                <span className="font-medium text-lg">カレンダー</span>
                <p className="text-xs opacity-70 mt-0.5">スケジュール管理</p>
              </div>
            </div>
            {page === "calendar" && (
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-blue-400 to-cyan-500 rounded-full"></div>
            )}
          </button>

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
        {page === "analytics" && <AnalyticsDashboard />}
        {page === "engineers" && <EngineerList />}
        {page === "skill-sheets" && <SkillSheetManager />}
        {page === "interviews" && <InterviewManager />}
        {page === "hr-evaluation" && <HREvaluation />}
        {page === "recruitment-marketing" && <RecruitmentMarketing />}
        {page === "cs-cases" && <CsCaseManager />}
        {page === "calendar" && <Calendar />}
        {page === "settings" && <Settings />}
      </main>
    </div>
  );
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [page, setPage] = useState("dashboard");
  const [showLogoutMsg, setShowLogoutMsg] = useState(null);

  const handleLogin = () => {
    setIsLoggedIn(true);
    setShowLogoutMsg(null);
    setPage("dashboard"); // ログイン時にダッシュボードに戻る
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setShowLogoutMsg("ログアウトしました"); // メッセージ文字列を設定
    setPage("dashboard"); // ログアウト時にダッシュボードにリセット
    // 4秒後にログアウトメッセージを自動的に非表示にする
    setTimeout(() => {
      setShowLogoutMsg(null);
    }, 4000);
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
