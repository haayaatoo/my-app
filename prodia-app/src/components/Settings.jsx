import React, { useState } from "react";
import { useUser } from "../contexts/UserContext";

export default function Settings() {
  const { user } = useUser();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // success or error

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      setMessage("全ての項目を入力してください");
      setMessageType("error");
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage("新しいパスワードが一致しません");
      setMessageType("error");
      return;
    }

    if (newPassword.length < 6) {
      setMessage("パスワードは6文字以上で入力してください");
      setMessageType("error");
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      const response = await fetch("http://localhost:8000/api/auth/change-password/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: user.email,
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage("パスワードが正常に変更されました");
        setMessageType("success");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setMessage(data.error || "パスワード変更に失敗しました");
        setMessageType("error");
      }
    } catch (error) {
      setMessage("ネットワークエラーが発生しました");
      setMessageType("error");
      console.error("Password change error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 bg-gradient-to-br from-stone-50 via-amber-50/20 to-slate-100 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-2xl flex items-center justify-center shadow-luxury">
            <i className="fas fa-cog text-white text-xl"></i>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-700 font-display">設定</h1>
            <p className="text-slate-500">アカウント設定とセキュリティ</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* User Information Card */}
        <div className="lg:col-span-1">
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 border border-white/60 shadow-luxury">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-amber-400 via-yellow-400 to-amber-500 rounded-full mx-auto mb-4 flex items-center justify-center shadow-luxury">
                <i className="fas fa-user text-white text-2xl"></i>
              </div>
              <h3 className="text-xl font-semibold text-slate-700 mb-2">{user?.name}</h3>
              <p className="text-slate-500 text-sm">{user?.email}</p>
              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                  <i className="fas fa-shield-alt text-emerald-500"></i>
                  <span>認証済みユーザー</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                  <i className="fas fa-clock text-blue-500"></i>
                  <span>アクティブ</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Password Change Form */}
        <div className="lg:col-span-2">
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 border border-white/60 shadow-luxury">
            <div className="flex items-center gap-3 mb-6">
              <i className="fas fa-key text-amber-500 text-xl"></i>
              <h2 className="text-2xl font-semibold text-slate-700">パスワード変更</h2>
            </div>

            {/* メッセージ表示 */}
            {message && (
              <div className={`mb-6 p-4 rounded-2xl ${
                messageType === "success" 
                  ? "bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 text-emerald-700" 
                  : "bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 text-red-700"
              }`}>
                <div className="flex items-center gap-2">
                  <i className={`fas ${messageType === "success" ? "fa-check-circle" : "fa-exclamation-triangle"}`}></i>
                  <span>{message}</span>
                </div>
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-6">
              {/* 現在のパスワード */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-600 ml-1">現在のパスワード</label>
                <div className="relative">
                  <i className="fas fa-lock absolute left-5 top-1/2 transform -translate-y-1/2 text-slate-400 text-lg"></i>
                  <input
                    type="password"
                    placeholder="現在のパスワードを入力"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full pl-14 pr-5 py-4 border-2 border-stone-200/80 rounded-2xl focus:border-amber-400 focus:ring-4 focus:ring-amber-100 transition-all duration-300 text-slate-700 placeholder-slate-400 bg-white/90 backdrop-blur-sm"
                  />
                </div>
              </div>

              {/* 新しいパスワード */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-600 ml-1">新しいパスワード</label>
                <div className="relative">
                  <i className="fas fa-key absolute left-5 top-1/2 transform -translate-y-1/2 text-slate-400 text-lg"></i>
                  <input
                    type="password"
                    placeholder="新しいパスワードを入力（6文字以上）"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-14 pr-5 py-4 border-2 border-stone-200/80 rounded-2xl focus:border-amber-400 focus:ring-4 focus:ring-amber-100 transition-all duration-300 text-slate-700 placeholder-slate-400 bg-white/90 backdrop-blur-sm"
                  />
                </div>
              </div>

              {/* パスワード確認 */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-600 ml-1">パスワード確認</label>
                <div className="relative">
                  <i className="fas fa-check-circle absolute left-5 top-1/2 transform -translate-y-1/2 text-slate-400 text-lg"></i>
                  <input
                    type="password"
                    placeholder="新しいパスワードを再入力"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-14 pr-5 py-4 border-2 border-stone-200/80 rounded-2xl focus:border-amber-400 focus:ring-4 focus:ring-amber-100 transition-all duration-300 text-slate-700 placeholder-slate-400 bg-white/90 backdrop-blur-sm"
                  />
                </div>
              </div>

              {/* 変更ボタン */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full relative overflow-hidden bg-amber-400 hover:bg-amber-500 text-white py-4 rounded-2xl font-semibold text-lg transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed shadow-luxury"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>変更中...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-3">
                    <i className="fas fa-save"></i>
                    <span>パスワードを変更</span>
                  </div>
                )}
              </button>
            </form>

            {/* セキュリティ情報 */}
            <div className="mt-8 p-4 bg-blue-50 rounded-2xl border border-blue-200">
              <div className="flex items-start gap-3">
                <i className="fas fa-info-circle text-blue-500 mt-1"></i>
                <div className="text-sm text-blue-700">
                  <p className="font-medium mb-1">パスワード変更に関して</p>
                  <ul className="space-y-1 text-xs">
                    <li>• パスワードは6文字以上で設定してください</li>
                    <li>• 定期的なパスワード変更を推奨します</li>
                    <li>• 他のサービスと同じパスワードは使用しないでください</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}