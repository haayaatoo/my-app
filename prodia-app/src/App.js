import React, { useState } from "react";
import { UserProvider, useUser } from "./contexts/UserContext";
import { ToastProvider } from "./components/Toast";
import Login from "./components/Login";
import { apiFetch, clearTokens, getAccessToken } from "./utils/api";
import Dashboard from "./components/Dashboard";
import EngineerList from "./components/EngineerList";
import SkillSheetManager from "./components/SkillSheetManager";
import InterviewManager from "./components/InterviewManager";
import HREvaluation from "./components/HREvaluation";
import RecruitmentMarketing from "./components/RecruitmentMarketing";
import Settings from "./components/Settings";
import CsCaseManager from "./components/CsCaseManager";
import Calendar from "./components/Calendar";
import DealPipeline from "./components/DealPipeline";
import UtilizationDashboard from "./components/UtilizationDashboard";

const CS_CASE_ALLOWED = ['y-okada@1dr.co.jp'];

const INTERVIEWS_ALLOWED = ['kamiya@1dr.co.jp', 'asai@1dr.co.jp', 'h-setoyama@1dr.co.jp', 'i-uemae@1dr.co.jp', 't-nukumizu@1dr.co.jp'];

// Linear風シンプルナビゲーションボタン
function NavButton({ isActive, onClick, iconClass, label, activeColors, collapsed }) {
  const { icon, iconHover } = activeColors;
  return (
    <button
      title={collapsed ? label : undefined}
      onClick={onClick}
      className={`relative group w-full transition-all duration-150 ${
        collapsed
          ? 'flex items-center justify-center p-2.5 rounded-lg'
          : 'flex items-center gap-3 px-3 py-2 rounded-lg text-left'
      } ${
        isActive
          ? 'bg-slate-100 text-slate-800'
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
      }`}
    >
      {isActive && (
        <span className="absolute left-0 inset-y-0 my-auto w-[3px] h-[55%] rounded-r-full bg-amber-500" />
      )}
      <div className={`flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center transition-colors ${
        isActive ? `${icon} text-white` : `text-slate-400 ${iconHover}`
      }`}>
        <i className={`${iconClass} text-xs`}></i>
      </div>
      {!collapsed && (
        <span className="text-[13px] font-medium truncate">{label}</span>
      )}
    </button>
  );
}

