
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StartIcon, StopIcon } from './components/Icons';
import { SUBJECTS, TEACHING_MODES, TEACHING_ACTIONS, ENGAGEMENT_CONFIG } from './constants';
import { TeachingModeId, TeachingActionId, EngagementLevel, LogEntry } from './types';

const App: React.FC = () => {
  // Session State
  const [isActive, setIsActive] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [currentSystemTime, setCurrentSystemTime] = useState(new Date().toLocaleTimeString('zh-TW', { hour12: false }));
  const [subject, setSubject] = useState(SUBJECTS[0]);

  // Mode & Action Data
  const [activeMode, setActiveMode] = useState<TeachingModeId | null>(null);
  const [modeTimes, setModeTimes] = useState<Record<TeachingModeId, number>>({
    lecture: 0, discussion: 0, practice: 0, digital: 0
  });

  const [activeAction, setActiveAction] = useState<TeachingActionId | null>(null);
  const [actionCounts, setActionCounts] = useState<Record<TeachingActionId, number>>({
    encourage: 0, regulate: 0, open_q: 0, closed_q: 0, patrol: 0
  });
  const [actionDurations, setActionDurations] = useState<Record<TeachingActionId, number>>({
    encourage: 0, regulate: 0, open_q: 0, closed_q: 0, patrol: 0
  });

  // Log & Interaction
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [engagement, setEngagement] = useState<EngagementLevel>('mid');
  const [note, setNote] = useState('');
  const [lastInteractionTime, setLastInteractionTime] = useState(Date.now());
  const [showReminder, setShowReminder] = useState(false);
  const [showReport, setShowReport] = useState(false);

  // Refs for timer and long press
  const intervalRef = useRef<number | null>(null);
  const pressTimerRef = useRef<number | null>(null);
  const currentTimingDurationRef = useRef<number>(0);

  // System Time Updater
  useEffect(() => {
    const t = setInterval(() => {
      setCurrentSystemTime(new Date().toLocaleTimeString('zh-TW', { hour12: false }));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  // Main Session Timer
  useEffect(() => {
    if (isActive) {
      intervalRef.current = window.setInterval(() => {
        setSessionDuration(prev => prev + 1);
        
        // Mode timing
        if (activeMode) {
          setModeTimes(prev => ({
            ...prev,
            [activeMode]: prev[activeMode] + 1
          }));
        }

        // Action duration timing (if currently holding/active)
        if (activeAction) {
          currentTimingDurationRef.current += 1;
          setActionDurations(prev => ({
            ...prev,
            [activeAction]: prev[activeAction] + 1
          }));
        }
        
        // Check for 5 min inactivity
        const now = Date.now();
        if (now - lastInteractionTime > 300000) {
          setShowReminder(true);
        } else {
          setShowReminder(false);
        }
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, activeMode, activeAction, lastInteractionTime]);

  const addLog = useCallback((label: string, type: LogEntry['type'], value?: any) => {
    const newLog: LogEntry = {
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toLocaleTimeString('zh-TW', { hour12: false }),
      label,
      type,
      value
    };
    setLogs(prev => [newLog, ...prev]);
    setLastInteractionTime(Date.now());
    setShowReminder(false);
  }, []);

  const handleToggleSession = () => {
    if (!isActive) {
      setStartTime(Date.now());
      setIsActive(true);
      addLog('開始觀課', 'note');
    } else {
      setIsActive(false);
      setActiveMode(null);
      setActiveAction(null);
      addLog('結束觀課', 'note');
      setShowReport(true);
    }
  };

  const toggleMode = (modeId: TeachingModeId) => {
    if (!isActive) return;
    if (activeMode === modeId) {
      setActiveMode(null);
      addLog(`停止模式: ${TEACHING_MODES.find(m => m.id === modeId)?.label}`, 'mode');
    } else {
      setActiveMode(modeId);
      addLog(`啟動模式: ${TEACHING_MODES.find(m => m.id === modeId)?.label}`, 'mode');
    }
  };

  // Action Logic: Click vs Long Press
  const handleActionStart = (actionId: TeachingActionId) => {
    if (!isActive) return;
    currentTimingDurationRef.current = 0;
    
    pressTimerRef.current = window.setTimeout(() => {
      setActiveAction(actionId);
      // Vibration feedback for long press if available
      if ('vibrate' in navigator) navigator.vibrate(50);
    }, 500); // 500ms threshold for long press
  };

  const handleActionEnd = (actionId: TeachingActionId) => {
    if (!isActive) return;
    
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }

    if (activeAction === actionId) {
      // Was a long press/timing session
      const duration = currentTimingDurationRef.current;
      addLog(`行為計時: ${TEACHING_ACTIONS.find(a => a.id === actionId)?.label} (持續 ${formatTime(duration)})`, 'action', { duration });
      setActiveAction(null);
    } else {
      // Was a normal click
      setActionCounts(prev => ({ ...prev, [actionId]: prev[actionId] + 1 }));
      addLog(`行為計數: ${TEACHING_ACTIONS.find(a => a.id === actionId)?.label}`, 'action');
    }
    currentTimingDurationRef.current = 0;
  };

  const handleSendNote = () => {
    if (!note.trim() || !isActive) return;
    addLog(`質性筆記: ${note}`, 'note');
    setNote('');
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const copyToClipboard = () => {
    const content = generateReportText();
    navigator.clipboard.writeText(content);
    alert('已複製到剪貼簿');
  };

  const downloadTxt = () => {
    const content = generateReportText();
    const blob = new Blob(["\uFEFF" + content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Chronos_Report_${subject}_${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const generateReportText = () => {
    let text = `CHRONOS 數位觀課結算報告\n`;
    text += `====================================\n`;
    text += `科目: ${subject}\n`;
    text += `日期: ${new Date().toLocaleDateString('zh-TW')}\n`;
    text += `授課總時長: ${formatTime(sessionDuration)}\n`;
    text += `====================================\n\n`;
    
    text += `[教學模式分布]\n`;
    TEACHING_MODES.forEach(m => {
      const percentage = sessionDuration > 0 ? ((modeTimes[m.id] / sessionDuration) * 100).toFixed(1) : 0;
      text += `- ${m.label.padEnd(8)}: ${formatTime(modeTimes[m.id])} (${percentage}%)\n`;
    });
    
    text += `\n[教學行為統計]\n`;
    TEACHING_ACTIONS.forEach(a => {
      text += `- ${a.label.padEnd(8)}: 計次 ${actionCounts[a.id]} 次 | 總時數 ${formatTime(actionDurations[a.id])}\n`;
    });
    
    text += `\n[詳細紀錄歷程]\n`;
    text += `------------------------------------\n`;
    logs.slice().reverse().forEach(l => {
      text += `[${l.timestamp}] ${l.label}\n`;
    });
    text += `------------------------------------\n`;
    
    return text;
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden select-none">
      {/* Header */}
      <header className="glass sticky top-0 z-40 px-4 py-3 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-4">
          <div className="hidden md:block">
            <h1 className="text-xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
              CHRONOS
            </h1>
          </div>
          <select 
            className="bg-slate-900 border border-white/20 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          >
            {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="flex flex-col items-center">
          <span className="text-[10px] text-slate-400 uppercase tracking-widest font-light">Total Duration</span>
          <span className="text-2xl font-mono text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]">
            {formatTime(sessionDuration)}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:block text-right">
            <div className="text-[10px] text-slate-500 uppercase tracking-tighter">System Clock</div>
            <div className="text-sm font-mono">{currentSystemTime}</div>
          </div>
          <button 
            onClick={handleToggleSession}
            className="transition-transform active:scale-95 hover:brightness-110"
          >
            {isActive ? <StopIcon /> : <StartIcon />}
          </button>
        </div>
      </header>

      {/* Main Dashboard */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left: Teaching Modes (States) */}
        <div className="md:col-span-4 space-y-4">
          <h2 className="text-amber-500/80 text-xs font-bold tracking-[0.2em] mb-2 flex items-center gap-2 uppercase">
            <div className="w-1.5 h-1.5 bg-amber-500 rounded-full shadow-[0_0_5px_rgba(245,158,11,0.8)]" />
            教學模式 STATES
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-1 gap-3">
            {TEACHING_MODES.map(mode => (
              <button
                key={mode.id}
                disabled={!isActive}
                onClick={() => toggleMode(mode.id)}
                className={`group relative p-4 rounded-xl border transition-all flex flex-col items-center justify-center gap-2 h-28 overflow-hidden ${
                  activeMode === mode.id 
                    ? 'bg-amber-500/20 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]' 
                    : 'bg-slate-900/40 border-white/5 hover:border-white/20 opacity-70'
                }`}
              >
                <div className={`text-sm font-medium transition-colors ${activeMode === mode.id ? 'text-amber-300' : 'text-slate-300'}`}>
                  {mode.label}
                </div>
                <div className={`text-2xl font-mono ${activeMode === mode.id ? 'text-amber-400 font-bold' : 'text-slate-500'}`}>
                  {formatTime(modeTimes[mode.id])}
                </div>
                {activeMode === mode.id && (
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-amber-500 animate-pulse" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Middle: Teaching Actions (Events & Durations) */}
        <div className="md:col-span-5 space-y-4">
          <h2 className="text-amber-500/80 text-xs font-bold tracking-[0.2em] mb-2 flex items-center gap-2 uppercase">
            <div className="w-1.5 h-1.5 bg-amber-500 rounded-full shadow-[0_0_5px_rgba(245,158,11,0.8)]" />
            教學行為 ACTIONS
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {TEACHING_ACTIONS.map(action => (
              <button
                key={action.id}
                disabled={!isActive}
                onMouseDown={() => handleActionStart(action.id)}
                onMouseUp={() => handleActionEnd(action.id)}
                onMouseLeave={() => activeAction === action.id && handleActionEnd(action.id)}
                onTouchStart={(e) => { e.preventDefault(); handleActionStart(action.id); }}
                onTouchEnd={(e) => { e.preventDefault(); handleActionEnd(action.id); }}
                className={`group p-4 rounded-xl border transition-all flex flex-col items-center gap-2 active:scale-95 touch-none ${
                  activeAction === action.id 
                    ? 'bg-amber-500/40 border-amber-400 scale-105 shadow-[0_0_20px_rgba(245,158,11,0.4)]' 
                    : 'bg-slate-900/40 border-white/5 hover:border-white/20'
                }`}
              >
                <div className="text-2xl group-hover:scale-110 transition-transform">{action.icon}</div>
                <div className="text-xs text-slate-400 group-hover:text-amber-300 text-center leading-tight">
                  {action.label}
                </div>
                <div className="flex flex-col items-center gap-1 w-full pt-1 border-t border-white/5">
                  <div className="text-[10px] text-slate-500 font-mono">
                    次數: <span className="text-slate-200">{actionCounts[action.id]}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    時數: <span className="text-amber-600/80">{formatTime(actionDurations[action.id])}</span>
                  </div>
                </div>
                {activeAction === action.id && (
                   <div className="absolute inset-0 bg-amber-500/10 animate-pulse rounded-xl" />
                )}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-slate-500 italic text-center px-4">
            * 點擊增加計次，長按開始計時
          </p>
        </div>

        {/* Right: Log Stream */}
        <div className="md:col-span-3 flex flex-col space-y-4">
          <h2 className="text-amber-500/80 text-xs font-bold tracking-[0.2em] flex items-center gap-2 uppercase">
            <div className="w-1.5 h-1.5 bg-amber-500 rounded-full shadow-[0_0_5px_rgba(245,158,11,0.8)]" />
            即時紀錄 LOG
          </h2>
          <div className="flex-1 bg-slate-900/30 border border-white/5 rounded-xl overflow-hidden flex flex-col h-[300px] md:h-auto">
            <div className="p-3 text-[10px] text-slate-500 border-b border-white/5 uppercase font-mono bg-white/5">
              Live Stream
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2 no-scrollbar">
              {logs.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-600 italic text-xs">
                  NO LOGS RECORDED
                </div>
              ) : (
                logs.map(log => (
                  <div key={log.id} className="text-[11px] bg-slate-800/40 p-2 rounded border border-white/5 flex items-start gap-2 animate-in fade-in slide-in-from-right-1">
                    <span className="text-amber-600/80 font-mono flex-shrink-0">{log.timestamp}</span>
                    <span className="text-slate-300 break-words leading-relaxed">{log.label}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className={`glass px-4 py-3 border-t transition-all duration-700 ${showReminder ? 'reminder-pulse border-amber-500 shadow-[0_-5px_20px_rgba(245,158,11,0.2)]' : 'border-white/10'}`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-6">
          
          {/* Engagement */}
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="text-xs text-slate-400 font-bold whitespace-nowrap uppercase tracking-tighter">ENGAGEMENT:</div>
            <div className="flex-1 md:w-48 bg-slate-900/80 rounded-lg p-1 flex border border-white/5">
              {(['low', 'mid', 'high'] as EngagementLevel[]).map((level) => (
                <button
                  key={level}
                  onClick={() => {
                    setEngagement(level);
                    addLog(`調整專注度: ${ENGAGEMENT_CONFIG[level].label}`, 'engagement', level);
                  }}
                  className={`flex-1 py-1.5 text-xs rounded transition-all duration-300 ${
                    engagement === level 
                      ? `${ENGAGEMENT_CONFIG[level].bg} text-slate-950 font-black shadow-[0_0_10px_rgba(255,255,255,0.2)]` 
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {ENGAGEMENT_CONFIG[level].label}
                </button>
              ))}
            </div>
          </div>

          {/* Qualitative Note */}
          <div className="flex-1 flex items-center gap-2 w-full">
            <input 
              type="text" 
              placeholder="輸入質性紀錄或補充說明..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendNote()}
              className="flex-1 bg-slate-900/50 border border-white/10 rounded-full px-5 py-2.5 text-sm focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all"
            />
            <button 
              onClick={handleSendNote}
              disabled={!isActive || !note.trim()}
              className="bg-amber-600 text-slate-950 px-6 py-2.5 rounded-full text-xs font-bold hover:bg-amber-500 active:scale-95 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
            >
              發送
            </button>
          </div>
        </div>
      </footer>

      {/* Report Modal */}
      {showReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" onClick={() => setShowReport(false)} />
          <div className="relative glass w-full max-w-2xl max-h-[90vh] rounded-[2rem] overflow-hidden flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-amber-500/20">
            <div className="p-8 border-b border-white/10 flex justify-between items-center bg-gradient-to-b from-amber-500/10 to-transparent">
              <div>
                <h2 className="text-2xl font-bold text-amber-500 uppercase tracking-widest">觀課結算報告</h2>
                <p className="text-xs text-slate-500 mt-1">{subject} | {new Date().toLocaleDateString('zh-TW')}</p>
              </div>
              <button onClick={() => setShowReport(false)} className="text-slate-500 hover:text-white transition-colors">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 space-y-10 no-scrollbar">
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-slate-900/40 p-5 rounded-2xl border border-white/5 shadow-inner">
                  <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">科目 / 單元</div>
                  <div className="text-lg font-bold text-slate-200">{subject}</div>
                </div>
                <div className="bg-slate-900/40 p-5 rounded-2xl border border-white/5 shadow-inner">
                  <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">總授課時數</div>
                  <div className="text-lg font-bold font-mono text-amber-500">{formatTime(sessionDuration)}</div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-amber-500/80 mb-4 flex items-center gap-2 uppercase tracking-widest">
                   <div className="w-1.5 h-1.5 bg-amber-600 rounded-full"/> 教學模式分布 (STATES)
                </h3>
                <div className="space-y-4">
                  {TEACHING_MODES.map(m => {
                    const pct = sessionDuration > 0 ? (modeTimes[m.id] / sessionDuration) * 100 : 0;
                    return (
                      <div key={m.id} className="group">
                        <div className="flex justify-between text-xs px-1 mb-1.5">
                          <span className="text-slate-400 group-hover:text-slate-200 transition-colors">{m.label}</span>
                          <span className="font-mono text-amber-500/60 group-hover:text-amber-500 transition-colors">
                            {formatTime(modeTimes[m.id])} <span className="text-[10px] opacity-60">({pct.toFixed(1)}%)</span>
                          </span>
                        </div>
                        <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-white/5">
                          <div 
                            className="bg-amber-500 h-full rounded-full transition-all duration-1000 ease-out" 
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-amber-500/80 mb-4 flex items-center gap-2 uppercase tracking-widest">
                   <div className="w-1.5 h-1.5 bg-amber-600 rounded-full"/> 教學行為統計 (ACTIONS)
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {TEACHING_ACTIONS.map(a => (
                    <div key={a.id} className="bg-slate-900/30 p-4 rounded-xl border border-white/5 flex justify-between items-center group hover:bg-slate-800/40 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{a.icon}</span>
                        <span className="text-sm text-slate-300 font-medium">{a.label}</span>
                      </div>
                      <div className="flex gap-4 text-xs font-mono">
                        <div className="text-right">
                          <div className="text-[10px] text-slate-500 uppercase tracking-tighter">次數</div>
                          <div className="text-slate-200 font-bold">{actionCounts[a.id]} <span className="text-[10px] font-normal text-slate-500 italic">次</span></div>
                        </div>
                        <div className="text-right border-l border-white/5 pl-4">
                          <div className="text-[10px] text-slate-500 uppercase tracking-tighter">總時數</div>
                          <div className="text-amber-500/80 font-bold">{formatTime(actionDurations[a.id])}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-8 border-t border-white/10 bg-slate-900/80 flex gap-4">
              <button 
                onClick={copyToClipboard}
                className="flex-1 py-4 rounded-2xl bg-slate-800 border border-white/10 text-white text-sm font-bold hover:bg-slate-700 active:scale-95 transition-all shadow-lg"
              >
                複製紀錄數據
              </button>
              <button 
                onClick={downloadTxt}
                className="flex-1 py-4 rounded-2xl bg-amber-600 text-slate-950 text-sm font-bold hover:bg-amber-500 active:scale-95 transition-all shadow-lg shadow-amber-900/20"
              >
                下載完整報告 (TXT)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
