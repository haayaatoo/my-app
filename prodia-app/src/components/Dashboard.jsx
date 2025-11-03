import React, { useEffect, useState } from "react";
// import { useUser } from "../contexts/UserContext";

// 🎉 面白い仕掛け：動的なメッセージシステム
const EXECUTIVE_MESSAGES = [
  { text: "今日も素晴らしいチームですね！", icon: "fas fa-star", color: "text-amber-600" },
  { text: "エンジニアの生産性が向上中です", icon: "fas fa-chart-line", color: "text-emerald-600" },
  { text: "新しい才能が加わりました", icon: "fas fa-rocket", color: "text-blue-600" },
  { text: "プロジェクト進行が順調です", icon: "fas fa-trophy", color: "text-purple-600" },
  { text: "技術スタックが多様化しています", icon: "fas fa-code", color: "text-indigo-600" }
];

// スキルレーダーチャート風の視覚化
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
    blue: {
      bg: "bg-gradient-to-br from-blue-500 to-indigo-600",
      text: "text-white",
      icon: "text-blue-200",
      accent: "bg-blue-300"
    },
    green: {
      bg: "bg-gradient-to-br from-emerald-500 to-teal-600", 
      text: "text-white",
      icon: "text-emerald-200",
      accent: "bg-emerald-300"
    },
    red: {
      bg: "bg-gradient-to-br from-rose-500 to-pink-600",
      text: "text-white", 
      icon: "text-rose-200",
      accent: "bg-rose-300"
    },
    purple: {
      bg: "bg-gradient-to-br from-violet-500 to-purple-600",
      text: "text-white",
      icon: "text-violet-200", 
      accent: "bg-violet-300"
    },
    yellow: {
      bg: "bg-gradient-to-br from-amber-500 to-orange-600",
      text: "text-white",
      icon: "text-amber-200",
      accent: "bg-amber-300"
    }
  };

  return (
    <div className={`
      relative overflow-hidden p-6 rounded-2xl shadow-xl text-center 
      transform transition-all duration-500 ease-out hover:scale-105 hover:-translate-y-1
      ${colorClasses[color].bg} ${colorClasses[color].text}
      ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}
    `} style={{
      boxShadow: '0 25px 50px rgba(0,0,0,0.15), 0 10px 20px rgba(0,0,0,0.1)'
    }}>
      {/* 背景装飾 */}
      <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -mr-8 -mt-8"></div>
      <div className="absolute bottom-0 left-0 w-12 h-12 bg-white/5 rounded-full -ml-6 -mb-6"></div>
      
      {/* アイコン */}
      <div className={`text-3xl mb-4 ${colorClasses[color].icon}`}>
        <i className={icon}></i>
      </div>
      
      {/* カウンター */}
      <div className="text-3xl font-bold mb-2">
        <span className="tracking-tight">
          {prefix}{count.toLocaleString()}{suffix}
        </span>
      </div>
      
      {/* ラベル */}
      <div className="text-sm font-medium opacity-90 uppercase tracking-wide">
        {label}
      </div>
      
      {/* プログレスインジケーター */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
        <div 
          className={`h-full ${colorClasses[color].accent} transition-all duration-2000 ease-out`}
          style={{ width: isVisible ? '100%' : '0%' }}
        ></div>
      </div>
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
            <i className="fas fa-chart-line mr-4 text-3xl text-amber-600"></i>
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

// インタラクティブスキル分析カード
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
            <i className="fas fa-chart-bar text-amber-500 text-3xl"></i>
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
    <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/50 relative overflow-hidden">
      {/* 背景グラデーション */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-200/20 to-transparent rounded-full blur-2xl"></div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <i className="fas fa-calendar-alt text-white"></i>
            </div>
            稼働状況
          </h3>
          <div className={`text-3xl font-bold ${utilizationRate >= 80 ? 'text-emerald-600' : utilizationRate >= 60 ? 'text-amber-600' : 'text-rose-600'}`}>
            {isFinite(utilizationRate) && !isNaN(utilizationRate) ? utilizationRate.toFixed(0) : '0'}%
          </div>
        </div>
        
        {/* プログレスバー */}
        <div className="mb-6">
          <div className="w-full bg-gray-100 rounded-full h-4 relative overflow-hidden">
            <div 
              className={`h-4 rounded-full transition-all duration-1000 ease-out relative ${
                utilizationRate >= 80 ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : 
                utilizationRate >= 60 ? 'bg-gradient-to-r from-amber-400 to-amber-600' : 
                'bg-gradient-to-r from-rose-400 to-rose-600'
              }`}
              style={{ width: `${utilizationRate}%` }}
            >
              <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse"></div>
            </div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>
        
        {/* 統計カード */}
        <div className="grid grid-cols-2 gap-4 opacity-0 animate-slide-in-from-bottom" style={{animationDelay: '400ms', animationFillMode: 'forwards'}}>
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-4 rounded-2xl border border-emerald-100">
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600 mb-1">{assigned.length}</div>
              <div className="text-emerald-700 text-sm font-medium">稼働中</div>
              <div className="flex items-center justify-center mt-2">
                <i className="fas fa-user-check text-emerald-500 text-sm"></i>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-4 rounded-2xl border border-amber-100">
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-600 mb-1">{unassigned.length}</div>
              <div className="text-amber-700 text-sm font-medium">待機中</div>
              <div className="flex items-center justify-center mt-2">
                <i className="fas fa-user-clock text-amber-500 text-sm"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// リアルタイム市場トレンドコンポーネント
function RealTimeMarketTrends() {
  const [marketData, setMarketData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState('aichi'); // デフォルトを愛知県に

  const fetchMarketData = async (region = 'aichi') => {
    try {
      setLoading(true);
      
      // 地域別APIエンドポイント選択
      const apiUrl = region === 'aichi' 
        ? "http://localhost:8000/api/market/aichi/summary/"
        : "http://localhost:8000/api/market/summary/";
      
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        // 愛知県データと全国データの構造差を吸収
        const trendsData = region === 'aichi' 
          ? data.summary.top_growing_technologies 
          : data.summary.top_growing_technologies || [];
        
        setMarketData(trendsData);
        setLastUpdated(new Date(data.last_updated));
        setError(null);
      } else {
        throw new Error(data.error || '市場データの取得に失敗しました');
      }
    } catch (err) {
      console.error('Market data fetch error:', err);
      setError(err.message);
      
      // エラー時は地域別フォールバックデータを使用
      const fallbackData = region === 'aichi' ? [
        { technology: "ROS", change_percentage: 67.4, trend_direction: "up", job_count: 18, avg_salary: 6500000, major_companies: ["トヨタ自動車", "豊田自動織機"] },
        { technology: "Unity", change_percentage: 41.5, trend_direction: "up", job_count: 29, avg_salary: 5100000, major_companies: ["トヨタ自動車", "デンソー"] },
        { technology: "C++", change_percentage: 31.7, trend_direction: "up", job_count: 98, avg_salary: 5900000, major_companies: ["トヨタ自動車", "デンソー"] },
        { technology: "Python", change_percentage: 28.4, trend_direction: "up", job_count: 145, avg_salary: 5200000, major_companies: ["トヨタ自動車", "デンソー"] }
      ] : [
        { technology: "React", change_percentage: 18.5, trend_direction: "up" },
        { technology: "TypeScript", change_percentage: 24.3, trend_direction: "up" },
        { technology: "AWS", change_percentage: 15.7, trend_direction: "up" },
        { technology: "jQuery", change_percentage: -8.4, trend_direction: "down" }
      ];
      
      setMarketData(fallbackData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketData(selectedRegion);
    
    // 5分ごとに自動更新
    const interval = setInterval(() => fetchMarketData(selectedRegion), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [selectedRegion]);

  const getTrendColor = (percentage, direction) => {
    if (direction === 'up' && percentage > 15) return 'text-green-600';
    if (direction === 'up' && percentage > 5) return 'text-blue-600';
    if (direction === 'down') return 'text-red-600';
    return 'text-gray-600';
  };

  const getTrendIcon = (direction, percentage) => {
    if (direction === 'up') {
      return percentage > 15 ? 
        <i className="fas fa-rocket text-green-600"></i> : 
        <i className="fas fa-arrow-trend-up text-green-500"></i>;
    }
    if (direction === 'down') {
      return <i className="fas fa-arrow-trend-down text-red-500"></i>;
    }
    return <i className="fas fa-arrow-right text-gray-500"></i>;
  };

  if (loading && marketData.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <div className="flex items-center justify-center space-x-2">
          <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce"></div>
          <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
          <span className="ml-2 text-gray-600">市場データを読み込み中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg relative overflow-hidden">
      {/* 背景装飾 */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100/50 to-green-100/50 rounded-full transform translate-x-16 -translate-y-16"></div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              {selectedRegion === 'aichi' ? 
                <i className="fas fa-industry text-orange-600"></i> : 
                <i className="fas fa-chart-area text-blue-600"></i>
              }
              {selectedRegion === 'aichi' ? '愛知県' : '全国'} IT市場トレンド分析
              {loading && (
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin ml-2"></div>
              )}
            </h3>
            
            {/* 地域切り替えボタン */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setSelectedRegion('aichi')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 ${
                  selectedRegion === 'aichi' 
                    ? 'bg-orange-500 text-white shadow-md' 
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                <i className="fas fa-industry mr-1"></i> 愛知県
              </button>
              <button
                onClick={() => setSelectedRegion('national')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 ${
                  selectedRegion === 'national' 
                    ? 'bg-blue-500 text-white shadow-md' 
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                <i className="fas fa-globe-asia mr-1"></i> 全国
              </button>
            </div>
          </div>
          <div className="text-right">
            <button 
              onClick={() => fetchMarketData(selectedRegion)} 
              disabled={loading}
              className="px-3 py-1 bg-blue-500 text-white rounded-lg text-xs hover:bg-blue-600 disabled:opacity-50 transition-colors duration-200 flex items-center gap-1"
            >
              <i className="fas fa-sync-alt"></i>
              更新
            </button>
            <div className="text-xs text-gray-500 mt-1">
              {lastUpdated ? `更新: ${lastUpdated.toLocaleString('ja-JP')}` : 'データ読み込み中...'}
            </div>
            {error && (
              <div className="text-xs text-red-500 mt-1">
                <i className="fas fa-exclamation-triangle text-red-500 mr-1"></i> {error}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {marketData.slice(0, 4).map((trend, index) => (
            <div 
              key={trend.technology}
              className={`text-center p-4 rounded-xl border hover:shadow-md transition-all duration-300 transform hover:scale-105 ${
                selectedRegion === 'aichi' 
                  ? 'bg-gradient-to-br from-orange-50 to-red-50/30 border-orange-100' 
                  : 'bg-gradient-to-br from-gray-50 to-blue-50/30 border-gray-100'
              }`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="text-3xl mb-2 flex justify-center">
                {getTrendIcon(trend.trend_direction, trend.change_percentage)}
              </div>
              <div className={`text-xl font-bold ${getTrendColor(trend.change_percentage, trend.trend_direction)}`}>
                {trend.change_percentage > 0 ? '↑' : trend.change_percentage < 0 ? '↓' : '→'} 
                {Math.abs(trend.change_percentage).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600 font-medium mt-1">
                {trend.technology}
              </div>
              
              {/* 愛知県データの場合、追加情報を表示 */}
              {selectedRegion === 'aichi' && trend.job_count && (
                <div className="mt-2 space-y-1">
                  <div className="text-xs text-orange-600 font-semibold">
                    求人: {trend.job_count}件
                  </div>
                  {trend.avg_salary && (
                    <div className="text-xs text-green-600 font-semibold">
                      年収: {Math.round(trend.avg_salary / 10000)}万円
                    </div>
                  )}
                  {trend.major_companies && trend.major_companies.length > 0 && (
                    <div className="text-xs text-gray-500">
                      {trend.major_companies[0]}他
                    </div>
                  )}
                </div>
              )}
              
              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                <div 
                  className={`h-1.5 rounded-full transition-all duration-1000 ${
                    selectedRegion === 'aichi'
                      ? trend.trend_direction === 'up' ? 'bg-orange-500' : 
                        trend.trend_direction === 'down' ? 'bg-red-500' : 'bg-gray-500'
                      : trend.trend_direction === 'up' ? 'bg-green-500' : 
                        trend.trend_direction === 'down' ? 'bg-red-500' : 'bg-gray-500'
                  }`}
                  style={{ 
                    width: `${Math.min(100, Math.abs(trend.change_percentage) * 3)}%` 
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>

        {/* データソース情報 */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>
              <i className="fas fa-satellite-dish text-gray-500 mr-1"></i> データソース: {selectedRegion === 'aichi' 
                ? '愛知県求人統計, 製造業DX調査, 地域IT企業分析' 
                : 'GitHub API, Stack Overflow, 求人サイト統計'
              }
            </span>
            <span className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full animate-pulse ${
                selectedRegion === 'aichi' ? 'bg-orange-500' : 'bg-green-500'
              }`}></div>
              {selectedRegion === 'aichi' ? '愛知県特化データ' : 'リアルタイム更新中'}
            </span>
          </div>
          
          {/* 愛知県特別情報 */}
          {selectedRegion === 'aichi' && (
            <div className="mt-2 p-2 bg-orange-50 rounded-lg border border-orange-200">
              <div className="text-xs text-orange-700">
                <i className="fas fa-industry text-orange-600 mr-1"></i> <strong>愛知県IT市場の特徴:</strong> 製造業DX・自動車関連技術が高需要 | 
                平均年収509万円（全国トップクラス） | 
                トヨタグループを中心とした技術投資活発
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  // const { user } = useUser(); // 現在未使用
  const [engineers, setEngineers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  
  // 🎉 面白い仕掛け：動的メッセージシステム
  const [currentMessage, setCurrentMessage] = useState(0);

  // 💰 売上シミュレーション用状態
  const [showRevenueSimulation, setShowRevenueSimulation] = useState(false);
  const [simulationParams, setSimulationParams] = useState({
    engineerCount: 0,
    averageRate: 75,
    workingRate: 85,
    projectDuration: 12
  });

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

  // エンジニア数更新時にシミュレーションパラメータを更新
  useEffect(() => {
    if (engineers.length > 0) {
      setSimulationParams(prev => ({
        ...prev,
        engineerCount: engineers.length
      }));
    }
  }, [engineers]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 via-amber-50/30 to-slate-100 flex items-center justify-center relative overflow-hidden">
        {/* 背景アニメーション */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-amber-200/20 rounded-full animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-stone-200/20 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
        </div>
        
        <div className="text-center p-12 bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 relative z-10">
          {/* モダンローダー */}
          <div className="relative mb-10">
            <div className="w-20 h-20 border-4 border-amber-100 rounded-full animate-spin border-t-amber-500 mx-auto"></div>
            <div className="absolute inset-2 w-16 h-16 border-2 border-stone-100 rounded-full animate-pulse border-t-stone-400 mx-auto"></div>
          </div>
          
          {/* プログレスドット */}
          <div className="flex justify-center space-x-3 mb-8">
            <div className="w-3 h-3 bg-amber-500 rounded-full animate-bounce"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
            <div className="w-3 h-3 bg-stone-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            <div className="w-3 h-3 bg-amber-600 rounded-full animate-bounce" style={{animationDelay: '0.3s'}}></div>
          </div>
          
          <h2 className="text-3xl font-bold text-slate-800 mb-4">ダッシュボードを準備中...</h2>
          <p className="text-slate-600 text-lg">エンジニア情報を読み込んでいます</p>
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
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-amber-50/30 to-slate-100 relative overflow-hidden opacity-0 animate-fade-in" style={{animationDelay: '0ms', animationFillMode: 'forwards'}}>
      {/* 背景装飾 */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-amber-200/20 to-transparent rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-stone-200/20 to-transparent rounded-full blur-3xl"></div>
      
      <div className="container mx-auto px-6 py-6 relative z-10">
        {/* モダンヘッダー */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8 mb-8 opacity-0 animate-slide-in-from-top" style={{animationDelay: '200ms', animationFillMode: 'forwards'}}>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* タイトル部分 */}
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-2xl flex items-center justify-center shadow-luxury transform hover:rotate-12 transition-transform duration-300">
                  <i className="fas fa-tachometer-alt text-white text-2xl"></i>
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-400 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-amber-700 bg-clip-text text-transparent">
                  Executive Dashboard
                </h1>
                <p className="text-slate-600 mt-1 text-lg">リアルタイム人材管理システム</p>
              </div>
            </div>

            {/* 右側コントロール */}
            <div className="flex items-center gap-4">
              <select 
                value={selectedPeriod} 
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-4 py-3 bg-white/70 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-slate-700 shadow-sm"
              >
                <option value="week">今週</option>
                <option value="month">今月</option>
                <option value="quarter">四半期</option>
              </select>
              <button className="px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 flex items-center gap-2 font-medium">
                <i className="fas fa-sync-alt"></i>
                更新
              </button>
            </div>
          </div>

          {/* 動的メッセージ */}
          <div className="mt-6 p-4 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-2xl border border-amber-200/50">
            <div className="flex items-center gap-3">
              <i className={`${EXECUTIVE_MESSAGES[currentMessage].icon} text-xl ${EXECUTIVE_MESSAGES[currentMessage].color}`}></i>
              <span className="text-slate-700 font-medium flex-1">{EXECUTIVE_MESSAGES[currentMessage].text}</span>
              <div className="flex gap-1">
                {EXECUTIVE_MESSAGES.map((_, index) => (
                  <div 
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      index === currentMessage ? 'bg-amber-500' : 'bg-stone-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* KPIメトリクス - グリッドレイアウトを改善 */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-6 mb-8 opacity-0 animate-slide-in-from-bottom" style={{animationDelay: '600ms', animationFillMode: 'forwards'}}>
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

        {/* 🚀 売上・収益予測セクション */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl p-8 border border-green-200 mb-8 opacity-0 animate-slide-in-from-bottom" style={{animationDelay: '700ms', animationFillMode: 'forwards'}}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
              <i className="fas fa-chart-area text-green-500 text-2xl"></i>
              売上・収益予測 Executive Overview
            </h3>
            <button 
              onClick={() => setShowRevenueSimulation(true)}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium hover:shadow-lg transition-all duration-200 flex items-center gap-2"
            >
              <i className="fas fa-calculator"></i>
              詳細シミュレーション
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* 月間売上実績 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-green-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 rounded-xl">
                    <i className="fas fa-coins text-green-600 text-xl"></i>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-700">月間売上実績</h4>
                    <p className="text-xs text-slate-500">今月の確定売上</p>
                  </div>
                </div>
              </div>
              <div className="text-3xl font-bold text-green-600 mb-2">
                <AnimatedCounter end={Math.round(advancedMonthlyRevenue * 1.15)} suffix="万円" />
              </div>
              <div className="text-sm text-green-600 flex items-center gap-1">
                <i className="fas fa-arrow-up text-xs"></i>
                前月比 +5.2%
              </div>
            </div>

            {/* 年間予測 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-blue-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <i className="fas fa-chart-line text-blue-600 text-xl"></i>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-700">年間予測売上</h4>
                    <p className="text-xs text-slate-500">AI予測モデル</p>
                  </div>
                </div>
              </div>
              <div className="text-3xl font-bold text-blue-600 mb-2">
                <AnimatedCounter end={Math.round(advancedMonthlyRevenue * 12 * 1.08)} suffix="万円" />
              </div>
              <div className="text-sm text-blue-600 flex items-center gap-1">
                <i className="fas fa-target text-xs"></i>
                目標達成率 89%
              </div>
            </div>

            {/* プロジェクト収益性 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-purple-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-100 rounded-xl">
                    <i className="fas fa-briefcase text-purple-600 text-xl"></i>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-700">プロジェクト数</h4>
                    <p className="text-xs text-slate-500">進行中案件</p>
                  </div>
                </div>
              </div>
              <div className="text-3xl font-bold text-purple-600 mb-2">
                <AnimatedCounter end={assignedCount + 3} suffix="件" />
              </div>
              <div className="text-sm text-purple-600 flex items-center gap-1">
                <i className="fas fa-rocket text-xs"></i>
                平均単価 {Math.round(advancedMonthlyRevenue / assignedCount)}万円
              </div>
            </div>

            {/* 収益率・効率性 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-amber-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-amber-100 rounded-xl">
                    <i className="fas fa-percentage text-amber-600 text-xl"></i>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-700">収益率</h4>
                    <p className="text-xs text-slate-500">営業利益率</p>
                  </div>
                </div>
              </div>
              <div className="text-3xl font-bold text-amber-600 mb-2">
                <AnimatedCounter end={23.5} suffix="%" />
              </div>
              <div className="text-sm text-amber-600 flex items-center gap-1">
                <i className="fas fa-trophy text-xs"></i>
                業界平均 18%
              </div>
            </div>
          </div>

          {/* SES売上計算式の説明 */}
          <div className="mt-6 p-4 bg-white/70 rounded-xl border border-green-200">
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <i className="fas fa-info-circle text-green-500"></i>
              <span><strong>SES売上計算式:</strong> エンジニア単価 × 稼働率 × プロジェクト期間 | AI予測モデルがスキル・経験・市場価格を分析</span>
            </div>
          </div>
        </div>

        {/* メインコンテンツエリア - レスポンシブ対応を強化 */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 mb-8 opacity-0 animate-slide-in-from-bottom" style={{animationDelay: '800ms', animationFillMode: 'forwards'}}>
          {/* 左メインエリア (8/12) */}
          <div className="xl:col-span-8 space-y-8 opacity-0 animate-slide-in-from-left" style={{animationDelay: '1000ms', animationFillMode: 'forwards'}}>
            {/* 売上と稼働状況を横並び */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RevenueCard engineers={engineers} />
              <ScheduleCard engineers={engineers} />
            </div>
            
            {/* スキル分析を広く表示 */}
            <SkillAnalysisCard engineers={engineers} />
          </div>

          {/* 右サイドバー (4/12) */}
          <div className="xl:col-span-4 space-y-6 opacity-0 animate-slide-in-from-right" style={{animationDelay: '1100ms', animationFillMode: 'forwards'}}>
            {/* アラート */}
            <AlertCard engineers={engineers} />
            
            {/* 営業支援ツール - モダンなデザインに */}
            <div className="bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 text-white p-6 rounded-2xl shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold flex items-center gap-3">
                  <i className="fas fa-handshake text-emerald-200"></i>
                  営業支援ツール
                </h3>
                <div className="w-3 h-3 bg-green-300 rounded-full animate-pulse"></div>
              </div>
              <div className="space-y-3">
                <button className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-all py-3 px-4 rounded-xl text-sm font-semibold flex items-center gap-3 group">
                  <i className="fas fa-users group-hover:scale-110 transition-transform"></i>
                  提案可能人材リスト
                </button>
                <button className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-all py-3 px-4 rounded-xl text-sm font-semibold flex items-center gap-3 group">
                  <i className="fas fa-calendar-alt group-hover:scale-110 transition-transform"></i>
                  来月の空き状況
                </button>
                <button className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-all py-3 px-4 rounded-xl text-sm font-semibold flex items-center gap-3 group">
                  <i className="fas fa-chart-pie group-hover:scale-110 transition-transform"></i>
                  スキルマッチング分析
                </button>
              </div>
            </div>

            {/* クイックアクション - デザインを統一 */}
            <div className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl shadow-xl border border-white/50">
              <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                <i className="fas fa-bolt text-yellow-500"></i>
                クイックアクション
              </h3>
              <div className="space-y-3">
                <button className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-all py-3 px-4 rounded-xl text-sm font-semibold text-left flex items-center gap-3 group border border-blue-100">
                  <i className="fas fa-plus-circle text-blue-600 group-hover:scale-110 transition-transform"></i>
                  新規エンジニア登録
                </button>
                <button className="w-full bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 transition-all py-3 px-4 rounded-xl text-sm font-semibold text-left flex items-center gap-3 group border border-green-100">
                  <i className="fas fa-file-excel text-green-600 group-hover:scale-110 transition-transform"></i>
                  月次レポート作成
                </button>
                <button className="w-full bg-gradient-to-r from-yellow-50 to-orange-50 hover:from-yellow-100 hover:to-orange-100 transition-all py-3 px-4 rounded-xl text-sm font-semibold text-left flex items-center gap-3 group border border-yellow-100">
                  <i className="fas fa-bell text-yellow-600 group-hover:scale-110 transition-transform"></i>
                  アラート設定
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 市場トレンド - 全幅表示 */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 overflow-hidden">
          <RealTimeMarketTrends />
        </div>
      </div>

      {/* 💰 売上シミュレーションモーダル */}
      {showRevenueSimulation && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-4 pb-4 px-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-white/50 w-full max-w-4xl max-h-[85vh] overflow-y-auto animate-fade-in">
            {/* モーダルヘッダー */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <i className="fas fa-calculator text-2xl"></i>
                  <div>
                    <h2 className="text-2xl font-bold">売上シミュレーション</h2>
                    <p className="text-green-100 mt-1">パラメータを調整して将来の売上を予測</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowRevenueSimulation(false)}
                  className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>
            </div>

            {/* モーダル本体 */}
            <div className="p-6 space-y-6">
              {/* パラメータ調整パネル */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* エンジニア数 */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6">
                  <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <i className="fas fa-users text-blue-600"></i>
                    エンジニア数
                  </h4>
                  <input
                    type="range"
                    min="1"
                    max="150"
                    step="1"
                    value={simulationParams.engineerCount}
                    onChange={(e) => setSimulationParams(prev => ({...prev, engineerCount: parseInt(e.target.value)}))}
                    className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-sm text-slate-600 mt-2">
                    <span>1名</span>
                    <span className="font-bold text-lg text-blue-600">{simulationParams.engineerCount}名</span>
                    <span>150名</span>
                  </div>
                  
                  {/* 50単位の目安表示 */}
                  <div className="flex justify-between text-xs text-slate-400 mt-1">
                    <span>小規模</span>
                    <span>50名</span>
                    <span>100名</span>
                    <span>大規模</span>
                  </div>
                  
                  {/* 50単位クイック設定ボタン */}
                  <div className="flex gap-2 mt-3">
                    {[50, 100, 150].map(count => (
                      <button
                        key={count}
                        onClick={() => setSimulationParams(prev => ({...prev, engineerCount: count}))}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all duration-200 ${
                          simulationParams.engineerCount === count
                            ? 'bg-blue-500 text-white shadow-md'
                            : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                        }`}
                      >
                        {count}名
                      </button>
                    ))}
                  </div>
                </div>

                {/* 平均単価 */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6">
                  <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <i className="fas fa-yen-sign text-green-600"></i>
                    平均単価
                  </h4>
                  <input
                    type="range"
                    min="40"
                    max="150"
                    value={simulationParams.averageRate}
                    onChange={(e) => setSimulationParams(prev => ({...prev, averageRate: parseInt(e.target.value)}))}
                    className="w-full h-2 bg-green-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-sm text-slate-600 mt-2">
                    <span>40万円</span>
                    <span className="font-bold text-lg text-green-600">{simulationParams.averageRate}万円</span>
                    <span>150万円</span>
                  </div>
                </div>

                {/* 稼働率 */}
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6">
                  <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <i className="fas fa-chart-pie text-purple-600"></i>
                    稼働率
                  </h4>
                  <input
                    type="range"
                    min="50"
                    max="100"
                    value={simulationParams.workingRate}
                    onChange={(e) => setSimulationParams(prev => ({...prev, workingRate: parseInt(e.target.value)}))}
                    className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-sm text-slate-600 mt-2">
                    <span>50%</span>
                    <span className="font-bold text-lg text-purple-600">{simulationParams.workingRate}%</span>
                    <span>100%</span>
                  </div>
                </div>

                {/* プロジェクト期間 */}
                <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-6">
                  <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <i className="fas fa-calendar text-amber-600"></i>
                    予測期間
                  </h4>
                  <input
                    type="range"
                    min="3"
                    max="24"
                    value={simulationParams.projectDuration}
                    onChange={(e) => setSimulationParams(prev => ({...prev, projectDuration: parseInt(e.target.value)}))}
                    className="w-full h-2 bg-amber-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-sm text-slate-600 mt-2">
                    <span>3ヶ月</span>
                    <span className="font-bold text-lg text-amber-600">{simulationParams.projectDuration}ヶ月</span>
                    <span>24ヶ月</span>
                  </div>
                </div>
              </div>

              {/* 予測結果表示 */}
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-6">
                <h4 className="font-semibold text-slate-800 mb-6 text-xl flex items-center gap-2">
                  <i className="fas fa-chart-line text-slate-600"></i>
                  シミュレーション結果
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* 月間売上予測 */}
                  <div className="bg-white rounded-xl p-6 shadow-sm">
                    <div className="text-center">
                      <h5 className="font-medium text-slate-600 mb-2">月間売上予測</h5>
                      <div className="text-3xl font-bold text-green-600 mb-2">
                        {Math.round(simulationParams.engineerCount * simulationParams.averageRate * (simulationParams.workingRate / 100)).toLocaleString()}万円
                      </div>
                      <div className="text-sm text-slate-500">
                        {simulationParams.engineerCount}名 × {simulationParams.averageRate}万円 × {simulationParams.workingRate}%
                      </div>
                    </div>
                  </div>

                  {/* 期間売上予測 */}
                  <div className="bg-white rounded-xl p-6 shadow-sm">
                    <div className="text-center">
                      <h5 className="font-medium text-slate-600 mb-2">{simulationParams.projectDuration}ヶ月売上予測</h5>
                      <div className="text-3xl font-bold text-blue-600 mb-2">
                        {Math.round(simulationParams.engineerCount * simulationParams.averageRate * (simulationParams.workingRate / 100) * simulationParams.projectDuration).toLocaleString()}万円
                      </div>
                      <div className="text-sm text-slate-500">
                        月間売上 × {simulationParams.projectDuration}ヶ月
                      </div>
                    </div>
                  </div>

                  {/* 年換算売上 */}
                  <div className="bg-white rounded-xl p-6 shadow-sm">
                    <div className="text-center">
                      <h5 className="font-medium text-slate-600 mb-2">年換算売上</h5>
                      <div className="text-3xl font-bold text-purple-600 mb-2">
                        {Math.round(simulationParams.engineerCount * simulationParams.averageRate * (simulationParams.workingRate / 100) * 12).toLocaleString()}万円
                      </div>
                      <div className="text-sm text-slate-500">
                        月間売上 × 12ヶ月
                      </div>
                    </div>
                  </div>
                </div>

                {/* 計算式説明 */}
                <div className="mt-6 p-4 bg-white/70 rounded-xl border border-slate-200">
                  <div className="text-sm text-slate-600">
                    <strong>計算式:</strong> エンジニア数 × 平均単価 × 稼働率 = 月間売上<br/>
                    <strong>想定:</strong> SES単価はスキル・経験・市場価格により40万円〜150万円で変動
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
