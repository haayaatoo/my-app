
import React, { useEffect, useState } from "react";
import { useToast } from "./Toast";
import EngineerCard from "./EngineerCard";
import EngineerForm from "./EngineerForm";
import EngineerStats from "./EngineerStats";
import DeleteDropZone from "./DeleteDropZone";
import EngineerMemo from "./EngineerMemo";
import CSVImporter from "./CSVImporter";
import PPSalesProgress from "./PPSalesProgress";
import BPProgress from "./BPProgress";
import CompanyAppointmentManager from "./CompanyAppointmentManager";
import PartnerEngineerList from "./PartnerEngineerList";

// モダン・ラグジュアリーローディング
function AnimatedLoader() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-amber-50/20 to-slate-100 flex items-center justify-center">
      <div className="text-center p-16 bg-white/70 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/80" style={{
        boxShadow: '0 25px 60px rgba(0,0,0,0.08), 0 10px 25px rgba(0,0,0,0.06)'
      }}>
        {/* エレガントなローダー */}
        <div className="relative mb-10">
          <div className="w-24 h-24 border-3 border-amber-200/50 rounded-full animate-spin border-t-amber-400 mx-auto"></div>
          <div className="absolute inset-3 w-18 h-18 border-2 border-stone-200/40 rounded-full animate-pulse mx-auto"></div>
          <div className="absolute inset-6 w-12 h-12 border border-amber-300/30 rounded-full animate-ping mx-auto"></div>
        </div>
        
        {/* 上品なドット */}
        <div className="flex justify-center space-x-4 mb-10">
          <div className="w-3 h-3 bg-amber-400 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
          <div className="w-3 h-3 bg-stone-400 rounded-full animate-bounce" style={{animationDelay: '0.3s'}}></div>
          <div className="w-3 h-3 bg-amber-400 rounded-full animate-bounce" style={{animationDelay: '0.6s'}}></div>
        </div>
        
        {/* テキスト */}
        <h2 className="text-2xl font-medium text-slate-700 mb-4 tracking-wide font-display">エンジニアデータを読み込み中...</h2>
        <p className="text-slate-500 animate-pulse font-normal text-lg">エンジニア情報を取得しています</p>
      </div>
    </div>
  );
}

