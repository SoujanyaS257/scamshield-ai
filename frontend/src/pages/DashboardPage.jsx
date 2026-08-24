/**
 * DashboardPage.jsx — Scam trend analytics dashboard
 * Shows charts from real backend data (analysis history)
 */

import { useState, useEffect } from 'react'
import {
  LineChart, Line,
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid,
  Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts'
import { getDashboard } from '../services/api.js'

// Chart colors
const COLORS = [
  '#e74c3c', '#e67e22', '#f39c12',
  '#2ecc71', '#3498db', '#9b59b6',
  '#1abc9c', '#e91e63',
]

// ── Stat card ─────────────────────────────────────────────────
function StatCard({ emoji, label, value, sub, colorClass = 'text-indigo-600 dark:text-indigo-400' }) {
  return (
    <div className="card p-5 space-y-1">
      <div className="flex items-start justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {label}
        </p>
        <span className="text-2xl">{emoji}</span>
      </div>
      <p className={`text-3xl font-black ${colorClass}`}>
        {value}
      </p>
      {sub && (
        <p className="text-xs text-gray-400">{sub}</p>
      )}
    </div>
  )
}

// ── Custom tooltip for charts ─────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-gray-900 text-white text-xs
                    px-3 py-2 rounded-xl shadow-xl space-y-1">
      <p className="font-bold text-gray-300">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  )
}

// ── Demo data (shown when DB is empty) ───────────────────────
const DEMO_TREND = [
  { date: 'Jan 13', scams: 3,  legitimate: 7,  avg_risk: 55 },
  { date: 'Jan 14', scams: 6,  legitimate: 4,  avg_risk: 68 },
  { date: 'Jan 15', scams: 4,  legitimate: 8,  avg_risk: 51 },
  { date: 'Jan 16', scams: 9,  legitimate: 3,  avg_risk: 77 },
  { date: 'Jan 17', scams: 5,  legitimate: 6,  avg_risk: 63 },
  { date: 'Jan 18', scams: 7,  legitimate: 5,  avg_risk: 71 },
  { date: 'Jan 19', scams: 2,  legitimate: 10, avg_risk: 38 },
]

const DEMO_TYPES = [
  { type: 'OTP Theft',       count: 14 },
  { type: 'UPI Fraud',       count: 11 },
  { type: 'Lottery Scam',    count: 8  },
  { type: 'Phishing Attack', count: 7  },
  { type: 'Impersonation',   count: 5  },
  { type: 'Job Fraud',       count: 3  },
]

const DEMO_RISK_DIST = [
  { level: 'CRITICAL', count: 18 },
  { level: 'HIGH',     count: 12 },
  { level: 'MEDIUM',   count: 8  },
  { level: 'LOW',      count: 14 },
]


