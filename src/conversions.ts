export type ConverterCategory = {
  key: string;
  label: string;
  units: string[];
  toBase: Record<string, (value: number) => number>;
  fromBase: Record<string, (value: number) => number>;
  note?: string;
  isPrimary?: boolean;
};

const linearCategory = (
  key: string,
  label: string,
  factors: Record<string, number>,
  options?: Pick<ConverterCategory, 'note' | 'isPrimary'>
): ConverterCategory => {
  const toBase: Record<string, (value: number) => number> = {};
  const fromBase: Record<string, (value: number) => number> = {};
  Object.entries(factors).forEach(([unit, factor]) => {
    toBase[unit] = (v) => v * factor;
    fromBase[unit] = (v) => v / factor;
  });
  return { key, label, units: Object.keys(factors), toBase, fromBase, ...options };
};

export const categories: ConverterCategory[] = [
  linearCategory('weight-flow', 'A. 重量 / 流量', { 'Kg/h': 1, 'G/s': 3.6 }, { isPrimary: true }),
  linearCategory('length', 'B. 長度', { mm: 1, 條: 1, Inch: 25.4, ft: 304.8 }, { isPrimary: true }),
  linearCategory(
    'pressure',
    'C. 壓力',
    {
      mmbar: 0.001,
      Bar: 1,
      Kpa: 0.01,
      Hpa: 0.001,
      Mpa: 10,
      Psi: 0.0689475729,
      'INCH HG.': 0.0338638867,
      '-kpa': 0.01,
      cmhg: 0.0133322368
    },
    { isPrimary: true, note: '要分表壓力跟絕對壓力還有負壓' }
  ),
  linearCategory('power', 'D. 功率', { Kw: 1, 'Hp(馬力)': 0.745699872 }, { isPrimary: true }),
  linearCategory('torque', '扭力', { 'N·m': 1, 'kgf·m': 9.80665, 'lb·ft': 1.35581795, 'lb·in': 0.112984829 }),
  {
    key: 'temp',
    label: '溫度',
    units: ['°C', '°F', 'K'],
    toBase: {
      '°C': (v) => v,
      '°F': (v) => ((v - 32) * 5) / 9,
      K: (v) => v - 273.15
    },
    fromBase: {
      '°C': (v) => v,
      '°F': (v) => (v * 9) / 5 + 32,
      K: (v) => v + 273.15
    }
  },
  linearCategory('volume', '容積', { L: 1, mL: 0.001, 'gallon US': 3.785411784, quart: 0.946352946, pint: 0.473176473, cc: 0.001 }),
  linearCategory('electrical', '電系', { V: 1, A: 1, W: 1, Ohm: 1 }),
  linearCategory('pressure-extended', '其他壓力延伸功能', { psi: 1, bar: 14.5037738, kPa: 0.145037738, MPa: 145.037738, 'kg/cm²': 14.2233433, inHg: 0.4911542, cmHg: 0.1933676 })
];

export const convertValue = (category: ConverterCategory, input: number, fromUnit: string, toUnit: string) => {
  const baseValue = category.toBase[fromUnit](input);
  return category.fromBase[toUnit](baseValue);
};