// モダン・ラグジュアリーヘッダーコンポーネント
function EngineerListHeader({ engineersCount, onAddNew, showStats, onToggleStats }) {
  return (
    <div
      className="relative overflow-hidden soft-panel soft-panel-accent p-8 rounded-3xl mb-8"
      style={{
        boxShadow: '0 25px 70px rgba(0,0,0,0.1), 0 10px 30px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.8)'
      }}
    >
      
      {/* 上品な装飾要素 */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-300"></div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-medium text-slate-700 mb-3 tracking-wide">
              <span className="font-display">
                エンジニア管理
              </span>
            </h1>
            <p className="text-slate-500 text-lg font-normal">
              登録数: <span className="text-amber-600 font-medium text-xl">{engineersCount}</span>名のプロフェッショナル
            </p>
          </div>
        </div>
        
        {/* タブナビゲーション */}
        <div className="flex bg-white rounded-2xl p-1 shadow-lg">
          <button
            onClick={() => onToggleStats()}
            className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center gap-2 ${
              showStats
                ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <i className="fas fa-tachometer-alt"></i>
            ダッシュボード
          </button>
          <button
            onClick={() => onToggleStats()}
            className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center gap-2 ${
              !showStats
                ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <i className="fas fa-users"></i>
            エンジニアリスト
          </button>
        </div>
      </div>
    </div>
  );
}


export default function EngineerList() {
  const toast = useToast();
  const [engineers, setEngineers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingEngineer, setEditingEngineer] = useState(null);
  const [search, setSearch] = useState({ status: '', skill: '', planner: '' });
  const [selectedEngineers, setSelectedEngineers] = useState([]);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [displayMode, setDisplayMode] = useState('card'); // 'card' or 'table'（カード/テーブル表示切り替え）
  const [activeTab, setActiveTab] = useState('dashboard'); // タブ切り替え用の状態（初期表示はダッシュボード）
  const [showMemoModal, setShowMemoModal] = useState(false);
  const [selectedEngineerForMemo, setSelectedEngineerForMemo] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0); // メモ変更時のカード更新トリガー
  const [showCSVImporter, setShowCSVImporter] = useState(false); // CSVインポートモーダル
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 12;

  const fetchEngineers = () => {
    setLoading(true);
    fetch("/api/engineers/")
      .then((res) => {
        if (!res.ok) throw new Error("API error");
        return res.json();
      })
      .then((data) => {
        setEngineers(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchEngineers();
  }, []);

  // 検索フィルタ + ソート
  const filtered = engineers.filter(e => {
    const statusMatch = search.status ? (e.engineer_status === search.status) : true;
    const skillMatch = search.skill ? (e.skills && e.skills.some(skill => skill.toLowerCase().includes(search.skill.toLowerCase()))) : true;
    const plannerMatch = search.planner ? (e.planner && e.planner.toLowerCase().includes(search.planner.toLowerCase())) : true;
    return statusMatch && skillMatch && plannerMatch;
  }).sort((a, b) => {
    let aValue, bValue;
    switch(sortBy) {
      case 'name':
        aValue = a.name;
        bValue = b.name;
        break;
      case 'skills':
        aValue = Array.isArray(a.skills) ? a.skills.length : 0;
        bValue = Array.isArray(b.skills) ? b.skills.length : 0;
        break;
      case 'status':
        aValue = a.engineer_status;
        bValue = b.engineer_status;
        break;
      default:
        aValue = a.name;
        bValue = b.name;
    }
    
    if (typeof aValue === 'string') {
      const comparison = aValue.localeCompare(bValue);
      return sortOrder === 'asc' ? comparison : -comparison;
    } else {
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    }
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // フィルター変更時にページをリセット
  useEffect(() => { setCurrentPage(1); }, [search, sortBy, sortOrder]);

  // 新規登録・編集
  const handleSubmit = async (form, continueAfter = false) => {
    const url = editingEngineer 
      ? `/api/engineers/${editingEngineer.id}/`
      : "/api/engineers/";
    
    const method = editingEngineer ? "PUT" : "POST";
    
    try {
      console.log('送信データ:', {
        ...form,
        skills: form.skills,
        phase: form.phase,
      });

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          skills: form.skills,
          phase: form.phase,
        })
      });

      console.log('レスポンス状態:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('エラー詳細:', errorText);
        
        let errorMessage;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.detail || errorData.error || JSON.stringify(errorData);
        } catch (e) {
          errorMessage = errorText || `HTTP ${response.status}: ${response.statusText}`;
        }
        
        throw new Error(`${editingEngineer ? "更新" : "登録"}に失敗しました: ${errorMessage}`);
      }

      await response.json();
      
      // 連続登録でなければフォームを閉じる
      if (!continueAfter) {
        setShowForm(false);
        setEditingEngineer(null);
      }
      
      // データを再取得
      fetchEngineers();
      
      // 成功メッセージ
      toast.success(
        continueAfter 
          ? "登録完了！続けて登録できます" 
          : (editingEngineer ? "更新完了!" : "登録完了!") 
      );
      
    } catch (err) {
      throw err; // エラーをフォームに返す
    }
  };

  // 編集開始
  const handleEdit = (engineer) => {
    setEditingEngineer(engineer);
    setShowForm(true);
  };

  // メモ表示
  const handleMemoClick = (engineerName) => {
    setSelectedEngineerForMemo(engineerName);
    setShowMemoModal(true);
  };

  // メモモーダルを閉じる（メモ変更時のリアルタイム更新対応）
  const closeMemoModal = () => {
    setShowMemoModal(false);
    setSelectedEngineerForMemo(null);
    // モーダルを閉じる際にも最終的にカードを更新（念のため）
    setRefreshTrigger(prev => prev + 1);
  };

  // メモ変更時のコールバック（EngineerMemoから呼び出される）
  const handleMemoChange = () => {
    // メモが変更された際にエンジニアカードのメモ統計をリアルタイム更新
    setRefreshTrigger(prev => prev + 1); // トリガー値を変更してカードのuseEffectを実行
  };

  // 削除
  const handleDelete = (engineerId) => {
    fetch(`/api/engineers/${engineerId}/`, {
      method: "DELETE",
    })
      .then(res => {
        if (!res.ok) throw new Error("削除に失敗しました");
        fetchEngineers();
        toast.success("削除完了!");
      })
      .catch(err => toast.error(err.message));
  };

  // ドロップゾーンからの削除
  const handleDropDelete = (engineerId) => {
    const engineer = engineers.find(e => e.id === engineerId);
    if (engineer && window.confirm(`${engineer.name}さんを削除しますか？`)) {
      handleDelete(engineerId);
    }
  };

  // フォームのキャンセル
  const handleCancel = () => {
    setShowForm(false);
    setEditingEngineer(null);
  };

  // CSVインポート関連
  const handleCSVImport = () => {
    setShowCSVImporter(true);
  };

  const handleCSVImportComplete = (result) => {
    toast.success(
      `${result.created_count}名のエンジニアを登録しました${
        result.skipped_count > 0 ? `（${result.skipped_count}名は重複のためスキップ）` : ''
      }`
    );
    fetchEngineers(); // データを再取得
  };

  const handleCSVImportClose = () => {
    setShowCSVImporter(false);
  };

  // 一括操作
  const handleSelectEngineer = (engineerId, isSelected) => {
    if (isSelected) {
      setSelectedEngineers([...selectedEngineers, engineerId]);
    } else {
      setSelectedEngineers(selectedEngineers.filter(id => id !== engineerId));
    }
  };

  const handleSelectAll = () => {
    if (selectedEngineers.length === filtered.length) {
      setSelectedEngineers([]);
    } else {
      setSelectedEngineers(filtered.map(e => e.id));
    }
  };

  const handleBulkDelete = () => {
    if (selectedEngineers.length === 0) return;
    
    if (window.confirm(`選択した${selectedEngineers.length}件のエンジニアを削除しますか？`)) {
      Promise.all(
        selectedEngineers.map(id => 
          fetch(`/api/engineers/${id}/`, { method: "DELETE" })
        )
      ).then(() => {
        fetchEngineers();
        setSelectedEngineers([]);
        toast.success(`${selectedEngineers.length}件のエンジニアを削除しました`);
      }).catch(err => toast.error("一括削除に失敗しました"));
    }
  };

  const handleBulkStatusChange = (newStatus) => {
    if (selectedEngineers.length === 0) return;
    
    Promise.all(
      selectedEngineers.map(id => {
        const engineer = engineers.find(e => e.id === id);
        return fetch(`/api/engineers/${id}/`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...engineer, engineer_status: newStatus })
        });
      })
    ).then(() => {
      fetchEngineers();
      setSelectedEngineers([]);
      toast.success(`${selectedEngineers.length}件のステータスを更新しました`);
    }).catch(err => toast.error("一括更新に失敗しました"));
  };

  // CSV エクスポート
  const handleExportCSV = () => {
    if (filtered.length === 0) { toast.error("出力するデータがありません"); return; }
    const csvData = filtered.map(e => ({
      name: e.name || '',
      position: e.position || '',
      project_name: e.project_name || '',
      planner: e.planner || '',
      skills: Array.isArray(e.skills) ? e.skills.join(',') : (e.skills || ''),
      engineer_status: e.engineer_status || '',
      phase: Array.isArray(e.phase) ? e.phase.join(',') : (e.phase || ''),
      client_company: e.client_company || '',
      monthly_rate: e.monthly_rate || '',
      project_start_date: e.project_start_date || '',
      project_end_date: e.project_end_date || '',
      project_location: e.project_location || '',
    }));

    const headers = Object.keys(csvData[0]);
    const escape = (val) => `"${String(val).replace(/"/g, '""')}"`;
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(h => escape(row[h])).join(','))
    ].join('\n');

    const bom = '\uFEFF';
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `engineers_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    toast.success("CSVファイルをダウンロードしました");
  };

  if (loading) return <AnimatedLoader />;
  if (error) return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-amber-50/20 to-slate-100 flex items-center justify-center">
      <div className="text-center p-16 bg-white/80 backdrop-blur-sm rounded-3xl border border-red-200/50" style={{
        boxShadow: '0 25px 60px rgba(220, 38, 38, 0.15), 0 10px 25px rgba(0,0,0,0.06)'
      }}>
        <div className="w-20 h-20 bg-gradient-to-br from-red-400 to-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-8">
          <i className="fas fa-exclamation-triangle text-3xl text-white"></i>
        </div>
        <h2 className="text-2xl font-medium text-slate-700 mb-6 tracking-wide font-display">エラーが発生しました</h2>
        <p className="text-slate-500 text-lg font-normal">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-8 px-8 py-3 bg-gradient-to-r from-red-400 to-rose-500 text-white rounded-2xl font-medium hover:from-red-500 hover:to-rose-600 transition-all duration-300"
        >
          ページを再読み込み
        </button>
      </div>
    </div>
  );

  return (
    <div
      className="flex flex-col h-full soft-page"
    >
      <div className="soft-aurora soft-aurora--emerald"></div>
      <div className="soft-aurora soft-aurora--indigo"></div>
      <div className="soft-noise"></div>

      {/* ページヘッダー */}
      <div className="relative z-10 px-6 pt-5 pb-4 border-b border-slate-200/60 bg-white/70 backdrop-blur-sm flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-sm">
              <i className="fas fa-users text-white text-sm"></i>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">
                {activeTab === 'dashboard' ? 'エンジニア統計ダッシュボード' :
                 activeTab === 'pp-sales' ? 'PP営業進捗管理' :
                 activeTab === 'bp-progress' ? 'BP進捗管理' :
                 activeTab === 'apo-kanri' ? 'アポ管理' : 'エンジニア管理'}
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                {activeTab === 'engineers' ? `登録数: ${engineers.length}名` : 'リアルタイム人材管理システム'}
              </p>
            </div>
          </div>
          <div className="flex items-center bg-white rounded-xl p-1 shadow-sm border border-slate-200 gap-0.5">
            {[
              { key: 'dashboard',         icon: 'fa-tachometer-alt', label: 'ダッシュボード',  color: 'bg-amber-500' },
              { key: 'engineers',         icon: 'fa-users',          label: 'IDRエンジニア',   color: 'bg-amber-500' },
              { key: 'partner-engineers', icon: 'fa-user-tie',       label: 'BPエンジニア',    color: 'bg-indigo-600' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === tab.key
                    ? `${tab.color} text-white shadow-sm`
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <i className={`fas ${tab.icon} text-[10px]`}></i>
                {tab.label}
              </button>
            ))}
            <div className="w-px h-5 bg-slate-200 mx-0.5 shrink-0"></div>
            {[
              { key: 'pp-sales',    icon: 'fa-handshake',       label: 'PP営業進捗' },
              { key: 'bp-progress', icon: 'fa-project-diagram', label: 'BP進捗管理' },
              { key: 'apo-kanri',   icon: 'fa-calendar-check',  label: 'アポ管理'   },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <i className={`fas ${tab.icon} text-[10px]`}></i>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="relative z-10 flex-1 overflow-auto px-6 py-5">

        {/* ダッシュボード表示 - エンジニア統計 */}
        {activeTab === 'dashboard' && (
          <div>
            <EngineerStats engineers={engineers} />
          </div>
        )}

        {/* PP営業進捗表示 */}
        {activeTab === 'pp-sales' && (
          <div>
            <PPSalesProgress />
          </div>
        )}

        {/* BP進捗表示 */}
        {activeTab === 'bp-progress' && (
          <div>
            <BPProgress />
          </div>
        )}

        {/* アポ管理表示 */}
        {activeTab === 'apo-kanri' && (
          <div>
            <CompanyAppointmentManager />
          </div>
        )}

        {/* パートナーエンジニアリスト表示 */}
        {activeTab === 'partner-engineers' && (
          <div>
            <PartnerEngineerList />
          </div>
        )}

        {/* エンジニアリスト表示 */}
        {activeTab === 'engineers' && (
          <>

      {/* モダン・ラグジュアリー一括操作バー */}
      {selectedEngineers.length > 0 && (
        <div className="mb-10 p-6 bg-gradient-to-r from-amber-50 via-white to-stone-50 backdrop-blur-sm rounded-3xl border border-amber-200/50" style={{
          boxShadow: '0 15px 40px rgba(0,0,0,0.08), 0 6px 16px rgba(251,191,36,0.15)'
        }}>
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-amber-400 rounded-full animate-pulse"></div>
                <span className="text-slate-700 font-medium text-lg tracking-wide">
                  <i className="fas fa-check-square mr-3 text-amber-500"></i>
                  {selectedEngineers.length}件選択中
                </span>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleBulkDelete}
                className="px-6 py-3 bg-white hover:bg-red-50 text-red-600 rounded-2xl transition-all duration-300 flex items-center gap-3 border-2 border-red-200 hover:border-red-300 font-medium whitespace-nowrap min-w-fit text-sm"
                style={{
                  boxShadow: '0 4px 15px rgba(220, 38, 38, 0.15)'
                }}
              >
                <i className="fas fa-trash text-lg"></i>
                一括削除
              </button>
              <button
                onClick={() => handleBulkStatusChange('アサイン済')}
                className="px-6 py-3 bg-white hover:bg-emerald-50 text-emerald-600 rounded-2xl transition-all duration-300 flex items-center gap-3 border-2 border-emerald-200 hover:border-emerald-300 font-medium whitespace-nowrap min-w-fit text-sm"
                style={{
                  boxShadow: '0 4px 15px rgba(16, 185, 129, 0.15)'
                }}
              >
                <i className="fas fa-check text-lg"></i>
                アサイン済に
              </button>
              <button
                onClick={() => handleBulkStatusChange('未アサイン')}
                className="px-6 py-3 bg-white hover:bg-amber-50 text-amber-600 rounded-2xl transition-all duration-300 flex items-center gap-3 border-2 border-amber-200 hover:border-amber-300 font-medium whitespace-nowrap min-w-fit text-sm"
                style={{
                  boxShadow: '0 4px 15px rgba(245, 158, 11, 0.15)'
                }}
              >
                <i className="fas fa-clock text-lg"></i>
                未アサインに
              </button>
            </div>
            
            <button
              onClick={() => setSelectedEngineers([])}
              className="p-3 text-slate-400 hover:text-slate-600 hover:bg-white/80 rounded-2xl transition-all duration-300"
            >
              <i className="fas fa-times text-lg"></i>
            </button>
          </div>
        </div>
      )}

      {/* モダン・ラグジュアリータイトル & アクション */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-10 gap-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-medium tracking-wide text-slate-700 flex items-center gap-4 font-display">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-stone-400 rounded-2xl flex items-center justify-center">
              <i className="fas fa-users text-white text-xl"></i>
            </div>
            IDRエンジニアリスト
          </h2>
          <div className="flex items-center gap-3 ml-16">
            <span className="px-4 py-2 bg-gradient-to-r from-amber-100 to-stone-100 text-slate-700 rounded-2xl text-lg font-medium border border-amber-200/50">
              {filtered.length}件表示中
            </span>
            <span className="text-slate-500 font-normal">/ 総数 {engineers.length}件</span>
            {totalPages > 1 && (
              <span className="text-slate-400 text-sm">{currentPage} / {totalPages}ページ</span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* 表示モード切り替え - エレガント */}
          <div className="flex bg-white/80 backdrop-blur-sm rounded-2xl p-2 border border-stone-200/80" style={{
            boxShadow: '0 8px 25px rgba(0,0,0,0.06)'
          }}>
            <button
              onClick={() => setDisplayMode('card')}
              className={`px-5 py-3 rounded-xl text-sm font-medium transition-all duration-300 flex items-center gap-2 whitespace-nowrap min-w-fit ${
                displayMode === 'card' 
                  ? 'bg-gradient-to-r from-amber-100 to-stone-100 text-slate-700 shadow-lg border border-amber-200/50' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-white/60'
              }`}
            >
              <i className="fas fa-th"></i>
              カード
            </button>
            <button
              onClick={() => setDisplayMode('table')}
              className={`px-5 py-3 rounded-xl text-sm font-medium transition-all duration-300 flex items-center gap-2 whitespace-nowrap min-w-fit ${
                displayMode === 'table' 
                  ? 'bg-gradient-to-r from-amber-100 to-stone-100 text-slate-700 shadow-lg border border-amber-200/50' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-white/60'
              }`}
            >
              <i className="fas fa-list"></i>
              テーブル
            </button>
          </div>
          
          {/* CSVインポート - エレガント */}
          <button
            onClick={handleCSVImport}
            className="px-6 py-3 bg-white/90 hover:bg-blue-50 text-blue-600 rounded-2xl transition-all duration-300 flex items-center gap-3 border-2 border-blue-200 hover:border-blue-300 font-medium backdrop-blur-sm whitespace-nowrap min-w-fit text-sm"
            style={{
              boxShadow: '0 8px 25px rgba(59, 130, 246, 0.15)'
            }}
          >
            <i className="fas fa-file-import text-lg"></i>
            CSVインポート
          </button>

          {/* CSVエクスポート - エレガント */}
          <button
            onClick={handleExportCSV}
            className="px-6 py-3 bg-white/90 hover:bg-emerald-50 text-emerald-600 rounded-2xl transition-all duration-300 flex items-center gap-3 border-2 border-emerald-200 hover:border-emerald-300 font-medium backdrop-blur-sm whitespace-nowrap min-w-fit text-sm"
            style={{
              boxShadow: '0 8px 25px rgba(16, 185, 129, 0.15)'
            }}
          >
            <i className="fas fa-file-csv text-lg"></i>
            CSV出力
          </button>
          
          {/* 新規登録 - プレミアム */}
          <button
            className="px-8 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-semibold flex items-center gap-3 transition-all duration-300 transform hover:scale-105 backdrop-blur-sm shadow-luxury whitespace-nowrap min-w-fit text-sm"
            style={{
              boxShadow: '0 8px 32px 0 rgba(245, 158, 11, 0.18), 0 2px 8px 0 rgba(120, 113, 108, 0.10), 0 1.5px 0 rgba(255,255,255,0.7) inset'
            }}
            onClick={() => setShowForm(true)}
          >
            <i className="fas fa-plus text-lg"></i>
            新規登録
          </button>
        </div>
      </div>
      {/* モダン・ラグジュアリー検索フィルタ + ソート */}
      <div className="soft-panel mb-10 p-8 rounded-3xl" style={{
        boxShadow: '0 20px 50px rgba(0,0,0,0.06), 0 8px 20px rgba(0,0,0,0.04)'
      }}>
        <div className="flex flex-col gap-8">
          {/* 全選択チェックボックス - エレガント */}
          <div className="flex items-center">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={selectedEngineers.length === filtered.length && filtered.length > 0}
                  onChange={handleSelectAll}
                  className="w-5 h-5 text-amber-600 rounded-lg focus:ring-amber-200 focus:ring-4 border-2 border-stone-300 bg-white/90 transition-all duration-300"
                />
                <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-amber-100 to-stone-100 opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
              </div>
              <span className="text-lg font-normal text-slate-700 tracking-wide">全選択</span>
            </label>
          </div>
          
          {/* フィルター行 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* アサイン状況 */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-600 tracking-wide">アサイン状況</label>
              <select 
                className="w-full px-5 py-4 border-2 border-stone-200/80 rounded-2xl focus:border-amber-400 focus:ring-4 focus:ring-amber-100 transition-all duration-300 text-slate-700 bg-white/90 backdrop-blur-sm font-normal text-lg" 
                style={{
                  boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
                }}
                value={search.status} 
                onChange={e => setSearch(s => ({ ...s, status: e.target.value }))}
              >
                <option value="">すべて</option>
                <option value="アサイン済">アサイン済</option>
                <option value="未アサイン">未アサイン</option>
              </select>
            </div>
            
            {/* スキル検索 */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-600 tracking-wide">スキル（部分一致）</label>
              <div className="relative">
                <i className="fas fa-code absolute left-5 top-1/2 transform -translate-y-1/2 text-slate-400 text-lg"></i>
                <input 
                  className="w-full pl-14 pr-5 py-4 border-2 border-stone-200/80 rounded-2xl focus:border-amber-400 focus:ring-4 focus:ring-amber-100 transition-all duration-300 text-slate-700 placeholder-slate-400 bg-white/90 backdrop-blur-sm font-normal text-lg" 
                  style={{
                    boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
                  }}
                  value={search.skill} 
                  onChange={e => setSearch(s => ({ ...s, skill: e.target.value }))} 
                  placeholder="例: Python, React"
                />
              </div>
            </div>
            
            {/* プランナー検索 */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-600 tracking-wide">担当プランナー</label>
              <div className="relative">
                <i className="fas fa-user-tie absolute left-5 top-1/2 transform -translate-y-1/2 text-slate-400 text-lg"></i>
                <input 
                  className="w-full pl-14 pr-5 py-4 border-2 border-stone-200/80 rounded-2xl focus:border-amber-400 focus:ring-4 focus:ring-amber-100 transition-all duration-300 text-slate-700 placeholder-slate-400 bg-white/90 backdrop-blur-sm font-normal text-lg" 
                  style={{
                    boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
                  }}
                  value={search.planner} 
                  onChange={e => setSearch(s => ({ ...s, planner: e.target.value }))} 
                  placeholder="例: 佐藤"
                />
              </div>
            </div>
            
            {/* ソート機能 */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-600 tracking-wide">並び順</label>
              <div className="flex gap-3">
                <select 
                  className="flex-1 px-5 py-4 border-2 border-stone-200/80 rounded-2xl focus:border-amber-400 focus:ring-4 focus:ring-amber-100 transition-all duration-300 text-slate-700 bg-white/90 backdrop-blur-sm font-normal text-lg" 
                  style={{
                    boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
                  }}
                  value={sortBy} 
                  onChange={e => setSortBy(e.target.value)}
                >
                  <option value="name">名前</option>
                  <option value="skills">スキル数</option>
                  <option value="status">ステータス</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-5 py-4 border-2 border-stone-200/80 rounded-2xl hover:border-amber-400 hover:bg-amber-50 transition-all duration-300 flex items-center justify-center text-slate-600 bg-white/90 backdrop-blur-sm"
                  style={{
                    boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
                  }}
                  title={sortOrder === 'asc' ? '昇順' : '降順'}
                >
                  <i className={`fas text-lg ${sortOrder === 'asc' ? 'fa-sort-amount-up' : 'fa-sort-amount-down'}`}></i>
                </button>
              </div>
            </div>
          </div>
          
          {/* アクティブフィルターの表示 */}
          {(search.status || search.skill || search.planner) && (
            <div className="pt-6 border-t border-stone-200/50">
              <div className="flex flex-wrap gap-3">
                <span className="text-sm font-medium text-slate-600 mr-3">アクティブフィルター:</span>
                {search.status && (
                  <span className="px-4 py-2 bg-amber-100 text-amber-800 rounded-xl text-sm font-medium">
                    状況: {search.status}
                  </span>
                )}
                {search.skill && (
                  <span className="px-4 py-2 bg-stone-100 text-stone-700 rounded-xl text-sm font-medium">
                    スキル: "{search.skill}"
                  </span>
                )}
                {search.planner && (
                  <span className="px-4 py-2 bg-stone-100 text-stone-700 rounded-xl text-sm font-medium">
                    プランナー: "{search.planner}"
                  </span>
                )}
                <button
                  onClick={() => setSearch({ status: '', skill: '', planner: '' })}
                  className="px-4 py-2 bg-stone-200 hover:bg-stone-300 text-slate-600 rounded-xl text-sm font-medium transition-all duration-300"
                >
                  <i className="fas fa-times mr-2"></i>
                  クリア
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* エンジニア一覧 */}
      {displayMode === 'table' ? (
        /* ── テーブル表示 ── */
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-amber-50 to-stone-50 border-b border-stone-200">
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedEngineers.length === filtered.length && filtered.length > 0}
                      onChange={handleSelectAll}
                      className="w-4 h-4 text-amber-600 rounded"
                    />
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600 whitespace-nowrap">名前</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600 whitespace-nowrap">役職</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600 whitespace-nowrap">ステータス</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600 whitespace-nowrap">スキル</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600 whitespace-nowrap">プランナー</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600 whitespace-nowrap">プロジェクト</th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-600 whitespace-nowrap">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-16 text-slate-400">
                      <i className="fas fa-search text-3xl block mb-3"></i>
                      該当するエンジニアがいません
                    </td>
                  </tr>
                ) : paginated.map((e) => {
                  const statusMap = {
                    'アサイン済': { color: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
                    '未アサイン': { color: 'bg-red-100 text-red-600',   dot: 'bg-red-400'   },
                  };
                  const st = statusMap[e.engineer_status] || { color: 'bg-gray-100 text-gray-500', dot: 'bg-gray-400' };
                  const skillsArr = Array.isArray(e.skills) ? e.skills : (e.skills || '').split(',').map(s => s.trim()).filter(Boolean);
                  return (
                    <tr key={e.id} className={`hover:bg-amber-50/40 transition-colors ${selectedEngineers.includes(e.id) ? 'bg-amber-50' : ''}`}>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedEngineers.includes(e.id)}
                          onChange={(ev) => handleSelectEngineer(e.id, ev.target.checked)}
                          className="w-4 h-4 text-amber-600 rounded"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-300 to-blue-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {e.name?.charAt(0)}
                          </div>
                          <span className="font-semibold text-slate-800 whitespace-nowrap">{e.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{e.position || '―'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${st.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`}></span>
                          {e.engineer_status || '不明'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {skillsArr.slice(0, 4).map((s, i) => (
                            <span key={i} className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.5 rounded-full">{s}</span>
                          ))}
                          {skillsArr.length > 4 && <span className="text-[10px] text-slate-400">+{skillsArr.length - 4}</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{e.planner || '―'}</td>
                      <td className="px-4 py-3 text-slate-600 max-w-[160px] truncate">{e.project_name || '―'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleMemoClick(e.name)}
                            className="w-7 h-7 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-600 flex items-center justify-center transition-colors"
                            title="メモ"
                          >
                            <i className="fas fa-sticky-note text-xs"></i>
                          </button>
                          <button
                            onClick={() => handleEdit(e)}
                            className="w-7 h-7 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 flex items-center justify-center transition-colors"
                            title="編集"
                          >
                            <i className="fas fa-pen text-xs"></i>
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`${e.name}さんを削除しますか？`)) handleDelete(e.id);
                            }}
                            className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center transition-colors"
                            title="削除"
                          >
                            <i className="fas fa-trash text-xs"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ── カード表示 ── */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 items-stretch">
          {paginated.map((e, index) => (
          <div 
            key={e.id}
            className="h-full"
          >
            <EngineerCard 
              engineer={{ ...e, project: e.project_name, project_location: e.project_location }}
              onEdit={handleEdit}
              onDelete={handleDelete}
              isSelected={selectedEngineers.includes(e.id)}
              onSelect={handleSelectEngineer}
              onMemoClick={handleMemoClick}
              refreshTrigger={refreshTrigger}
            />
          </div>
        ))}
        
          {/* 空の状態もスタイリッシュに */}
          {paginated.length === 0 && filtered.length === 0 && (
          <div className="col-span-full text-center py-16">
            <div className="relative">
              {/* 背景の装飾 */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-32 border-4 border-gray-200 rounded-full animate-pulse"></div>
                <div className="absolute w-20 h-20 border-2 border-gray-300 rounded-full animate-ping"></div>
              </div>
              
              <div className="relative z-10">
                <div className="text-8xl mb-6 text-gray-300 animate-bounce">
                  <i className="fas fa-search"></i>
                </div>
                <h3 className="text-2xl font-bold text-gray-400 mb-3">該当するエンジニアがいません</h3>
                <p className="text-gray-400 text-lg mb-4">検索条件を変更してみてください</p>
                <button 
                  onClick={() => setSearch({ status: '', skill: '', planner: '' })}
                  className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-xl font-semibold hover:scale-105 transform transition-all duration-300 shadow-md"
                >
                  <i className="fas fa-refresh mr-2"></i>
                  検索をクリア
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
      )}

      {/* ページネーション */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="w-9 h-9 rounded-xl bg-white border border-stone-200 text-slate-500 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-600 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all shadow-sm"
          >
            <i className="fas fa-angle-double-left text-xs"></i>
          </button>
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="w-9 h-9 rounded-xl bg-white border border-stone-200 text-slate-500 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-600 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all shadow-sm"
          >
            <i className="fas fa-angle-left text-xs"></i>
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
            .reduce((acc, p, idx, arr) => {
              if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
              acc.push(p);
              return acc;
            }, [])
            .map((item, idx) =>
              item === '...' ? (
                <span key={`ellipsis-${idx}`} className="w-9 h-9 flex items-center justify-center text-slate-400 text-sm">…</span>
              ) : (
                <button
                  key={item}
                  onClick={() => setCurrentPage(item)}
                  className={`w-9 h-9 rounded-xl text-sm font-semibold transition-all shadow-sm ${
                    currentPage === item
                      ? 'bg-gradient-to-br from-amber-400 to-stone-400 text-white border-0 shadow-md scale-105'
                      : 'bg-white border border-stone-200 text-slate-600 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-600'
                  }`}
                >
                  {item}
                </button>
              )
            )}
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="w-9 h-9 rounded-xl bg-white border border-stone-200 text-slate-500 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-600 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all shadow-sm"
          >
            <i className="fas fa-angle-right text-xs"></i>
          </button>
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className="w-9 h-9 rounded-xl bg-white border border-stone-200 text-slate-500 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-600 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all shadow-sm"
          >
            <i className="fas fa-angle-double-right text-xs"></i>
          </button>
        </div>
      )}
      
      {/* 新規登録・編集モーダル */}
      {showForm && (
        <EngineerForm 
          onSubmit={handleSubmit} 
          onCancel={handleCancel}
          initialData={editingEngineer}
        />
      )}

      {/* メモモーダル */}
      {showMemoModal && selectedEngineerForMemo && (
        <EngineerMemo
          engineerName={selectedEngineerForMemo}
          onClose={closeMemoModal}
          onMemoChange={handleMemoChange}
        />
      )}

      {/* CSVインポートモーダル */}
      {showCSVImporter && (
        <CSVImporter
          onImport={handleCSVImportComplete}
          onClose={handleCSVImportClose}
        />
      )}

      {/* 削除ドロップゾーン */}
      <DeleteDropZone onDrop={handleDropDelete} />
          </>
        )}
      </div>
  </div>
  );
}
