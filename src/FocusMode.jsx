import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  BrainCircuit,
  Play,
  Pause,
  RotateCcw,
  Coffee,
  Settings,
  X,
  Flame,
} from "lucide-react";
import { supabase } from "./lib/supabase";

const defaultSettings = {
  focusDuration: 25,
  shortBreak: 5,
  longBreak: 15,
  sessionsBeforeLongBreak: 4,
};

const todayString = () => new Date().toISOString().slice(0, 10);

const yesterdayString = () => {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date.toISOString().slice(0, 10);
};

const mapSettingsRow = (row) => ({
  focusDuration: row.focus_duration,
  shortBreak: row.short_break,
  longBreak: row.long_break,
  sessionsBeforeLongBreak: row.sessions_before_long_break,
});

const mapStatsRow = (row) => ({
  sessionsToday: row.sessions_today,
  focusMinutesToday: row.focus_minutes_today,
  currentStreak: row.current_streak,
  completedTotal: row.completed_total,
  lastDate: row.last_date,
  sessionCountInCycle: row.session_count_in_cycle,
});

const TIMER_STORAGE_KEY = "learnloop_focus_timer_state";

const FocusMode = () => {
  const [userId, setUserId] = useState(null);

  const [settings, setSettings] = useState(defaultSettings);
  const [tempSettings, setTempSettings] = useState(defaultSettings);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [mode, setMode] = useState("focus");
  const [timeLeft, setTimeLeft] = useState(defaultSettings.focusDuration * 60);
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [endTime, setEndTime] = useState(null);

  const [stats, setStats] = useState({
    sessionsToday: 0,
    focusMinutesToday: 0,
    currentStreak: 0,
    completedTotal: 0,
    lastDate: todayString(),
    sessionCountInCycle: 0,
  });

  const getModeDurationInSeconds = useCallback(
    (currentMode) => {
      if (currentMode === "focus") return settings.focusDuration * 60;
      if (currentMode === "break") return settings.shortBreak * 60;
      return settings.longBreak * 60;
    },
    [settings],
  );

  const saveTimerState = useCallback((nextState) => {
    localStorage.setItem(
      TIMER_STORAGE_KEY,
      JSON.stringify({
        mode: nextState.mode,
        timeLeft: nextState.timeLeft,
        isActive: nextState.isActive,
        endTime: nextState.endTime,
        savedAt: Date.now(),
      }),
    );
  }, []);

  const clearTimerState = useCallback(() => {
    localStorage.removeItem(TIMER_STORAGE_KEY);
  }, []);

  const saveStatsToDb = useCallback(
    async (nextStats) => {
      if (!userId) return;

      const { error } = await supabase
        .from("focus_stats")
        .update({
          sessions_today: nextStats.sessionsToday,
          focus_minutes_today: nextStats.focusMinutesToday,
          current_streak: nextStats.currentStreak,
          completed_total: nextStats.completedTotal,
          last_date: nextStats.lastDate,
          session_count_in_cycle: nextStats.sessionCountInCycle,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      if (error) {
        console.error("Failed to save focus stats:", error.message);
      }
    },
    [userId],
  );

  const handleSessionCompletion = useCallback(async () => {
    setIsActive(false);
    setEndTime(null);

    if (mode === "focus") {
      const today = todayString();
      const yesterday = yesterdayString();

      let newStreak = 1;
      if (stats.lastDate === today) {
        newStreak = Math.max(stats.currentStreak, 1);
      } else if (stats.lastDate === yesterday) {
        newStreak = stats.currentStreak + 1;
      }

      const nextSessionCount = stats.sessionCountInCycle + 1;

      const nextStats = {
        sessionsToday: stats.lastDate === today ? stats.sessionsToday + 1 : 1,
        focusMinutesToday:
          stats.lastDate === today
            ? stats.focusMinutesToday + settings.focusDuration
            : settings.focusDuration,
        completedTotal: stats.completedTotal + 1,
        currentStreak: newStreak,
        lastDate: today,
        sessionCountInCycle: nextSessionCount,
      };

      setStats(nextStats);
      await saveStatsToDb(nextStats);

      if (nextSessionCount % settings.sessionsBeforeLongBreak === 0) {
        const nextMode = "longBreak";
        const nextTime = settings.longBreak * 60;
        setMode(nextMode);
        setTimeLeft(nextTime);
        saveTimerState({
          mode: nextMode,
          timeLeft: nextTime,
          isActive: false,
          endTime: null,
        });
      } else {
        const nextMode = "break";
        const nextTime = settings.shortBreak * 60;
        setMode(nextMode);
        setTimeLeft(nextTime);
        saveTimerState({
          mode: nextMode,
          timeLeft: nextTime,
          isActive: false,
          endTime: null,
        });
      }
    } else {
      const nextMode = "focus";
      const nextTime = settings.focusDuration * 60;
      setMode(nextMode);
      setTimeLeft(nextTime);
      saveTimerState({
        mode: nextMode,
        timeLeft: nextTime,
        isActive: false,
        endTime: null,
      });
    }
  }, [mode, saveStatsToDb, saveTimerState, settings, stats]);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      if (!mounted) return;
      setUserId(user.id);

      let { data: settingsRow } = await supabase
        .from("focus_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!settingsRow) {
        const { data: insertedSettings } = await supabase
          .from("focus_settings")
          .insert({
            user_id: user.id,
            focus_duration: defaultSettings.focusDuration,
            short_break: defaultSettings.shortBreak,
            long_break: defaultSettings.longBreak,
            sessions_before_long_break: defaultSettings.sessionsBeforeLongBreak,
          })
          .select()
          .single();

        settingsRow = insertedSettings;
      }

      const normalizedSettings = settingsRow
        ? mapSettingsRow(settingsRow)
        : defaultSettings;

      if (mounted) {
        setSettings(normalizedSettings);
        setTempSettings(normalizedSettings);
      }

      let { data: statsRow } = await supabase
        .from("focus_stats")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!statsRow) {
        const { data: insertedStats } = await supabase
          .from("focus_stats")
          .insert({
            user_id: user.id,
            sessions_today: 0,
            focus_minutes_today: 0,
            current_streak: 0,
            completed_total: 0,
            last_date: todayString(),
            session_count_in_cycle: 0,
          })
          .select()
          .single();

        statsRow = insertedStats;
      } else {
        const today = todayString();
        const yesterday = yesterdayString();
        let updates = null;

        if (statsRow.last_date !== today) {
          updates = {
            sessions_today: 0,
            focus_minutes_today: 0,
          };

          if (statsRow.last_date !== yesterday) {
            updates.current_streak = 0;
          }
        }

        if (updates) {
          const { data: updatedStats } = await supabase
            .from("focus_stats")
            .update(updates)
            .eq("user_id", user.id)
            .select()
            .single();

          if (updatedStats) {
            statsRow = updatedStats;
          }
        }
      }

      if (mounted && statsRow) {
        setStats(mapStatsRow(statsRow));
      }

      if (!mounted) return;

      const savedTimer = localStorage.getItem(TIMER_STORAGE_KEY);

      if (savedTimer) {
        try {
          const parsed = JSON.parse(savedTimer);
          const nextMode = parsed.mode || "focus";

          const fallbackDuration =
            nextMode === "focus"
              ? normalizedSettings.focusDuration * 60
              : nextMode === "break"
                ? normalizedSettings.shortBreak * 60
                : normalizedSettings.longBreak * 60;

          if (parsed.isActive && parsed.endTime) {
            const remaining = Math.max(
              0,
              Math.ceil((Number(parsed.endTime) - Date.now()) / 1000),
            );

            if (remaining > 0) {
              setMode(nextMode);
              setIsActive(true);
              setEndTime(Number(parsed.endTime));
              setTimeLeft(remaining);
            } else {
              setMode(nextMode);
              setIsActive(false);
              setEndTime(null);
              setTimeLeft(0);
              clearTimerState();
            }
          } else {
            setMode(nextMode);
            setIsActive(false);
            setEndTime(null);
            setTimeLeft(
              typeof parsed.timeLeft === "number"
                ? parsed.timeLeft
                : fallbackDuration,
            );
          }
        } catch {
          setMode("focus");
          setIsActive(false);
          setEndTime(null);
          setTimeLeft(normalizedSettings.focusDuration * 60);
          clearTimerState();
        }
      } else {
        setMode("focus");
        setIsActive(false);
        setEndTime(null);
        setTimeLeft(normalizedSettings.focusDuration * 60);
      }

      setLoading(false);
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, [clearTimerState]);

  const resetTimer = useCallback(() => {
    const resetValue = getModeDurationInSeconds(mode);
    setIsActive(false);
    setEndTime(null);
    setTimeLeft(resetValue);
    saveTimerState({
      mode,
      timeLeft: resetValue,
      isActive: false,
      endTime: null,
    });
  }, [getModeDurationInSeconds, mode, saveTimerState]);

  useEffect(() => {
    if (loading || !isActive || !endTime) return;

    const tick = async () => {
      const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));

      setTimeLeft(remaining);

      if (remaining <= 0) {
        setIsActive(false);
        setEndTime(null);
        clearTimerState();
        await handleSessionCompletion();
      }
    };

    tick();
    const interval = setInterval(tick, 1000);

    return () => clearInterval(interval);
  }, [loading, isActive, endTime, handleSessionCompletion, clearTimerState]);

  useEffect(() => {
    if (loading) return;

    saveTimerState({
      mode,
      timeLeft,
      isActive,
      endTime,
    });
  }, [mode, timeLeft, isActive, endTime, loading, saveTimerState]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const saveNewSettings = async () => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from("focus_settings")
        .update({
          focus_duration: tempSettings.focusDuration,
          short_break: tempSettings.shortBreak,
          long_break: tempSettings.longBreak,
          sessions_before_long_break: tempSettings.sessionsBeforeLongBreak,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      if (error) throw error;

      setSettings(tempSettings);

      if (!isActive) {
        const nextDuration =
          mode === "focus"
            ? tempSettings.focusDuration * 60
            : mode === "break"
              ? tempSettings.shortBreak * 60
              : tempSettings.longBreak * 60;

        setTimeLeft(nextDuration);
        saveTimerState({
          mode,
          timeLeft: nextDuration,
          isActive: false,
          endTime: null,
        });
      }

      setIsSettingsOpen(false);
    } catch (error) {
      alert(error.message || "Failed to save settings.");
    }
  };

  const toggleTimer = () => {
    if (isActive) {
      const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
      setIsActive(false);
      setEndTime(null);
      setTimeLeft(remaining);
      saveTimerState({
        mode,
        timeLeft: remaining,
        isActive: false,
        endTime: null,
      });
    } else {
      const newEndTime = Date.now() + timeLeft * 1000;
      setIsActive(true);
      setEndTime(newEndTime);
      saveTimerState({
        mode,
        timeLeft,
        isActive: true,
        endTime: newEndTime,
      });
    }
  };

  const changeModeManually = (nextMode) => {
    const nextDuration = getModeDurationInSeconds(nextMode);
    setMode(nextMode);
    setIsActive(false);
    setEndTime(null);
    setTimeLeft(nextDuration);
    saveTimerState({
      mode: nextMode,
      timeLeft: nextDuration,
      isActive: false,
      endTime: null,
    });
  };

  const isFocusMode = mode === "focus";
  const headerBgColor = isFocusMode ? "bg-blue-600" : "bg-emerald-600";
  const timeDisplayColor = isFocusMode ? "text-blue-600" : "text-emerald-600";

  const cycleProgress = useMemo(
    () => stats.sessionCountInCycle % settings.sessionsBeforeLongBreak,
    [settings.sessionsBeforeLongBreak, stats.sessionCountInCycle],
  );

  const nextFocusIn =
    cycleProgress === 0
      ? settings.sessionsBeforeLongBreak
      : settings.sessionsBeforeLongBreak - cycleProgress;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen bg-gray-50/50 font-sans text-left">
      <div className="flex flex-col sm:flex-row justify-between items-start mb-6 md:mb-8 gap-4">
        <div className="text-left">
          <h1 className="text-xl md:text-3xl font-black text-gray-950 tracking-tight uppercase md:normal-case">
            Focus Mode
          </h1>
          <p className="text-[10px] md:text-sm text-gray-500 font-medium italic">
            Productivity timer for study sessions
          </p>
        </div>

        <button
          onClick={() => {
            setTempSettings(settings);
            setIsSettingsOpen(true);
          }}
          className="flex items-center gap-2 bg-white text-gray-700 px-4 py-2 md:px-5 md:py-3 rounded-xl md:rounded-2xl hover:bg-gray-100 transition-all font-bold shadow-sm text-[10px] md:text-sm border border-gray-100 uppercase tracking-wider"
        >
          <Settings size={16} />
          <span>Settings</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-6 mb-6 md:mb-10">
        {[
          {
            label: "Sessions Today",
            value: stats.sessionsToday,
            icon: <BrainCircuit size={20} />,
            color: "bg-blue-600",
          },
          {
            label: "Focus Minutes",
            value: stats.focusMinutesToday,
            icon: <Play size={20} className="rotate-12" />,
            color: "bg-emerald-600",
          },
          {
            label: "Daily Streak",
            value: stats.currentStreak,
            icon: <Flame size={20} />,
            color: "bg-orange-600",
          },
        ].map((card) => (
          <div
            key={card.label}
            className="bg-white p-4 md:p-7 rounded-2xl md:rounded-[2.5rem] flex items-center justify-between border border-gray-100 shadow-sm"
          >
            <div className="text-left">
              <p className="text-[8px] md:text-xs font-black text-gray-400 mb-0.5 uppercase tracking-widest">
                {card.label}
              </p>
              <p className="text-2xl md:text-4xl font-black text-gray-950 tracking-tighter">
                {card.value}
              </p>
            </div>
            <div
              className={`p-2.5 md:p-4 rounded-xl md:rounded-3xl ${card.color} text-white shadow-lg`}
            >
              {card.icon}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl md:rounded-[3rem] shadow-xl overflow-hidden border border-gray-100 max-w-xl mx-auto w-full">
        <div
          className={`${headerBgColor} text-white p-5 md:p-8 text-center transition-all duration-300`}
        >
          <div className="flex items-center justify-center gap-2 mb-1 md:mb-2">
            {isFocusMode ? <BrainCircuit size={18} /> : <Coffee size={18} />}
            <h2 className="text-lg md:text-2xl font-black tracking-tight uppercase">
              {isFocusMode
                ? "Focus"
                : mode === "longBreak"
                  ? "Long Break"
                  : "Break"}
            </h2>
          </div>
          <p className="text-[9px] md:text-sm font-bold opacity-80 uppercase tracking-widest">
            {isFocusMode ? "Time to work" : "Time to rest"}
          </p>
        </div>

        <div className="p-6 md:p-10 flex flex-col items-center gap-6 md:gap-8">
          <div className="flex bg-gray-50 p-1.5 rounded-xl md:rounded-2xl w-full border border-gray-100">
            <button
              onClick={() => changeModeManually("focus")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 md:py-3 rounded-lg md:rounded-xl transition-all font-black text-[10px] md:text-sm uppercase tracking-wider ${
                isFocusMode
                  ? "bg-gray-950 text-white shadow-lg"
                  : "text-gray-400"
              }`}
            >
              <BrainCircuit size={14} /> <span>Focus</span>
            </button>
            <button
              onClick={() => changeModeManually("break")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 md:py-3 rounded-lg md:rounded-xl transition-all font-black text-[10px] md:text-sm uppercase tracking-wider ${
                !isFocusMode
                  ? "bg-gray-950 text-white shadow-lg"
                  : "text-gray-400"
              }`}
            >
              <Coffee size={14} /> <span>Break</span>
            </button>
          </div>

          <div
            className={`${timeDisplayColor} text-7xl md:text-[120px] font-black tracking-tighter leading-none w-full border-b-2 md:border-b-[6px] border-gray-50 pb-4 md:pb-6 transition-all duration-300 font-mono text-center`}
          >
            {formatTime(timeLeft)}
          </div>

          <p className="text-[10px] md:text-sm font-black text-gray-400 uppercase tracking-[0.2em] mt-4 md:mt-6">
            {isActive ? "Session Live" : "Paused"}
          </p>

          <div className="flex gap-3 md:gap-4 w-full sm:w-auto">
            <button
              onClick={toggleTimer}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-gray-950 text-white px-6 md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl hover:bg-gray-800 transition-all active:scale-95 shadow-xl font-black text-[11px] md:text-sm uppercase tracking-widest"
            >
              {isActive ? (
                <Pause size={16} />
              ) : (
                <Play size={16} className="rotate-12" />
              )}
              <span>{isActive ? "Pause" : "Start"}</span>
            </button>

            <button
              onClick={resetTimer}
              className="flex items-center justify-center gap-2 bg-gray-100 text-gray-500 px-6 md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl hover:bg-gray-200 hover:text-gray-900 font-black text-[11px] md:text-sm uppercase tracking-widest transition-all"
            >
              <RotateCcw size={16} />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>

          <div className="w-full flex justify-between items-center pt-6 md:pt-8 border-t border-gray-50">
            <div className="text-left">
              <p className="text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Total Cycles
              </p>
              <p className="text-xl md:text-3xl font-black text-gray-950 tracking-tighter">
                {stats.completedTotal}
              </p>
              <p className="text-[9px] text-gray-400 font-bold italic">
                {nextFocusIn} left in cycle
              </p>
            </div>

            <div className="flex gap-1 md:gap-1.5">
              {Array.from({ length: settings.sessionsBeforeLongBreak }).map(
                (_, index) => (
                  <div
                    key={index}
                    className={`w-2.5 h-2.5 md:w-4 md:h-4 rounded-full ${
                      index < cycleProgress
                        ? "bg-blue-600 shadow-sm shadow-blue-200"
                        : "bg-gray-100 border-2 border-gray-200"
                    }`}
                  />
                ),
              )}
            </div>
          </div>
        </div>
      </div>

      {isSettingsOpen && (
        <div className="fixed inset-0 bg-gray-950/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 z-50">
          <div className="bg-white rounded-2xl md:rounded-[2.5rem] w-full max-w-lg shadow-2xl p-6 md:p-10 animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg md:text-2xl font-black text-gray-950 uppercase tracking-tight">
                Configuration
              </h2>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full text-gray-400"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 md:space-y-6">
              {[
                { label: "Focus (min)", key: "focusDuration" },
                { label: "Short Break (min)", key: "shortBreak" },
                { label: "Long Break (min)", key: "longBreak" },
                { label: "Session Cycle", key: "sessionsBeforeLongBreak" },
              ].map((item) => (
                <div key={item.key} className="text-left">
                  <label className="text-[9px] md:text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">
                    {item.label}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={tempSettings[item.key]}
                    onChange={(e) =>
                      setTempSettings({
                        ...tempSettings,
                        [item.key]: parseInt(e.target.value, 10) || 1,
                      })
                    }
                    className="w-full p-3 md:p-4 mt-1 bg-gray-50 border border-gray-100 rounded-xl md:rounded-2xl text-xs md:text-sm font-bold focus:bg-white outline-none transition-all"
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="flex-1 py-3 md:py-4 rounded-xl md:rounded-2xl text-gray-500 font-bold text-[10px] md:text-xs uppercase tracking-widest hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={saveNewSettings}
                className="flex-[1.2] bg-gray-950 text-white py-3 md:py-4 rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest hover:bg-gray-800 transition-all active:scale-[0.98]"
              >
                Save changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FocusMode;
