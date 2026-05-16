import { useMemo, useState } from 'react';
import { categories, convertValue } from './conversions';

type PressureMode = 'gauge' | 'absolute' | 'vacuum';
type SignDirection = 'positive' | 'negative';

type ElectricalField = 'V' | 'A' | 'Ohm' | 'W';

const ATM_KPA = 101.325;

const pressureUnits = ['mmbar', 'Bar', 'Kpa', 'Hpa', 'Mpa', 'Psi', 'INCH HG.', '-kpa', 'cmhg'];

const toKpa = {
  mmbar: (v: number) => v * 0.1,
  Bar: (v: number) => v * 100,
  Kpa: (v: number) => v,
  Hpa: (v: number) => v * 0.1,
  Mpa: (v: number) => v * 1000,
  Psi: (v: number) => v * 6.89475729,
  'INCH HG.': (v: number) => v * 3.38638867,
  '-kpa': (v: number) => v,
  cmhg: (v: number) => v * 1.33322368
} as const;

const formatNumber = (v: number) => v.toLocaleString(undefined, { maximumFractionDigits: 6 });

export default function App() {
  const primaryCategories = categories.filter((cat) => cat.isPrimary);
  const advancedCategories = categories.filter((cat) => !cat.isPrimary);

  const [activeCategoryKey, setActiveCategoryKey] = useState<string | null>(null);
  const activeCategory = categories.find((cat) => cat.key === activeCategoryKey) ?? null;

  const [inputValue, setInputValue] = useState('');
  const [fromUnit, setFromUnit] = useState(categories[0]?.units[0] ?? '');
  const [pressureMode, setPressureMode] = useState<PressureMode>('gauge');
  const [pressureDirection, setPressureDirection] = useState<SignDirection>('positive');

  const [electricalValues, setElectricalValues] = useState<Record<ElectricalField, string>>({ V: '', A: '', Ohm: '', W: '' });

  const numericValue = Number(inputValue);
  const canConvert = inputValue.trim() !== '' && Number.isFinite(numericValue);

  const results = useMemo(() => {
    if (!activeCategory || !canConvert) return [];
    return activeCategory.units.map((unit) => ({ unit, value: convertValue(activeCategory, numericValue, fromUnit, unit) }));
  }, [activeCategory, canConvert, fromUnit, numericValue]);

  const pressureComputed = useMemo(() => {
    if (activeCategory?.key !== 'pressure') return null;
    if (inputValue.trim() === '' || !Number.isFinite(numericValue) || numericValue < 0) return null;

    const directionFactor = pressureDirection === 'negative' ? -1 : 1;
    const chosen = fromUnit as keyof typeof toKpa;
    const baseInput = numericValue;

    if (pressureMode === 'absolute') {
      const absoluteKpa = toKpa[chosen](baseInput);
      if (absoluteKpa < 0) return null;
      return { modeLabel: '絕對壓力換算', gaugeKpa: absoluteKpa - ATM_KPA, absoluteKpa, vacuumKpa: Math.max(0, ATM_KPA - absoluteKpa) };
    }

    if (pressureMode === 'vacuum') {
      const vacuumKpa = toKpa[chosen](baseInput);
      const gaugeKpa = -vacuumKpa;
      const absoluteKpa = ATM_KPA + gaugeKpa;
      return { modeLabel: '負壓換算', gaugeKpa, absoluteKpa, vacuumKpa };
    }

    const gaugeInput = toKpa[chosen](baseInput) * directionFactor;
    const absoluteKpa = gaugeInput + ATM_KPA;
    return { modeLabel: '表壓換算', gaugeKpa: gaugeInput, absoluteKpa, vacuumKpa: gaugeInput < 0 ? Math.abs(gaugeInput) : 0 };
  }, [activeCategory?.key, fromUnit, inputValue, numericValue, pressureDirection, pressureMode]);

  const electricalComputed = useMemo(() => {
    const parsed: Partial<Record<ElectricalField, number>> = {};
    (Object.keys(electricalValues) as ElectricalField[]).forEach((k) => {
      const text = electricalValues[k].trim();
      if (!text) return;
      const n = Number(text);
      if (Number.isFinite(n) && n >= 0) parsed[k] = n;
    });
    const entries = Object.entries(parsed) as [ElectricalField, number][];
    if (entries.length !== 2) return null;

    const map = Object.fromEntries(entries) as Record<ElectricalField, number>;
    let { V, A, Ohm, W } = map;

    if (V !== undefined && A !== undefined) {
      Ohm = A === 0 ? Infinity : V / A;
      W = V * A;
    } else if (V !== undefined && Ohm !== undefined) {
      A = Ohm === 0 ? Infinity : V / Ohm;
      W = Ohm === 0 ? Infinity : (V * V) / Ohm;
    } else if (V !== undefined && W !== undefined) {
      A = V === 0 ? Infinity : W / V;
      Ohm = W === 0 ? Infinity : (V * V) / W;
    } else if (A !== undefined && Ohm !== undefined) {
      V = A * Ohm;
      W = A * A * Ohm;
    } else if (A !== undefined && W !== undefined) {
      V = A === 0 ? Infinity : W / A;
      Ohm = A === 0 ? Infinity : W / (A * A);
    } else if (Ohm !== undefined && W !== undefined) {
      if (Ohm === 0) return null;
      A = Math.sqrt(W / Ohm);
      V = A * Ohm;
    }

    if ([V, A, Ohm, W].some((v) => v === undefined || !Number.isFinite(v) || v < 0)) return null;

    return { V: V!, A: A!, Ohm: Ohm!, W: W! };
  }, [electricalValues]);

  const enterCategory = (key: string) => {
    const next = categories.find((cat) => cat.key === key);
    if (!next) return;
    setActiveCategoryKey(next.key);
    setFromUnit(next.units[0]);
    setInputValue('');
    setPressureMode('gauge');
    setPressureDirection('positive');
    setElectricalValues({ V: '', A: '', Ohm: '', W: '' });
  };

  const backToHome = () => {
    setActiveCategoryKey(null);
    setInputValue('');
  };

  if (activeCategory) {
    const isPressure = activeCategory.key === 'pressure';
    const isElectrical = activeCategory.key === 'electrical';

    return <div className="app"><header className="card page-header"><button className="back-button" onClick={backToHome}>返回首頁</button><h1>{activeCategory.label}</h1>{activeCategory.note ? <p className="note">{activeCategory.note}</p> : null}</header>
      <section className="card converter-card">
        {!isPressure && !isElectrical && (
          <>
            <div className="controls">
              <input type="text" pattern="[0-9.]*" inputMode="decimal" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="輸入數值" />
              <select value={fromUnit} onChange={(e) => setFromUnit(e.target.value)}>{activeCategory.units.map((u) => <option key={u} value={u}>{u}</option>)}</select>
              <button onClick={() => setInputValue('')}>一鍵清除</button>
            </div>
            <div className="results">{canConvert ? results.map((r) => <div key={r.unit} className="result"><span>{r.unit}</span><strong>{formatNumber(r.value)}</strong></div>) : <p className="empty-result">請輸入數值以顯示換算結果</p>}</div>
          </>
        )}

        {isPressure && (
          <>
            <p className="note">手機不用輸入負號，請用正負選擇切換。</p>
            <div className="toggle-row">{(['gauge', 'absolute', 'vacuum'] as PressureMode[]).map((m) => <button key={m} className={pressureMode === m ? 'mode-btn active' : 'mode-btn'} onClick={() => setPressureMode(m)}>{m === 'gauge' ? '表壓' : m === 'absolute' ? '絕對壓力' : '負壓'}</button>)}</div>
            <div className="controls">
              <input type="text" pattern="[0-9.]*" inputMode="decimal" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="請輸入數值（正數）" />
              <select value={fromUnit} onChange={(e) => setFromUnit(e.target.value)}>{pressureUnits.map((u) => <option key={u} value={u}>{u}</option>)}</select>
              {pressureMode !== 'absolute' && <select value={pressureDirection} onChange={(e) => setPressureDirection(e.target.value as SignDirection)}>
                <option value="positive">正壓 / 加壓</option><option value="negative">負壓 / 真空</option></select>}
              <button onClick={() => setInputValue('')}>一鍵清除</button>
            </div>
            {fromUnit === '-kpa' && pressureMode !== 'vacuum' ? <p className="note">-kpa 建議用於負壓模式。</p> : null}
            <div className="results">
              {!pressureComputed ? <p className="empty-result">請輸入有效數值（絕對壓力不可小於 0）</p> : <>
                <div className="result"><span>{pressureComputed.modeLabel}</span><strong>{formatNumber(pressureComputed.gaugeKpa)} kPa (Gauge)</strong></div>
                <div className="result"><span>對應絕對壓力</span><strong>{formatNumber(pressureComputed.absoluteKpa)} kPa (Absolute)</strong></div>
                <div className="result"><span>真空度</span><strong>{formatNumber(Math.abs(pressureComputed.vacuumKpa))} kPa vacuum</strong></div>
                {pressureMode === 'vacuum' && <div className="result"><span>負壓</span><strong>{formatNumber(pressureComputed.gaugeKpa)} kPa</strong></div>}
                {pressureMode === 'vacuum' && pressureComputed.vacuumKpa > ATM_KPA ? <p className="empty-result">超過理論真空，請檢查輸入值</p> : null}
              </>}
            </div>
          </>
        )}

        {isElectrical && (
          <>
            <p className="formula">Ohm’s Law 快速計算：輸入任意兩個值，自動算出另外兩個值。</p>
            <div className="controls">{(['V', 'A', 'Ohm', 'W'] as ElectricalField[]).map((field) => <input key={field} type="text" pattern="[0-9.]*" inputMode="decimal" placeholder={`${field === 'Ohm' ? '電阻 Ω' : field === 'V' ? '電壓 V' : field === 'A' ? '電流 A' : '功率 W'}`} value={electricalValues[field]} onChange={(e) => setElectricalValues((prev) => ({ ...prev, [field]: e.target.value }))} />)}<button onClick={() => setElectricalValues({ V: '', A: '', Ohm: '', W: '' })}>一鍵清除</button></div>
            <div className="results">{!electricalComputed ? <p className="empty-result">請輸入任意兩個有效數值。</p> : <>
              <div className="result"><span>電壓 V</span><strong>{formatNumber(electricalComputed.V)} V / {formatNumber(electricalComputed.V * 1000)} mV</strong></div>
              <div className="result"><span>電流 A</span><strong>{formatNumber(electricalComputed.A)} A / {formatNumber(electricalComputed.A * 1000)} mA</strong></div>
              <div className="result"><span>電阻 Ω</span><strong>{formatNumber(electricalComputed.Ohm)} Ω / {formatNumber(electricalComputed.Ohm * 1000)} mΩ / {formatNumber(electricalComputed.Ohm / 1000)} kΩ</strong></div>
              <div className="result"><span>功率 W</span><strong>{formatNumber(electricalComputed.W)} W / {formatNumber(electricalComputed.W / 1000)} kW</strong></div>
            </>}</div>
          </>
        )}
      </section></div>;
  }

  return <div className="app"><header className="hero card"><h1>Auto Repair Unit Converter</h1><p>汽車維修單位換算工具</p><p>Web V1.0</p></header><section className="card"><h2>主要功能</h2><div className="grid">{primaryCategories.map((cat) => <button key={cat.key} onClick={() => enterCategory(cat.key)}>{cat.label}</button>)}</div><h3>進階功能 / 其他換算</h3><div className="grid advanced-grid">{advancedCategories.map((cat) => <button key={cat.key} className="secondary" onClick={() => enterCategory(cat.key)}>{cat.label}</button>)}</div></section></div>;
}
