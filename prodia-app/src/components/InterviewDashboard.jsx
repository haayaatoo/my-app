import React, { useState, useEffect } from 'react';

export default function InterviewDashboard({ interviews, engineers }) {
  // 統計データ計算
  const stats = {
    total: interviews.length,
    pass: interviews.filter(i => i.result === 'pass').length,
    fail: interviews.filter(i => i.result === 'fail').length,
    pending: interviews.filter(i => i.result === 'pending').length,
    thisMonth: interviews.filter(i => {
      const interviewDate = new Date(i.interview_date);
      const now = new Date();
      return interviewDate.getMonth() === now.getMonth() && 
             interviewDate.getFullYear() === now.getFullYear();
    }).length
  };

  // エンジニア別統計
  const engineerStats = engineers.map(engineer => {
    const engineerInterviews = interviews.filter(i => i.engineer === engineer.id);
    return {
      ...engineer,
      totalInterviews: engineerInterviews.length,
      passRate: engineerInterviews.length > 0 
        ? Math.round((engineerInterviews.filter(i => i.result === 'pass').length / engineerInterviews.length) * 100)
        : 0,
      recentInterviews: engineerInterviews
        .sort((a, b) => new Date(b.interview_date) - new Date(a.interview_date))
        .slice(0, 3)
    };
  }).sort((a, b) => b.totalInterviews - a.totalInterviews);

  return (
    <div className="space-y-8">
      {/* 📊 統計サマリー */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">総面談数</p>
              <p className="text-3xl font-bold">{stats.total}</p>
            </div>
            <i className="fas fa-comments text-4xl text-blue-200"></i>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100">合格数</p>
              <p className="text-3xl font-bold">{stats.pass}</p>
              <p className="text-emerald-100 text-sm">
                ({stats.total > 0 ? Math.round((stats.pass / stats.total) * 100) : 0}%)
              </p>
            </div>
            <i className="fas fa-check-circle text-4xl text-emerald-200"></i>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100">今月面談</p>
              <p className="text-3xl font-bold">{stats.thisMonth}</p>
            </div>
            <i className="fas fa-calendar-alt text-4xl text-amber-200"></i>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100">保留中</p>
              <p className="text-3xl font-bold">{stats.pending}</p>
            </div>
            <i className="fas fa-clock text-4xl text-purple-200"></i>
          </div>
        </div>
      </div>

      {/* 🏆 エンジニア別パフォーマンス */}
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <h3 className="text-xl font-bold text-slate-700 mb-6 flex items-center gap-3">
          <i className="fas fa-trophy text-amber-500"></i>
          エンジニア別パフォーマンス
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {engineerStats.slice(0, 6).map((engineer, index) => (
            <div key={engineer.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors duration-200">
              {/* ランキング */}
              <div className="flex-shrink-0">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                  index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-500' :
                  index === 1 ? 'bg-gradient-to-br from-gray-400 to-gray-500' :
                  index === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-700' :
                  'bg-gradient-to-br from-slate-400 to-slate-500'
                }`}>
                  {index + 1}
                </div>
              </div>

              {/* エンジニア情報 */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-slate-700">{engineer.name}</h4>
                  <span className="text-slate-500 text-sm">{engineer.totalInterviews}件</span>
                </div>
                
                {/* 合格率バー */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-slate-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-emerald-400 to-emerald-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${engineer.passRate}%` }}
                    ></div>
                  </div>
                  <span className="text-slate-600 text-sm font-medium">{engineer.passRate}%</span>
                </div>
              </div>

              {/* 最近の面談 */}
              <div className="flex gap-1">
                {engineer.recentInterviews.map(interview => (
                  <div
                    key={interview.id}
                    className={`w-3 h-3 rounded-full ${
                      interview.result === 'pass' ? 'bg-emerald-400' :
                      interview.result === 'fail' ? 'bg-red-400' :
                      interview.result === 'pending' ? 'bg-amber-400' :
                      'bg-gray-400'
                    }`}
                    title={`${interview.client_company} - ${interview.result}`}
                  ></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 📅 月別推移グラフ風表示 */}
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <h3 className="text-xl font-bold text-slate-700 mb-6 flex items-center gap-3">
          <i className="fas fa-chart-line text-blue-500"></i>
          月別面談推移
        </h3>
        
        <div className="grid grid-cols-6 gap-4">
          {Array.from({ length: 6 }, (_, i) => {
            const date = new Date();
            date.setMonth(date.getMonth() - (5 - i));
            const monthInterviews = interviews.filter(interview => {
              const interviewDate = new Date(interview.interview_date);
              return interviewDate.getMonth() === date.getMonth() && 
                     interviewDate.getFullYear() === date.getFullYear();
            });
            
            return (
              <div key={i} className="text-center">
                <div className="mb-2">
                  <div 
                    className="bg-gradient-to-t from-amber-400 to-amber-300 rounded-lg mx-auto transition-all duration-500"
                    style={{ 
                      width: '40px',
                      height: `${Math.max(20, (monthInterviews.length / Math.max(...Array.from({ length: 6 }, (_, j) => {
                        const d = new Date();
                        d.setMonth(d.getMonth() - (5 - j));
                        return interviews.filter(interview => {
                          const interviewDate = new Date(interview.interview_date);
                          return interviewDate.getMonth() === d.getMonth() && 
                                 interviewDate.getFullYear() === d.getFullYear();
                        }).length;
                      }))) * 100)}px` 
                    }}
                  ></div>
                </div>
                <p className="text-slate-600 text-sm">
                  {date.getMonth() + 1}月
                </p>
                <p className="text-slate-700 font-bold">
                  {monthInterviews.length}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}