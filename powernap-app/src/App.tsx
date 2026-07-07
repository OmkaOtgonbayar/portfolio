import React, { useEffect, useMemo, useRef, useState } from "react";

type ChecklistItem = { id: string; label: string; done: boolean };
type Preset = { label: string; minutes: number };

const PRESETS: Preset[] = [
  { label: "10分", minutes: 10 },
  { label: "20分(推奨)", minutes: 20 },
  { label: "45分", minutes: 45 },
  { label: "90分", minutes: 90 },
];

const defaultItems: ChecklistItem[] = [
  { id: "student-card", label: "学生証", done: false },
  { id: "wallet", label: "財布 / 交通系IC", done: false },
  { id: "laptop", label: "ノートPC & 充電器", done: false },
  { id: "textbook", label: "教科書・ノート", done: false },
  { id: "mask", label: "マスク", done: false },
  { id: "water", label: "水筒", done: false },
];

function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : initial;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue] as const;
}

function formatTime(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60).toString().padStart(2, "0");
  const s = Math.floor(total % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function App() {
  const [items, setItems] = useLocalStorage<ChecklistItem[]>("px.items", defaultItems);
  const [targetAt, setTargetAt] = useLocalStorage<number | null>("px.targetAt", null);
  const [remaining, setRemaining] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [notifGranted, setNotifGranted] = useState<NotificationPermission>("default");

  const [newLabel, setNewLabel] = useState("");
  const [customMinutes, setCustomMinutes] = useState("");

  
  const [alarmSound, setAlarmSound] = useState("/alarm1.wav");

  const running = targetAt !== null;

  useEffect(() => {
    setNotifGranted(Notification.permission);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      if (targetAt) {
        const left = targetAt - Date.now();
        setRemaining(left);

        if (left <= 0) {
          setTargetAt(null);
          try {
            audioRef.current?.play();
          } catch {}

          if (Notification && Notification.permission === "granted") {
            new Notification("Power Nap 完了！", {
              body: "起きる時間です ⏰",
              silent: false,
            });
          }
          if (navigator.vibrate) {
            navigator.vibrate([300, 200, 300, 200, 600]);
          }
        }
      } else {
        setRemaining(0);
      }
    }, 200);

    return () => clearInterval(id);
  }, [targetAt, setTargetAt]);

  function toggleItem(id: string) {
    setItems(items.map(it => it.id === id ? { ...it, done: !it.done } : it));
  }

  function addItem(label: string) {
    const trimmed = label.trim();
    if (!trimmed) return;
    setItems([{ id: crypto.randomUUID(), label: trimmed, done: false }, ...items]);
  }

  function resetChecklist() {
    setItems(items.map(it => ({ ...it, done: false })));
  }

  function startTimer(mins: number) {
    const at = Date.now() + mins * 60 * 1000;
    setTargetAt(at);

    if (Notification && Notification.permission === "default") {
      Notification.requestPermission().then(p => setNotifGranted(p));
    }
  }

  function stopTimer() {
    setTargetAt(null);
  }

  const percent = useMemo(() => {
    if (!running) return 0;
    const total = Math.max(1, targetAt! - (targetAt! - remaining));
    const left = Math.max(0, remaining);
    const p = 100 - Math.round((left / total) * 100);
    return Math.min(100, Math.max(0, p));
  }, [running, remaining, targetAt]);

  return (
    <div className="container">
      <div className="card" style={{ padding: "18px 16px 14px" }}>
        <h1>Power Nap Buddy</h1>
        <div className="subtitle">
          短時間の仮眠をスマホでシンプル管理。通知 & バイブ & 音で起こします。
        </div>

        <div className="timer" aria-live="polite">
          {running ? formatTime(remaining) : "00:00"}
        </div>
        <div className="small" style={{ marginTop: 8 }}>
          進捗: {percent}%
        </div>

        <div className="grid cols-2" style={{ marginTop: 12 }}>
          {PRESETS.map(p => (
            <button key={p.label} className="btn" onClick={() => startTimer(p.minutes)}>
              {p.label}
            </button>
          ))}
        </div>

        
        <div className="row" style={{ marginTop: 10 }}>
          <input
            className="input"
            type="number"
            placeholder="カスタム (分)"
            value={customMinutes}
            onChange={e => setCustomMinutes(e.target.value)}
          />
          <button
            className="btn primary"
            onClick={() => {
              const m = parseInt(customMinutes);
              if (m > 0) {
                startTimer(m);
                setCustomMinutes("");
              }
            }}
          >
            開始
          </button>
        </div>

       
        <div className="row" style={{ marginTop: 8, gap: 8 }}>
          {!running ? (
            <button className="btn primary" onClick={() => startTimer(20)}>20分で開始</button>
          ) : (
            <button className="btn danger" onClick={stopTimer}>停止</button>
          )}
          <span className="badge">
            {notifGranted === "granted" ? "通知ON" : "通知許可で更に便利"}
          </span>
        </div>

     
        <div className="row" style={{ marginTop: 12 }}>
          <label style={{ fontSize: "0.9rem", marginRight: "8px" }}>アラーム音:</label>
          <select
            className="input"
            style={{ flex: "none", width: "auto" }}
            value={alarmSound}
            onChange={e => setAlarmSound(e.target.value)}
          >
            <option value="/alarm1.wav">穏やかな音</option>
            <option value="/alarm2.wav">自然音</option>
            <option value="/alarm3.wav">アラーム音</option>
          </select>
        </div>

        
        <audio ref={audioRef} src={alarmSound} preload="auto" />
      </div>

      
      <div className="card">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>持ち物チェック</h2>
          <button className="btn" onClick={resetChecklist}>リセット</button>
        </div>

        <div className="row" style={{ marginTop: 8, gap: 8 }}>
          <input
            className="input"
            placeholder="例：学生証、USB..."
            value={newLabel}
            onChange={e => setNewLabel(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter") {
                addItem(newLabel);
                setNewLabel("");
              }
            }}
          />
          <button className="btn primary" onClick={() => { addItem(newLabel); setNewLabel(""); }}>
            追加
          </button>
        </div>

        <div className="grid" style={{ marginTop: 10 }}>
          {items.map(it => (
            <label key={it.id} className="item">
              <input type="checkbox" checked={it.done} onChange={() => toggleItem(it.id)} />
              <span style={{ textDecoration: it.done ? "line-through" : "none" }}>
                {it.label}
              </span>
            </label>
          ))}
        </div>

        <div className="footer-note">
          チェックリストは端末内（localStorage）に保存されます。
        </div>
      </div>

    
      <div className="card">
        <h2 style={{ fontSize: "18px", marginBottom: "8px" }}>💡 Power Nap の豆知識</h2>
        <ul style={{ fontSize: "14px", color: "#cbd5e1", lineHeight: "1.6" }}>
          <li>10〜20分: 集中力・記憶力がアップしやすい。</li>
          <li>30分以上寝ると逆にだるさを感じることもある。</li>
          <li>90分寝ると1サイクル分でスッキリ起きやすい。</li>
          <li>午後2時〜4時が最も効果的な時間帯。</li>
        </ul>
      </div>

      <div className="footer-note">作成: Omka / React + Vite + TS</div>
    </div>
  );
}