import { useMemo, useState } from 'react';
import { categories, convertValue } from './conversions';

type ElectricalField = 'V' | 'A' | 'Ohm' | 'W';
type PressureDirection = 'positive' | 'negative';

const pressureUnits = ['mmbar', 'Bar', 'Kpa', 'Hpa', 'Mpa', 'Psi', 'INCH HG.', 'cmhg'] as const;

const electricalUnitOptions = {
  V: [{ label: 'mV', factor: 0.001 }, { label: 'V', factor: 1 }, { label: 'kV', factor: 1000 }],
  A: [{ label: 'mA', factor: 0.001 }, { label: 'A', factor: 1 }],
  Ohm: [{ label: 'mΩ', factor: 0.001 }, { label: 'Ω', factor: 1 }, { label: 'kΩ', factor: 1000 }, { label: 'MΩ', factor: 1000000 }],
  W: [{ label: 'mW', factor: 0.001 }, { label: 'W', factor: 1 }, { label: 'kW', factor: 1000 }]
} as const;

type ElectricalUnitSelections = Record<ElectricalField, string>;

const formatNumber = (v: number) => v.toLocaleString(undefined, { maximumFractionDigits: 6 });

export default function App() {
  const primaryCategories = categories.filter((cat) => cat.isPrimary);
  const advancedCategories = categories.filter((cat) => !cat.isPrimary);

  const [activeCategoryKey, setActiveCategoryKey] = useState<string | null>(null);
  const activeCategory = categories.find((cat) => cat.key === activeCategoryKey) ?? null;

  const [inputValue, setInputValue] = useState('');
  const [fromUnit, setFromUnit] = useState(categories[0]?.units[0] ?? '');
  const [pressureDirection, setPressureDirection] = useState<PressureDirection>('positive');

  const [electricalValues, setElectricalValues] = useState<Record<ElectricalField, string>>({ V: '', A: '', Ohm: '', W: '' });
  const [electricalUnits, setElectricalUnits] = useState<ElectricalUnitSelections>({ V: 'V', A: 'A', Ohm: 'Ω', W: 'W' });

  const numericValue = Number(inputValue);
  const canConvert = inputValue.trim() !== '' && Number.isFinite(numericValue);

  const results = useMemo(() => {
    if (!activeCategory || !canConvert) return [];
    return activeCategory.units.map((unit) => ({ unit, value: convertValue(activeCategory, numericValue, fromUnit, unit) }));
  }, [activeCategory, canConvert, fromUnit, numericValue]);

  const pressureResults = useMemo(() => {
    if (activeCategory?.key !== 'pressure') return [];
    if (!canConvert || numericValue < 0) return [];
    const sign = pressureDirection === 'negative' ? -1 : 1;
    return pressureUnits.map((unit) => ({
      unit,
      value: convertValue(activeCategory, numericValue, fromUnit, unit) * sign
    }));
  }, [activeCategory, canConvert, fromUnit, numericValue, pressureDirection]);

  const electricalComputed = useMemo(() => {
    const parsed: Partial<Record<ElectricalField, number>> = {};

    (Object.keys(electricalValues) as ElectricalField[]).forEach((field) => {
      const text = electricalValues[field].trim();
      if (!text) return;
      const n = Number(text);
      if (!Number.isFinite(n) || n < 0) return;
      const selected = electricalUnitOptions[field].find((option) => option.label === electricalUnits[field]);
      if (!selected) return;
      parsed[field] = n * selected.factor;
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
  }, [electricalUnits, electricalValues]);

  const formatElectricalBySelectedUnit = (field: ElectricalField, baseValue: number) => {
    const selected = electricalUnitOptions[field].find((option) => option.label === electricalUnits[field]);
    if (!selected) return `${formatNumber(baseValue)}`;
    return `${formatNumber(baseValue / selected.factor)} ${selected.label}`;
  };

  const enterCategory = (key: string) => {
    const next = categories.find((cat) => cat.key === key);
    if (!next) return;
    setActiveCategoryKey(next.key);
    setFromUnit(next.units[0]);
    setInputValue('');
    setPressureDirection('positive');
    setElectricalValues({ V: '', A: '', Ohm: '', W: '' });
    setElectricalUnits({ V: 'V', A: 'A', Ohm: 'Ω', W: 'W' });
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
            <div className="pressure-direction">
              <span>壓力方向</span>
              <div className="toggle-row">{(['positive', 'negative'] as PressureDirection[]).map((direction) => <button key={direction} className={pressureDirection === direction ? 'mode-btn active' : 'mode-btn'} onClick={() => setPressureDirection(direction)}>{direction === 'positive' ? '正壓' : '負壓'}</button>)}</div>
            </div>
            <div className="controls">
              <input type="text" pattern="[0-9.]*" inputMode="decimal" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="請輸入數值（正數）" />
              <select value={fromUnit} onChange={(e) => setFromUnit(e.target.value)}>{pressureUnits.map((u) => <option key={u} value={u}>{u}</option>)}</select>
              <button onClick={() => setInputValue('')}>一鍵清除</button>
            </div>
            <p className="note gauge-note">輸出值為表壓；負壓會以負號顯示。</p>
            <div className="results">{canConvert ? pressureResults.map((r) => <div key={r.unit} className="result"><span>{r.unit}</span><strong>{formatNumber(r.value)}</strong></div>) : <p className="empty-result">請輸入有效數值（不可小於 0）</p>}</div>
          </>
        )}

        {isElectrical && (
          <>
            <p className="formula">Ohm’s Law 快速計算：輸入任意兩個值，自動算出另外兩個值。</p>
            <div className="controls electrical-controls">{(['V', 'A', 'Ohm', 'W'] as ElectricalField[]).map((field) => (
              <div key={field} className="electrical-row">
                <input type="text" pattern="[0-9.]*" inputMode="decimal" placeholder={field === 'Ohm' ? '電阻' : field === 'V' ? '電壓' : field === 'A' ? '電流' : '功率'} value={electricalValues[field]} onChange={(e) => setElectricalValues((prev) => ({ ...prev, [field]: e.target.value }))} />
                <select value={electricalUnits[field]} onChange={(e) => setElectricalUnits((prev) => ({ ...prev, [field]: e.target.value }))}>
                  {electricalUnitOptions[field].map((option) => <option key={option.label} value={option.label}>{option.label}</option>)}
                </select>
              </div>
            ))}<button onClick={() => setElectricalValues({ V: '', A: '', Ohm: '', W: '' })}>一鍵清除</button></div>
            <div className="results">{!electricalComputed ? <p className="empty-result">請輸入任意兩個有效數值。</p> : <>
              <div className="result"><span>電壓</span><strong>{formatElectricalBySelectedUnit('V', electricalComputed.V)}</strong></div>
              <div className="result"><span>電流</span><strong>{formatElectricalBySelectedUnit('A', electricalComputed.A)}</strong></div>
              <div className="result"><span>電阻</span><strong>{formatElectricalBySelectedUnit('Ohm', electricalComputed.Ohm)}</strong></div>
              <div className="result"><span>功率</span><strong>{formatElectricalBySelectedUnit('W', electricalComputed.W)}</strong></div>
              <div className="result"><span>常用電壓</span><strong>{formatNumber(electricalComputed.V * 1000)} mV / {formatNumber(electricalComputed.V)} V</strong></div>
              <div className="result"><span>常用電流</span><strong>{formatNumber(electricalComputed.A * 1000)} mA / {formatNumber(electricalComputed.A)} A</strong></div>
              <div className="result"><span>常用電阻</span><strong>{formatNumber(electricalComputed.Ohm * 1000)} mΩ / {formatNumber(electricalComputed.Ohm)} Ω / {formatNumber(electricalComputed.Ohm / 1000)} kΩ</strong></div>
              <div className="result"><span>常用功率</span><strong>{formatNumber(electricalComputed.W * 1000)} mW / {formatNumber(electricalComputed.W)} W / {formatNumber(electricalComputed.W / 1000)} kW</strong></div>
            </>}</div>
          </>
        )}
      </section></div>;
  }

  return <div className="app"><header className="hero card"><h1>Auto Repair Unit Converter</h1><p>汽車維修單位換算工具</p><p>Web V1.0</p></header><section className="card"><h2>主要功能</h2><div className="grid">{primaryCategories.map((cat) => <button key={cat.key} onClick={() => enterCategory(cat.key)}>{cat.label}</button>)}</div><h3>進階功能 / 其他換算</h3><div className="grid advanced-grid">{advancedCategories.map((cat) => <button key={cat.key} className="secondary" onClick={() => enterCategory(cat.key)}>{cat.label}</button>)}</div></section></div>;
}
