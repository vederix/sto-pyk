import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import {
  PieChart,
  BarChart3,
  TrendingUp,
  Activity
} from 'lucide-react';

export default function AnalyticsChartsPimpinan({ tugas = [], barang = [] }) {
  const { isDark } = useTheme();
  const [hoveredSlice, setHoveredSlice] = useState(null);

  // =========================================================================
  // 1. DATA KALKULASI CHART 1: PIE / DONUT (Distribusi Status Tiket & SLA)
  // =========================================================================
  const totalTasks = tugas.length || 1; // avoid divide by 0
  const doneCount = tugas.filter(t => t.status === 'Done').length;
  const progressCount = tugas.filter(t => t.status === 'Progress').length;
  const waitingCount = tugas.filter(t => t.status !== 'Done' && t.status !== 'Progress').length;

  const donePercent = Math.round((doneCount / totalTasks) * 100);
  const progressPercent = Math.round((progressCount / totalTasks) * 100);
  const waitingPercent = Math.max(0, 100 - donePercent - progressPercent);

  // SVG Donut calculation (circumference = 2 * pi * r = 2 * 3.14159 * 40 = 251.32)
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const doneStroke = (doneCount / totalTasks) * circumference;
  const progressStroke = (progressCount / totalTasks) * circumference;
  const waitingStroke = (waitingCount / totalTasks) * circumference;

  const doneOffset = 0;
  const progressOffset = -doneStroke;
  const waitingOffset = -(doneStroke + progressStroke);

  // =========================================================================
  // 2. DATA KALKULASI CHART 2: BAR CHART (Volume Jenis Pekerjaan)
  // =========================================================================
  const taskCategories = [
    {
      label: 'Pasang Baru',
      desc: 'Instalasi IndiHome Baru',
      count: tugas.filter(t => t.jenis_kerja?.toLowerCase().includes('pasang')).length,
      color: 'from-blue-600 to-cyan-500',
      barBg: 'bg-blue-500'
    },
    {
      label: 'Gangguan (Repair)',
      desc: 'Assurance & Tiket Putus',
      count: tugas.filter(t => t.jenis_kerja?.toLowerCase().includes('gangguan') || t.jenis_kerja?.toLowerCase().includes('repair')).length,
      color: 'from-burgundy-600 to-rose-500',
      barBg: 'bg-burgundy-600'
    },
    {
      label: 'Maintenance ODP',
      desc: 'Redaman & Feeder Optik',
      count: tugas.filter(t => t.jenis_kerja?.toLowerCase().includes('maintenance') || t.jenis_kerja?.toLowerCase().includes('odp')).length,
      color: 'from-purple-600 to-indigo-500',
      barBg: 'bg-purple-600'
    },
    {
      label: 'Dismantling/Relokasi',
      desc: 'Pencabutan & Pindah Jalur',
      count: tugas.filter(t =>
        !t.jenis_kerja?.toLowerCase().includes('pasang') &&
        !t.jenis_kerja?.toLowerCase().includes('gangguan') &&
        !t.jenis_kerja?.toLowerCase().includes('maintenance')
      ).length,
      color: 'from-amber-600 to-orange-500',
      barBg: 'bg-amber-600'
    }
  ];

  const maxTaskCount = Math.max(...taskCategories.map(c => c.count), 1);

  // =========================================================================
  // 3. DATA KALKULASI CHART 3: DIAGRAM MATERIAL (Tingkat Ketersediaan Gudang)
  // =========================================================================
  // Target stok aman rata-rata = 80 unit/roll/pcs
  const criticalItems = barang.slice(0, 6).map(b => {
    const threshold = 25;
    const isCritical = b.stok <= threshold;
    const isNormal = b.stok > threshold && b.stok < 70;
    const isSafe = b.stok >= 70;
    const fillPercent = Math.min(100, Math.round((b.stok / 120) * 100));

    return {
      nama: b.nama_barang,
      stok: b.stok,
      satuan: b.satuan,
      percent: fillPercent,
      isCritical,
      isNormal,
      isSafe
    };
  });

  return (
    <div className="space-y-4">
      {/* Header Visual Analytics */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-xl bg-burgundy-600/20 text-burgundy-500 border border-burgundy-500/30">
            <Activity className="w-4 h-4" />
          </span>
          <h2 className={`text-sm sm:text-base font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Visual Analitik & Grafik Kinerja STO Payakumbuh
          </h2>
        </div>
        <span className="text-[11px] font-bold text-slate-400">
          Update Real-Time Operasional
        </span>
      </div>

      {/* Grid 3 Chart Visuals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* ================================================================= */}
        {/* VISUAL 1: PIE / DONUT CHART (Distribusi Tiket & SLA) */}
        {/* ================================================================= */}
        <div className={`p-5 rounded-3xl border ${
          isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        } flex flex-col justify-between transition-colors`}>
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/60 mb-4">
              <div className="flex items-center gap-2">
                <PieChart className="w-4 h-4 text-emerald-500" />
                <h3 className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  1. Pie Chart: Status Tiket (SLA)
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                {donePercent}% Selesai
              </span>
            </div>

            {/* SVG Donut Graphic */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-2">
              <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  {/* Background Circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="transparent"
                    stroke={isDark ? '#1e293b' : '#e2e8f0'}
                    strokeWidth="14"
                  />
                  {/* Segment: Selesai / Done */}
                  {doneStroke > 0 && (
                    <circle
                      cx="50"
                      cy="50"
                      r={radius}
                      fill="transparent"
                      stroke="#10b981"
                      strokeWidth="14"
                      strokeDasharray={`${doneStroke} ${circumference}`}
                      strokeDashoffset={doneOffset}
                      className="transition-all duration-700 ease-out cursor-pointer hover:stroke-emerald-400"
                      onMouseEnter={() => setHoveredSlice('Done')}
                      onMouseLeave={() => setHoveredSlice(null)}
                    />
                  )}
                  {/* Segment: In Progress */}
                  {progressStroke > 0 && (
                    <circle
                      cx="50"
                      cy="50"
                      r={radius}
                      fill="transparent"
                      stroke="#3b82f6"
                      strokeWidth="14"
                      strokeDasharray={`${progressStroke} ${circumference}`}
                      strokeDashoffset={progressOffset}
                      className="transition-all duration-700 ease-out cursor-pointer hover:stroke-blue-400"
                      onMouseEnter={() => setHoveredSlice('Progress')}
                      onMouseLeave={() => setHoveredSlice(null)}
                    />
                  )}
                  {/* Segment: Open / Menunggu */}
                  {waitingStroke > 0 && (
                    <circle
                      cx="50"
                      cy="50"
                      r={radius}
                      fill="transparent"
                      stroke="#f59e0b"
                      strokeWidth="14"
                      strokeDasharray={`${waitingStroke} ${circumference}`}
                      strokeDashoffset={waitingOffset}
                      className="transition-all duration-700 ease-out cursor-pointer hover:stroke-amber-400"
                      onMouseEnter={() => setHoveredSlice('Open')}
                      onMouseLeave={() => setHoveredSlice(null)}
                    />
                  )}
                </svg>

                {/* Center Donut Label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                  <span className="text-xl font-black">{totalTasks}</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                    {hoveredSlice || 'Total Tiket'}
                  </span>
                </div>
              </div>

              {/* Legends with values */}
              <div className="space-y-2 text-xs w-full max-w-[170px]">
                <div className={`p-2 rounded-xl flex items-center justify-between border ${
                  hoveredSlice === 'Done' ? 'bg-emerald-500/20 border-emerald-500/40' : isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span className="font-semibold text-[11px]">Selesai</span>
                  </div>
                  <span className="font-bold text-emerald-500">{doneCount} ({donePercent}%)</span>
                </div>

                <div className={`p-2 rounded-xl flex items-center justify-between border ${
                  hoveredSlice === 'Progress' ? 'bg-blue-500/20 border-blue-500/40' : isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                    <span className="font-semibold text-[11px]">Progress</span>
                  </div>
                  <span className="font-bold text-blue-500">{progressCount} ({progressPercent}%)</span>
                </div>

                <div className={`p-2 rounded-xl flex items-center justify-between border ${
                  hoveredSlice === 'Open' ? 'bg-amber-500/20 border-amber-500/40' : isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    <span className="font-semibold text-[11px]">Pool Tiket</span>
                  </div>
                  <span className="font-bold text-amber-500">{waitingCount} ({waitingPercent}%)</span>
                </div>
              </div>
            </div>
          </div>

          <p className="text-[10px] text-slate-400 mt-2 text-center pt-2 border-t border-slate-800/40">
            Penyelesaian tepat waktu berbanding tiket aktif di wilayah Payakumbuh.
          </p>
        </div>

        {/* ================================================================= */}
        {/* VISUAL 2: BAR CHART (Volume Jenis Pekerjaan STO) */}
        {/* ================================================================= */}
        <div className={`p-5 rounded-3xl border ${
          isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        } flex flex-col justify-between transition-colors`}>
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/60 mb-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-500" />
                <h3 className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  2. Diagram Batang: Jenis Pekerjaan
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                4 Kategori
              </span>
            </div>

            {/* Horizontal / Progress Bars per Category */}
            <div className="space-y-3 pt-1">
              {taskCategories.map(cat => {
                const barWidth = Math.max(8, Math.round((cat.count / maxTaskCount) * 100));
                return (
                  <div key={cat.label} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{cat.label}</span>
                        <span className="text-[10px] text-slate-400 ml-1.5 hidden sm:inline">({cat.desc})</span>
                      </div>
                      <span className="font-mono font-bold text-xs">{cat.count} Tiket</span>
                    </div>

                    {/* Bar Line */}
                    <div className={`w-full h-3 rounded-full overflow-hidden ${isDark ? 'bg-slate-950' : 'bg-slate-100'} p-0.5 border border-slate-800/40`}>
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${cat.color} transition-all duration-700 ease-out`}
                        style={{ width: `${barWidth}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className={`mt-3 p-2.5 rounded-2xl ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'} border flex items-center justify-between text-[11px]`}>
            <span className="text-slate-400">Dominasi Pekerjaan:</span>
            <span className="font-bold text-blue-400">
              {taskCategories.reduce((prev, current) => (prev.count > current.count) ? prev : current).label}
            </span>
          </div>
        </div>

        {/* ================================================================= */}
        {/* VISUAL 3: DIAGRAM MATERIAL (Tingkat Ketersediaan Logistik Gudang) */}
        {/* ================================================================= */}
        <div className={`p-5 rounded-3xl border ${
          isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        } flex flex-col justify-between transition-colors`}>
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/60 mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-500" />
                <h3 className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  3. Grafik Rasio: Logistik Gudang
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                Safety Stock
              </span>
            </div>

            {/* Inventory Level Bars */}
            <div className="space-y-2.5">
              {criticalItems.length === 0 ? (
                <div className="text-xs text-slate-500 italic py-4 text-center">
                  Data inventaris gudang sedang dimuat...
                </div>
              ) : (
                criticalItems.map((item, idx) => (
                  <div key={item.nama + idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className={`font-semibold text-[11px] truncate max-w-[160px] ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        {item.nama}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-xs">{item.stok} {item.satuan}</span>
                        {item.isCritical ? (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                            Kritis
                          </span>
                        ) : item.isSafe ? (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            Aman
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            Waspada
                          </span>
                        )}
                      </div>
                    </div>

                    <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-950' : 'bg-slate-100'}`}>
                      <div
                        className={`h-full rounded-full transition-all duration-700 ease-out ${
                          item.isCritical
                            ? 'bg-rose-500'
                            : item.isSafe
                            ? 'bg-emerald-500'
                            : 'bg-amber-500'
                        }`}
                        style={{ width: `${item.percent}%` }}
                      ></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-800/40 flex items-center justify-between text-[10px] text-slate-400">
            <span>Batas Kritis: ≤ 25 Unit/Roll</span>
            <span className="text-emerald-400 font-bold">Ambang Aman: ≥ 70 Unit</span>
          </div>
        </div>

      </div>
    </div>
  );
}
