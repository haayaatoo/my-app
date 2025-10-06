import React, { useEffect, useState } from "react";
import { useUser } from "../contexts/UserContext";

// 🎉 面白い仕掛け：動的なメッセージシステム
const EXECUTIVE_MESSAGES = [
  { text: "今日も素晴らしいチームですね！", icon: "fas fa-star", color: "text-amber-600" },
  { text: "エンジニアの生産性が向上中です", icon: "fas fa-chart-line", color: "text-emerald-600" },
  { text: "新しい才能が加わりました", icon: "fas fa-rocket", color: "text-blue-600" },
  { text: "プロジェクト進行が順調です", icon: "fas fa-trophy", color: "text-purple-600" },
  { text: "技術スタックが多様化しています", icon: "fas fa-code", color: "text-indigo-600" }
];

// 🎯 面白い仕掛け：スキルレーダーチャート風の視覚化
const SKILL_CATEGORIES = [
  { name: "フロントエンド", skills: ["React", "Vue.js", "Angular"], color: "bg-blue-500" },
  { name: "バックエンド", skills: ["Python", "Node.js", "Django"], color: "bg-green-500" },
  { name: "データベース", skills: ["PostgreSQL", "MongoDB", "MySQL"], color: "bg-purple-500" },
  { name: "インフラ", skills: ["AWS", "Docker", "Kubernetes"], color: "bg-orange-500" },
  { name: "AI/ML", skills: ["TensorFlow", "PyTorch", "Scikit-learn"], color: "bg-pink-500" }
];

