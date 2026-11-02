/**
 * ============================================================================
 * KOMPONEN: WebGISMap (Peta Geospasial Infrastruktur Jaringan STO Telkom Akses)
 * ============================================================================
 * Standar WebGIS Resmi Pemetaan Infrastruktur Fiber Optic Payakumbuh:
 * 1. Peta terpusat di Kantor STO Telkom Akses Payakumbuh (Koto Nan IV).
 * 2. Menampilkan sebaran titik ODP (Optical Distribution Point) Telkom Akses.
 * 3. Indikator kapasitas port ODP (Tersedia, Hampir Penuh, Penuh, Maintenance).
 * 4. PENGELOMPOKAN (GROUPING) TITIK ODP BERDASARKAN WILAYAH KERJA & STATUS.
 * 5. CRUD LENGKAP ODP OLEH PIMPINAN (Tambah via Pinpoint/Form, Edit, Hapus)
 *    tersinkronisasi langsung ke tabel 'odp' di Supabase Cloud.
 * 6. Bebas dari kabel distribusi, murni fokus pada aset titik ODP lapangan.
 * ============================================================================
 */

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useApp } from '../context/AppContext';
import {
  Layers,
  Check,
  MapPin,
  Plus,
  Filter,
  X,
  Edit2,
  Trash2,
  FolderTree,
  ChevronRight,
  ChevronDown,
  Compass
} from 'lucide-react';

// Konfigurasi jenis pekerjaan, warna, bentuk penanda, dan badge
export function getTaskTypeConfig(jenisKerja = '') {
  const str = (jenisKerja || '').toLowerCase();

  if (str.includes('pasang baru') || str.includes('psb')) {
    return {
      type: 'Pasang Baru',
      code: 'PSB',
      badgeText: 'PASANG BARU',
      badgeBg: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
      shapeClass: 'marker-shape-diamond',
      bgColor: '#0284c7',
      borderColor: '#7dd3fc',
      bgTw: 'bg-sky-600',
      borderTw: 'border-sky-300',
      textColor: 'text-sky-400',
      lineColor: '#0284c7'
    };
  }

  if (str.includes('kabel putus') || str.includes('cut') || str.includes('fo cut')) {
    return {
      type: 'Kabel Putus',
      code: 'CUT',
      badgeText: 'KABEL PUTUS',
      badgeBg: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      shapeClass: 'marker-shape-octagon',
      bgColor: '#9333ea',
      borderColor: '#d8b4fe',
      bgTw: 'bg-purple-600',
      borderTw: 'border-purple-300',
      textColor: 'text-purple-400',
      lineColor: '#9333ea'
    };
  }

  if (str.includes('gangguan') || str.includes('los') || str.includes('repair')) {
    return {
      type: 'Gangguan',
      code: 'LOS',
      badgeText: 'GANGGUAN (LOS)',
      badgeBg: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
      shapeClass: 'marker-shape-triangle',
      bgColor: '#e11d48',
      borderColor: '#fca5a5',
      bgTw: 'bg-rose-600',
      borderTw: 'border-rose-300',
      textColor: 'text-rose-400',
      lineColor: '#e11d48'
    };
  }

  if (str.includes('perbaikan') || str.includes('maintenance')) {
    return {
      type: 'Perbaikan',
      code: 'PBK',
      badgeText: 'PERBAIKAN',
      badgeBg: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      shapeClass: 'marker-shape-squircle',
      bgColor: '#d97706',
      borderColor: '#fde68a',
      bgTw: 'bg-amber-500',
      borderTw: 'border-amber-300',
      textColor: 'text-amber-400',
      lineColor: '#d97706'
    };
  }

  if (str.includes('odp') || str.includes('splitter')) {
    return {
      type: 'ODP',
      code: 'ODP',
      badgeText: 'ODP / SPLITTER',
      badgeBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      shapeClass: 'marker-shape-squircle',
      bgColor: '#059669',
      borderColor: '#6ee7b7',
      bgTw: 'bg-emerald-600',
      borderTw: 'border-emerald-300',
      textColor: 'text-emerald-400',
      lineColor: '#059669'
    };
  }

  return {
    type: 'Siaga',
    code: 'SBY',
    badgeText: 'SIAGA STO',
    badgeBg: 'bg-slate-700/40 text-slate-400 border-slate-600/40',
    shapeClass: 'rounded-full',
    bgColor: '#475569',
    borderColor: '#94a3b8',
    bgTw: 'bg-slate-700',
    borderTw: 'border-slate-400',
    textColor: 'text-slate-300',
    lineColor: '#64748b'
  };
}

