import { useMemo, useState } from 'react';
import { categories, convertValue } from './conversions';

export default function App() {
  const primaryCategories = categories.filter((cat) => cat.isPrimary);
  const advancedCategories = categories.filter((cat) => !cat.isPrimary);

  const [activeCategoryKey, setActiveCategoryKey] = useState<string | null>(null);
  const activeCategory = categories.find((cat) => cat.key === activeCategoryKey) ?? null;

  const [inputValue, setInputValue] = useState('');
  const [fromUnit, setFromUnit] = useState(categories[0]?.units[0] ?? '');

  const numericValue = Number(inputValue);
  const canConvert = inputValue.trim() !== '' && Number.isFinite(numericValue);

  const results = useMemo(() => {
    if (!activeCategory || !canConvert) return [];
    return activeCategory.units.map((unit) => ({
      unit,
      value: convertValue(activeCategory, numericValue, fromUnit, unit)
    }));
  }, [activeCategory, canConvert, fromUnit, numericValue]);

  const enterCategory = (key: string) => {
    const next = categories.find((cat) => cat.key === key);
    if (!next) return;
    setActiveCategoryKey(next.key);
    setFromUnit(next.units[0]);
    setInputValue('');
  };

  const backToHome = () => {
    setActiveCategoryKey(null);
    setInputValue('');
  };

  if (activeCategory) {
    return (
      <div className="app">
        <header className="card page-header">
          <button className="back-button" onClick={backToHome}>返回首頁</button>
          <h1>{activeCategory.label}</h1>
          {activeCategory.note ? <p className="note">{activeCategory.note}</p> : null}
          {activeCategory.key === 'electrical' ? <p className="formula">P = V × A</p> : null}
        </header>

        <section className="card converter-card">
          <div className="controls">
            <input value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="輸入數值" inputMode="decimal" />
            <select value={fromUnit} onChange={(e) => setFromUnit(e.target.value)}>
              {activeCategory.units.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
            <button onClick={() => setInputValue('')}>一鍵清除</button>
          </div>

          <div className="results">
            {canConvert
              ? results.map((r) => (
                  <div key={r.unit} className="result">
                    <span>{r.unit}</span>
                    <strong>{r.value.toLocaleString(undefined, { maximumFractionDigits: 6 })}</strong>
                  </div>
                ))
              : <p className="empty-result">請輸入數值以顯示換算結果</p>}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="hero card">
        <h1>Auto Repair Unit Converter</h1>
        <p>汽車維修單位換算工具</p>
        <p>Web V1.0</p>
      </header>

      <section className="card">
        <h2>主要功能</h2>
        <div className="grid">
          {primaryCategories.map((cat) => (
            <button key={cat.key} onClick={() => enterCategory(cat.key)}>
              {cat.label}
            </button>
          ))}
        </div>

        <h3>進階功能 / 其他換算</h3>
        <div className="grid advanced-grid">
          {advancedCategories.map((cat) => (
            <button key={cat.key} className="secondary" onClick={() => enterCategory(cat.key)}>
              {cat.label}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
