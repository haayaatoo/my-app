
import React, { useEffect, useState } from "react";
import EngineerCard from "./EngineerCard";
import EngineerForm from "./EngineerForm";
import EngineerStats from "./EngineerStats";
import DeleteDropZone from "./DeleteDropZone";
import EngineerMemo from "./EngineerMemo";
import CSVImporter from "./CSVImporter";

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
        <h2 className="text-3xl font-medium text-slate-700 mb-4 tracking-wide font-display">エンジニアデータを読み込み中...</h2>
        <p className="text-slate-500 animate-pulse font-normal text-lg">エンジニア情報を取得しています</p>
      </div>
    </div>
  );
}

// モダン・ラグジュアリーヘッダーコンポーネント
function EngineerListHeader({ engineersCount, onAddNew, showStats, onToggleStats }) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-white via-stone-50 to-amber-50/30 p-8 rounded-3xl shadow-2xl border border-white/80 mb-8 backdrop-blur-sm" 
         style={{
           boxShadow: '0 25px 70px rgba(0,0,0,0.1), 0 10px 30px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.8)'
         }}>
      
      {/* 上品な装飾要素 */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-300"></div>
      <div className="absolute top-4 right-6 w-3 h-3 bg-amber-200/40 rounded-full animate-pulse"></div>
      <div className="absolute bottom-4 left-6 w-2 h-2 bg-stone-200/50 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
      <div className="absolute top-8 left-12 w-1 h-1 bg-amber-300/60 rounded-full animate-ping" style={{animationDelay: '2s'}}></div>
      
      <div className="relative z-10 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-medium text-slate-700 mb-3 tracking-wide">
            <span className="inline-block hover:scale-105 transition-transform duration-300 font-display">
              エンジニア管理
            </span>
          </h1>
          <p className="text-slate-500 text-lg font-normal">
            登録数: <span className="text-amber-600 font-medium text-xl">{engineersCount}</span>名のプロフェッショナル
          </p>
        </div>
        
        <div className="flex space-x-4">
          <button
            onClick={onToggleStats}
            className="group relative overflow-hidden bg-gradient-to-br from-white/80 via-stone-50 to-amber-50/50 text-slate-700 px-8 py-4 rounded-2xl font-medium transition-all duration-500 transform hover:scale-105 shadow-lg border border-white/60 backdrop-blur-sm hover:shadow-amber-200/50 whitespace-nowrap min-w-fit text-sm"
            style={{
              boxShadow: '0 10px 30px rgba(0,0,0,0.08), 0 4px 15px rgba(0,0,0,0.06)'
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-100/30 to-transparent -skew-x-12 -translate-x-full group-hover:animate-shimmer"></div>
            <i className="fas fa-chart-bar mr-3 text-amber-600"></i>
            {showStats ? '統計を隠す' : '統計を表示'}
          </button>
        </div>
      </div>
    </div>
  );
}


export default function EngineerList() {
  const [engineers, setEngineers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingEngineer, setEditingEngineer] = useState(null);
  const [search, setSearch] = useState({ status: '', skill: '', planner: '' });
  const [selectedEngineers, setSelectedEngineers] = useState([]);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [viewMode, setViewMode] = useState('card'); // 'card' or 'table'
  const [showStats, setShowStats] = useState(true); // 統計表示の切り替え
  const [showMemoModal, setShowMemoModal] = useState(false);
  const [selectedEngineerForMemo, setSelectedEngineerForMemo] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0); // メモ変更時のカード更新トリガー
  const [showCSVImporter, setShowCSVImporter] = useState(false); // CSVインポートモーダル

  const fetchEngineers = () => {
    setLoading(true);
    fetch("http://localhost:8000/api/engineers/")
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

  // 新規登録・編集
  const handleSubmit = async (form, continueAfter = false) => {
    const url = editingEngineer 
      ? `http://localhost:8000/api/engineers/${editingEngineer.id}/`
      : "http://localhost:8000/api/engineers/";
    
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
      showNotification(
        continueAfter 
          ? "登録完了！続けて登録できます" 
          : (editingEngineer ? "更新完了!" : "登録完了!"), 
        "success"
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
    fetch(`http://localhost:8000/api/engineers/${engineerId}/`, {
      method: "DELETE",
    })
      .then(res => {
        if (!res.ok) throw new Error("削除に失敗しました");
        fetchEngineers();
        showNotification("削除完了!", "error");
      })
      .catch(err => alert(err.message));
  };

  // ドロップゾーンからの削除
  const handleDropDelete = (engineerId) => {
    const engineer = engineers.find(e => e.id === engineerId);
    if (engineer && window.confirm(`${engineer.name}さんを削除しますか？`)) {
      handleDelete(engineerId);
    }
  };

  // 通知表示
  const [notification, setNotification] = useState(null);
  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
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
    showNotification(
      `${result.created_count}名のエンジニアを登録しました${
        result.skipped_count > 0 ? `（${result.skipped_count}名は重複のためスキップ）` : ''
      }`, 
      "success"
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
          fetch(`http://localhost:8000/api/engineers/${id}/`, { method: "DELETE" })
        )
      ).then(() => {
        fetchEngineers();
        setSelectedEngineers([]);
        showNotification(`${selectedEngineers.length}件のエンジニアを削除しました`, "success");
      }).catch(err => alert("一括削除に失敗しました"));
    }
  };

  const handleBulkStatusChange = (newStatus) => {
    if (selectedEngineers.length === 0) return;
    
    Promise.all(
      selectedEngineers.map(id => {
        const engineer = engineers.find(e => e.id === id);
        return fetch(`http://localhost:8000/api/engineers/${id}/`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...engineer, engineer_status: newStatus })
        });
      })
    ).then(() => {
      fetchEngineers();
      setSelectedEngineers([]);
      showNotification(`${selectedEngineers.length}件のステータスを更新しました`, "success");
    }).catch(err => alert("一括更新に失敗しました"));
  };

  // CSV エクスポート
  const handleExportCSV = () => {
    const csvData = filtered.map(e => ({
      名前: e.name,
      役職: e.position || '',
      プロジェクト: e.project_name || '',
      プランナー: e.planner || '',
      スキル: Array.isArray(e.skills) ? e.skills.join(', ') : '',
      ステータス: e.engineer_status,
      フェーズ: Array.isArray(e.phase) ? e.phase.join(', ') : ''
    }));
    
    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `engineers_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    showNotification("CSVファイルをダウンロードしました", "success");
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
        <h2 className="text-3xl font-medium text-slate-700 mb-6 tracking-wide font-display">エラーが発生しました</h2>
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
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-amber-50/20 to-slate-100">
      {/* モダン・ラグジュアリー通知 */}
      {notification && (
        <div className={`fixed top-6 right-6 z-50 px-8 py-4 rounded-3xl backdrop-blur-sm text-white font-medium animate-bounce-in flex items-center gap-4 border border-white/20 ${
          notification.type === 'success' 
            ? 'bg-gradient-to-r from-emerald-500 to-green-500' 
            : 'bg-gradient-to-r from-red-500 to-rose-500'
        }`} style={{
          boxShadow: '0 20px 50px rgba(0,0,0,0.15), 0 8px 20px rgba(0,0,0,0.1)'
        }}>
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
            <i className={`fas text-sm ${notification.type === 'success' ? 'fa-check' : 'fa-exclamation'}`}></i>
          </div>
          <span className="text-lg tracking-wide">{notification.message}</span>
        </div>
      )}

      <div className="container mx-auto px-6 py-8">
        {/* 新しいスタイリッシュヘッダー */}
        <EngineerListHeader 
          engineersCount={engineers.length}
          onAddNew={() => setShowForm(true)}
          showStats={showStats}
          onToggleStats={() => setShowStats(!showStats)}
        />

        {/* 統計情報（条件付き表示） */}
        {showStats && (
          <div className="mb-8 transform transition-all duration-500 ease-in-out">
            <EngineerStats engineers={engineers} />
          </div>
        )}

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
          <h2 className="text-4xl font-medium tracking-wide text-slate-700 flex items-center gap-4 font-display">
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
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* 表示モード切り替え - エレガント */}
          <div className="flex bg-white/80 backdrop-blur-sm rounded-2xl p-2 border border-stone-200/80" style={{
            boxShadow: '0 8px 25px rgba(0,0,0,0.06)'
          }}>
            <button
              onClick={() => setViewMode('card')}
              className={`px-5 py-3 rounded-xl text-sm font-medium transition-all duration-300 flex items-center gap-2 whitespace-nowrap min-w-fit ${
                viewMode === 'card' 
                  ? 'bg-gradient-to-r from-amber-100 to-stone-100 text-slate-700 shadow-lg border border-amber-200/50' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-white/60'
              }`}
            >
              <i className="fas fa-th"></i>
              カード
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-5 py-3 rounded-xl text-sm font-medium transition-all duration-300 flex items-center gap-2 whitespace-nowrap min-w-fit ${
                viewMode === 'table' 
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
            className="px-8 py-3 bg-amber-400 hover:bg-amber-500 text-white rounded-2xl font-semibold flex items-center gap-3 transition-all duration-300 transform hover:scale-105 backdrop-blur-sm shadow-luxury whitespace-nowrap min-w-fit text-sm"
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
      <div className="mb-10 p-8 bg-white/80 backdrop-blur-sm rounded-3xl border border-white/90" style={{
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
      {/* エンジニア一覧 - スタイリッシュアニメーション付き */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filtered.map((e, index) => (
          <div 
            key={e.id}
            className="transform transition-all duration-700 ease-out hover:scale-105"
            style={{
              animationDelay: `${index * 0.1}s`,
              animation: 'slideInUp 0.8s ease-out forwards'
            }}
          >
            <EngineerCard 
              engineer={{ ...e, project: e.project_name }}
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
        {filtered.length === 0 && (
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
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-2xl font-semibold hover:scale-105 transform transition-all duration-300 shadow-lg hover:shadow-blue-500/50"
                >
                  <i className="fas fa-refresh mr-2"></i>
                  検索をクリア
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
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
      </div>
    </div>
  );
}