// Layer Peta Resmi (Google Satellite Hybrid, Carto Voyager, Carto Dark, Esri Topo)
const MAP_LAYERS = {
  satellite: {
    id: 'satellite',
    name: 'Satelit Hybrid',
    desc: 'Citra Satelit & Label Jalan (Google Maps)',
    url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    attribution: '&copy; Google Maps Satelit & Label',
    maxZoom: 20
  },
  street: {
    id: 'street',
    name: 'Street View',
    desc: 'Peta Jalan & Bangunan Jelas (Carto Voyager)',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; CARTO &copy; OpenStreetMap',
    maxZoom: 19
  },
  dark: {
    id: 'dark',
    name: 'Dark Matter',
    desc: 'Mode Gelap Kontras Tinggi (Carto Dark)',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; CARTO &copy; OpenStreetMap',
    maxZoom: 19
  },
  topo: {
    id: 'topo',
    name: 'Topografi',
    desc: 'Kontur Wilayah & Ketinggian (Esri Topo)',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Topo Map',
    maxZoom: 18
  }
};

// Helper menentukan zona wilayah ODP
function getOdpWilayah(point) {
  const loc = (point.alamat || point.nama_lokasi || '').toLowerCase();
  if (loc.includes('koto nan iv') || loc.includes('soekarno')) return 'Koto Nan IV (Sentral STO)';
  if (loc.includes('balai nan duo')) return 'Balai Nan Duo (Payakumbuh Barat)';
  if (loc.includes('sudirman') || loc.includes('labuh basilang')) return 'Labuh Basilang & Ruko';
  if (loc.includes('pasar ibuh') || loc.includes('pasar')) return 'Sentra Pasar Ibuh';
  if (loc.includes('benteng') || loc.includes('payolansek')) return 'Simpang Benteng / Payolansek';
  if (loc.includes('tiakar') || loc.includes('timur')) return 'Kelurahan Tiakar (Payakumbuh Timur)';
  return 'Wilayah Payakumbuh Lainnya';
}

