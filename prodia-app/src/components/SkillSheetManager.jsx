import React, { useState, useMemo, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { useUser } from '../contexts/UserContext';
import { useToast } from './Toast';
import EngineerMemo from './EngineerMemo';

// APIエンドポイント
const API_BASE = '/api/skillsheets/';

// 統一されたローディングコンポーネント
function AnimatedLoader() {
  return (
    <div className="h-full bg-gradient-to-br from-stone-50 via-amber-50/20 to-slate-100 flex items-center justify-center">
      <div className="text-center p-16 bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/80" style={{
        boxShadow: '0 25px 60px rgba(0,0,0,0.08), 0 10px 25px rgba(0,0,0,0.06)'
      }}>
        <div className="relative mb-10">
          <div className="w-24 h-24 border-3 border-amber-200/50 rounded-full animate-spin border-t-amber-400 mx-auto"></div>
          <div className="absolute inset-3 w-18 h-18 border-2 border-stone-200/40 rounded-full animate-pulse mx-auto"></div>
          <div className="absolute inset-6 w-12 h-12 border border-amber-300/30 rounded-full animate-ping mx-auto"></div>
        </div>
        
        <div className="flex justify-center space-x-4 mb-10">
          <div className="w-3 h-3 bg-amber-400 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
          <div className="w-3 h-3 bg-stone-400 rounded-full animate-bounce" style={{animationDelay: '0.3s'}}></div>
          <div className="w-3 h-3 bg-amber-400 rounded-full animate-bounce" style={{animationDelay: '0.6s'}}></div>
        </div>
        
        <h2 className="text-2xl font-medium text-slate-700 mb-4 tracking-wide font-display">スキルシートデータを読み込み中...</h2>
        <p className="text-slate-500 animate-pulse font-normal text-lg">エンジニア情報を取得しています</p>
      </div>
    </div>
  );
}

// 標準ファイルアップロードコンポーネント
function SkillSheetUpload({ onUpload }) {
  const toast = useToast();
  const fileInputRef = useRef();
  const [fileName, setFileName] = useState("");
  const [engineerName, setEngineerName] = useState("");
  const { user } = useUser(); // ログインユーザー情報を取得

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFileName(file.name);
      // ファイル選択後、エンジニア名が入力済みなら即座にアップロード
      if (engineerName.trim()) {
        const uploaderName = user?.name || user?.email || 'Anonymous';
        onUpload && onUpload(file, engineerName, uploaderName);
      }
    }
  };

  const handleEngineerNameChange = (e) => {
    setEngineerName(e.target.value);
  };

  const handleUploadClick = () => {
    if (!engineerName.trim()) {
      toast.warning("エンジニア名を入力してください");
      return;
    }
    fileInputRef.current && fileInputRef.current.click();
  };

  const handleManualUpload = () => {
    if (!fileName || !engineerName.trim()) {
      toast.warning("エンジニア名とファイルの両方を選択してください");
      return;
    }
    const file = fileInputRef.current.files[0];
    const uploaderName = user?.name || user?.email || 'Anonymous';
    onUpload && onUpload(file, engineerName, uploaderName);
  };

  return (
    <div className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-stone-300 rounded-2xl text-center cursor-pointer transition-all duration-300 hover:border-amber-400 hover:bg-white/80">
      <i className="fas fa-cloud-upload-alt text-4xl mb-4 text-stone-400"></i>
      
      <div className="w-full max-w-md mb-6">
        <label htmlFor="engineerNameInput" className="text-slate-600 font-medium mb-2 block">
          エンジニア名 <span className="text-red-500">*</span>
        </label>
        <input
          id="engineerNameInput"
          type="text"
          value={engineerName}
          onChange={handleEngineerNameChange}
          placeholder="例: 田中太郎"
          className="px-4 py-2 border border-stone-300 rounded-lg w-full text-center focus:ring-2 focus:ring-amber-500 focus:border-transparent"
        />
        
        {/* ログインユーザー表示 */}
        <div className="mt-2 text-sm text-slate-500">
          アップロード者: <span className="font-medium text-slate-700">
            {user?.name || user?.email || '未ログイン'}
          </span>
        </div>
      </div>

      <label htmlFor="skillSheetUpload" className="text-slate-600 font-medium mb-2 cursor-pointer">
        スキルシートを選択してください
      </label>
      <input
        id="skillSheetUpload"
        type="file"
        accept=".pdf,.xlsx,.xls,.docx,.csv"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
      />
      <button
        className="mt-2 px-6 py-2 bg-amber-500 text-white rounded-lg font-semibold hover:bg-amber-600 transition-colors"
        onClick={handleUploadClick}
      >
        ファイルを選択
      </button>
      {fileName && (
        <div className="mt-4">
          <p className="text-sm text-slate-600 mb-2">
            選択されたファイル: <span className="font-medium text-amber-600">{fileName}</span>
          </p>
          {engineerName && (
            <button
              onClick={handleManualUpload}
              className="px-4 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors"
            >
              <i className="fas fa-upload mr-2"></i>
              アップロード実行
            </button>
          )}
        </div>
      )}
    </div>
  );
}


