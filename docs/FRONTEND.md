# 🎨 Supply Guardian Frontend Guide

Welcome to the **Vibe Coding** track! Your mission is to build the "Mission Control" interface for the supply chain.

---

## 🚀 Getting Started (Proven Build Path)

This guide reflects the verified setup for **Vite + React (TS) + Tailwind CSS v4**.

### 1. Project Initialization
```bash
npm create vite@latest frontend_supply_api -- --template react-ts --yes
cd frontend_supply_api
npm install
```

### 2. Core Dependencies
Install the required packages for Maps, Styling, and API calls:
```bash
npm install axios leaflet react-leaflet lucide-react clsx tailwind-merge framer-motion
npm install -D tailwindcss @tailwindcss/postcss postcss autoprefixer
```

### 3. Configuration Setup

#### Tailwind CSS v4 (`src/index.css`)
Tailwind v4 uses CSS-first configuration. You do **not** need a simple `tailwind.config.js` for themes.
```css
@import "tailwindcss";

@theme {
  --color-brand-dark: #171717;
  --color-brand-primary: #cc0000;
  --color-brand-accent: #ffffff;
  --font-sans: "Inter", "ui-sans-serif", "system-ui";
  --font-mono: "JetBrains Mono", "ui-monospace", "monospace";
}
```

#### PostCSS (`postcss.config.js`)
**CRITICAL**: Use the new `@tailwindcss/postcss` plugin, not the legacy `tailwindcss`.
```javascript
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}
```

#### Vite Config (`vite.config.ts`)
Set up path aliases to map `@` to `./src`.
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
```

---

## 🐛 Troubleshooting & Gotchas

### 1. Type-Only Export Errors
**Error**: `Uncaught SyntaxError: The requested module '...' does not provide an export named 'Node'`
**Cause**: The bundler tries to compile TypeScript interfaces as runtime code.
**Fix**: Always use `import type` for interfaces.
```typescript
// ❌ WRONG
import { Node, Shipment } from './types';

// ✅ CORRECT
import type { Node, Shipment } from './types';
```

### 2. Leaflet Icon Fix
Leaflet's default icons often break in bundlers. Add this snippet to your Map component:
```typescript
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;
```

---

## 🎨 Style Guidelines (Target / Sci-Fi Aesthetic)

This dashboard currently implements the **Target Industrial Future** look:

### Color Palette
*   **Background**: `#171717` (Dark Charcoal)
*   **Brand Red**: `#CC0000` (Headers & Critical Alerts)
*   **Status Indicators**:
    *   🟢 **Green (#22c55e)**: In-Transit
    *   🟡 **Yellow (#eab308)**: Delayed
    *   🔴 **Red (#ef4444)**: Stuck

### UI Patterns implemented in `frontend_supply_api`
*   **Glassmorphism**: Backdrop blur on HUD elements (`backdrop-blur-sm`).
*   **Neons**: Glow effects on map markers.
*   **Scanlines**: CRT overlay in `index.css` for atmosphere.

---

## 📡 API Integration
The frontend polls `http://localhost:8000` every 2 seconds.
*   **Client**: `src/api.ts` (Axios wrapper)
*   **Models**: `src/types.ts` (TypeScript interfaces)

**Key Endpoints**:
1.  `GET /network/nodes`: Static infrastructure (Ports, Warehouses).
2.  `GET /shipments`: Moving assets (poll this!).
3.  `GET /network/disruptions`: Global event zones.

---

## ☁️ Deployment Configuration

### Nginx Proxy (Production)
In production (e.g., Cloud Run), Nginx serves the static files and proxies API requests.
*   **File**: `nginx.conf.template`
*   **Logic**: Using `envsubst`, the `${BACKEND_URL}` is injected at runtime.
*   **Cloud Run Note**: We deliberately **do not** forward the `Host` header (`proxy_set_header Host $host;`) to the backend. Cloud Run requires the Host header to match the target service's URL, not the frontend's custom domain.

### Build Verification (.npmrc)
An `.npmrc` file is included in the project root to force the use of the public npm registry (`registry.npmjs.org`). This prevents build failures in environments with internal private registries.
