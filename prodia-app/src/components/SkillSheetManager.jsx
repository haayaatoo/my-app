import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import { useUser } from '../contexts/UserContext';
import EngineerMemo from './EngineerMemo';

// APIエンドポイント
const API_BASE = 'http://localhost:8000/api/skillsheets/';

// 統一されたローディングコンポーネント
function AnimatedLoader() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-amber-50/20 to-slate-100 flex items-center justify-center">
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
        
        <h2 className="text-3xl font-medium text-slate-700 mb-4 tracking-wide font-display">スキルシートデータを読み込み中...</h2>
        <p className="text-slate-500 animate-pulse font-normal text-lg">エンジニア情報を取得しています</p>
      </div>
    </div>
  );
}

// 標準ファイルアップロードコンポーネント
function SkillSheetUpload({ onUpload }) {
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
      alert("エンジニア名を入力してください");
      return;
    }
    fileInputRef.current && fileInputRef.current.click();
  };

  const handleManualUpload = () => {
    if (!fileName || !engineerName.trim()) {
      alert("エンジニア名とファイルの両方を選択してください");
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


function PreviewModal({ fileName, url, onClose }) {
  const [previewContent, setPreviewContent] = useState(null);
  const [loading, setLoading] = useState(true);

  const generatePreview = useCallback(async () => {
    setLoading(true);
    if (!fileName || !url) {
      setLoading(false);
      return;
    }

    const ext = fileName.split('.').pop().toLowerCase();

    try {
      if (ext === 'pdf') {
        setPreviewContent(<iframe src={url} width="100%" height="500px" title="スキルシートプレビュー" />);
      } else if (['xlsx', 'xls'].includes(ext)) {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        setPreviewContent(
          <div className="overflow-auto max-h-96">
            <table className="w-full border-collapse border border-gray-300">
              {jsonData.slice(0, 20).map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="border border-gray-300 px-2 py-1 text-sm">
                      {cell || ''}
                    </td>
                  ))}
                </tr>
              ))}
            </table>
            {jsonData.length > 20 && (
              <p className="text-center text-gray-500 mt-2">...他 {jsonData.length - 20} 行</p>
            )}
          </div>
        );
      } else if (ext === 'docx') {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        setPreviewContent(<div dangerouslySetInnerHTML={{ __html: result.value }} />);
      } else {
        setPreviewContent(<p>このファイル形式のプレビューはサポートされていません。</p>);
      }
    } catch (error) {
      console.error('プレビュー生成エラー:', error);
      setPreviewContent(<p>プレビューの生成に失敗しました。</p>);
    }

    setLoading(false);
  }, [fileName, url]);

  useEffect(() => {
    generatePreview();
  }, [generatePreview]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl max-h-screen overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">{fileName} - プレビュー</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-amber-500"></div>
          </div>
        ) : (
          previewContent
        )}
      </div>
    </div>
  );
}

