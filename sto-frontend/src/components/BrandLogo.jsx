/**
 * ============================================================================
 * KOMPONEN: BrandLogo (Logo Resmi Aplikasi Telkom Akses STO Payakumbuh)
 * ============================================================================
 * Penjelasan Teknis:
 * Komponen ini menampilkan logo identitas Telkom Akses pada Sidebar dan Header.
 * 
 * CARA MENGGANTI LOGO APLIKASI:
 * 1. Anda bisa memberikan prop 'logoUrl', contoh: <BrandLogo logoUrl="https://link-anda.com/logo.png" />
 * 2. Atau Anda bisa mengubah nilai variabel default `DEFAULT_PLACEHOLDER_LOGO` di bawah ini.
 * 3. Jika link gambar tidak diisi atau gambar gagal dimuat (error), sistem otomatis
 *    menampilkan lambang vektor SVG Telkom Akses berteknologi tinggi (Hexagon Fiber Shield).
 * ============================================================================
 */

import React, { useState } from 'react';

// Link placeholder default (bisa Anda ganti dengan link URL logo resmi Telkom Akses / STO pilihan Anda)
const DEFAULT_PLACEHOLDER_LOGO = ""; // Kosongkan atau isi misal link gambar logo Telkom Akses

export default function BrandLogo({
  logoUrl = DEFAULT_PLACEHOLDER_LOGO,
  size = 'md',
  collapsed = false,
  className = ''
}) {
  // State untuk menangani jika gambar gagal dimuat
  const [imageError, setImageError] = useState(false);

  // Pengaturan ukuran logo: 'sm', 'md', 'lg', 'xl'
  const iconSize = size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-14 h-14' : size === 'xl' ? 'w-20 h-20' : 'w-10 h-10';
  const textTitle = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-xl' : size === 'xl' ? 'text-2xl' : 'text-sm font-black';
  const textSub = size === 'sm' ? 'text-[9px]' : size === 'lg' ? 'text-xs' : size === 'xl' ? 'text-xs' : 'text-[10px]';

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Wadah Ikon Logo */}
      <div className={`relative ${iconSize} flex-shrink-0 flex items-center justify-center`}>
        {/* Efek Cahaya Halus (Ambient Glow) */}
        <div className="absolute inset-0 bg-burgundy-600/30 rounded-2xl blur-md pointer-events-none" />

        {/* Jika ada URL Logo gambar dan tidak error, tampilkan gambar tersebut */}
        {logoUrl && !imageError ? (
          <div className="relative w-full h-full rounded-2xl overflow-hidden border border-burgundy-500/30 shadow-xl bg-slate-900 flex items-center justify-center">
            <img
              src={logoUrl}
              alt="Logo Telkom Akses STO"
              className="w-full h-full object-contain p-1"
              onError={() => setImageError(true)}
            />
          </div>
        ) : (
          /* Fallback: Lambang Hexagon Fiber Command SVG Telkom Akses Berteknologi Tinggi */
          <div className="relative w-full h-full rounded-2xl bg-gradient-to-br from-burgundy-700 via-burgundy-900 to-navy-950 p-[1.5px] shadow-xl shadow-burgundy-950/40 border border-burgundy-500/30">
            <div className="w-full h-full rounded-[14px] bg-gradient-to-tr from-navy-950 via-slate-900 to-navy-900 flex items-center justify-center overflow-hidden relative">
              
              {/* Pola Kisi Grid Fiber Optik */}
              <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#be123c_1px,transparent_1px)] [background-size:6px_6px]" />

              {/* Ikon Vektor SVG Fiber Core */}
              <svg
                viewBox="0 0 40 40"
                className="w-3/4 h-3/4 drop-shadow-[0_2px_8px_rgba(190,18,60,0.6)]"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <linearGradient id="taGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f43f5e" />
                    <stop offset="50%" stopColor="#be123c" />
                    <stop offset="100%" stopColor="#881337" />
                  </linearGradient>
                </defs>

                {/* Lingkaran Pulsa Sinyal Cahaya */}
                <circle cx="20" cy="20" r="14" stroke="url(#taGrad1)" strokeWidth="2.2" strokeDasharray="6 3" />
                <circle cx="20" cy="6" r="2.2" fill="#f43f5e" />
                <circle cx="34" cy="20" r="2.2" fill="#38bdf8" />
                <circle cx="20" cy="34" r="2.2" fill="#f43f5e" />
                <circle cx="6" cy="20" r="2.2" fill="#38bdf8" />

                {/* Inti Berlian Fiber Core Telkom Akses */}
                <path
                  d="M14 15L20 9L26 15L26 25L20 31L14 25Z"
                  fill="url(#taGrad1)"
                  fillOpacity="0.85"
                  stroke="#ffffff"
                  strokeWidth="1.2"
                />

                <circle cx="20" cy="20" r="3.2" fill="#ffffff" />
                <circle cx="20" cy="20" r="1.5" fill="#be123c" />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Teks Identitas Perusahaan (Disembunyikan jika sidebar ditutup/collapsed) */}
      {!collapsed && (
        <div className="flex flex-col leading-tight min-w-0">
          <div className={`font-black tracking-tight ${textTitle} text-slate-900 dark:text-white flex items-center gap-1.5 truncate`}>
            <span>TELKOM</span>
            <span className="text-burgundy-600 dark:text-burgundy-500 font-extrabold">AKSES</span>
          </div>
          <div className={`font-semibold tracking-wider uppercase text-slate-600 dark:text-slate-400 ${textSub} truncate flex items-center gap-1`}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>STO PAYAKUMBUH</span>
          </div>
        </div>
      )}
    </div>
  );
}

