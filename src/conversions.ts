export type ConverterCategory = {
  key: string;
  label: string;
  units: string[];
  toBase: Record<string, (value: number) => number>;
  fromBase: Record<string, (value: number) => number>;
};

const linearCategory = (key: string, label: string, factors: Record<string, number>): ConverterCategory => {
  const toBase: Record<string, (value: number) => number> = {};
  const fromBase: Record<string, (value: number) => number> = {};
  Object.entries(factors).forEach(([unit, factor]) => {
    toBase[unit] = (v) => v * factor;
    fromBase[unit] = (v) => v / factor;
  });
  return { key, label, units: Object.keys(factors), toBase, fromBase };
};

export const categories: ConverterCategory[] = [
  linearCategory('pressure', 'A. 壓力換算', { psi: 1, bar: 14.5037738, kPa: 0.145037738, MPa: 145.037738, 'kg/cm²': 14.2233433, inHg: 0.4911542, cmHg: 0.1933676 }),
  linearCategory('torque', 'B. 扭力換算', { 'N·m': 1, 'kgf·m': 9.80665, 'lb·ft': 1.35581795, 'lb·in': 0.112984829 }),
  linearCategory('length', 'C. 長度換算', { mm: 1, cm: 10, inch: 25.4, ft: 304.8 }),
  linearCategory('weight', 'D. 重量換算', { kg: 1, g: 0.001, lb: 0.45359237, oz: 0.0283495231 }),
  {
    key: 'temp',
    label: 'E. 溫度換算',
    units: ['°C', '°F', 'K'],
    toBase: {
      '°C': (v) => v,
      '°F': (v) => (v - 32) * 5 / 9,
      K: (v) => v - 273.15
    },
    fromBase: {
      '°C': (v) => v,
      '°F': (v) => (v * 9) / 5 + 32,
      K: (v) => v + 273.15
    }
  },
  linearCategory('volume', 'F. 容積換算', { L: 1, mL: 0.001, 'gallon US': 3.785411784, quart: 0.946352946, pint: 0.473176473, cc: 0.001 }),
  linearCategory('power', 'G. 功率換算', { kW: 1, hp: 0.745699872, PS: 0.73549875 }),
  linearCategory('electrical', 'H. 電系換算', { V: 1, A: 1, W: 1, Ohm: 1 })
];

export const convertValue = (category: ConverterCategory, input: number, fromUnit: string, toUnit: string) => {
  const baseValue = category.toBase[fromUnit](input);
  return category.fromBase[toUnit](baseValue);
};