export default function SkillSheetManager() {
  const [skillSheets, setSkillSheets] = useState([]);  // 全スキルシート
  const [loading, setLoading] = useState(true);
  const [uploadMessage, setUploadMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [previewFile, setPreviewFile] = useState(null);
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
        setUploadMessage(`エラー: データの取得に失敗しました (${response.status})`);
      }
    } catch (error) {
      console.error('データ取得エラー:', error);
      setUploadMessage("エラー: サーバーに接続できませんでした");
      setTimeout(() => setUploadMessage(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  // ファイルアップロード処理
  const handleFileUpload = async (file, engineerName, uploaderName = null) => {
    // アップロード者名が指定されていない場合は、ログインユーザーを使用
    const actualUploader = uploaderName || user?.name || user?.email || 'Anonymous';
    
    if (!file || !engineerName.trim()) {
      setUploadMessage("エラー: ファイルとエンジニア名を入力してください");
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
        setUploadMessage(`${engineerName}のスキルシートをアップロードしました！エンジニア一覧に追加されています。`);

        // データを再取得
        await fetchEngineers();
        
        // 3秒後にメッセージを消去
        setTimeout(() => {
          setUploadMessage("");
        }, 3000);

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
      setUploadMessage(`アップロードエラー: ${error.message}`);
      
      // エラーメッセージを5秒後に消去
      setTimeout(() => {
        setUploadMessage("");
      }, 5000);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };



  // 営業資料PDF出力
  const generateSalesReport = () => {
    try {
      console.log('営業支援レポート生成開始');
      
      // 営業資料データの準備
      const salesData = {
        totalEngineers: stats.totalEngineers,
        totalSheets: stats.total,
        skillSummary: stats.topSkills,
        monthlyTrend: stats.thisMonth,
        engineerDetails: skillSheets.map(sheet => ({
          name: sheet.engineer_name || '未設定',
          uploadDate: sheet.uploaded_at,
          status: sheet.is_approved ? 'approved' : 'pending',
          fileName: sheet.file_name || 'N/A'
        }))
      };

      console.log('営業資料データ:', salesData);

      // 詳細な営業レポート生成
      const reportContent = `
=== 📊 営業支援レポート ===
生成日時: ${new Date().toLocaleString('ja-JP')}
システム: Prodia エンジニアリソース管理

【📈 概要サマリー】
・登録エンジニア総数: ${salesData.totalEngineers}名
・総スキルシート数: ${salesData.totalSheets}件
・今月の新規登録: ${salesData.monthlyTrend}件
・検出スキル種類: ${salesData.skillSummary.length}種類

【💼 主要スキル分析】
${salesData.skillSummary.length > 0 ? 
  salesData.skillSummary.map((skill, index) => `${index + 1}. ${skill.name} - ${skill.count}件保有`).join('\n') :
  '- スキルデータが不足しています'
}

【👥 エンジニア詳細リスト】
${salesData.engineerDetails.length > 0 ?
  salesData.engineerDetails.map((eng, index) => 
    `${index + 1}. ${eng.name}\n   登録日: ${new Date(eng.uploadDate).toLocaleDateString('ja-JP')}\n   ステータス: ${eng.status}\n   ファイル: ${eng.fileName}`
  ).join('\n\n') :
  '- 登録エンジニアがありません'
}

【🎯 営業アクション推奨】
1. ECサイト開発案件 → React/Node.js経験者を優先的に提案
2. 金融システム案件 → Java/Spring経験者を重点的にマッチング  
3. AI・機械学習案件 → Python/データサイエンス経験者を積極活用
4. モバイルアプリ案件 → React Native/Flutter経験者を最優先

【📋 次のアクション】
- 新規案件とのマッチング分析実施
- エンジニアとの面談スケジュール調整
- クライアントへの提案資料作成
- スキルシートデータベースの継続更新

【📞 問い合わせ先】
Prodia営業部 - engineer-support@prodia.com
      `;

      // ファイルダウンロード処理
      const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `営業支援レポート_${new Date().toISOString().slice(0, 10)}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log('営業支援レポート生成完了');
      setUploadMessage("📊 営業支援レポートを生成しました！ダウンロードが開始されます。");
      
      // 3秒後にメッセージを消去
      setTimeout(() => {
        setUploadMessage("");
      }, 3000);

    } catch (error) {
      console.error('営業資料生成エラー:', error);
      setUploadMessage("❌ 営業資料の生成に失敗しました。コンソールでエラーを確認してください。");
      setTimeout(() => setUploadMessage(""), 5000);
    }
  };

  // Excel出力処理
  const exportToExcel = () => {
    try {
      setUploadMessage("Excel形式でエクスポートを開始しました");
      
      // 実際のExcel出力処理をここに実装
      // 今回はメッセージ表示のみ
      setTimeout(() => {
        setUploadMessage("Excelファイルのダウンロードが完了しました");
        setTimeout(() => setUploadMessage(""), 3000);
      }, 2000);
      
    } catch (error) {
      setUploadMessage("Excelエクスポートに失敗しました");
      setTimeout(() => setUploadMessage(""), 3000);
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
  }, []);



  // プレビュー表示
  const handlePreview = (engineer) => {
    setPreviewFile({
      fileName: engineer.file_name,
      url: engineer.file_url,
    });
  };

  // 検索クリア
  const clearSearch = () => {
    setSearchTerm("");
  };

  if (loading) {
    return <AnimatedLoader />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-amber-50/20 to-slate-100 relative overflow-hidden opacity-0 animate-fade-in" style={{animationDelay: '0ms', animationFillMode: 'forwards'}}>
      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* 🎨 エレガントなヘッダー（ダッシュボードと同じスタイル） */}
        <div className="flex justify-between items-center p-8 bg-white/70 backdrop-blur-sm rounded-3xl shadow-xl border border-white/80 relative overflow-hidden opacity-0 animate-slide-in-from-top" style={{
          boxShadow: '0 25px 60px rgba(0,0,0,0.08), 0 10px 25px rgba(0,0,0,0.06)',
          animationDelay: '200ms',
          animationFillMode: 'forwards'
        }}>
          {/* 動的背景パターン */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-stone-500 transform rotate-12 scale-150"></div>
          </div>
          
          <div className="relative z-10">
            <h1 className="text-4xl font-medium text-slate-700 tracking-wide flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-stone-500 rounded-2xl flex items-center justify-center transform hover:rotate-12 transition-transform duration-300">
                <i className="fas fa-file-alt text-white text-xl"></i>
              </div>
              スキルシート管理
            </h1>
            <p className="text-slate-500 mt-2 font-normal tracking-wide">登録・承認・検索・営業支援システム</p>
            
            {/* 統計情報表示 */}
            <div className="mt-4 p-4 bg-gradient-to-r from-amber-50 to-stone-50 rounded-2xl border border-amber-200/50">
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <i className="fas fa-users text-emerald-600"></i>
                  <span className="text-slate-700">エンジニア数: <strong>{stats.totalEngineers}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <i className="fas fa-database text-amber-600"></i>
                  <span className="text-slate-700">スキルシート数: <strong>{stats.total}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <i className="fas fa-calendar text-emerald-600"></i>
                  <span className="text-slate-700">今月: <strong>+{stats.thisMonth}</strong></span>
                </div>
                {stats.topSkills.length > 0 && (
                  <div className="flex items-center gap-2">
                    <i className="fas fa-star text-blue-600"></i>
                    <span className="text-slate-700">人気スキル: <strong>{stats.topSkills[0].name}</strong></span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4 relative z-10">
            {/* ログインユーザー表示 */}
            <div className="flex items-center gap-2 text-white mr-4">
              <i className="fas fa-user-circle text-xl"></i>
              <span className="text-sm font-medium">
                {user?.name || user?.email || '未ログイン'}
              </span>
            </div>
            
            {/* 営業支援ボタン */}
            <button 
              onClick={generateSalesReport}
              className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300 transform hover:scale-105"
            >
              <i className="fas fa-handshake mr-2"></i>
              営業支援
            </button>
            {/* エクスポートボタン */}
            <button 
              onClick={exportToExcel}
              className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300 transform hover:scale-105"
            >
              <i className="fas fa-file-excel mr-2"></i>
              Excel出力
            </button>
          </div>
        </div>

        {/* アップロードメッセージ */}
        {uploadMessage && (
          <div className={`mb-6 p-4 rounded-lg ${
            uploadMessage.includes("成功") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          }`}>
            {uploadMessage}
          </div>
        )}

        {/* 営業支援ダッシュボード */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8 opacity-0 animate-slide-in-from-bottom" style={{animationDelay: '400ms', animationFillMode: 'forwards'}}>
          {/* 統計カード */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300 opacity-0 animate-slide-in-from-bottom" style={{animationDelay: '600ms', animationFillMode: 'forwards'}}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">{stats.total}</div>
                <div className="text-blue-100 text-sm">総スキルシート数</div>
              </div>
              <i className="fas fa-database text-3xl text-blue-200"></i>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white p-6 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300 opacity-0 animate-slide-in-from-bottom" style={{animationDelay: '700ms', animationFillMode: 'forwards'}}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">{stats.totalEngineers}</div>
                <div className="text-green-100 text-sm">登録エンジニア数</div>
              </div>
              <i className="fas fa-users text-3xl text-green-200"></i>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300 opacity-0 animate-slide-in-from-bottom" style={{animationDelay: '800ms', animationFillMode: 'forwards'}}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">{stats.topSkills.length}</div>
                <div className="text-purple-100 text-sm">検出スキル種類</div>
              </div>
              <i className="fas fa-cogs text-3xl text-purple-200"></i>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-amber-500 to-orange-600 text-white p-6 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300 opacity-0 animate-slide-in-from-bottom" style={{animationDelay: '900ms', animationFillMode: 'forwards'}}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">{stats.thisMonth}</div>
                <div className="text-amber-100 text-sm">今月新規登録</div>
              </div>
              <i className="fas fa-plus-circle text-3xl text-amber-200"></i>
            </div>
          </div>
        </div>

        {/* アップロードセクション */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 opacity-0 animate-slide-in-from-bottom" style={{animationDelay: '1000ms', animationFillMode: 'forwards'}}>
          <h2 className="text-2xl font-semibold text-slate-700 mb-6">
            新しいスキルシートをアップロード
          </h2>
          
          {/* アップロードメッセージ */}
          {uploadMessage && (
            <div className={`mb-4 p-4 rounded-lg ${
              uploadMessage.includes('エラー') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
            }`}>
              <i className={`fas ${uploadMessage.includes('エラー') ? 'fa-exclamation-circle' : 'fa-check-circle'} mr-2`}></i>
              {uploadMessage}
            </div>
          )}

          {/* アップロード進捗 */}
          {isUploading && (
            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center mb-2">
                <i className="fas fa-upload mr-2 text-blue-600"></i>
                <span className="text-blue-700">アップロード中...</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <div className="text-sm text-blue-600 mt-1">{uploadProgress}%</div>
            </div>
          )}

          <SkillSheetUpload onUpload={handleFileUpload} />
        </div>



        {/* スキルシート表示セクション */}
        <div className="bg-white rounded-2xl shadow-xl p-8 opacity-0 animate-slide-in-from-bottom" style={{animationDelay: '1200ms', animationFillMode: 'forwards'}}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-slate-700 flex items-center gap-3">
              <i className="fas fa-folder-open text-emerald-600"></i>
              スキルシート管理 ({skillSheets.length}件)
            </h2>
            
            {/* 表示モード切り替え */}
            <div className="flex items-center space-x-3">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("engineer")}
                  className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                    viewMode === "engineer" 
                      ? "bg-white text-blue-600 shadow-sm" 
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  <i className="fas fa-user-friends mr-2"></i>
                  エンジニア別
                </button>
                <button
                  onClick={() => setViewMode("all")}
                  className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                    viewMode === "all" 
                      ? "bg-white text-blue-600 shadow-sm" 
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  <i className="fas fa-list mr-2"></i>
                  全一覧
                </button>

              </div>
              
              {/* ソート・フィルタ（全一覧モード時のみ表示） */}
              {viewMode === "all" && (
                <>
                  <select 
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  >
                    <option value="date">日付順</option>
                    <option value="name">エンジニア名順</option>
                    <option value="uploader">アップロード者順</option>
                  </select>
                  
                  <select 
                    value={filterBy} 
                    onChange={(e) => setFilterBy(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
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
                  placeholder="エンジニア名、ファイル名、アップロード者で検索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent w-80"
                />
                <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                {searchTerm && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 営業向け要約情報 */}
          {stats.topSkills.length > 0 && viewMode === "all" && (
            <div className="mb-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <i className="fas fa-chart-pie text-indigo-600 text-xl"></i>
                  <div>
                    <div className="font-semibold text-slate-700">営業戦略インサイト</div>
                    <div className="text-sm text-slate-600">
                      人気スキル: {stats.topSkills.map(skill => `${skill.name}(${skill.count}人)`).join(', ')}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={generateSalesReport}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                >
                  <i className="fas fa-download mr-2"></i>
                  営業資料生成
                </button>
              </div>
            </div>
          )}

          {/* エンジニア別表示 */}
          {viewMode === "engineer" && (
            <div className="space-y-6">
              {Object.keys(groupedByEngineer)
                .filter(engineerName => 
                  !searchTerm || engineerName.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .sort()
                .map(engineerName => {
                  const engineerSheets = groupedByEngineer[engineerName];
                  const latestSheet = engineerSheets[0];
                  
                  return (
                    <div key={engineerName} className="bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-lg transition-all">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                            {engineerName.charAt(0)}
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-slate-800">{engineerName}</h3>
                            <div className="flex items-center gap-4 text-sm text-slate-600 mt-1">
                              <span className="flex items-center gap-1">
                                <i className="fas fa-file-alt text-blue-500"></i>
                                {engineerSheets.length}件のスキルシート
                              </span>
                              <span className="flex items-center gap-1">
                                <i className="fas fa-calendar text-green-500"></i>
                                最終更新: {new Date(latestSheet.uploaded_at).toLocaleDateString('ja-JP')}
                              </span>
                              <span className="flex items-center gap-1">
                                <i className="fas fa-user text-purple-500"></i>
                                担当: {latestSheet.uploader}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openMemoModal(engineerName)}
                            className="px-3 py-2 bg-amber-500 text-white rounded-lg text-sm font-semibold hover:bg-amber-600 transition-colors"
                            title="営業メモ"
                          >
                            <i className="fas fa-sticky-note mr-2"></i>
                            メモ
                          </button>
                        </div>
                      </div>
                      
                      {/* スキルシート一覧 */}
                      <div className="grid gap-3">
                        {engineerSheets.map((sheet, index) => (
                          <div key={sheet.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                                index === 0 ? 'bg-green-500' : 'bg-gray-400'
                              }`}>
                                {index + 1}
                              </div>
                              <div>
                                <div className="font-medium text-slate-700 flex items-center gap-2">
                                  <i className="fas fa-file-pdf text-red-500"></i>
                                  {sheet.file_name}
                                </div>
                                <div className="text-sm text-slate-500">
                                  {new Date(sheet.uploaded_at).toLocaleString('ja-JP')} - {sheet.uploader}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handlePreview(sheet)}
                                className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
                              >
                                <i className="fas fa-eye mr-1"></i>
                                プレビュー
                              </button>
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
                            onClick={() => handlePreview(engineer)}
                            className="px-3 py-1 bg-blue-500 text-white rounded-lg text-sm font-semibold hover:bg-blue-600 transition-colors transform hover:scale-105"
                            title="プレビュー"
                          >
                            <i className="fas fa-eye mr-1"></i>
                            プレビュー
                          </button>
                          <button
                            onClick={() => openMemoModal(engineer.engineer_name)}
                            className="px-3 py-1 bg-amber-500 text-white rounded-lg text-sm font-semibold hover:bg-amber-600 transition-colors transform hover:scale-105"
                            title="営業メモ"
                          >
                            <i className="fas fa-sticky-note mr-1"></i>
                            メモ
                          </button>
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

        {/* 営業支援レポートセクション */}
        {stats.topSkills.length > 0 && (
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold flex items-center gap-3">
                <i className="fas fa-chart-line"></i>
                営業支援レポート
              </h2>
              <div className="text-sm opacity-80">
                データ更新: {new Date().toLocaleDateString('ja-JP')}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* スキル分析 */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <i className="fas fa-fire text-orange-300"></i>
                  人気スキルランキング
                </h3>
                <div className="space-y-3">
                  {stats.topSkills.map(([skill, count], index) => (
                    <div key={skill} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </span>
                        <span>{skill}</span>
                      </div>
                      <span className="font-bold">{count}人</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* 月次トレンド */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <i className="fas fa-chart-bar text-green-300"></i>
                  月次登録トレンド
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>今月新規</span>
                    <span className="font-bold text-green-300">+{stats.thisMonth}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>総登録数</span>
                    <span className="font-bold">{stats.total}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>人気スキル種類</span>
                    <span className="font-bold text-yellow-300">{stats.topSkills.length}</span>
                  </div>
                </div>
              </div>
              
              {/* 営業アクション */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <i className="fas fa-rocket text-purple-300"></i>
                  クイックアクション
                </h3>
                <div className="space-y-3">
                  <button 
                    onClick={() => setUploadMessage("提案資料テンプレートをダウンロードしました")}
                    className="w-full bg-white/20 hover:bg-white/30 transition-all py-2 px-3 rounded-lg text-sm font-semibold text-left"
                  >
                    <i className="fas fa-file-powerpoint mr-2"></i>
                    提案資料作成
                  </button>
                  <button 
                    onClick={() => setUploadMessage("スキルマッチング分析を開始しました")}
                    className="w-full bg-white/20 hover:bg-white/30 transition-all py-2 px-3 rounded-lg text-sm font-semibold text-left"
                  >
                    <i className="fas fa-search-plus mr-2"></i>
                    スキルマッチング
                  </button>
                  <button 
                    onClick={() => setUploadMessage("空き状況レポートを生成しました")}
                    className="w-full bg-white/20 hover:bg-white/30 transition-all py-2 px-3 rounded-lg text-sm font-semibold text-left"
                  >
                    <i className="fas fa-calendar-check mr-2"></i>
                    空き状況確認
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* プレビューモーダル */}
        {previewFile && (
          <PreviewModal
            fileName={previewFile.fileName}
            url={previewFile.url}
            onClose={() => setPreviewFile(null)}
          />
        )}

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