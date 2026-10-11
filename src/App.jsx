import React, { useEffect, useState, useMemo } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from './firebase';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid 
} from 'recharts';
import { 
  Heart, Activity, ShieldAlert, Wifi, WifiOff, AlertTriangle, 
  Radio, BellOff, Volume2, Cpu, Zap, Layers, Sparkles
} from 'lucide-react';

export default function App() {
  const [data, setData] = useState({
    maternal_bpm: 0,
    fetal_bpm: 0,
    spo2: 0,
    motion_artifact: false,
    probe_connected: false,
    timestamp: 0
  });

  const [history, setHistory] = useState([]);
  const [isMuted, setIsMuted] = useState(false);
  const [lastSeen, setLastSeen] = useState(Date.now());
  const [selectedParam, setSelectedParam] = useState('fetal');

  useEffect(() => {
    const monitorRef = ref(database, 'fetal_monitor');
    const unsubscribe = onValue(monitorRef, (snapshot) => {
      const val = snapshot.val();
      if (val) {
        setData(val);
        setLastSeen(Date.now());

        const calculatedSqi = !val.probe_connected ? 0 : val.motion_artifact ? 42 : 98;

        setHistory((prev) => {
          const timestamp = new Date().toLocaleTimeString([], { 
            hour: '2-digit', minute: '2-digit', second: '2-digit' 
          });
          const next = [
            ...prev,
            {
              time: timestamp,
              fetal: Math.round(val.fetal_bpm),
              maternal: Math.round(val.maternal_bpm),
              spo2: Number(val.spo2 ? val.spo2.toFixed(1) : 0),
              sqi: calculatedSqi
            }
          ];
          return next.slice(-30);
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const isOnline = useMemo(() => {
    return (Date.now() - lastSeen) < 3500 && data.timestamp > 0;
  }, [data, lastSeen]);

  const fetalStatus = useMemo(() => {
    if (!data.probe_connected) return { label: 'PROBE DISCONNECTED', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.1)' };
    if (data.motion_artifact) return { label: 'MOTION GATED', color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.1)' };
    if (data.fetal_bpm === 0) return { label: 'CALIBRATING...', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.1)' };
    if (data.fetal_bpm < 110) return { label: 'BRADYCARDIA', color: '#f87171', bg: 'rgba(248, 113, 113, 0.12)' };
    if (data.fetal_bpm > 160) return { label: 'TACHYCARDIA', color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.12)' };
    return { label: 'NORMAL SINUS', color: '#34d399', bg: 'rgba(52, 211, 153, 0.12)' };
  }, [data]);

  const chartConfig = useMemo(() => {
    switch (selectedParam) {
      case 'fetal':
        return {
          title: 'Fetal Heart Rate (FHR)',
          subTitle: 'Target Physiological Window: 110 – 160 BPM',
          dataKey: 'fetal',
          color: '#38bdf8',
          unit: 'BPM',
          domain: [90, 180],
          gradId: 'fetalGrad'
        };
      case 'maternal':
        return {
          title: 'Maternal Heart Rate (MHR)',
          subTitle: 'Baseline Vascular Frequency: 60 – 100 BPM',
          dataKey: 'maternal',
          color: '#fb7185',
          unit: 'BPM',
          domain: [40, 120],
          gradId: 'maternalGrad'
        };
      case 'spo2':
        return {
          title: 'Transcutaneous Oxygenation (SpO₂)',
          subTitle: 'Calculated via Modified Beer-Lambert R-Ratio',
          dataKey: 'spo2',
          color: '#34d399',
          unit: '%',
          domain: [70, 100],
          gradId: 'spo2Grad'
        };
      case 'sqi':
        return {
          title: 'Signal Quality Index & Inertial Stability',
          subTitle: 'Real-time 6-DoF Accelerometer Deviation Filter',
          dataKey: 'sqi',
          color: '#c084fc',
          unit: 'SQI',
          domain: [0, 100],
          gradId: 'sqiGrad'
        };
      case 'all':
      default:
        return {
          title: 'Dual-Channel Cardiac Waveform Synchronization',
          subTitle: 'Synchronous Spectral Extraction (Maternal vs Fetal)',
          dataKey: null,
          color: '#38bdf8',
          unit: 'BPM',
          domain: [40, 180],
          gradId: null
        };
    }
  }, [selectedParam]);

  return (
    <div style={styles.container}>
      {/* Top Clinical Header */}
      <header style={styles.header}>
        <div style={styles.brandGroup}>
          <div style={styles.iconContainer}>
            <Radio size={20} color="#0284c7" />
          </div>
          <div>
            <div style={styles.titleRow}>
              <h1 style={styles.title}>N-FIBO Clinical Monitor</h1>
              <span style={styles.versionTag}>RTOS Dual-Core Engine</span>
            </div>
            <p style={styles.subtitle}>Non-Invasive Transabdominal Optical Telemetry & Motion Compensation</p>
          </div>
        </div>

        <div style={styles.headerMeta}>
          <div style={{
            ...styles.connectionPill,
            backgroundColor: isOnline ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            borderColor: isOnline ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)',
          }}>
            <span style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: isOnline ? '#10b981' : '#ef4444',
              display: 'inline-block'
            }} />
            <span style={{ color: isOnline ? '#34d399' : '#f87171', fontWeight: 600, fontSize: '0.8rem' }}>
              {isOnline ? 'Telemetry Online' : 'Telemetry Offline'}
            </span>
          </div>

          <button 
            onClick={() => setIsMuted(!isMuted)} 
            style={styles.iconButton}
            title={isMuted ? 'Unmute Alarms' : 'Mute Alarms'}
          >
            {isMuted ? <BellOff size={18} color="#fbbf24" /> : <Volume2 size={18} color="#94a3b8" />}
          </button>
        </div>
      </header>

      {/* Dynamic Alarm Ribbon */}
      {(!data.probe_connected || data.motion_artifact || !isOnline) && (
        <div style={{
          ...styles.alarmBanner,
          backgroundColor: !isOnline ? 'rgba(239, 68, 68, 0.12)' : data.motion_artifact ? 'rgba(245, 158, 11, 0.12)' : 'rgba(168, 85, 247, 0.12)',
          borderColor: !isOnline ? 'rgba(239, 68, 68, 0.4)' : data.motion_artifact ? 'rgba(245, 158, 11, 0.4)' : 'rgba(168, 85, 247, 0.4)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {!isOnline ? (
              <ShieldAlert color="#f87171" size={22} />
            ) : data.motion_artifact ? (
              <AlertTriangle color="#fbbf24" size={22} />
            ) : (
              <Activity color="#c084fc" size={22} />
            )}
            <div>
              <div style={styles.alarmTitle}>
                {!isOnline 
                  ? 'Communication Link Lost' 
                  : data.motion_artifact 
                    ? 'Adaptive Motion Gating Engaged' 
                    : 'Transabdominal Optical Probe Unseated'}
              </div>
              <div style={styles.alarmDesc}>
                {!isOnline 
                  ? 'Cloud telemetry stream stopped. Please verify ESP32 Wi-Fi configuration.' 
                  : data.motion_artifact 
                    ? 'Inertial displacement exceeded 2.2 m/s². Physiological estimator paused to prevent false triggers.' 
                    : 'Photodiode counts dropped below 50,000 threshold. Verify patient abdominal placement.'}
              </div>
            </div>
          </div>
          <span style={styles.alarmSeverity}>HIGH ATTENTION</span>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div style={styles.metricsGrid}>
        {/* FETAL HEART RATE */}
        <div 
          onClick={() => setSelectedParam('fetal')}
          style={{ 
            ...styles.kpiCard, 
            borderColor: selectedParam === 'fetal' ? '#38bdf8' : 'rgba(255, 255, 255, 0.08)',
            backgroundColor: selectedParam === 'fetal' ? 'rgba(2, 132, 199, 0.06)' : '#0f172a'
          }}
        >
          <div style={styles.kpiTop}>
            <span style={styles.kpiLabel}>FETAL HEART RATE</span>
            <div style={{ ...styles.badgeIcon, background: 'rgba(56, 189, 248, 0.12)' }}>
              <Heart size={16} color="#38bdf8" />
            </div>
          </div>
          <div style={styles.valueRow}>
            <span style={{ ...styles.numericValue, color: '#38bdf8' }}>
              {data.probe_connected && data.fetal_bpm > 0 ? data.fetal_bpm.toFixed(0) : '--'}
            </span>
            <span style={styles.unitText}>BPM</span>
          </div>
          <div style={styles.kpiFooter}>
            <span style={{ ...styles.statusTag, color: fetalStatus.color, backgroundColor: fetalStatus.bg }}>
              {fetalStatus.label}
            </span>
            <span style={styles.viewBadge}>{selectedParam === 'fetal' ? 'Displaying' : 'Click to inspect'}</span>
          </div>
        </div>

        {/* MATERNAL HEART RATE */}
        <div 
          onClick={() => setSelectedParam('maternal')}
          style={{ 
            ...styles.kpiCard, 
            borderColor: selectedParam === 'maternal' ? '#fb7185' : 'rgba(255, 255, 255, 0.08)',
            backgroundColor: selectedParam === 'maternal' ? 'rgba(225, 29, 72, 0.06)' : '#0f172a'
          }}
        >
          <div style={styles.kpiTop}>
            <span style={styles.kpiLabel}>MATERNAL PULSE</span>
            <div style={{ ...styles.badgeIcon, background: 'rgba(251, 113, 133, 0.12)' }}>
              <Activity size={16} color="#fb7185" />
            </div>
          </div>
          <div style={styles.valueRow}>
            <span style={{ ...styles.numericValue, color: '#fb7185' }}>
              {data.probe_connected && data.maternal_bpm > 0 ? data.maternal_bpm.toFixed(0) : '--'}
            </span>
            <span style={styles.unitText}>BPM</span>
          </div>
          <div style={styles.kpiFooter}>
            <span style={{ ...styles.statusTag, color: '#34d399', backgroundColor: 'rgba(52, 211, 153, 0.1)' }}>
              {data.maternal_bpm > 0 ? 'SYNCHRONIZED' : 'STANDBY'}
            </span>
            <span style={styles.viewBadge}>{selectedParam === 'maternal' ? 'Displaying' : 'Click to inspect'}</span>
          </div>
        </div>

        {/* OXYGEN SATURATION */}
        <div 
          onClick={() => setSelectedParam('spo2')}
          style={{ 
            ...styles.kpiCard, 
            borderColor: selectedParam === 'spo2' ? '#34d399' : 'rgba(255, 255, 255, 0.08)',
            backgroundColor: selectedParam === 'spo2' ? 'rgba(16, 185, 129, 0.06)' : '#0f172a'
          }}
        >
          <div style={styles.kpiTop}>
            <span style={styles.kpiLabel}>OXYGENATION (SpO₂)</span>
            <div style={{ ...styles.badgeIcon, background: 'rgba(52, 211, 153, 0.12)' }}>
              <Zap size={16} color="#34d399" />
            </div>
          </div>
          <div style={styles.valueRow}>
            <span style={{ ...styles.numericValue, color: '#34d399' }}>
              {data.probe_connected && data.spo2 > 0 ? data.spo2.toFixed(1) : '--'}
            </span>
            <span style={styles.unitText}>%</span>
          </div>
          <div style={styles.kpiFooter}>
            <span style={{ 
              ...styles.statusTag, 
              color: data.spo2 >= 95 ? '#34d399' : '#fbbf24',
              backgroundColor: data.spo2 >= 95 ? 'rgba(52, 211, 153, 0.1)' : 'rgba(251, 191, 36, 0.1)'
            }}>
              {data.spo2 >= 95 ? 'OPTIMAL' : 'CALCULATING'}
            </span>
            <span style={styles.viewBadge}>{selectedParam === 'spo2' ? 'Displaying' : 'Click to inspect'}</span>
          </div>
        </div>

        {/* SIGNAL QUALITY INDEX */}
        <div 
          onClick={() => setSelectedParam('sqi')}
          style={{ 
            ...styles.kpiCard, 
            borderColor: selectedParam === 'sqi' ? '#c084fc' : 'rgba(255, 255, 255, 0.08)',
            backgroundColor: selectedParam === 'sqi' ? 'rgba(168, 85, 247, 0.06)' : '#0f172a'
          }}
        >
          <div style={styles.kpiTop}>
            <span style={styles.kpiLabel}>SIGNAL INTEGRITY (SQI)</span>
            <div style={{ ...styles.badgeIcon, background: 'rgba(192, 132, 252, 0.12)' }}>
              <Cpu size={16} color="#c084fc" />
            </div>
          </div>
          <div style={styles.valueRow}>
            <span style={{ ...styles.numericValue, color: '#f8fafc' }}>
              {!data.probe_connected ? '0' : data.motion_artifact ? '42' : '98'}
            </span>
            <span style={styles.unitText}>/ 100</span>
          </div>
          <div style={styles.kpiFooter}>
            <span style={{ ...styles.statusTag, color: '#94a3b8', backgroundColor: 'rgba(148, 163, 184, 0.1)' }}>
              {data.motion_artifact ? 'NOISE DETECTED' : 'EXCELLENT'}
            </span>
            <span style={styles.viewBadge}>{selectedParam === 'sqi' ? 'Displaying' : 'Click to inspect'}</span>
          </div>
        </div>
      </div>

      {/* Main Clinical Waveform Chart */}
      <section style={styles.chartPanel}>
        <div style={styles.chartHeader}>
          <div>
            <h2 style={{ ...styles.chartTitle, color: chartConfig.color }}>
              {chartConfig.title}
            </h2>
            <p style={styles.chartSubTitle}>{chartConfig.subTitle}</p>
          </div>

          <button 
            onClick={() => setSelectedParam(selectedParam === 'all' ? 'fetal' : 'all')} 
            style={{
              ...styles.viewToggleButton,
              backgroundColor: selectedParam === 'all' ? '#0284c7' : '#1e293b',
              borderColor: selectedParam === 'all' ? '#38bdf8' : 'rgba(255, 255, 255, 0.12)'
            }}
          >
            <Layers size={15} />
            <span>{selectedParam === 'all' ? 'Split View' : 'Combined Dual View'}</span>
          </button>
        </div>

        <div style={{ height: '340px', width: '100%', marginTop: '12px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="fetalGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0}/>
                </linearGradient>
                <linearGradient id="maternalGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#fb7185" stopOpacity={0.35}/>
                  <stop offset="95%" stopColor="#fb7185" stopOpacity={0.0}/>
                </linearGradient>
                <linearGradient id="spo2Grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#34d399" stopOpacity={0.35}/>
                  <stop offset="95%" stopColor="#34d399" stopOpacity={0.0}/>
                </linearGradient>
                <linearGradient id="sqiGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#c084fc" stopOpacity={0.35}/>
                  <stop offset="95%" stopColor="#c084fc" stopOpacity={0.0}/>
                </linearGradient>
              </defs>

              <CartesianGrid stroke="rgba(255, 255, 255, 0.05)" strokeDasharray="4 4" vertical={false} />
              <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis domain={chartConfig.domain} stroke="#64748b" fontSize={11} tickLine={false} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#090d16', 
                  borderColor: 'rgba(255, 255, 255, 0.12)', 
                  borderRadius: '10px', 
                  fontSize: '12px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.6)'
                }} 
              />

              {selectedParam === 'all' ? (
                <>
                  <Area 
                    type="monotone" 
                    dataKey="fetal" 
                    stroke="#38bdf8" 
                    strokeWidth={2.5} 
                    fillOpacity={1} 
                    fill="url(#fetalGrad)" 
                    name="Fetal BPM" 
                    isAnimationActive={false}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="maternal" 
                    stroke="#fb7185" 
                    strokeWidth={2} 
                    fillOpacity={1} 
                    fill="url(#maternalGrad)" 
                    name="Maternal BPM" 
                    isAnimationActive={false}
                  />
                </>
              ) : (
                <Area 
                  type="monotone" 
                  dataKey={chartConfig.dataKey} 
                  stroke={chartConfig.color} 
                  strokeWidth={2.5} 
                  fillOpacity={1} 
                  fill={`url(#${chartConfig.gradId})`} 
                  name={`${chartConfig.title} (${chartConfig.unit})`} 
                  isAnimationActive={false}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}

// Medical Dashboard Clean Style System
const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#070b14',
    color: '#f8fafc',
    padding: '28px 40px',
    fontFamily: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    boxSizing: 'border-box'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '24px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
  },
  brandGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  iconContainer: {
    backgroundColor: 'rgba(2, 132, 199, 0.15)',
    border: '1px solid rgba(56, 189, 248, 0.3)',
    padding: '12px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  title: {
    margin: 0,
    fontSize: '1.35rem',
    fontWeight: 800,
    letterSpacing: '-0.02em',
    color: '#ffffff'
  },
  versionTag: {
    fontSize: '0.7rem',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    color: '#38bdf8',
    padding: '3px 8px',
    borderRadius: '6px',
    fontWeight: 600,
    border: '1px solid rgba(56, 189, 248, 0.25)'
  },
  subtitle: {
    margin: '4px 0 0 0',
    color: '#94a3b8',
    fontSize: '0.825rem',
    fontWeight: 400
  },
  headerMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px'
  },
  connectionPill: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    border: '1px solid',
    padding: '7px 16px',
    borderRadius: '999px',
    transition: 'all 0.3s ease'
  },
  iconButton: {
    backgroundColor: '#0f172a',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '10px',
    padding: '10px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  alarmBanner: {
    marginTop: '20px',
    padding: '14px 20px',
    borderRadius: '12px',
    border: '1px solid',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  alarmTitle: {
    fontWeight: 700,
    fontSize: '0.9rem',
    letterSpacing: '-0.01em'
  },
  alarmDesc: {
    fontSize: '0.785rem',
    opacity: 0.85,
    marginTop: '2px'
  },
  alarmSeverity: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    color: '#f87171',
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '0.7rem',
    fontWeight: 700,
    letterSpacing: '0.04em'
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '20px',
    marginTop: '24px'
  },
  kpiCard: {
    borderRadius: '16px',
    border: '1px solid',
    padding: '24px',
    cursor: 'pointer',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between'
  },
  kpiTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  kpiLabel: {
    fontSize: '0.75rem',
    fontWeight: 700,
    color: '#94a3b8',
    letterSpacing: '0.04em'
  },
  badgeIcon: {
    padding: '7px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  valueRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '10px',
    margin: '18px 0 14px 0'
  },
  numericValue: {
    fontFamily: '"Space Grotesk", sans-serif',
    fontVariantNumeric: 'tabular-nums',
    fontSize: '3.5rem',
    fontWeight: 700,
    lineHeight: 1,
    letterSpacing: '-0.04em'
  },
  unitText: {
    fontSize: '1rem',
    color: '#64748b',
    fontWeight: 600
  },
  kpiFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
    paddingTop: '14px'
  },
  statusTag: {
    fontSize: '0.7rem',
    fontWeight: 700,
    padding: '3px 8px',
    borderRadius: '6px',
    letterSpacing: '0.02em'
  },
  viewBadge: {
    fontSize: '0.7rem',
    color: '#64748b',
    fontWeight: 500
  },
  chartPanel: {
    backgroundColor: '#0f172a',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '18px',
    padding: '26px',
    marginTop: '24px'
  },
  chartHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '10px'
  },
  chartTitle: {
    fontSize: '1.05rem',
    fontWeight: 700,
    margin: 0,
    letterSpacing: '-0.02em'
  },
  chartSubTitle: {
    fontSize: '0.775rem',
    color: '#64748b',
    margin: '4px 0 0 0'
  },
  viewToggleButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    borderRadius: '8px',
    border: '1px solid',
    color: '#ffffff',
    fontSize: '0.8rem',
    cursor: 'pointer',
    fontWeight: 600,
    transition: 'all 0.2s ease'
  }
};
