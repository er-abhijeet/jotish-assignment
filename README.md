# Enterprise Dashboard Project

This repository contains a full-stack dashboard implementation featuring custom DOM virtualization, raw SVG analytics, hardware API integration, and client-side routing. 

## 🚨 INTENTIONAL VULNERABILITY (Requirement)
**Type:** Stale Closure & Orphaned Interval Memory Leak
**Location:** `Visualization.jsx` (Inside the auto-refresh `useEffect`)

**Technical Explanation:**
I added a "Live Auto-Refresh" feature to poll the API. Inside the `useEffect`, there is a `setInterval` that increments a `refreshCount` state. 

I deliberately introduced two engine-level bugs here:
1. **Stale Closure:** The dependency array only tracks `[autoRefresh]`, leaving `refreshCount` out. Because of JS lexical scoping, the arrow function inside the interval is trapped in the initial render snapshot. It captures `refreshCount` at `0`. Every interval tick just runs `setRefreshCount(0 + 1)`. The state gets permanently stuck at 1.
2. **Memory Leak (Garbage Collection Evasion):** I intentionally omitted the cleanup function (`return () => clearInterval(timerId)`). When you navigate away from the visualization page, React destroys the DOM nodes, but the `setInterval` keeps running in the V8 engine background. If you toggle the checkbox multiple times or change routes, it spawns parallel zombie intervals. In production, this memory bloat eventually causes an Out-of-Memory (OOM) browser crash.

---

## 1. Custom List Virtualization
**Location:** `App.jsx` & `EmpListCard.jsx`

Rendering thousands of DOM nodes causes severe main-thread blocking and layout thrashing. I implemented custom virtualization without using external libraries like `react-window`.

* **The Math Logic:** We track `scrollTop` via an `onScroll` event. We calculate the visible window using `Math.floor(scrollTop / ITEM_HEIGHT)`. 
* **Strict Layout Bounds:** Virtualization math breaks if heights are dynamic. I strictly locked the card CSS to exactly `120px` height using `box-sizing`, `overflow: hidden`, and text truncation.
* **Phantom Scrollbar:** A parent container simulates the `totalHeight` (dataset length * 120) to force the browser to render a native scrollbar. A nested div uses `translateY` to push the ~10 rendered DOM nodes down the screen to match the user's scroll depth.

## 2. Secure Authentication & Data Routing
**Location:** `AuthContext.jsx`, `MainApp.jsx`, `ProtectedRoute.jsx`

* **Context API & Storage:** Global UI state (login/logout) is managed via Context. I used `localStorage` to persist session across hard refreshes. *(Note: This is client-side UX routing, actual security must be enforced via JWTs and 401 interceptors on the backend).*
* **Data Router API:** Migrated from legacy `<BrowserRouter>` to React Router v6.4+ `createBrowserRouter`. 
* **Layout Architecture:** Used a `<RootLayout>` wrapper with an `<Outlet />` to keep global UI buttons stable while child routes (`/login`, `/list`, `/details`) swap out dynamically. Unauthenticated users hitting protected routes are intercepted by `<ProtectedRoute>` and hard-redirected via `<Navigate replace />`.

## 3. Identity Verification (Hardware & Canvas API)
**Location:** `UserDetails.jsx`

Built a KYC (Know Your Customer) style non-repudiation interface.
* **Camera Stream:** Used `navigator.mediaDevices.getUserMedia` to access the webcam. Fixed a React race condition by binding the stream to the `<video>` ref inside a `useEffect` after the DOM painted.
* **Signature Matrix:** Layered a transparent HTML5 `<canvas>` directly over the video capture. Bound pointer/touch events to calculate exact `clientX/Y` offsets for drawing.
* **The "Blob" Merge:** To prevent payload tampering (e.g., swapping a signature file in transit), I used an off-screen canvas to flatten both the background photo and the signature into a single 2D rasterized matrix. Exported as a Base64 Data URI.
* **Client-Side Download:** Implemented the anchor tag hack (`document.createElement('a')`) to force the browser to download the Base64 string as a `.png` without hitting a server.

## 4. Visualization & Geospatial Mapping
**Location:** `Visualization.jsx`

* **Raw SVG Bar Chart:** No D3 or Chart.js used. I aggregated the API data by city and calculated a dynamic Y-axis multiplier (`scaleY`) based on the `maxSalary`. Mapped the data directly to `<rect>` and `<text>` SVG primitives, calculating precise `x` and `y` coordinates based on container width and bar spacing.
* **Leaflet Map Integration:** Rendered interactive map tiles.
* **O(1) Geocoding:** Instead of blasting a Geocoding REST API with 10,000 requests to find coordinates for strings like "Tokyo" (which triggers rate limits and UI freezing), I implemented a Static Hash Map (`GEO_DICTIONARY`). The string-to-coordinate lookup happens instantly in memory.