function MainLayout({ page, setPage, handleLogout }) {
  const { user } = useUser();
  const canViewCsCases = user && CS_CASE_ALLOWED.includes(user.email);
  const [collapsed, setCollapsed] = useState(false);
  
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
    if (page === "cs-cases" && !canViewCsCases) {
      setPage("dashboard");
    }
  }, [page, user, setPage, canViewCsCases]);
  
  return (
    <div className="flex h-screen bg-slate-50">
      {/* サイドバー */}
      <aside
        className={`${
          collapsed ? 'w-[60px]' : 'w-56'
        } bg-white border-r border-slate-200 flex flex-col flex-shrink-0 transition-all duration-200 overflow-hidden`}
        style={{ boxShadow: '1px 0 3px rgba(0,0,0,0.04)' }}
      >
        {/* ブランドヘッダー + 折りたたみボタン */}
        <div className={`flex items-center h-14 border-b border-slate-100 flex-shrink-0 ${
          collapsed ? 'justify-center px-2' : 'justify-between px-4'
        }`}>
          {!collapsed && (
            <div>
              <h1 className="text-base font-bold text-slate-800 tracking-wide leading-none">Prodia</h1>
              <p className="text-slate-400 text-[10px] mt-0.5">Management System</p>
              <div className="w-8 h-0.5 bg-amber-400 mt-1.5 rounded-full"></div>
            </div>
          )}
          {collapsed && (
            <span className="text-base font-black text-amber-600">P</span>
          )}
          <button
            onClick={() => setCollapsed(c => !c)}
            className="w-6 h-6 rounded-md flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors flex-shrink-0"
          >
            <i className={`fas ${
              collapsed ? 'fa-chevron-right' : 'fa-chevron-left'
            } text-[10px]`}></i>
          </button>
        </div>

        {!collapsed && user?.name && (
          <div className="px-4 py-2 text-[11px] font-semibold text-amber-600 border-b border-slate-100 truncate">
            {user.name} さん
          </div>
        )}

        {/* ナビゲーション */}
        <nav className="flex-1 overflow-y-auto py-2">

          {/* ── 概要 ── */}
          <div className={collapsed ? 'px-2 space-y-1 mt-2' : 'px-2 mt-2 space-y-0.5'}>
            <NavButton
              isActive={page === "dashboard"}
              onClick={() => setPage("dashboard")}
              iconClass="fas fa-tachometer-alt"
              label="ダッシュボード"
              activeColors={{
                icon: "bg-amber-400",
                bg: "bg-gradient-to-r from-amber-100 to-stone-100",
                border: "border-amber-200/50",
                iconHover: "group-hover:bg-amber-100 group-hover:text-amber-600",
              }}
              collapsed={collapsed}
            />
          </div>

          <div className="mx-3 my-2 h-px bg-slate-100"></div>

          {/* ── 人材管理 ── */}
          {!collapsed && (
            <div className="px-4 pb-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">人材管理</span>
            </div>
          )}
          <div className={collapsed ? 'px-2 space-y-1' : 'px-2 space-y-0.5'}>
            <NavButton
              isActive={page === "utilization"}
              onClick={() => setPage("utilization")}
              iconClass="fas fa-user-check"
              label="稼働率管理"
              activeColors={{
                icon: "bg-emerald-500",
                bg: "bg-gradient-to-r from-emerald-100 to-teal-100",
                border: "border-emerald-200/50",
                iconHover: "group-hover:bg-emerald-100 group-hover:text-emerald-600",
              }}
              collapsed={collapsed}
            />
            <NavButton
              isActive={page === "engineers"}
              onClick={() => setPage("engineers")}
              iconClass="fas fa-users"
              label="エンジニア管理"
              activeColors={{
                icon: "bg-amber-400",
                bg: "bg-gradient-to-r from-amber-100 to-stone-100",
                border: "border-amber-200/50",
                iconHover: "group-hover:bg-amber-100 group-hover:text-amber-600",
              }}
              collapsed={collapsed}
            />
            {user && !['h-setoyama@1dr.co.jp', 'i-uemae@1dr.co.jp'].includes(user.email) && (
              <NavButton
                isActive={page === "skill-sheets"}
                onClick={() => setPage("skill-sheets")}
                iconClass="fas fa-file-alt"
                label="スキルシート管理"
                activeColors={{
                  icon: "bg-amber-400",
                  bg: "bg-gradient-to-r from-amber-100 to-stone-100",
                  border: "border-amber-200/50",
                  iconHover: "group-hover:bg-amber-100 group-hover:text-amber-600",
                }}
                collapsed={collapsed}
              />
            )}
            {user && ['kamiya@1dr.co.jp', 'asai@1dr.co.jp', 'h-setoyama@1dr.co.jp', 'i-uemae@1dr.co.jp', 't-nukumizu@1dr.co.jp'].includes(user.email) && (
              <NavButton
                isActive={page === "interviews"}
                onClick={() => setPage("interviews")}
                iconClass="fas fa-handshake"
                label="お客様面談履歴"
                activeColors={{
                  icon: "bg-amber-400",
                  bg: "bg-gradient-to-r from-amber-100 to-stone-100",
                  border: "border-amber-200/50",
                  iconHover: "group-hover:bg-amber-100 group-hover:text-amber-600",
                }}
                collapsed={collapsed}
              />
            )}
            <NavButton
              isActive={page === "pipeline"}
              onClick={() => setPage("pipeline")}
              iconClass="fas fa-th-list"
              label="案件回収管理"
              activeColors={{
                icon: "bg-amber-400",
                bg: "bg-gradient-to-r from-amber-100 to-orange-100",
                border: "border-amber-200/50",
                iconHover: "group-hover:bg-amber-100 group-hover:text-amber-600",
              }}
              collapsed={collapsed}
            />
          </div>

          {/* ── 組織・採用（権限ある人のみセクションごと表示） ── */}
          {((user && ['kamiya@1dr.co.jp', 'asai@1dr.co.jp', 'a-inagaki@1dr.co.jp'].includes(user.email)) || canViewCsCases) && (
            <>
              <div className="mx-3 my-2 h-px bg-slate-100"></div>
              {!collapsed && (
                <div className="px-4 pb-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">組織・採用</span>
                </div>
              )}
              <div className={collapsed ? 'px-2 space-y-1' : 'px-2 space-y-0.5'}>
                {user && (user.email === 'kamiya@1dr.co.jp' || user.email === 'asai@1dr.co.jp') && (
                  <NavButton
                    isActive={page === "hr-evaluation"}
                    onClick={() => setPage("hr-evaluation")}
                    iconClass="fas fa-star"
                    label="人事評価"
                    activeColors={{
                      icon: "bg-purple-400",
                      bg: "bg-gradient-to-r from-purple-100 to-indigo-100",
                      border: "border-purple-200/50",
                      iconHover: "group-hover:bg-purple-100 group-hover:text-purple-600",
                    }}
                    collapsed={collapsed}
                  />
                )}
                {user && ['kamiya@1dr.co.jp', 'asai@1dr.co.jp', 'a-inagaki@1dr.co.jp'].includes(user.email) && (
                  <NavButton
                    isActive={page === "recruitment-marketing"}
                    onClick={() => setPage("recruitment-marketing")}
                    iconClass="fas fa-bullhorn"
                    label="採用マーケティング"
                    activeColors={{
                      icon: "bg-blue-400",
                      bg: "bg-gradient-to-r from-blue-100 to-purple-100",
                      border: "border-blue-200/50",
                      iconHover: "group-hover:bg-blue-100 group-hover:text-blue-600",
                    }}
                    collapsed={collapsed}
                  />
                )}
                {canViewCsCases && (
                  <NavButton
                    isActive={page === "cs-cases"}
                    onClick={() => setPage("cs-cases")}
                    iconClass="fas fa-clipboard-list"
                    label="CS案件管理"
                    activeColors={{
                      icon: "bg-emerald-400",
                      bg: "bg-gradient-to-r from-emerald-100 to-teal-100",
                      border: "border-emerald-200/50",
                      iconHover: "group-hover:bg-emerald-100 group-hover:text-emerald-600",
                    }}
                    collapsed={collapsed}
                  />
                )}
              </div>
            </>
          )}

          <div className="mx-3 my-2 h-px bg-slate-100"></div>

          {/* ── ツール ── */}
          {!collapsed && (
            <div className="px-4 pb-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ツール</span>
            </div>
          )}
          <div className={collapsed ? 'px-2 space-y-1' : 'px-2 space-y-0.5'}>
            <NavButton
              isActive={page === "calendar"}
              onClick={() => setPage("calendar")}
              iconClass="fas fa-calendar-alt"
              label="カレンダー"
              activeColors={{
                icon: "bg-blue-400",
                bg: "bg-gradient-to-r from-blue-100 to-cyan-100",
                border: "border-blue-200/50",
                iconHover: "group-hover:bg-blue-100 group-hover:text-blue-600",
              }}
              collapsed={collapsed}
            />
            <NavButton
              isActive={page === "settings"}
              onClick={() => setPage("settings")}
              iconClass="fas fa-cog"
              label="設定"
              activeColors={{
                icon: "bg-amber-400",
                bg: "bg-gradient-to-r from-amber-100 to-stone-100",
                border: "border-amber-200/50",
                iconHover: "group-hover:bg-amber-100 group-hover:text-amber-600",
              }}
              collapsed={collapsed}
            />
          </div>

        </nav>
        
        {/* フッター・ログアウト */}
        <div className={`border-t border-slate-100 flex-shrink-0 ${collapsed ? 'p-2' : 'px-3 py-3'}`}>
          <button
            title={collapsed ? 'ログアウト' : undefined}
            className={`w-full flex items-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors ${
              collapsed ? 'justify-center p-2.5' : 'gap-2.5 px-3 py-2'
            }`}
            onClick={() => handleLogout()}
          >
            <i className="fas fa-sign-out-alt text-xs"></i>
            {!collapsed && <span className="text-[13px] font-medium">ログアウト</span>}
          </button>
          {!collapsed && (
            <div className="mt-1 px-3">
              <p className="text-[10px] text-slate-300">© 2025 Prodia Corp.</p>
            </div>
          )}
        </div>
      </aside>

      {/* メイン画面 */}
      <main className="flex-1 overflow-auto">
        {page === "dashboard" && <Dashboard />}
        {page === "utilization" && <UtilizationDashboard />}
        {page === "engineers" && <EngineerList />}
        {page === "skill-sheets" && <SkillSheetManager />}
        {page === "interviews" && <InterviewManager />}
        {page === "hr-evaluation" && <HREvaluation />}
        {page === "recruitment-marketing" && <RecruitmentMarketing />}
        {page === "cs-cases" && <CsCaseManager />}
        {page === "pipeline" && <DealPipeline />}
        {page === "calendar" && <Calendar />}
        {page === "settings" && <Settings />}
      </main>
    </div>
  );
}