export default function DashboardPage() {
  const [data,       setData]       = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)
  const [lastUpdate, setLastUpdate] = useState(null)

  const fetchData = async () => {
    try {
      const response = await getDashboard()
      setData(response)
      setLastUpdate(new Date())
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  // Use real data if available, demo data if DB is empty
  const trendData = data?.daily_trend?.length > 0
    ? data.daily_trend
    : DEMO_TREND

  const typesData = data?.scam_types?.length > 0
    ? data.scam_types.map(t => ({ type: t.type, count: t.count }))
    : DEMO_TYPES

  const riskDistData = data?.risk_distribution?.length > 0
    ? data.risk_distribution
    : DEMO_RISK_DIST

  // ── Loading ─────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center
                      min-h-[400px] gap-4">
        <div className="text-5xl animate-spin-slow">📊</div>
        <p className="text-gray-400">Loading dashboard...</p>
      </div>
    )
  }

  // ── Stats ───────────────────────────────────────────────
  const totalAnalyses  = data?.total_analyses   ?? DEMO_TREND.reduce((a,b) => a + b.scams + b.legitimate, 0)
  const scamDetected   = data?.scam_detected    ?? DEMO_TREND.reduce((a,b) => a + b.scams, 0)
  const legitimateCount = data?.legitimate_count ?? DEMO_TREND.reduce((a,b) => a + b.legitimate, 0)
  const scamPct        = data?.scam_percentage  ?? Math.round(scamDetected / Math.max(totalAnalyses,1) * 100)

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">

      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900
                         dark:text-white">
            📊 Scam Trends Dashboard
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
            Real-time scam detection statistics
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Backend offline notice */}
          {error && (
            <span className="text-xs text-orange-500
                             bg-orange-50 dark:bg-orange-900/20
                             px-3 py-1.5 rounded-lg border
                             border-orange-200 dark:border-orange-800">
              ⚠️ Showing demo data (backend offline)
            </span>
          )}
          {/* Refresh button */}
          <button
            onClick={() => { setLoading(true); fetchData() }}
            className="px-4 py-2 text-sm rounded-xl font-medium
                       bg-gray-100 dark:bg-gray-800
                       text-gray-600 dark:text-gray-300
                       hover:bg-gray-200 dark:hover:bg-gray-700
                       transition-colors flex items-center gap-1.5"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* ── Stat cards ─────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          emoji="🔍"
          label="Total Analyses"
          value={totalAnalyses.toLocaleString()}
          colorClass="text-indigo-600 dark:text-indigo-400"
        />
        <StatCard
          emoji="🔴"
          label="Scams Detected"
          value={scamDetected.toLocaleString()}
          sub={`${scamPct}% of total`}
          colorClass="text-red-600 dark:text-red-400"
        />
        <StatCard
          emoji="✅"
          label="Legitimate"
          value={legitimateCount.toLocaleString()}
          colorClass="text-green-600 dark:text-green-400"
        />
        <StatCard
          emoji="📈"
          label="Scam Rate"
          value={`${scamPct}%`}
          sub="of all analyses"
          colorClass="text-orange-600 dark:text-orange-400"
        />
      </div>

      {/* ── Charts row ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Daily trend — line chart */}
        <div className="card p-6 space-y-4">
          <h3 className="font-bold text-gray-800 dark:text-white">
            📈 Daily Analysis Trend
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={trendData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(150,150,150,0.15)"
              />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Line
                type="monotone"
                dataKey="scams"
                name="Scams"
                stroke="#e74c3c"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#e74c3c' }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="legitimate"
                name="Legitimate"
                stroke="#2ecc71"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#2ecc71' }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Scam types — horizontal bar chart */}
        <div className="card p-6 space-y-4">
          <h3 className="font-bold text-gray-800 dark:text-white">
            🎯 Top Scam Types
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={typesData} layout="vertical">
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(150,150,150,0.15)"
                horizontal={false}
              />
              <XAxis
                type="number"
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                dataKey="type"
                type="category"
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
                width={115}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Count" radius={[0, 6, 6, 0]}>
                {typesData.map((_, idx) => (
                  <Cell
                    key={idx}
                    fill={COLORS[idx % COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>

      {/* ── Risk distribution — pie chart ───────────────── */}
      <div className="card p-6 space-y-4">
        <h3 className="font-bold text-gray-800 dark:text-white">
          🎨 Risk Level Distribution
        </h3>
        <div className="flex flex-col sm:flex-row
                        items-center gap-6">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={riskDistData}
                dataKey="count"
                nameKey="level"
                cx="50%"
                cy="50%"
                outerRadius={85}
                innerRadius={40}
                paddingAngle={3}
                label={({ level, percent }) =>
                  `${level} ${(percent * 100).toFixed(0)}%`
                }
                labelLine={false}
              >
                {riskDistData.map((entry, idx) => (
                  <Cell
                    key={entry.level}
                    fill={
                      entry.level === 'CRITICAL' ? '#e74c3c' :
                      entry.level === 'HIGH'     ? '#e67e22' :
                      entry.level === 'MEDIUM'   ? '#f39c12' :
                                                   '#2ecc71'
                    }
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          {/* Legend */}
          <div className="space-y-2 shrink-0">
            {[
              { level: 'CRITICAL', color: '#e74c3c', desc: '76-100 score' },
              { level: 'HIGH',     color: '#e67e22', desc: '51-75 score'  },
              { level: 'MEDIUM',   color: '#f39c12', desc: '26-50 score'  },
              { level: 'LOW',      color: '#2ecc71', desc: '0-25 score'   },
            ].map(({ level, color, desc }) => (
              <div key={level}
                   className="flex items-center gap-2.5">
                <div className="w-3 h-3 rounded-full shrink-0"
                     style={{ backgroundColor: color }} />
                <div>
                  <span className="text-sm font-semibold
                                   text-gray-700 dark:text-gray-300">
                    {level}
                  </span>
                  <span className="text-xs text-gray-400 ml-1.5">
                    {desc}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Footer ─────────────────────────────────────── */}
      <div className="flex items-center justify-between
                      text-xs text-gray-400 dark:text-gray-500
                      flex-wrap gap-2">
        <span>
          {error
            ? '⚠️ Demo data — connect backend to see real stats'
            : '✅ Live data from backend database'
          }
        </span>
        {lastUpdate && (
          <span>
            Last updated: {lastUpdate.toLocaleTimeString()}
            &nbsp;· Auto-refreshes every 30s
          </span>
        )}
      </div>

    </div>
  )
}