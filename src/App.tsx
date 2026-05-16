import { useMemo, useState } from 'react';
import { categories, convertValue } from './conversions';

type DisplayMode = 'large' | 'compact';

export default function App() {
  const [displayMode, setDisplayMode] = useState<DisplayMode>('large');
  const [activeCategory, setActiveCategory] = useState(categories[0]);
  const [inputValue, setInputValue] = useState('');
  const [fromUnit, setFromUnit] = useState(activeCategory.units[0]);

  const numericValue = Number(inputValue);
  const canConvert = inputValue.trim() !== '' && Number.isFinite(numericValue);

  const results = useMemo(() => {
    if (!canConvert) return [];
    return activeCategory.units.map((unit) => ({
      unit,
      value: convertValue(activeCategory, numericValue, fromUnit, unit)
    }));
  }, [activeCategory, canConvert, fromUnit, numericValue]);

  const updateCategory = (key: string) => {
    const next = categories.find((cat) => cat.key === key);
    if (!next) return;
    setActiveCategory(next);
    setFromUnit(next.units[0]);
    setInputValue('');
  };

  return (
    <div className={`app ${displayMode}`}>
      <header className="hero card">
        <h1>Auto Repair Unit Converter</h1>
        <p>汽車維修單位換算工具</p>
        <p>Web V1.0</p>
        <button onClick={() => setDisplayMode(displayMode === 'large' ? 'compact' : 'large')}>
          顯示模式：{displayMode === 'large' ? '大字' : '緊湊'}
        </button>
      </header>

      <section className="card">
        <h2>分類</h2>
        <div className="grid">
          {categories.map((cat) => (
            <button key={cat.key} className={cat.key === activeCategory.key ? 'active' : ''} onClick={() => updateCategory(cat.key)}>
              {cat.label}
            </button>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>{activeCategory.label}</h2>
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
          {canConvert ? results.map((r) => <div key={r.unit} className="result"><span>{r.unit}</span><strong>{r.value.toLocaleString(undefined, { maximumFractionDigits: 6 })}</strong></div>) : <p>請輸入數值以顯示換算結果</p>}
        </div>
      </section>

      <section className="card">
        <h2>電系公式</h2>
        <p>P = V × A</p>
      </section>
    </div>
  );
}