// セッションタイムアウト設定（JWTアクセストークン 8hと嚟合）
const LOGIN_TS_KEY = 'prodia_login_at';

function isSessionValid() {
  // JWTトークンが残っているかどうかだけチェック
  return !!getAccessToken() && !!localStorage.getItem('prodia_user');
}

function getInitialLogoutMsg() {
  return null;
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => isSessionValid());
  const [page, setPage] = useState("dashboard");
  const [showLogoutMsg, setShowLogoutMsg] = useState(() => getInitialLogoutMsg());

  const handleLogin = () => {
    localStorage.setItem(LOGIN_TS_KEY, String(Date.now()));
    setIsLoggedIn(true);
    setShowLogoutMsg(null);
    setPage("dashboard");
  };

  const handleLogout = async (msg = 'ログアウトしました') => {
    // リフレッシュトークンをサーバー側で無効化
    const refresh = localStorage.getItem('prodia_refresh');
    if (refresh) {
      await apiFetch('/auth/logout/', {
        method: 'POST',
        body: JSON.stringify({ refresh }),
      }).catch(() => {});
    }
    clearTokens();
    localStorage.removeItem(LOGIN_TS_KEY);
    setIsLoggedIn(false);
    setShowLogoutMsg(msg);
    setPage("dashboard");
    setTimeout(() => setShowLogoutMsg(null), 4000);
  };

  return (
    <ToastProvider>
      <UserProvider>
        {!isLoggedIn ? (
          <Login onLogin={handleLogin} logoutMsg={showLogoutMsg} />
        ) : (
          <MainLayout page={page} setPage={setPage} handleLogout={handleLogout} />
        )}
      </UserProvider>
    </ToastProvider>
  );
}

export default App;
