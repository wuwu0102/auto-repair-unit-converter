# Auto Repair Unit Converter

汽車維修單位換算工具（React + Vite + TypeScript + PWA）。

## 功能
- 壓力、扭力、長度、重量、溫度、容積、功率、電系單位換算
- 手機優先 UI、白底 + 淺藍色卡片 + 大按鈕
- 大字 / 緊湊顯示模式切換
- 輸入即時換算、可輸入小數、可一鍵清除
- PWA（可安裝）

## 安裝
```bash
npm install
```

## 開發
```bash
npm run dev
```

## Build
```bash
npm run build
npm run preview
```

## Deploy（GitHub Pages）
已包含 `.github/workflows/deploy.yml`：
1. 推送到 `main` 分支即自動 build + deploy
2. Repository Settings → Pages → Source 選擇 **GitHub Actions**

Vite `base` 已設定為 `/auto-repair-unit-converter/`。