export default function SkillSheetManager() {
  const toast = useToast();
  const [skillSheets, setSkillSheets] = useState([]);  // 全スキルシート
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [sortBy, setSortBy] = useState("date");
  const [filterBy, setFilterBy] = useState("all");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showMemoModal, setShowMemoModal] = useState(false);
  const [selectedEngineerForMemo, setSelectedEngineerForMemo] = useState(null);
  const [viewMode, setViewMode] = useState("engineer"); // engineer | all
  const [groupedByEngineer, setGroupedByEngineer] = useState({});
  
  const { user } = useUser(); // ログインユーザー情報を取得

  // メモ関連のハンドラー
  const openMemoModal = (engineerName) => {
    setSelectedEngineerForMemo(engineerName);
    setShowMemoModal(true);
  };

  const closeMemoModal = () => {
    setShowMemoModal(false);
    setSelectedEngineerForMemo(null);
  };

  // データ取得関数
  const fetchEngineers = async () => {
    try {
      setLoading(true);
      console.log('データ取得開始:', API_BASE);
      
      const response = await fetch(API_BASE);
      console.log('レスポンス状態:', response.status, response.statusText);
      
      if (response.ok) {
        const data = await response.json();
        console.log('取得データ:', data);
        
        // 全スキルシートを保存
        setSkillSheets(data);
        
        // エンジニア別にグループ化
        const grouped = data.reduce((acc, sheet) => {
          const engineerName = sheet.engineer_name || '未設定';
          if (!acc[engineerName]) {
            acc[engineerName] = [];
          }
          acc[engineerName].push(sheet);
          return acc;
        }, {});
        
        // 各エンジニアのスキルシートを日付順でソート
        Object.keys(grouped).forEach(engineerName => {
          grouped[engineerName].sort((a, b) => new Date(b.uploaded_at) - new Date(a.uploaded_at));
        });
        
        setGroupedByEngineer(grouped);
        
        console.log('分類結果:', { 
          total: data.length,
          engineers: Object.keys(grouped).length
        });
      } else {
        const errorText = await response.text();
        console.error('データ取得エラー:', errorText);
        toast.error(`データの取得に失敗しました (${response.status})`);
      }
    } catch (error) {
      console.error('データ取得エラー:', error);
      toast.error("サーバーに接続できませんでした");
    } finally {
      setLoading(false);
    }
  };

  // ファイルアップロード処理
  const handleFileUpload = async (file, engineerName, uploaderName = null) => {
    // アップロード者名が指定されていない場合は、ログインユーザーを使用
    const actualUploader = uploaderName || user?.name || user?.email || 'Anonymous';
    
    if (!file || !engineerName.trim()) {
      toast.error("ファイルとエンジニア名を入力してください");
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);  // Djangoのserializerに合わせて'file'を使用
      formData.append('engineer_name', engineerName.trim());
      formData.append('uploader', actualUploader); // ログインユーザーを使用

      setIsUploading(true);
      setUploadProgress(0);

      console.log('フォームデータ:', {
        file: file.name,
        engineer_name: engineerName.trim(),
        uploader: actualUploader
      });

      // アップロード進捗をシミュレート
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      console.log('アップロード開始:', { file: file.name, engineerName });

      const response = await fetch(API_BASE, {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      console.log('レスポンス:', response.status, response.statusText);

      if (response.ok) {
        const result = await response.json();
        console.log('アップロード成功:', result);
        
        // 成功メッセージ
        toast.success(`${engineerName}のスキルシートをアップロードしました！`);

        // データを再取得
        await fetchEngineers();

      } else {
        const errorText = await response.text();
        console.error('アップロードエラー詳細:', errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { detail: errorText || 'アップロードに失敗しました' };
        }
        throw new Error(errorData.detail || errorData.error || 'アップロードに失敗しました');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(`アップロードエラー: ${error.message}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };



  // Excel出力処理
  const exportToExcel = () => {
    try {
      const rows = skillSheets.map(sheet => ({
        エンジニア名: sheet.engineer_name || '',
        ファイル名: sheet.file_name || '',
        アップロード者: sheet.uploader || '',
        アップロード日: sheet.uploaded_at ? new Date(sheet.uploaded_at).toLocaleDateString('ja-JP') : '',
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'スキルシート一覧');
      XLSX.writeFile(wb, `スキルシート一覧_${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success("Excelファイルをダウンロードしました");
    } catch (error) {
      toast.error("Excelエクスポートに失敗しました");
    }
  };




  // スキルシートのフィルタリング（全一覧モード用）
  const filteredEngineers = useMemo(() => {
    let filtered = skillSheets; // 全スキルシートを対象
    
    // 検索フィルタ
    if (searchTerm) {
      filtered = filtered.filter(sheet => {
        const searchLower = searchTerm.toLowerCase();
        return (
          sheet.engineer_name?.toLowerCase().includes(searchLower) ||
          sheet.file_name?.toLowerCase().includes(searchLower) ||
          sheet.uploader?.toLowerCase().includes(searchLower)
        );
      });
    }
    
    // 期間フィルタ
    if (filterBy !== "all") {
      const now = new Date();
      const filterDate = new Date();
      
      switch (filterBy) {
        case "week":
          filterDate.setDate(now.getDate() - 7);
          break;
        case "month":
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case "quarter":
          filterDate.setMonth(now.getMonth() - 3);
          break;
        default:
          // デフォルトケースを追加
          break;
      }
      
      filtered = filtered.filter(sheet => 
        new Date(sheet.uploaded_at) >= filterDate
      );
    }
    
    // ソート
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.engineer_name?.localeCompare(b.engineer_name) || 0;
        case "uploader":
          return a.uploader?.localeCompare(b.uploader) || 0;
        case "date":
        default:
          return new Date(b.uploaded_at) - new Date(a.uploaded_at);
      }
    });
    
    return filtered;
  }, [skillSheets, searchTerm, sortBy, filterBy]);

  // 統計データ
  const stats = useMemo(() => {
    const total = skillSheets.length;
    const totalEngineers = Object.keys(groupedByEngineer).length;
    const thisMonth = skillSheets.filter(sheet => {
      const uploadDate = new Date(sheet.uploaded_at);
      const now = new Date();
      return uploadDate.getMonth() === now.getMonth() && 
             uploadDate.getFullYear() === now.getFullYear();
    }).length;
    
    const skillsData = {};
    skillSheets.forEach(sheet => {
      const fileName = sheet.file_name?.toLowerCase() || "";
      if (fileName.includes("react")) skillsData.React = (skillsData.React || 0) + 1;
      if (fileName.includes("python")) skillsData.Python = (skillsData.Python || 0) + 1;
      if (fileName.includes("aws")) skillsData.AWS = (skillsData.AWS || 0) + 1;
      if (fileName.includes("java")) skillsData.Java = (skillsData.Java || 0) + 1;
      if (fileName.includes("vue")) skillsData.Vue = (skillsData.Vue || 0) + 1;
      if (fileName.includes("node")) skillsData.Node = (skillsData.Node || 0) + 1;
    });
    
    const topSkills = Object.entries(skillsData)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([skill, count]) => ({ name: skill, count }));
    
    return { total, totalEngineers, thisMonth, topSkills };
  }, [skillSheets, groupedByEngineer]);

  // データ取得
  useEffect(() => {
    fetchEngineers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);



  // スキルシート削除
  const handleDelete = async (id) => {
    try {
      const response = await fetch(`${API_BASE}${id}/`, { method: 'DELETE' });
      if (response.ok || response.status === 204) {
        toast.success("削除しました");
        setConfirmDeleteId(null);
        await fetchEngineers();
      } else {
        toast.error("削除に失敗しました");
      }
    } catch (error) {
      toast.error("削除に失敗しました");
    }
  };

  // 検索クリア
  const clearSearch = () => {
    setSearchTerm("");
  };

  if (loading) {
    return <AnimatedLoader />;
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-stone-50 via-amber-50/20 to-slate-100 relative">
      {/* ページヘッダー */}
      <div className="px-6 pt-5 pb-4 border-b border-slate-200/60 bg-white/70 backdrop-blur-sm flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-stone-500 flex items-center justify-center shadow-sm">
              <i className="fas fa-file-alt text-white text-sm"></i>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">スキルシート管理</h1>
              <p className="text-xs text-slate-400 mt-0.5">登録・検索・ダウンロード</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportToExcel}
              className="px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg text-sm font-medium hover:shadow-md transition-all duration-200 flex items-center gap-1.5"
            >
              <i className="fas fa-file-excel text-xs"></i>
              Excel出力
            </button>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-auto px-6 py-5 space-y-6">

        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <i className="fas fa-database text-3xl opacity-80"></i>
              <span className="text-4xl font-bold">{stats.total}</span>
            </div>
            <p className="text-blue-100">総スキルシート数</p>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <i className="fas fa-users text-3xl opacity-80"></i>
              <span className="text-4xl font-bold">{stats.totalEngineers}</span>
            </div>
            <p className="text-emerald-100">登録エンジニア数</p>
          </div>

          <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <i className="fas fa-calendar-plus text-3xl opacity-80"></i>
              <span className="text-4xl font-bold">{stats.thisMonth}</span>
            </div>
            <p className="text-amber-100">今月新規登録</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <i className="fas fa-layer-group text-3xl opacity-80"></i>
              <span className="text-4xl font-bold">{Object.keys(groupedByEngineer).length}</span>
            </div>
            <p className="text-purple-100">エンジニアグループ</p>
          </div>
        </div>

        {/* アップロードセクション */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h2 className="text-base font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <i className="fas fa-cloud-upload-alt text-amber-500"></i>
            新しいスキルシートをアップロード
          </h2>

          {/* アップロード進捗 */}
          {isUploading && (
            <div className="mb-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <div className="flex items-center mb-2">
                <i className="fas fa-upload mr-2 text-blue-600"></i>
                <span className="text-blue-700 text-sm font-medium">アップロード中...</span>
              </div>
              <div className="w-full bg-blue-100 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <div className="text-xs text-blue-500 mt-1">{uploadProgress}%</div>
            </div>
          )}

          <SkillSheetUpload onUpload={handleFileUpload} />
        </div>



        {/* スキルシート表示セクション */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex flex-wrap justify-between items-center gap-3 mb-5">
            <h2 className="text-base font-semibold text-slate-700 flex items-center gap-2">
              <i className="fas fa-folder-open text-amber-500"></i>
              スキルシート一覧
              <span className="text-xs font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{skillSheets.length}件</span>
            </h2>
            
            {/* 表示モード切り替え */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex bg-slate-100 rounded-lg p-0.5">
                <button
                  onClick={() => setViewMode("engineer")}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    viewMode === "engineer"
                      ? "bg-white text-amber-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <i className="fas fa-user-friends mr-1"></i>
                  エンジニア別
                </button>
                <button
                  onClick={() => setViewMode("all")}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    viewMode === "all"
                      ? "bg-white text-amber-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <i className="fas fa-list mr-1"></i>
                  全一覧
                </button>
              </div>

              {/* ソート・フィルタ（全一覧モード時のみ表示） */}
              {viewMode === "all" && (
                <>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-2 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-amber-400 focus:border-transparent bg-white"
                  >
                    <option value="date">日付順</option>
                    <option value="name">エンジニア名順</option>
                    <option value="uploader">アップロード者順</option>
                  </select>
                  <select
                    value={filterBy}
                    onChange={(e) => setFilterBy(e.target.value)}
                    className="px-2 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-amber-400 focus:border-transparent bg-white"
                  >
                    <option value="all">全期間</option>
                    <option value="week">1週間以内</option>
                    <option value="month">1ヶ月以内</option>
                    <option value="quarter">3ヶ月以内</option>
                  </select>
                </>
              )}

              {/* 検索ボックス */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="エンジニア名、ファイル名で検索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-8 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-amber-400 focus:border-transparent w-52"
                />
                <i className="fas fa-search absolute left-2.5 top-1/2 transform -translate-y-1/2 text-slate-400 text-xs"></i>
                {searchTerm && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <i className="fas fa-times text-xs"></i>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* エンジニア別表示 */}
          {viewMode === "engineer" && (
            <div className="space-y-3">
              {Object.keys(groupedByEngineer)
                .filter(engineerName =>
                  !searchTerm || engineerName.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .sort()
                .map(engineerName => {
                  const engineerSheets = groupedByEngineer[engineerName];
                  const latestSheet = engineerSheets[0];

                  return (
                    <div key={engineerName} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
                      {/* カードヘッダー */}
                      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-gradient-to-r from-amber-50/40 to-white">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center text-white font-bold shadow-sm">
                            {engineerName.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-800 text-sm">{engineerName}</h3>
                            <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                              <span><i className="fas fa-file-alt mr-1 text-blue-400"></i>{engineerSheets.length}件</span>
                              <span><i className="fas fa-clock mr-1 text-green-400"></i>{new Date(latestSheet.uploaded_at).toLocaleDateString('ja-JP')}</span>
                              <span><i className="fas fa-user mr-1 text-purple-400"></i>{latestSheet.uploader}</span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => openMemoModal(engineerName)}
                          className="px-3 py-1.5 bg-amber-50 text-amber-600 border border-amber-200 rounded-lg text-xs font-semibold hover:bg-amber-100 transition-colors flex items-center gap-1.5 flex-shrink-0"
                        >
                          <i className="fas fa-sticky-note"></i>
                          メモ
                        </button>
                      </div>
                      {/* ファイル一覧 */}
                      <div className="divide-y divide-slate-100">
                        {engineerSheets.map((sheet, index) => (
                          <div key={sheet.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-2 min-w-0">
                              {index === 0 && (
                                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold flex-shrink-0">最新版</span>
                              )}
                              <div className="min-w-0">
                                <div className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                                  <i className={`fas ${
                                    sheet.file_name?.toLowerCase().endsWith('.pdf') ? 'fa-file-pdf text-red-400' :
                                    sheet.file_name?.toLowerCase().endsWith('.xlsx') || sheet.file_name?.toLowerCase().endsWith('.xls') ? 'fa-file-excel text-green-400' :
                                    'fa-file-word text-blue-400'
                                  } text-sm flex-shrink-0`}></i>
                                  <span className="truncate">{sheet.file_name}</span>
                                </div>
                                <div className="text-xs text-slate-400 mt-0.5">
                                  {new Date(sheet.uploaded_at).toLocaleString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} · {sheet.uploader}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center flex-shrink-0 ml-3">
                              {confirmDeleteId === sheet.id ? (
                                <div className="flex items-center gap-1.5 bg-red-50 px-3 py-1.5 rounded-lg border border-red-200">
                                  <span className="text-xs text-red-600 font-medium">削除しますか？</span>
                                  <button onClick={() => handleDelete(sheet.id)} className="text-xs bg-red-500 text-white px-2 py-0.5 rounded font-semibold hover:bg-red-600 transition-colors">はい</button>
                                  <button onClick={() => setConfirmDeleteId(null)} className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded font-semibold hover:bg-slate-300 transition-colors">いいえ</button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setConfirmDeleteId(sheet.id)}
                                  className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                  title="削除"
                                >
                                  <i className="fas fa-trash-alt text-sm"></i>
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
                
              {Object.keys(groupedByEngineer).length === 0 && (
                <div className="text-center py-12">
                  <i className="fas fa-user-slash text-4xl text-stone-300 mb-4"></i>
                  <p className="text-slate-500 mb-2">登録されているエンジニアがいません。</p>
                  <p className="text-sm text-slate-400">スキルシートをアップロードして開始してください。</p>
                </div>
              )}
            </div>
          )}

          {/* 全一覧表示 */}
          {viewMode === "all" && (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-stone-50">
                    <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-slate-700">
                      <i className="fas fa-user mr-2 text-blue-600"></i>エンジニア名
                    </th>
                    <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-slate-700">
                      <i className="fas fa-file mr-2 text-green-600"></i>ファイル名
                    </th>
                    <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-slate-700">
                      <i className="fas fa-user-tie mr-2 text-purple-600"></i>アップロード者
                    </th>
                    <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-slate-700">
                      <i className="fas fa-calendar mr-2 text-amber-600"></i>アップロード日
                    </th>
                    <th className="border border-gray-300 px-4 py-3 text-center font-semibold text-slate-700">
                      <i className="fas fa-cogs mr-2 text-red-600"></i>アクション
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEngineers.map((engineer, index) => (
                    <tr key={engineer.id} className={`hover:bg-amber-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                      <td className="border border-gray-300 px-4 py-3 font-medium text-slate-700">{engineer.engineer_name}</td>
                      <td className="border border-gray-300 px-4 py-3 text-slate-600">
                        <div className="flex items-center gap-2">
                          <i className="fas fa-file-pdf text-red-500" title="PDF"></i>
                          <span className="truncate max-w-xs">{engineer.file_name}</span>
                        </div>
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-slate-600">{engineer.uploader}</td>
                      <td className="border border-gray-300 px-4 py-3 text-slate-600">
                        {new Date(engineer.uploaded_at).toLocaleDateString('ja-JP', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2 flex-wrap">
                          <button
                            onClick={() => openMemoModal(engineer.engineer_name)}
                            className="px-3 py-1 bg-amber-500 text-white rounded-lg text-sm font-semibold hover:bg-amber-600 transition-colors"
                            title="営業メモ"
                          >
                            <i className="fas fa-sticky-note mr-1"></i>
                            メモ
                          </button>
                          {confirmDeleteId === engineer.id ? (
                            <div className="flex items-center gap-1 bg-red-50 px-2 py-1 rounded-lg border border-red-200">
                              <span className="text-xs text-red-600">削除？</span>
                              <button onClick={() => handleDelete(engineer.id)} className="text-xs bg-red-500 text-white px-1.5 py-0.5 rounded hover:bg-red-600 transition-colors">はい</button>
                              <button onClick={() => setConfirmDeleteId(null)} className="text-xs bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded hover:bg-slate-300 transition-colors">いいえ</button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteId(engineer.id)}
                              className="px-3 py-1 bg-red-50 text-red-500 border border-red-200 rounded-lg text-sm font-semibold hover:bg-red-100 transition-colors"
                              title="削除"
                            >
                              <i className="fas fa-trash-alt mr-1"></i>
                              削除
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}



          {/* 空の状態表示 */}
          {filteredEngineers.length === 0 && skillSheets.length > 0 && (
            <div className="text-center py-12">
              <i className="fas fa-search text-4xl text-stone-300 mb-4"></i>
              <p className="text-slate-500 mb-2">検索条件に一致するスキルシートが見つかりません。</p>
              <p className="text-sm text-slate-400 mb-4">キーワードを変更するか、検索をクリアしてください。</p>
              <button 
                onClick={clearSearch}
                className="px-4 py-2 bg-amber-500 text-white rounded-lg font-semibold hover:bg-amber-600 transition-colors"
              >
                <i className="fas fa-refresh mr-2"></i>
                検索をリセット
              </button>
            </div>
          )}
          {skillSheets.length === 0 && (
            <div className="text-center py-12">
              <i className="fas fa-folder-open text-4xl text-stone-300 mb-4"></i>
              <p className="text-slate-500 mb-2">スキルシートはまだ登録されていません。</p>
              <p className="text-sm text-slate-400">スキルシートをアップロードして開始してください。</p>
            </div>
          )}
        </div>

        {/* 営業メモモーダル */}
        {showMemoModal && selectedEngineerForMemo && (
          <EngineerMemo
            engineerName={selectedEngineerForMemo}
            onClose={closeMemoModal}
          />
        )}
      </div>
    </div>
  );
}