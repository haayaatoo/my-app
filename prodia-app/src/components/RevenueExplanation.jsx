import React from 'react';

const RevenueExplanation = () => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-blue-500">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800">🧮 売上予測の計算方法</h3>
        <i className="fas fa-info-circle text-blue-500 text-xl"></i>
      </div>
      
      <div className="space-y-4">
        <div>
          <h4 className="font-semibold text-gray-700 mb-2">📊 計算ロジック</h4>
          <div className="bg-gray-50 p-3 rounded text-sm">
            <div className="font-mono">
              最終売上 = Σ(スキル単価 × 経験係数) × 稼働率(85%)
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold text-gray-700 mb-2">💎 スキル別単価 (万円/月)</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-red-600">AWS・Kubernetes:</span>
                <span className="font-bold">110-120万</span>
              </div>
              <div className="flex justify-between">
                <span className="text-orange-600">React・TypeScript:</span>
                <span className="font-bold">105-115万</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-600">Python・Django:</span>
                <span className="font-bold">95-100万</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">HTML・CSS:</span>
                <span className="font-bold">60-65万</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-700 mb-2">🎯 経験レベル係数</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>要件定義:</span>
                <span className="font-bold text-green-600">+30%</span>
              </div>
              <div className="flex justify-between">
                <span>基本設計:</span>
                <span className="font-bold text-blue-600">+20%</span>
              </div>
              <div className="flex justify-between">
                <span>詳細設計:</span>
                <span className="font-bold text-blue-600">+10%</span>
              </div>
              <div className="flex justify-between">
                <span>製造:</span>
                <span className="font-bold">±0%</span>
              </div>
              <div className="flex justify-between">
                <span>テスト:</span>
                <span className="font-bold text-yellow-600">-10%</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-blue-50 p-3 rounded">
          <div className="text-sm text-blue-800">
            <i className="fas fa-lightbulb mr-2"></i>
            <strong>実際の市場データに基づく予測:</strong> 
            フリーランス・SES市場の最新単価情報を反映した戦略的売上予測システムです。
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevenueExplanation;
