import React, { useState, useRef } from 'react';

const CSVImporter = ({ onImport, onClose }) => {
  const [file, setFile] = useState(null);
  const [csvData, setCsvData] = useState([]);
  const [errors, setErrors] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const fileInputRef = useRef();

  // CSVサンプルテンプレートのダウンロード
  const downloadTemplate = () => {
    const template = `name,email,position,project_name,planner,skills,engineer_status,phase
田中太郎,tanaka@example.com,シニアエンジニア,ECサイト開発,佐藤プランナー,"React,Node.js,AWS",アサイン済,"設計,開発,テスト"
山田花子,yamada@example.com,リードエンジニア,AIシステム構築,鈴木プランナー,"Python,TensorFlow,Docker",稼働予定,"要件定義,設計"
鈴木次郎,suzuki@example.com,フロントエンドエンジニア,モバイルアプリ開発,田中プランナー,"React Native,TypeScript",未アサイン,"開発,テスト"
佐藤美咲,sato@example.com,バックエンドエンジニア,金融システム改修,山田プランナー,"Java,Spring Boot,PostgreSQL",アサイン済,"設計,開発"
高橋健一,takahashi@example.com,データサイエンティスト,ビッグデータ分析,佐藤プランナー,"Python,Pandas,Machine Learning",稼働予定,"分析,モデル構築"`;

    const blob = new Blob([template], { type: 'text/csv;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'engineer_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  // CSVファイルの読み込み
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        setErrors(['CSVファイルを選択してください']);
        return;
      }
      setFile(selectedFile);
      parseCSV(selectedFile);
    }
  };

  // CSV解析（より堅牢な解析）
  const parseCSV = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const csv = e.target.result;
      const lines = csv.split('\\n').filter(line => line.trim() !== ''); // 空行を除去
      
      if (lines.length < 2) {
        setErrors(['CSVファイルにデータが含まれていません']);
        return;
      }

      // ヘッダー行の解析（より堅牢に）
      const headerLine = lines[0];
      const headers = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < headerLine.length; i++) {
        const char = headerLine[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          headers.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      headers.push(current.trim()); // 最後のヘッダー
      
      const requiredHeaders = ['name', 'email', 'project_name', 'planner', 'skills', 'engineer_status', 'phase'];
      const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
      
      if (missingHeaders.length > 0) {
        setErrors([`必須項目が不足しています: ${missingHeaders.join(', ')}`]);
        return;
      }

      const data = [];
      const validationErrors = [];

      // データ行の解析
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line === '') continue;
        
        // CSV行の解析（引用符内のカンマを考慮）
        const values = [];
        let current = '';
        let inQuotes = false;
        
        for (let j = 0; j < line.length; j++) {
          const char = line[j];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            values.push(current.trim().replace(/^"(.*)"$/, '$1'));
            current = '';
          } else {
            current += char;
          }
        }
        values.push(current.trim().replace(/^"(.*)"$/, '$1')); // 最後の値

        // 値が不足している場合は空文字で埋める
        while (values.length < headers.length) {
          values.push('');
        }

        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });

        // バリデーション
        if (!row.name) {
          validationErrors.push(`行 ${i + 1}: 名前は必須です`);
        }
        if (!row.email || !row.email.includes('@')) {
          validationErrors.push(`行 ${i + 1}: 有効なメールアドレスが必要です`);
        }
        if (!row.project_name) {
          validationErrors.push(`行 ${i + 1}: プロジェクト名は必須です`);
        }
        if (!row.planner) {
          validationErrors.push(`行 ${i + 1}: プランナーは必須です`);
        }

        // スキルとフェーズをJSON配列に変換（カンマまたはセミコロン区切り対応）
        if (row.skills) {
          // 引用符で囲まれている場合は内部のカンマで分割、そうでなければセミコロンで分割
          const skillsStr = row.skills.trim();
          if (skillsStr.startsWith('"') && skillsStr.endsWith('"')) {
            // 引用符内のスキルはカンマ区切り
            row.skills = skillsStr.slice(1, -1).split(',').map(s => s.trim()).filter(s => s);
          } else {
            // セミコロン区切り
            row.skills = skillsStr.split(';').map(s => s.trim()).filter(s => s);
          }
        } else {
          row.skills = [];
        }
        
        if (row.phase) {
          // 引用符で囲まれている場合は内部のカンマで分割、そうでなければセミコロンで分割
          const phaseStr = row.phase.trim();
          if (phaseStr.startsWith('"') && phaseStr.endsWith('"')) {
            // 引用符内のフェーズはカンマ区切り
            row.phase = phaseStr.slice(1, -1).split(',').map(p => p.trim()).filter(p => p);
          } else {
            // セミコロン区切り
            row.phase = phaseStr.split(';').map(p => p.trim()).filter(p => p);
          }
        } else {
          row.phase = [];
        }

        data.push({ ...row, rowNumber: i + 1 });
      }

      setErrors(validationErrors);
      setCsvData(data);
    };

    reader.readAsText(file, 'UTF-8');
  };

  // インポート実行
  const handleImport = async () => {
    if (errors.length > 0) {
      alert('エラーを修正してからインポートしてください');
      return;
    }

    setIsProcessing(true);
    setImportProgress(0);

    try {
      // プログレスバーのシミュレーション
      const progressInterval = setInterval(() => {
        setImportProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch('http://localhost:8000/api/engineers/bulk-create/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ engineers: csvData }),
      });

      clearInterval(progressInterval);
      setImportProgress(100);

      if (response.ok) {
        const result = await response.json();
        setTimeout(() => {
          onImport(result);
          onClose();
        }, 500);
      } else {
        const errorData = await response.json();
        setErrors([errorData.detail || 'インポートに失敗しました']);
      }
    } catch (error) {
      setErrors([`ネットワークエラー: ${error.message}`]);
    } finally {
      setIsProcessing(false);
      setImportProgress(0);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-6xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* ヘッダー */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-bold text-slate-700 flex items-center gap-3">
              <i className="fas fa-file-csv text-green-600"></i>
              CSVインポート
            </h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>
          <p className="text-slate-600 mt-2">
            CSVファイルから複数のエンジニアを一括登録できます
          </p>
        </div>

        <div className="p-6">
          {/* テンプレートダウンロード */}
          <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-blue-800 mb-1">
                  <i className="fas fa-download mr-2"></i>
                  テンプレートをダウンロード
                </h4>
                <p className="text-sm text-blue-600 mb-2">
                  適切なフォーマットでCSVファイルを作成するためのテンプレートです
                </p>
                <div className="text-xs text-blue-500 bg-blue-100 px-2 py-1 rounded">
                  <i className="fas fa-lightbulb text-amber-500 mr-2"></i>skills と phase は引用符で囲み、カンマ区切りで入力してください<br/>
                  例: "React,Node.js,AWS" / "設計,開発,テスト"
                </div>
              </div>
              <button
                onClick={downloadTemplate}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <i className="fas fa-download mr-2"></i>
                テンプレート
              </button>
            </div>
          </div>

          {/* ファイル選択 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CSVファイルを選択
            </label>
            <div className="flex items-center gap-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <i className="fas fa-folder-open mr-2"></i>
                ファイルを選択
              </button>
              {file && (
                <span className="text-sm text-gray-600">
                  選択済み: {file.name}
                </span>
              )}
            </div>
          </div>

          {/* エラー表示 */}
          {errors.length > 0 && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <h4 className="font-semibold text-red-800 mb-2">
                <i className="fas fa-exclamation-triangle mr-2"></i>
                エラーが発生しました
              </h4>
              <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* インポート進捗 */}
          {isProcessing && (
            <div className="mb-6 p-4 bg-blue-50 rounded-xl">
              <div className="flex items-center mb-2">
                <i className="fas fa-spinner fa-spin mr-2 text-blue-600"></i>
                <span className="text-blue-700">インポート中...</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${importProgress}%` }}
                ></div>
              </div>
              <div className="text-sm text-blue-600 mt-1">{importProgress}%</div>
            </div>
          )}

          {/* データプレビュー */}
          {csvData.length > 0 && errors.length === 0 && (
            <div className="mb-6">
              <h4 className="font-semibold text-gray-800 mb-3">
                <i className="fas fa-eye mr-2"></i>
                データプレビュー ({csvData.length}件)
              </h4>
              <div className="overflow-x-auto bg-gray-50 rounded-xl p-4 max-h-64">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-300">
                      <th className="text-left p-2 font-semibold">名前</th>
                      <th className="text-left p-2 font-semibold">メール</th>
                      <th className="text-left p-2 font-semibold">役職</th>
                      <th className="text-left p-2 font-semibold">プロジェクト</th>
                      <th className="text-left p-2 font-semibold">プランナー</th>
                      <th className="text-left p-2 font-semibold">ステータス</th>
                    </tr>
                  </thead>
                  <tbody>
                    {csvData.slice(0, 5).map((row, index) => (
                      <tr key={index} className="border-b border-gray-200">
                        <td className="p-2">{row.name}</td>
                        <td className="p-2">{row.email}</td>
                        <td className="p-2">{row.position || '-'}</td>
                        <td className="p-2">{row.project_name}</td>
                        <td className="p-2">{row.planner}</td>
                        <td className="p-2">{row.engineer_status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {csvData.length > 5 && (
                  <p className="text-center text-gray-500 mt-2">
                    ...他 {csvData.length - 5} 件
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="border-t border-gray-200 p-6 bg-gray-50 rounded-b-2xl">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              <i className="fas fa-info-circle mr-2"></i>
              重複するメールアドレスは自動的にスキップされます
            </div>
            <div className="flex gap-3">
              <button 
                onClick={onClose}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                キャンセル
              </button>
              <button 
                onClick={handleImport}
                disabled={csvData.length === 0 || errors.length > 0 || isProcessing}
                className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                  csvData.length === 0 || errors.length > 0 || isProcessing
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                <i className="fas fa-upload mr-2"></i>
                {isProcessing ? 'インポート中...' : `${csvData.length}件をインポート`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CSVImporter;