import React, { useMemo } from 'react';
import { useUser } from '../contexts/UserContext';

const pipelineStages = [
  { label: 'リード獲得', value: 0, target: 0, accent: 'from-blue-400 to-blue-600' },
  { label: '案件化', value: 0, target: 0, accent: 'from-indigo-400 to-indigo-600' },
  { label: '提案中', value: 0, target: 0, accent: 'from-purple-400 to-purple-600' },
  { label: '調整中', value: 0, target: 0, accent: 'from-rose-400 to-rose-600' }
];

const availabilityMatrix = [
  { label: '今月', bench: 0, project: 0, notice: 0 },
  { label: '来月', bench: 0, project: 0, notice: 0 },
  { label: '3ヶ月以内', bench: 0, project: 0, notice: 0 }
];

const skillHeatmap = [
  { skill: 'React / Next.js', demand: 0, trend: 'steady', clients: 0 },
  { skill: 'Python / Django', demand: 0, trend: 'steady', clients: 0 },
  { skill: 'AWS / IaC', demand: 0, trend: 'steady', clients: 0 },
  { skill: '生成AI / LLM', demand: 0, trend: 'steady', clients: 0 },
  { skill: 'データ分析', demand: 0, trend: 'steady', clients: 0 }
];

const executiveSignals = [
  {
    title: 'パイプライン健全性',
    value: '―',
    detail: 'データなし',
    sentiment: 'neutral'
  },
  {
    title: '稼働率',
    value: '―',
    detail: 'データなし',
    sentiment: 'neutral'
  },
  {
    title: '受注確度',
    value: '―',
    detail: 'データなし',
    sentiment: 'neutral'
  }
];

const geoLoad = [
  { label: '首都圈', percent: 0 },
  { label: '関西', percent: 0 },
  { label: 'リモート', percent: 0 }
];