// 高級感のあるアニメーションカウンター（モダンラグジュアリー）
function AnimatedCounter({ end, label, prefix = "", suffix = "", color = "blue", icon }) {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    setIsVisible(true);
    let start = 0;
    const duration = 2000;
    const stepTime = Math.max(Math.floor(duration / end), 30);
    const timer = setInterval(() => {
      start += Math.ceil(end / (duration / stepTime));
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, stepTime);
    return () => clearInterval(timer);
  }, [end]);
  
  const colorClasses = {
    blue: "bg-gradient-to-br from-slate-50 to-blue-50 text-slate-700 border-blue-100/50 shadow-blue-100/50",
    green: "bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-700 border-emerald-100/50 shadow-emerald-100/50",
    red: "bg-gradient-to-br from-rose-50 to-pink-50 text-rose-700 border-rose-100/50 shadow-rose-100/50",
    purple: "bg-gradient-to-br from-violet-50 to-purple-50 text-violet-700 border-violet-100/50 shadow-violet-100/50",
    yellow: "bg-gradient-to-br from-amber-50 to-orange-50 text-amber-700 border-amber-100/50 shadow-amber-100/50"
  };

  return (
    <div className={`
      relative overflow-hidden p-8 rounded-3xl shadow-xl border border-white/60 text-center 
      transform transition-all duration-700 ease-out hover:scale-105 hover:-translate-y-2
      backdrop-blur-sm bg-white/40
      ${colorClasses[color]} ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}
    `} style={{
      boxShadow: '0 20px 60px rgba(0,0,0,0.08), 0 8px 25px rgba(0,0,0,0.06)'
    }}>
      {/* 上品な装飾ライン */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-transparent via-amber-300 to-transparent rounded-full"></div>
      
      {/* アイコン */}
      <div className="text-4xl mb-4 transform hover:scale-110 transition-transform duration-300 text-amber-600">
        <i className={icon}></i>
      </div>
      
      {/* カウンター */}
      <div className="text-4xl font-light mb-2 tracking-tight">
        <span className="inline-block transform hover:scale-110 transition-transform duration-200 font-extralight">
          {prefix}{count.toLocaleString()}{suffix}
        </span>
      </div>
      
      {/* ラベル */}
      <div className="text-sm font-medium text-slate-600 uppercase tracking-widest">
        {label}
      </div>
      
      {/* 底部の装飾ライン */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-gradient-to-r from-transparent via-amber-300 to-transparent rounded-full"></div>
    </div>
  );
}

// 売上予測カード（高度な計算ロジック）
function RevenueCard({ engineers }) {
  const assignedEngineers = engineers.filter(e => e.engineer_status === 'アサイン済');
  
  // スキル別単価テーブル（実際の市場価格に基づく）
  const skillRates = {
    // 高単価スキル
    'AWS': 120, 'React': 110, 'TypeScript': 105, 'Next.js': 115,
    'Python': 100, 'Django': 95, 'FastAPI': 105,
    
    // 中単価スキル  
    'Vue.js': 90, 'Node.js': 85, 'PHP': 75, 'Laravel': 80,
    'Java': 85, 'Spring Boot': 90, 'C#': 85, '.NET': 85,
    
    // 標準単価スキル
    'HTML': 60, 'CSS': 60, 'JavaScript': 75, 'jQuery': 65,
    'MySQL': 70, 'PostgreSQL': 75, 'MongoDB': 80,
    
    // 特殊スキル
    'Docker': 95, 'Kubernetes': 110, 'GraphQL': 100,
    'Firebase': 85, 'Vercel': 80, 'Heroku': 75
  };
  
  // 経験レベル係数
  const experienceMultiplier = {
    '要件定義': 1.3,
    '基本設計': 1.2,
    '詳細設計': 1.1,
    '製造': 1.0,
    'テスト': 0.9,
    '運用・保守': 0.85
  };
  
  // 各エンジニアの予測売上を計算
  const detailedRevenue = assignedEngineers.map(engineer => {
    // 基本単価（最高スキルを基準）
    const skills = Array.isArray(engineer.skills) ? engineer.skills : [];
    const skillRatesList = skills.map(skill => skillRates[skill] || 70);
    const maxSkillRate = skillRatesList.length > 0 ? Math.max(...skillRatesList) : 70;
    
    // 経験レベル補正
    const phases = Array.isArray(engineer.phase) ? engineer.phase : [];
    const experienceBonuses = phases.map(phase => experienceMultiplier[phase] || 1.0);
    const experienceBonus = experienceBonuses.length > 0 ? Math.max(...experienceBonuses) : 1.0;
    
    // 最終単価計算（万円/月）
    const finalRate = maxSkillRate * experienceBonus;
    
    return {
      name: engineer.name,
      baseRate: maxSkillRate,
      experienceBonus: experienceBonus,
      finalRate: Math.round(finalRate),
      topSkill: skills.find(skill => skillRates[skill] === maxSkillRate) || '不明',
      topPhase: phases.find(phase => experienceMultiplier[phase] === experienceBonus) || '不明'
    };
  });
  
  // 総売上計算（エラーハンドリング追加）
  const totalRevenue = detailedRevenue.reduce((total, engineer) => {
    const rate = isNaN(engineer.finalRate) ? 0 : engineer.finalRate;
    return total + rate;
  }, 0);
  
  const monthlyRevenue = totalRevenue * 10000; // 万円を円に変換
  const quarterlyForecast = monthlyRevenue * 3;
  const yearlyForecast = monthlyRevenue * 12;
  
  // 稼働率を考慮（実際は85%程度）
  const realMonthlyRevenue = monthlyRevenue * 0.85;
  const realQuarterlyForecast = quarterlyForecast * 0.85;
  const realYearlyForecast = yearlyForecast * 0.85;
  
  // 安全な表示用関数
  const safeFormatMillion = (value) => {
    if (!isFinite(value) || isNaN(value)) return '0.0';
    return (value / 1000000).toFixed(1);
  };
  
  const safeFormatMillionInt = (value) => {
    if (!isFinite(value) || isNaN(value)) return '0';
    return (value / 1000000).toFixed(0);
  };
  
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-white via-stone-50 to-amber-50/30 p-8 rounded-3xl shadow-2xl border border-white/80 transform hover:scale-105 transition-all duration-700 backdrop-blur-sm" 
         style={{
           boxShadow: '0 25px 70px rgba(0,0,0,0.1), 0 10px 30px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.8)'
         }}>
      
      {/* 上品な装飾要素 */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-300"></div>
      <div className="absolute top-4 right-4 w-3 h-3 bg-amber-200/50 rounded-full animate-pulse"></div>
      <div className="absolute bottom-4 left-4 w-2 h-2 bg-stone-200/60 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-2xl font-light text-slate-700 tracking-wide flex items-center">
            <span className="mr-4 text-3xl text-amber-600">💰</span>
            売上予測（AI分析）
          </h3>
          <div className="text-3xl transform hover:scale-110 transition-transform duration-300 text-amber-600/70">
            <i className="fas fa-chart-line"></i>
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="transform hover:scale-105 transition-transform duration-300 p-6 bg-white/60 rounded-2xl backdrop-blur-sm border border-white/70">
            <div className="text-5xl font-ultralight mb-3 tracking-tight text-slate-700">
              <span className="inline-block hover:text-amber-600 transition-colors duration-300">
                ¥{safeFormatMillion(realMonthlyRevenue)}M
              </span>
            </div>
            <div className="text-sm font-medium text-slate-600 uppercase tracking-widest mb-1">今月売上予測 (稼働率85%考慮)</div>
            <div className="text-xs text-slate-500 mt-2">理論値: ¥{safeFormatMillion(monthlyRevenue)}M</div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gradient-to-br from-white/70 to-emerald-50/50 rounded-2xl backdrop-blur-sm border border-white/60 hover:scale-105 transition-transform duration-300">
              <div className="text-2xl font-light mb-2 text-slate-700">¥{safeFormatMillion(realQuarterlyForecast)}M</div>
              <div className="text-xs font-medium text-slate-600 uppercase tracking-widest">四半期予測</div>
            </div>
            
            <div className="p-4 bg-gradient-to-br from-white/70 to-violet-50/50 rounded-2xl backdrop-blur-sm border border-white/60 hover:scale-105 transition-transform duration-300">
              <div className="text-2xl font-light mb-2 text-slate-700">¥{safeFormatMillionInt(realYearlyForecast)}M</div>
              <div className="text-xs font-medium text-slate-600 uppercase tracking-widest">年間予測</div>
            </div>
          </div>
        </div>
        
        {/* 詳細分析 */}
        <div className="mt-6 p-6 bg-white/40 rounded-2xl backdrop-blur-sm border border-white/70">
          <div className="text-sm font-medium text-slate-600 mb-4 uppercase tracking-widest">売上内訳 (TOP3)</div>
          <div className="space-y-3">
            {detailedRevenue
              .sort((a, b) => b.finalRate - a.finalRate)
              .slice(0, 3)
              .map((engineer, index) => (
                <div key={engineer.name} className="flex justify-between items-center p-3 bg-white/60 rounded-xl hover:bg-white/80 transition-colors duration-200 border border-white/60">
                  <span className="font-medium text-slate-700">{engineer.name} ({engineer.topSkill})</span>
                  <span className="font-semibold text-amber-600">¥{engineer.finalRate}万/月</span>
                </div>
              ))
            }
          </div>
          
          {/* 統計情報 */}
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="text-center p-4 bg-gradient-to-br from-white/70 to-blue-50/50 rounded-xl border border-white/60">
              <div className="text-xl font-light text-slate-700">¥{assignedEngineers.length > 0 ? Math.round(monthlyRevenue / assignedEngineers.length / 10000) : 0}万</div>
              <div className="text-xs font-medium text-slate-600 uppercase tracking-widest mt-1">平均単価</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-white/70 to-rose-50/50 rounded-xl border border-white/60">
              <div className="text-xl font-light text-slate-700">¥{detailedRevenue.length > 0 ? Math.max(...detailedRevenue.map(e => e.finalRate)) : 0}万</div>
              <div className="text-xs font-medium text-slate-600 uppercase tracking-widest mt-1">最高単価</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// アラートカード
function AlertCard({ engineers }) {
  const unassigned = engineers.filter(e => e.engineer_status === '未アサイン');
  const criticalSkills = ['React', 'Python', 'AWS', 'TypeScript'];
  const availableSkills = unassigned.flatMap(e => e.skills || []);
  const missingSkills = criticalSkills.filter(skill => 
    !availableSkills.some(available => available.toLowerCase().includes(skill.toLowerCase()))
  );
  
  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-red-500">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800">🚨 アラート</h3>
        <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-bold">
          {unassigned.length + missingSkills.length}件
        </span>
      </div>
      <div className="space-y-3">
        {unassigned.length > 0 && (
          <div className="flex items-center gap-2">
            <i className="fas fa-clock text-yellow-500"></i>
            <span className="text-sm">未アサイン: {unassigned.length}名</span>
          </div>
        )}
        {missingSkills.length > 0 && (
          <div className="flex items-center gap-2">
            <i className="fas fa-exclamation-triangle text-red-500"></i>
            <span className="text-sm">不足スキル: {missingSkills.join(', ')}</span>
          </div>
        )}
        {unassigned.length === 0 && missingSkills.length === 0 && (
          <div className="flex items-center gap-2 text-green-600">
            <i className="fas fa-check-circle"></i>
            <span className="text-sm">すべて正常です</span>
          </div>
        )}
      </div>
    </div>
  );
}

// 🎯 面白い仕掛け：インタラクティブスキル分析カード
function SkillAnalysisCard({ engineers }) {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isHovering, setIsHovering] = useState(false);
  
  const skillCounts = {};
  engineers.forEach(engineer => {
    if (Array.isArray(engineer.skills)) {
      engineer.skills.forEach(skill => {
        skillCounts[skill] = (skillCounts[skill] || 0) + 1;
      });
    }
  });
  
  // カテゴリ別のスキル統計
  const categoryStats = SKILL_CATEGORIES.map(category => {
    const categorySkills = category.skills.filter(skill => skillCounts[skill]);
    const totalCount = categorySkills.reduce((sum, skill) => sum + (skillCounts[skill] || 0), 0);
    const coverage = (categorySkills.length / category.skills.length) * 100;
    
    return {
      ...category,
      totalCount,
      coverage,
      skills: categorySkills.map(skill => ({
        name: skill,
        count: skillCounts[skill] || 0
      }))
    };
  });

  const topSkills = Object.entries(skillCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 6);
    
  const marketValue = {
    'React': '高',
    'TypeScript': '高',
    'Python': '高',
    'AWS': '最高',
    'Docker': '中',
    'Node.js': '高'
  };

  return (
    <div
      className="relative p-8 bg-gradient-to-br from-white/80 via-amber-50/60 to-stone-100/80 rounded-3xl border border-white/80 shadow-2xl overflow-hidden group hover:bg-white/90 transition-all duration-500"
      style={{
        boxShadow: '0 25px 60px rgba(0,0,0,0.10), 0 10px 25px rgba(0,0,0,0.08)'
      }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* ラグジュアリーなパーティクル効果 */}
      {isHovering && (
        <div className="absolute inset-0 pointer-events-none z-0">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-amber-300 rounded-full animate-ping opacity-30"
              style={{
                top: `${20 + (i * 10)}%`,
                left: `${10 + (i * 11)}%`,
                animationDelay: `${i * 0.2}s`,
                animationDuration: '2s'
              }}
            />
          ))}
        </div>
      )}

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-2xl font-semibold text-slate-800 tracking-wide flex items-center gap-3">
            <span className="text-amber-500 text-3xl">📊</span>
            エンジニア統計
          </h3>
          <div className={`text-3xl transition-all duration-500 ${isHovering ? 'rotate-12 scale-110' : ''} text-amber-600/80`}>
            <i className="fas fa-chart-bar"></i>
          </div>
        </div>

        {/* カテゴリ選択 */}
        <div className="mb-8">
          <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mb-6">
            {categoryStats.map((category, index) => (
              <button
                key={category.name}
                onClick={() => setSelectedCategory(selectedCategory === category.name ? null : category.name)}
                className={`p-4 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 font-semibold shadow-sm border-2 ${
                  selectedCategory === category.name
                    ? 'bg-gradient-to-br from-amber-100 to-stone-100 border-amber-400 shadow-lg'
                    : 'bg-white/70 border-white/60 hover:bg-white/90'
                }`}
                style={{
                  animationDelay: `${index * 0.1}s`
                }}
              >
                <div className={`w-7 h-7 ${category.color} rounded-lg mx-auto mb-2 transition-all duration-300 ${
                  selectedCategory === category.name ? 'shadow-lg' : ''
                }`}></div>
                <div className="text-xs font-bold text-slate-700 tracking-wide">{category.name}</div>
                <div className="text-xs text-slate-500 mt-1">{category.totalCount}人</div>
                <div className="w-full bg-stone-200 rounded-full h-1 mt-2">
                  <div
                    className={`${category.color} h-1 rounded-full transition-all duration-500`}
                    style={{ width: `${category.coverage}%` }}
                  ></div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 選択カテゴリ詳細 */}
        {selectedCategory && (
          <div className="mb-8 p-6 bg-gradient-to-r from-amber-50 to-stone-50 rounded-2xl border border-amber-200/60 animate-fade-in shadow">
            {(() => {
              const category = categoryStats.find(c => c.name === selectedCategory);
              return (
                <div>
                  <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <div className={`w-4 h-4 ${category.color} rounded mr-2`}></div>
                    {category.name}領域の詳細
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {category.skills.map(skill => (
                      <div key={skill.name} className="p-3 bg-white/90 rounded-xl border border-white/60 shadow-sm">
                        <div className="font-bold text-slate-700 text-base">{skill.name}</div>
                        <div className="text-xs text-slate-500 mt-1">{skill.count}名が保有</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* 人気スキルランキング */}
        <div className="space-y-4">
          <h4 className="text-lg font-bold text-slate-800 mb-4">🏆 人気スキルランキング</h4>
          {topSkills.map(([skill, count], index) => (
            <div
              key={skill}
              className="flex items-center justify-between p-4 bg-white/80 rounded-2xl hover:bg-white/90 transition-all duration-300 transform hover:scale-102 border border-white/60 shadow-sm"
              style={{
                animationDelay: `${index * 0.1}s`
              }}
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-stone-400 rounded-xl flex items-center justify-center text-white font-bold text-sm">
                  {index + 1}
                </div>
                <span className="font-bold text-slate-700 text-base">{skill}</span>
                <span className={`ml-3 text-xs px-2 py-1 rounded-full font-semibold ${
                  marketValue[skill] === '最高' ? 'bg-red-100 text-red-800' :
                  marketValue[skill] === '高' ? 'bg-orange-100 text-orange-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {marketValue[skill] || '標準'}
                </span>
              </div>
              <div className="flex items-center">
                <span className="text-slate-600 mr-3 font-bold">{count}名</span>
                <div className="w-20 bg-stone-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-amber-400 to-stone-400 h-2 rounded-full transition-all duration-1000 delay-300"
                    style={{ width: `${(count / Math.max(...Object.values(skillCounts))) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 稼働予定カード
function ScheduleCard({ engineers }) {
  const assigned = engineers.filter(e => e.engineer_status === 'アサイン済');
  const unassigned = engineers.filter(e => e.engineer_status === '未アサイン');
  const utilizationRate = engineers.length > 0 ? (assigned.length / engineers.length * 100) : 0;
  
  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800">📅 稼働状況</h3>
        <div className={`text-2xl font-bold ${utilizationRate >= 80 ? 'text-green-600' : utilizationRate >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
          {isFinite(utilizationRate) && !isNaN(utilizationRate) ? utilizationRate.toFixed(0) : '0'}%
        </div>
      </div>
      <div className="space-y-4">
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className={`h-3 rounded-full transition-all duration-1000 ${
              utilizationRate >= 80 ? 'bg-green-500' : 
              utilizationRate >= 60 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${utilizationRate}%` }}
          ></div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="text-center">
            <div className="font-bold text-lg text-green-600">{assigned.length}</div>
            <div className="text-gray-600">稼働中</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-lg text-blue-600">{unassigned.length}</div>
            <div className="text-gray-600">待機中</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useUser();
  const [engineers, setEngineers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  
  // 🎉 面白い仕掛け：動的メッセージシステム
  const [currentMessage, setCurrentMessage] = useState(0);

  // エンジニアデータを取得
  useEffect(() => {
    fetch("http://localhost:8000/api/engineers/")
      .then((res) => res.json())
      .then((data) => {
        setEngineers(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  // 🎉 面白い仕掛け：メッセージローテーション
  useEffect(() => {
    const messageInterval = setInterval(() => {
      setCurrentMessage((prev) => (prev + 1) % EXECUTIVE_MESSAGES.length);
    }, 4000);
    
    return () => clearInterval(messageInterval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 via-amber-50/30 to-slate-100 flex items-center justify-center">
        <div className="text-center p-12 bg-white/70 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/80" style={{
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
          
          <h2 className="text-3xl font-medium text-slate-700 mb-4 tracking-wide font-display">ダッシュボードデータを読み込み中...</h2>
          <p className="text-slate-500 animate-pulse font-light text-lg">エンジニア情報を取得しています</p>
        </div>
      </div>
    );
  }

  const assignedCount = engineers.filter(e => e.engineer_status === 'アサイン済').length;
  const unassignedCount = engineers.filter(e => e.engineer_status === '未アサイン').length;

  // 高度な売上計算（KPI用）
  const calculateAdvancedRevenue = () => {
    const assignedEngineers = engineers.filter(e => e.engineer_status === 'アサイン済');
    const skillRates = {
      'AWS': 120, 'React': 110, 'TypeScript': 105, 'Next.js': 115,
      'Python': 100, 'Django': 95, 'FastAPI': 105,
      'Vue.js': 90, 'Node.js': 85, 'PHP': 75, 'Laravel': 80,
      'Java': 85, 'Spring Boot': 90, 'C#': 85, '.NET': 85,
      'HTML': 60, 'CSS': 60, 'JavaScript': 75, 'jQuery': 65,
      'MySQL': 70, 'PostgreSQL': 75, 'MongoDB': 80,
      'Docker': 95, 'Kubernetes': 110, 'GraphQL': 100,
      'Firebase': 85, 'Vercel': 80, 'Heroku': 75
    };
    
    const experienceMultiplier = {
      '要件定義': 1.3, '基本設計': 1.2, '詳細設計': 1.1,
      '製造': 1.0, 'テスト': 0.9, '運用・保守': 0.85
    };
    
    const totalRevenue = assignedEngineers.reduce((total, engineer) => {
      const skills = Array.isArray(engineer.skills) ? engineer.skills : [];
      const phases = Array.isArray(engineer.phase) ? engineer.phase : [];
      
      const skillRatesList = skills.map(skill => skillRates[skill] || 70);
      const maxSkillRate = skillRatesList.length > 0 ? Math.max(...skillRatesList) : 70;
      
      const experienceBonusList = phases.map(phase => experienceMultiplier[phase] || 1.0);
      const experienceBonus = experienceBonusList.length > 0 ? Math.max(...experienceBonusList) : 1.0;
      
      return total + (maxSkillRate * experienceBonus);
    }, 0);
    
    return Math.round(totalRevenue * 0.85); // 稼働率85%考慮
  };

  const advancedMonthlyRevenue = calculateAdvancedRevenue();

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-amber-50/20 to-slate-100 relative overflow-hidden">
      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* 🎨 面白い仕掛け：エレガントなヘッダー with 動的メッセージ */}
        <div className="flex justify-between items-center p-8 bg-white/70 backdrop-blur-sm rounded-3xl shadow-xl border border-white/80 relative overflow-hidden" style={{
          boxShadow: '0 25px 60px rgba(0,0,0,0.08), 0 10px 25px rgba(0,0,0,0.06)'
        }}>
          {/* 動的背景パターン */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-stone-500 transform rotate-12 scale-150"></div>
          </div>
          
          <div className="relative z-10">
            <h1 className="text-4xl font-medium text-slate-700 tracking-wide flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-stone-500 rounded-2xl flex items-center justify-center transform hover:rotate-12 transition-transform duration-300">
                <i className="fas fa-tachometer-alt text-white text-xl"></i>
              </div>
              Executive Dashboard
            </h1>
            <p className="text-slate-500 mt-2 font-normal tracking-wide">リアルタイム人材管理 & 売上予測</p>
            
            {/* 🎯 面白い仕掛け：動的メッセージ表示 */}
            <div className="mt-4 p-4 bg-gradient-to-r from-amber-50 to-stone-50 rounded-2xl border border-amber-200/50">
              <div className="flex items-center gap-3 transition-all duration-500 transform">
                <i className={`${EXECUTIVE_MESSAGES[currentMessage].icon} text-lg ${EXECUTIVE_MESSAGES[currentMessage].color}`}></i>
                <span className="text-slate-700 font-medium">{EXECUTIVE_MESSAGES[currentMessage].text}</span>
                <div className="ml-auto flex gap-1">
                  {EXECUTIVE_MESSAGES.map((_, index) => (
                    <div 
                      key={index}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        index === currentMessage ? 'bg-amber-400' : 'bg-stone-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4 relative z-10">
            <select 
              value={selectedPeriod} 
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="border border-stone-200 bg-white/80 backdrop-blur-sm rounded-2xl px-6 py-3 focus:ring-2 focus:ring-amber-400 font-light text-slate-700 shadow-lg"
            >
              <option value="week">今週</option>
              <option value="month">今月</option>
            <option value="quarter">四半期</option>
          </select>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all flex items-center gap-2">
            <i className="fas fa-sync-alt"></i>
            更新
          </button>
        </div>
      </div>

      {/* KPIカード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <AnimatedCounter 
          end={engineers.length} 
          label="総エンジニア数" 
          color="blue"
          suffix="名" 
          icon="fas fa-users"
        />
        <AnimatedCounter 
          end={assignedCount} 
          label="稼働中" 
          color="green"
          suffix="名" 
          icon="fas fa-user-check"
        />
        <AnimatedCounter 
          end={unassignedCount} 
          label="待機中" 
          color="yellow"
          suffix="名" 
          icon="fas fa-user-clock"
        />
        <AnimatedCounter 
          end={Math.round((assignedCount / engineers.length) * 100)} 
          label="稼働率" 
          color="purple"
          suffix="%" 
          icon="fas fa-chart-pie"
        />
        <AnimatedCounter 
          end={advancedMonthlyRevenue} 
          label="AI予測売上" 
          color="green"
          suffix="万円/月" 
          icon="fas fa-robot"
        />
      </div>

      {/* メインダッシュボード */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左列 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 売上と稼働状況 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <RevenueCard engineers={engineers} />
            <ScheduleCard engineers={engineers} />
          </div>
          
          {/* スキル分析 */}
          <SkillAnalysisCard engineers={engineers} />
        </div>

        {/* 右列 */}
        <div className="space-y-6">
          {/* アラート */}
          <AlertCard engineers={engineers} />
          
          {/* 営業支援カード */}
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">🎯 営業支援</h3>
              <i className="fas fa-handshake text-2xl opacity-80"></i>
            </div>
            <div className="space-y-3">
              <button className="w-full bg-white bg-opacity-20 hover:bg-opacity-30 transition-all py-2 px-3 rounded-lg text-sm font-semibold">
                <i className="fas fa-users mr-2"></i>
                提案可能人材リスト
              </button>
              <button className="w-full bg-white bg-opacity-20 hover:bg-opacity-30 transition-all py-2 px-3 rounded-lg text-sm font-semibold">
                <i className="fas fa-calendar-alt mr-2"></i>
                来月の空き状況
              </button>
              <button className="w-full bg-white bg-opacity-20 hover:bg-opacity-30 transition-all py-2 px-3 rounded-lg text-sm font-semibold">
                <i className="fas fa-chart-pie mr-2"></i>
                スキルマッチング分析
              </button>
            </div>
          </div>

          {/* クイックアクション */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-lg font-bold text-gray-800 mb-4">⚡ クイックアクション</h3>
            <div className="space-y-3">
              <button className="w-full bg-gray-100 hover:bg-gray-200 transition-all py-2 px-3 rounded-lg text-sm font-semibold text-left flex items-center gap-2">
                <i className="fas fa-plus-circle text-blue-600"></i>
                新規エンジニア登録
              </button>
              <button className="w-full bg-gray-100 hover:bg-gray-200 transition-all py-2 px-3 rounded-lg text-sm font-semibold text-left flex items-center gap-2">
                <i className="fas fa-file-excel text-green-600"></i>
                月次レポート作成
              </button>
              <button className="w-full bg-gray-100 hover:bg-gray-200 transition-all py-2 px-3 rounded-lg text-sm font-semibold text-left flex items-center gap-2">
                <i className="fas fa-bell text-yellow-600"></i>
                アラート設定
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* トレンド分析 */}
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-800">📈 市場トレンド分析</h3>
          <span className="text-sm text-gray-500">データ更新: {new Date().toLocaleDateString('ja-JP')}</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">↑ 15%</div>
            <div className="text-sm text-gray-600">React需要</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">↑ 12%</div>
            <div className="text-sm text-gray-600">AWS案件</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">↑ 8%</div>
            <div className="text-sm text-gray-600">TypeScript</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">↓ 3%</div>
            <div className="text-sm text-gray-600">jQuery</div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