export default function WebGISMap({
  selectedOdpId = null,
  onSelectOdp = () => {},
  onSelectTugas = () => {}
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const currentTileLayerRef = useRef(null);
  const layerGroupRef = useRef(null);

  const {
    odp = [],
    tugas = [],
    STO_COORDINATES,
    addOdp,
    updateOdp,
    deleteOdp,
    currentUser,
    showToast
  } = useApp();

  const isPimpinan = currentUser?.role === 'pimpinan';

  const [activeLayerId, setActiveLayerId] = useState(() => {
    return localStorage.getItem('sto_selected_map_layer') || 'satellite';
  });
  const [showLayerPicker, setShowLayerPicker] = useState(false);

  // Filter & Grouping State
  const [odpStatusFilter, setOdpStatusFilter] = useState('all'); // 'all' | 'Tersedia' | 'Penuh' | 'Maintenance'
  const [showTasks, setShowTasks] = useState(true);
  const [showOdpPoints, setShowOdpPoints] = useState(true);
  const [showGroupDrawer, setShowGroupDrawer] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState({
    'Koto Nan IV (Sentral STO)': true,
    'Balai Nan Duo (Payakumbuh Barat)': true,
    'Labuh Basilang & Ruko': true,
    'Sentra Pasar Ibuh': true,
    'Simpang Benteng / Payolansek': true,
    'Kelurahan Tiakar (Payakumbuh Timur)': true,
    'Wilayah Payakumbuh Lainnya': true
  });

  // Pinpoint Mode & Modal Tambah
  const [isPinpointMode, setIsPinpointMode] = useState(false);
  const [pinpointCoords, setPinpointCoords] = useState({ lat: null, lng: null });
  const [showPinpointModal, setShowPinpointModal] = useState(false);
  const [isSubmittingOdp, setIsSubmittingOdp] = useState(false);
  const [pinpointForm, setPinpointForm] = useState({
    kode_odp: '',
    alamat: '',
    kapasitas_port: 8,
    port_terpakai: 0,
    status: 'Tersedia'
  });

  // Modal Edit ODP
  const [editingOdp, setEditingOdp] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Expose global callback agar popup Leaflet bisa memanggil Edit/Delete
  useEffect(() => {
    window.__handleWebGisEditOdp = (id) => {
      const target = odp.find(o => Number(o.id) === Number(id));
      if (target) {
        setEditingOdp(target);
        setShowEditModal(true);
      }
    };

    window.__handleWebGisDeleteOdp = (id, kode) => {
      if (window.confirm(`Konfirmasi Hapus: Apakah Anda yakin ingin menghapus titik ODP '${kode}' dari Supabase Cloud?`)) {
        deleteOdp(id);
      }
    };

    return () => {
      delete window.__handleWebGisEditOdp;
      delete window.__handleWebGisDeleteOdp;
    };
  }, [odp, deleteOdp]);

  // Kelompokkan ODP berdasarkan Wilayah
  const groupedOdps = useMemo(() => {
    const groups = {};
    odp.forEach(point => {
      if (odpStatusFilter !== 'all' && point.status !== odpStatusFilter) return;
      const wilayah = getOdpWilayah(point);
      if (!groups[wilayah]) {
        groups[wilayah] = [];
      }
      groups[wilayah].push(point);
    });
    return groups;
  }, [odp, odpStatusFilter]);

  // Apply Tile Layer
  const applyTileLayer = useCallback((map, layerKey) => {
    const config = MAP_LAYERS[layerKey] || MAP_LAYERS.satellite;

    if (currentTileLayerRef.current) {
      map.removeLayer(currentTileLayerRef.current);
    }

    const tileLayer = L.tileLayer(config.url, {
      maxZoom: config.maxZoom || 19,
      subdomains: 'abcd',
      attribution: config.attribution,
      keepBuffer: 8,
      updateWhenIdle: true,
      updateWhenZooming: false,
      crossOrigin: true
    }).addTo(map);

    currentTileLayerRef.current = tileLayer;
  }, []);

  // Inisialisasi Peta Leaflet
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const initialLayer = localStorage.getItem('sto_selected_map_layer') || 'satellite';

    const map = L.map(mapRef.current, {
      center: [STO_COORDINATES.lat, STO_COORDINATES.lng],
      zoom: 14,
      zoomControl: false,
      attributionControl: false,
      preferCanvas: true, // Hardware-accelerated GPU canvas rendering for markers
      updateWhenIdle: true, // Render tiles/markers only after pan/zoom ends (saves CPU)
      fadeAnimation: false, // Turn off heavy DOM opacity transitions on mobile
      markerZoomAnimation: false
    });

    applyTileLayer(map, initialLayer);

    L.control.zoom({ position: 'topright' }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    layerGroupRef.current = layerGroup;
    mapInstanceRef.current = map;

    // Percepat load tampilan peta & cegah lag/blank grey tiles
    setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 150);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [STO_COORDINATES, applyTileLayer]);

  // Ganti Base Layer
  const switchBaseLayer = useCallback((layerId) => {
    if (!mapInstanceRef.current) return;
    setActiveLayerId(layerId);
    localStorage.setItem('sto_selected_map_layer', layerId);
    applyTileLayer(mapInstanceRef.current, layerId);
    setShowLayerPicker(false);
  }, [applyTileLayer]);

  // Efek Mode Pinpoint: Crosshair & Tangkap Koordinat Klik Peta
  useEffect(() => {
    const map = mapInstanceRef.current;
    const container = mapRef.current;
    if (!map || !container) return;

    if (isPinpointMode) {
      container.style.cursor = 'crosshair';

      const handleMapPinpointClick = (e) => {
        const { lat, lng } = e.latlng;
        const latFixed = parseFloat(lat.toFixed(6));
        const lngFixed = parseFloat(lng.toFixed(6));

        setPinpointCoords({ lat: latFixed, lng: lngFixed });
        setPinpointForm({
          kode_odp: `ODP-PYK-${String(odp.length + 1).padStart(2, '0')}/04`,
          alamat: 'Jl. Soekarno-Hatta, Payakumbuh',
          kapasitas_port: 8,
          port_terpakai: 0,
          status: 'Tersedia'
        });

        setIsPinpointMode(false);
        setShowPinpointModal(true);
        if (container) container.style.cursor = '';
      };

      map.on('click', handleMapPinpointClick);
      return () => {
        map.off('click', handleMapPinpointClick);
        if (container) container.style.cursor = '';
      };
    } else {
      if (container) container.style.cursor = '';
    }
  }, [isPinpointMode, odp.length]);

  // Handler simpan ODP baru dari pinpoint / modal
  const handleSavePinpointOdp = async (e) => {
    e.preventDefault();
    if (!pinpointForm.kode_odp || !pinpointForm.alamat) {
      showToast('Kode ODP dan Alamat wajib diisi!', 'warning');
      return;
    }

    setIsSubmittingOdp(true);
    try {
      const payload = {
        kode_odp: pinpointForm.kode_odp.toUpperCase().trim(),
        alamat: pinpointForm.alamat.trim(),
        latitude: pinpointCoords.lat || STO_COORDINATES.lat,
        longitude: pinpointCoords.lng || STO_COORDINATES.lng,
        kapasitas_port: parseInt(pinpointForm.kapasitas_port, 10) || 8,
        port_terpakai: parseInt(pinpointForm.port_terpakai, 10) || 0,
        status: pinpointForm.status || 'Tersedia'
      };

      await addOdp(payload);
      setShowPinpointModal(false);

      if (mapInstanceRef.current && payload.latitude && payload.longitude) {
        mapInstanceRef.current.flyTo([payload.latitude, payload.longitude], 16, {
          duration: 1.2
        });
      }

      showToast(`🎯 ODP '${payload.kode_odp}' berhasil disimpan ke Supabase Cloud & tampil di WebGIS!`, 'success');
    } catch (err) {
      showToast('Gagal mendaftarkan titik ODP: ' + err.message, 'error');
    } finally {
      setIsSubmittingOdp(false);
    }
  };

  // Handler Update ODP
  const handleSaveEditOdp = async (e) => {
    e.preventDefault();
    if (!editingOdp) return;

    try {
      await updateOdp(editingOdp.id, {
        kode_odp: editingOdp.kode_odp,
        alamat: editingOdp.alamat || editingOdp.nama_lokasi,
        latitude: parseFloat(editingOdp.latitude),
        longitude: parseFloat(editingOdp.longitude),
        kapasitas_port: parseInt(editingOdp.kapasitas_port, 10),
        port_terpakai: parseInt(editingOdp.port_terpakai, 10),
        status: editingOdp.status
      });

      setShowEditModal(false);
      setEditingOdp(null);
      showToast(`Data ODP '${editingOdp.kode_odp}' berhasil diperbarui di Supabase!`, 'success');
    } catch (err) {
      showToast('Gagal memperbarui data ODP: ' + err.message, 'error');
    }
  };

  // Fly to ODP dari drawer / list
  const flyToOdp = (point) => {
    if (mapInstanceRef.current && point.latitude && point.longitude) {
      mapInstanceRef.current.flyTo([point.latitude, point.longitude], 17, {
        duration: 1.2
      });
      onSelectOdp(point.id);
    }
  };

  // Render Penanda Titik ODP & Sentral STO
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    // 1. PENANDA KANTOR PUSAT STO TELKOM PAYAKUMBUH
    const stoIcon = L.divIcon({
      className: 'custom-sto-icon',
      html: `
        <div class="flex flex-col items-center cursor-pointer" style="transform: translate(-50%, -100%);">
          <div class="px-2.5 py-0.5 rounded-full bg-rose-700 text-white font-extrabold text-[10px] border border-white/60 shadow-xl whitespace-nowrap mb-1 flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-white"></span>
            <span>SENTRAL STO TELKOM</span>
          </div>
          <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-800 to-rose-600 border-2 border-white flex items-center justify-center shadow-2xl shadow-rose-950/80">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-white">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
        </div>
      `,
      iconSize: [40, 56],
      iconAnchor: [20, 56]
    });

    const stoMarker = L.marker([STO_COORDINATES.lat, STO_COORDINATES.lng], { icon: stoIcon })
      .bindPopup(`
        <div class="p-3 text-xs min-w-[240px] text-slate-800 dark:text-slate-100">
          <div class="font-extrabold text-rose-600 text-sm flex items-center gap-1.5 pb-1 border-b border-slate-200 dark:border-slate-700">
            <span>●</span> ${STO_COORDINATES.name}
          </div>
          <p class="text-slate-600 dark:text-slate-300 mt-2 leading-relaxed text-[11px]">${STO_COORDINATES.alamat}</p>
          <div class="mt-2.5 text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 p-2 rounded-xl">
            Pusat Sentral Jaringan & Distribusi Logistik Telkom Akses Payakumbuh
          </div>
        </div>
      `);
    layerGroup.addLayer(stoMarker);

    // 2. PENANDA TITIK-TITIK ODP (FOKUS 100% PADA ODP & PORT CAPACITY)
    if (showOdpPoints && Array.isArray(odp)) {
      odp.forEach(point => {
        if (!point.latitude || !point.longitude) return;

        if (odpStatusFilter !== 'all' && point.status !== odpStatusFilter) {
          return;
        }

        const isSelected = selectedOdpId === point.id;
        const totalPort = Number(point.kapasitas_port) || 8;
        const usedPort = Number(point.port_terpakai) || 0;
        const availablePort = Math.max(0, totalPort - usedPort);
        const percentUsed = Math.min(100, Math.round((usedPort / totalPort) * 100));

        // Status visual color
        let statusBg = '#059669'; // Emerald (Tersedia)
        let statusBadge = 'bg-emerald-600';
        let statusText = 'TERSEDIA';

        if (point.status === 'Maintenance' || Number(point.redaman_dbm) <= -24) {
          statusBg = '#e11d48';
          statusBadge = 'bg-rose-600';
          statusText = 'MAINTENANCE';
        } else if (availablePort === 0 || point.status === 'Penuh') {
          statusBg = '#dc2626';
          statusBadge = 'bg-red-600';
          statusText = 'PORT PENUH';
        } else if (availablePort <= 2 || percentUsed >= 70) {
          statusBg = '#d97706';
          statusBadge = 'bg-amber-600';
          statusText = 'HAMPIR PENUH';
        }

        const odpIcon = L.divIcon({
          className: 'custom-odp-icon',
          html: `
            <div class="flex flex-col items-center cursor-pointer transition-transform ${isSelected ? 'scale-125 z-50' : 'hover:scale-110'}" style="transform: translate(-50%, -100%);">
              <div class="px-2 py-0.5 rounded-full ${statusBadge} text-white font-extrabold text-[9px] shadow-lg whitespace-nowrap mb-1 flex items-center gap-1 border border-white/60">
                <span>${point.kode_odp}</span>
                <span class="bg-black/30 px-1 rounded text-[8px]">${usedPort}/${totalPort}</span>
              </div>
              <div class="w-8 h-8 rounded-xl border-2 border-white flex items-center justify-center shadow-xl text-white font-black text-xs" style="background-color: ${statusBg};">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-white">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                  <line x1="12" y1="22.08" x2="12" y2="12"/>
                </svg>
              </div>
            </div>
          `,
          iconSize: [36, 52],
          iconAnchor: [18, 52]
        });

        const address = point.alamat || point.nama_lokasi || 'Koto Nan IV Payakumbuh';
        const pimpinanActions = isPimpinan ? `
          <div class="pt-2 mt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-1.5">
            <button onclick="window.__handleWebGisEditOdp(${point.id})" class="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] flex items-center gap-1 cursor-pointer">
              ✏️ Edit ODP
            </button>
            <button onclick="window.__handleWebGisDeleteOdp(${point.id}, '${point.kode_odp}')" class="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] flex items-center gap-1 cursor-pointer">
              🗑️ Hapus
            </button>
          </div>
        ` : '';

        const odpMarker = L.marker([point.latitude, point.longitude], { icon: odpIcon })
          .bindPopup(`
            <div class="p-3 text-xs min-w-[260px] text-slate-800 dark:text-slate-100">
              <div class="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                <div>
                  <span class="font-black text-sm text-blue-600 dark:text-blue-400">${point.kode_odp}</span>
                  <div class="text-[10px] text-slate-400 font-mono">${getOdpWilayah(point)}</div>
                </div>
                <span class="px-2 py-0.5 rounded-full text-[9px] font-bold text-white ${statusBadge}">
                  ${statusText}
                </span>
              </div>

              <div class="mt-2.5 space-y-1.5 text-[11px]">
                <div>
                  <span class="text-slate-400 text-[10px]">Alamat / Lokasi Tiang:</span>
                  <div class="font-semibold text-slate-700 dark:text-slate-200">${address}</div>
                </div>

                <div class="pt-1.5 border-t border-slate-100 dark:border-slate-800">
                  <div class="flex items-center justify-between text-[10px]">
                    <span class="text-slate-400">Okupansi Port:</span>
                    <strong>${usedPort} / ${totalPort} Port (${availablePort} Tersedia)</strong>
                  </div>
                  <div class="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden mt-1">
                    <div class="h-full rounded-full transition-all" style="width: ${percentUsed}%; background-color: ${statusBg};"></div>
                  </div>
                </div>

                <div class="text-[10px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                  <strong>Koordinat GPS:</strong> ${Number(point.latitude).toFixed(5)}, ${Number(point.longitude).toFixed(5)}
                </div>

                ${pimpinanActions}
              </div>
            </div>
          `);

        odpMarker.on('click', () => {
          onSelectOdp(point.id);
        });

        layerGroup.addLayer(odpMarker);
      });
    }

    // 3. TITIK TIKET LAPANGAN (FOKUS TITIK SAJA, TANPA GARIS KABEL SESUAI PERMINTAAN USER)
    if (showTasks && Array.isArray(tugas)) {
      tugas.forEach(task => {
        if (!task.target_lat || !task.target_lng) return;

        const isDone = task.status === 'Done';
        const isGangguan = (task.jenis_kerja || '').toLowerCase().includes('gangguan') || (task.jenis_kerja || '').toLowerCase().includes('kabel');
        const taskBg = isDone ? '#059669' : (isGangguan ? '#e11d48' : '#0284c7');

        const taskIcon = L.divIcon({
          className: 'custom-task-icon',
          html: `
            <div class="flex flex-col items-center cursor-pointer" style="transform: translate(-50%, -100%);">
              <div class="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center shadow-lg" style="background-color: ${taskBg};">
                <span class="w-2 h-2 rounded-full bg-white"></span>
              </div>
            </div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 24]
        });

        const taskMarker = L.marker([task.target_lat, task.target_lng], { icon: taskIcon })
          .bindPopup(`
            <div class="p-2.5 text-xs text-slate-800 dark:text-slate-100 min-w-[200px]">
              <div class="font-bold text-rose-600">Tiket #${task.id}: ${task.jenis_kerja}</div>
              <div class="text-[11px] mt-1">${task.lokasi}</div>
              <div class="text-[10px] text-slate-400 mt-1">Status: ${task.status}</div>
            </div>
          `);

        taskMarker.on('click', () => {
          onSelectTugas(task.id);
        });

        layerGroup.addLayer(taskMarker);
      });
    }

  }, [odp, tugas, STO_COORDINATES, odpStatusFilter, showTasks, showOdpPoints, selectedOdpId, isPimpinan, onSelectOdp, onSelectTugas]);

  return (
    <div className="relative w-full h-full min-h-[480px] rounded-2xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800">
      {/* Map Container */}
      <div ref={mapRef} className="w-full h-full z-10" />

      {/* Top Floating Control Bar */}
      <div className="absolute top-3 left-3 z-20 flex flex-wrap items-center gap-2">
        {/* Layer Switcher Button */}
        <div className="relative">
          <button
            onClick={() => setShowLayerPicker(!showLayerPicker)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-900 text-white text-xs font-semibold shadow-lg backdrop-blur border border-slate-700 cursor-pointer transition active:scale-95"
            title="Ganti Jenis Peta"
          >
            <Layers className="w-4 h-4 text-rose-400" />
            <span>{MAP_LAYERS[activeLayerId]?.name || 'Peta'}</span>
          </button>

          {/* Layer Switcher Dropdown */}
          {showLayerPicker && (
            <div className="absolute top-10 left-0 w-56 rounded-2xl bg-slate-900/95 border border-slate-700 shadow-2xl p-2 text-xs space-y-1 z-30 animate-in fade-in zoom-in-95">
              <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Pilih Tampilan Peta
              </div>
              {Object.values(MAP_LAYERS).map((layer) => (
                <button
                  key={layer.id}
                  onClick={() => switchBaseLayer(layer.id)}
                  className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition ${
                    activeLayerId === layer.id
                      ? 'bg-rose-600 text-white font-bold'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div>
                    <div className="font-semibold">{layer.name}</div>
                    <div className="text-[10px] opacity-75">{layer.desc}</div>
                  </div>
                  {activeLayerId === layer.id && <Check className="w-4 h-4 shrink-0" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Filter Status ODP */}
        <div className="flex items-center bg-slate-900/90 backdrop-blur rounded-xl border border-slate-700 p-1 text-xs text-white">
          <Filter className="w-3.5 h-3.5 ml-2 mr-1 text-slate-400" />
          <select
            value={odpStatusFilter}
            onChange={(e) => setOdpStatusFilter(e.target.value)}
            className="bg-transparent text-xs text-white pr-2 py-1 focus:outline-none cursor-pointer"
          >
            <option value="all" className="bg-slate-900 text-white">Semua Status ODP</option>
            <option value="Tersedia" className="bg-slate-900 text-emerald-400">ODP Tersedia</option>
            <option value="Penuh" className="bg-slate-900 text-rose-400">ODP Port Penuh</option>
          </select>
        </div>

        {/* Tombol Pengelompokan / Grouping ODP */}
        <button
          type="button"
          onClick={() => setShowGroupDrawer(!showGroupDrawer)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border backdrop-blur shadow-lg transition active:scale-95 cursor-pointer ${
            showGroupDrawer
              ? 'bg-blue-600 text-white border-blue-400'
              : 'bg-slate-900/90 text-slate-200 border-slate-700 hover:bg-slate-800'
          }`}
          title="Buka Daftar Pengelompokan ODP per Wilayah"
        >
          <FolderTree className="w-4 h-4 text-amber-400" />
          <span>Grouping ODP ({odp.length})</span>
        </button>

        {/* Tombol Tambah ODP (Pimpinan) */}
        {isPimpinan && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setIsPinpointMode(!isPinpointMode);
                if (!isPinpointMode) {
                  showToast('🎯 Mode Pinpoint Aktif: Klik lokasi di peta untuk menambah titik ODP presisi!', 'info');
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shadow-lg transition active:scale-95 cursor-pointer border ${
                isPinpointMode
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-white ring-2 ring-amber-300 animate-pulse'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>{isPinpointMode ? '❌ Batal Pinpoint' : '+ Tambah ODP (Klik Peta)'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPinpointCoords({ lat: STO_COORDINATES.lat, lng: STO_COORDINATES.lng });
                setPinpointForm({
                  kode_odp: `ODP-PYK-${String(odp.length + 1).padStart(2, '0')}/04`,
                  alamat: 'Jl. Soekarno-Hatta, Payakumbuh',
                  kapasitas_port: 8,
                  port_terpakai: 0,
                  status: 'Tersedia'
                });
                setShowPinpointModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-white text-xs font-bold shadow-lg border border-slate-700 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-blue-400" />
              <span>Form Manual</span>
            </button>
          </div>
        )}
      </div>

      {/* Floating Indicator Banner Saat Mode Pinpoint Aktif */}
      {isPinpointMode && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 px-5 py-2.5 rounded-2xl bg-amber-500 text-slate-950 text-xs font-black shadow-2xl border-2 border-white flex items-center gap-2.5 animate-bounce">
          <MapPin className="w-4 h-4 text-slate-950 animate-spin" />
          <span>🎯 MODE PINPOINT AKTIF: Silakan klik lokasi di peta untuk meletakkan titik ODP!</span>
          <button
            type="button"
            onClick={() => setIsPinpointMode(false)}
            className="ml-2 bg-slate-900 text-white px-2 py-0.5 rounded-lg text-[10px] font-bold hover:bg-black"
          >
            Batal
          </button>
        </div>
      )}

      {/* DRAWER PENGELOMPOKAN (GROUPING) ODP PER WILAYAH */}
      {showGroupDrawer && (
        <div className="absolute top-14 left-3 z-30 w-80 max-h-[75vh] overflow-y-auto rounded-3xl bg-slate-900/95 backdrop-blur-md border border-slate-700 shadow-2xl p-4 text-xs text-white space-y-3 animate-in fade-in slide-in-from-left-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <FolderTree className="w-4 h-4 text-amber-400" />
              <div>
                <h4 className="font-extrabold text-xs">Pengelompokan ODP Wilayah</h4>
                <p className="text-[10px] text-slate-400">{odp.length} Total Titik Terdata di Supabase</p>
              </div>
            </div>
            <button
              onClick={() => setShowGroupDrawer(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2">
            {Object.keys(groupedOdps).length === 0 ? (
              <div className="text-center py-4 text-slate-500 text-xs">
                Tidak ada ODP pada filter ini
              </div>
            ) : (
              Object.entries(groupedOdps).map(([wilayah, items]) => {
                const isExpanded = expandedGroups[wilayah] !== false;
                const totalPorts = items.reduce((acc, curr) => acc + (Number(curr.kapasitas_port) || 8), 0);
                const usedPorts = items.reduce((acc, curr) => acc + (Number(curr.port_terpakai) || 0), 0);

                return (
                  <div key={wilayah} className="rounded-2xl border border-slate-800 bg-slate-950/60 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setExpandedGroups(prev => ({ ...prev, [wilayah]: !isExpanded }))}
                      className="w-full p-2.5 flex items-center justify-between bg-slate-900/80 hover:bg-slate-800/80 transition text-left"
                    >
                      <div className="flex items-center gap-1.5 font-bold text-[11px] text-slate-200">
                        {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                        <span>{wilayah}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono text-emerald-400 font-bold">
                          {usedPorts}/{totalPorts} Port
                        </span>
                        <span className="px-1.5 py-0.2 rounded-md bg-blue-500/20 text-blue-400 text-[10px] font-bold">
                          {items.length}
                        </span>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="p-2 space-y-1.5 border-t border-slate-800/80 divide-y divide-slate-800/40">
                        {items.map(point => {
                          const used = Number(point.port_terpakai) || 0;
                          const cap = Number(point.kapasitas_port) || 8;
                          const isFull = used >= cap || point.status === 'Penuh';

                          return (
                            <div
                              key={point.id}
                              className="pt-1.5 first:pt-0 flex items-center justify-between hover:bg-slate-900/50 p-1 rounded-lg transition"
                            >
                              <div
                                onClick={() => flyToOdp(point)}
                                className="cursor-pointer flex-1 pr-2"
                              >
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono font-bold text-amber-400 text-[11px]">{point.kode_odp}</span>
                                  <span className={`px-1.5 py-0.2 rounded text-[8px] font-bold ${isFull ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                    {point.status}
                                  </span>
                                </div>
                                <div className="text-[10px] text-slate-400 truncate max-w-[180px]">
                                  {point.alamat || point.nama_lokasi}
                                </div>
                              </div>

                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => flyToOdp(point)}
                                  className="p-1 text-slate-400 hover:text-white rounded"
                                  title="Arahkan Peta ke ODP ini"
                                >
                                  <Compass className="w-3.5 h-3.5 text-blue-400" />
                                </button>
                                {isPimpinan && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingOdp(point);
                                        setShowEditModal(true);
                                      }}
                                      className="p-1 text-slate-400 hover:text-blue-400 rounded"
                                      title="Edit ODP"
                                    >
                                      <Edit2 className="w-3 h-3" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (window.confirm(`Hapus ODP ${point.kode_odp}?`)) {
                                          deleteOdp(point.id);
                                        }
                                      }}
                                      className="p-1 text-slate-400 hover:text-rose-400 rounded"
                                      title="Hapus ODP"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Bottom Floating Legend Bar */}
      <div className="absolute bottom-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-2xl bg-slate-900/90 backdrop-blur border border-slate-700/80 text-[11px] text-white shadow-xl">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-600 border border-white"></span>
            <span className="text-slate-300 font-semibold">Sentral STO</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-emerald-600 border border-white"></span>
            <span className="text-slate-300 font-semibold">ODP Tersedia</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-amber-600 border border-white"></span>
            <span className="text-slate-300 font-semibold">Hampir Penuh</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-red-600 border border-white"></span>
            <span className="text-slate-300 font-semibold">Port Penuh</span>
          </div>
        </div>

        <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
          <span>WebGIS STO Payakumbuh</span>
          <span className="text-slate-600">|</span>
          <strong className="text-emerald-400 font-bold">{odp.length} Titik ODP Aktif di Supabase</strong>
        </div>
      </div>

      {/* MODAL 1: FORM TAMBAH TITIK ODP BARU (PIMPINAN) */}
      {showPinpointModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 text-white rounded-3xl p-6 shadow-2xl relative space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white">
                    Tambah Titik ODP Baru (Menu Pimpinan)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Data akan otomatis tersimpan ke tabel <code>odp</code> di Supabase Cloud.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPinpointModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Banner Koordinat */}
            <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                  Koordinat Geospasial Peta:
                </span>
                <span className="font-mono text-xs font-bold text-white">
                  Lat: {pinpointCoords.lat} | Lng: {pinpointCoords.lng}
                </span>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500 text-slate-950 flex items-center gap-1 shadow">
                <Check className="w-3 h-3" />
                <span>Sinkron Supabase</span>
              </span>
            </div>

            <form onSubmit={handleSavePinpointOdp} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Kode ODP Sesuai Standar Telkom <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: ODP-PYK-01/04"
                  value={pinpointForm.kode_odp}
                  onChange={(e) => setPinpointForm({ ...pinpointForm, kode_odp: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono uppercase focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Alamat / Lokasi Tiang ODP <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Jl. Soekarno-Hatta No. 45, Koto Nan IV"
                  value={pinpointForm.alamat}
                  onChange={(e) => setPinpointForm({ ...pinpointForm, alamat: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Kapasitas Port
                  </label>
                  <select
                    value={pinpointForm.kapasitas_port}
                    onChange={(e) => setPinpointForm({ ...pinpointForm, kapasitas_port: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-semibold focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="8">8 Port (Splitter 1:8)</option>
                    <option value="16">16 Port (Splitter 1:16)</option>
                    <option value="24">24 Port (Splitter 1:24)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Port Terpakai Awal
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={pinpointForm.kapasitas_port}
                    value={pinpointForm.port_terpakai}
                    onChange={(e) => setPinpointForm({ ...pinpointForm, port_terpakai: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowPinpointModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingOdp}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-950 transition active:scale-95 cursor-pointer flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSubmittingOdp ? 'Menyimpan ke Supabase...' : 'Simpan ODP ke Supabase'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: FORM EDIT ODP (PIMPINAN) */}
      {showEditModal && editingOdp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 text-white rounded-3xl p-6 shadow-2xl relative space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
                  <Edit2 className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white">
                    Edit Data ODP: {editingOdp.kode_odp}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Perubahan akan langsung ter-update di tabel <code>odp</code> Supabase.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditOdp} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Kode ODP
                </label>
                <input
                  type="text"
                  required
                  value={editingOdp.kode_odp}
                  onChange={(e) => setEditingOdp({ ...editingOdp, kode_odp: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono uppercase focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Alamat / Lokasi Tiang
                </label>
                <input
                  type="text"
                  required
                  value={editingOdp.alamat || editingOdp.nama_lokasi || ''}
                  onChange={(e) => setEditingOdp({ ...editingOdp, alamat: e.target.value, nama_lokasi: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    value={editingOdp.latitude}
                    onChange={(e) => setEditingOdp({ ...editingOdp, latitude: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    value={editingOdp.longitude}
                    onChange={(e) => setEditingOdp({ ...editingOdp, longitude: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Kapasitas Port
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editingOdp.kapasitas_port}
                    onChange={(e) => setEditingOdp({ ...editingOdp, kapasitas_port: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Port Terpakai
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={editingOdp.kapasitas_port}
                    value={editingOdp.port_terpakai}
                    onChange={(e) => setEditingOdp({ ...editingOdp, port_terpakai: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Status
                  </label>
                  <select
                    value={editingOdp.status}
                    onChange={(e) => setEditingOdp({ ...editingOdp, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="Tersedia">Tersedia</option>
                    <option value="Hampir Penuh">Hampir Penuh</option>
                    <option value="Penuh">Penuh</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-950 transition active:scale-95 cursor-pointer flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Update ODP di Supabase</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