export default function AnalyticsDashboard() {
  const { user } = useUser();

  const kpis = useMemo(() => ([
    { label: '総パイプライン金額', value: '―', delta: '―', accent: 'from-amber-500 to-rose-500' },
    { label: 'アクティブ案件', value: '0件', delta: '―', accent: 'from-blue-500 to-indigo-500' },
    { label: '空き予定エンジニア', value: '0名', delta: '―', accent: 'from-emerald-500 to-teal-500' },
    { label: '平均リードタイム', value: '―', delta: '―', accent: 'from-purple-500 to-fuchsia-500' }
  ]), []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.2),_transparent_45%)]"></div>
        <div className="absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-emerald-400/20 to-transparent blur-3xl"></div>
      </div>

      <div className="relative z-10 px-8 py-12 space-y-10">
        <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-emerald-200/70">Executive View</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">
              Analytics Dashboard
            </h1>
            <p className="mt-3 text-slate-300">
              パイプラインとリソースを横断的に可視化し、投資判断とアサイン戦略を即断できるエグゼクティブ向けビューです。
            </p>
          </div>
          <div className="px-5 py-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur">
            <p className="text-xs text-slate-300">閲覧権限</p>
            <p className="text-lg font-semibold">{user?.name || 'Executive User'}</p>
            <p className="text-sm text-slate-400">{user?.email}</p>
          </div>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {kpis.map((kpi) => (
            <div key={kpi.label} className="p-6 rounded-2xl bg-slate-900/70 border border-white/5 shadow-[0_15px_35px_rgba(0,0,0,0.35)]">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{kpi.label}</p>
              <p className="mt-3 text-3xl font-semibold">{kpi.value}</p>
              <div className="mt-4 h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                <div className={`h-full bg-gradient-to-r ${kpi.accent}`} style={{ width: '100%' }}></div>
              </div>
              <p className="mt-3 text-sm text-emerald-300">{kpi.delta}</p>
            </div>
          ))}
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 rounded-3xl bg-slate-950/80 border border-white/5 p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs tracking-[0.3em] text-slate-400">Pipeline Monitor</p>
                <h2 className="text-2xl font-semibold">パイプライン負荷</h2>
              </div>
              <button className="text-sm px-4 py-2 rounded-full border border-white/10 hover:border-white/40 transition">詳細レポート</button>
            </div>
            <div className="space-y-5">
              {pipelineStages.map((stage) => (
                <div key={stage.label}>
                  <div className="flex items-center justify-between text-sm text-slate-300">
                    <span>{stage.label}</span>
                    <span>{stage.value}% / 目標 {stage.target}%</span>
                  </div>
                  <div className="mt-2 h-3 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${stage.accent}`}
                      style={{ width: `${Math.min(stage.value, 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-slate-950/80 border border-white/5 p-8 space-y-6">
            <p className="text-xs tracking-[0.3em] text-slate-400">Geo Load</p>
            <h2 className="text-2xl font-semibold">エリア別リソース</h2>
            <div className="space-y-4">
              {geoLoad.map((area) => (
                <div key={area.label}>
                  <div className="flex items-center justify-between text-sm text-slate-300">
                    <span>{area.label}</span>
                    <span>{area.percent}%</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400" style={{ width: `${area.percent}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-400">リモート比率は 15% まで増加。次四半期に 25% を目標。</p>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-3xl bg-slate-950/80 border border-white/5 p-8">
            <p className="text-xs tracking-[0.3em] text-slate-400">Availability</p>
            <h2 className="text-2xl font-semibold">エンジニア空き状況</h2>
            <div className="mt-6 space-y-6">
              {availabilityMatrix.map((bucket) => {
                const total = bucket.bench + bucket.project + bucket.notice;
                return (
                  <div key={bucket.label}>
                    <div className="flex items-center justify-between text-sm text-slate-300">
                      <span>{bucket.label}</span>
                      <span>{total}名</span>
                    </div>
                    <div className="mt-2 h-4 rounded-full bg-white/5 flex overflow-hidden">
                      <span className="h-full bg-gradient-to-r from-amber-400 to-amber-500" style={{ width: `${(bucket.bench / total) * 100}%` }} title="即時稼働"></span>
                      <span className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500" style={{ width: `${(bucket.project / total) * 100}%` }} title="案件中"></span>
                      <span className="h-full bg-gradient-to-r from-sky-400 to-sky-500" style={{ width: `${(bucket.notice / total) * 100}%` }} title="稼働調整中"></span>
                    </div>
                    <div className="flex text-[11px] text-slate-400 gap-4 mt-2">
                      <span>即時 {bucket.bench}名</span>
                      <span>案件中 {bucket.project}名</span>
                      <span>調整中 {bucket.notice}名</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-3xl bg-slate-950/80 border border-white/5 p-8">
            <p className="text-xs tracking-[0.3em] text-slate-400">Skill Demand</p>
            <h2 className="text-2xl font-semibold">求められているスキル</h2>
            <div className="mt-6 space-y-5">
              {skillHeatmap.map((row) => (
                <div key={row.skill} className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{row.skill}</p>
                    <p className="text-xs text-slate-400">要望クライアント {row.clients} 社</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold">{row.demand}%</p>
                    <span className={`text-xs ${row.trend === 'up' ? 'text-emerald-300' : row.trend === 'down' ? 'text-rose-300' : 'text-slate-400'}`}>
                      {row.trend === 'up' ? '上昇' : row.trend === 'down' ? '減少' : '安定'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {executiveSignals.map((signal) => (
            <div key={signal.title} className="rounded-3xl bg-white/5 border border-white/10 p-6">
              <p className="text-xs tracking-[0.3em] text-slate-200">Signal</p>
              <h3 className="mt-2 text-xl font-semibold">{signal.title}</h3>
              <p
                className={`mt-4 text-3xl font-semibold ${
                  signal.sentiment === 'positive'
                    ? 'text-emerald-300'
                    : signal.sentiment === 'negative'
                      ? 'text-rose-300'
                      : 'text-amber-200'
                }`}
              >
                {signal.value}
              </p>
              <p className="mt-3 text-sm text-slate-200 leading-relaxed">{signal.detail}</p>
            </div>
          ))}
          <div className="rounded-3xl bg-slate-900/80 border border-white/5 p-6 lg:col-span-1">
            <p className="text-xs tracking-[0.3em] text-slate-400">Action Board</p>
            <h3 className="mt-2 text-xl font-semibold">推奨アクション</h3>
            <ul className="mt-4 space-y-4 text-sm text-slate-200">
              <li className="flex items-start gap-3">
                <span className="mt-1 w-2 h-2 rounded-full bg-emerald-300"></span>
                生成AI案件の専門チームを 2 名増強し、提案スピードを +20% 向上。
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 w-2 h-2 rounded-full bg-emerald-300"></span>
                フルリモート稼働比率を 25% まで引き上げ、採用プールを拡張。
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 w-2 h-2 rounded-full bg-amber-300"></span>
                案件化フェーズの営業リードに専任アドバイザーをアサイン。
              </li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
