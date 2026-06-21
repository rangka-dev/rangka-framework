---
'@rangka/client': patch
---

Bundle splitting for widget lazy loading

- Split built-in widgets into core tier (9 always-loaded) and lazy tier (29 on-demand)
- Lazy widgets load on first render via dynamic import, producing separate chunks
- Added vendor chunk separation for TanStack Query, Router, and Radix
- Removed unused recharts dependency and chart.tsx
- Initial JS payload reduced from 374KB to 243KB gzipped (35% reduction)
