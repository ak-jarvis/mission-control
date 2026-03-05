# Jarvis HQ — Customization Plan

## Phase 1: Branding Removal (DONE)

### Changes Made

| File | What Changed |
|------|-------------|
| `src/app/layout.tsx` | Title → "Jarvis HQ", description stripped of "OpenClaw", added 🤖 emoji favicon, apple web app title updated |
| `src/app/login/page.tsx` | Logo "MC" → 🤖 emoji, "Mission Control" → "Jarvis HQ", footer "OpenClaw Agent Orchestration" → "Agent Orchestration" |
| `src/nav-rail.tsx` | Sidebar logo "MC" → 🤖, sidebar title "Mission Control" → "Jarvis HQ" |
| `src/components/dashboard/sidebar.tsx` | Logo "MC" → 🤖, "Mission Control" → "Jarvis HQ", "ClawdBot Orchestration" → "Agent Orchestration" |
| `src/components/layout/header-bar.tsx` | Fallback title "Mission Control" → "Jarvis HQ" |
| `src/components/layout/promo-banner.tsx` | **Gutted entirely** — removed nyk branding, hire/follow links, DictX, Flight Deck Pro links. Returns null. |
| `src/app/docs/page.tsx` | API docs title "Mission Control API Docs" → "Jarvis HQ API Docs" |
| `package.json` | Description updated to "Jarvis HQ — agent orchestration dashboard" |
| `src/index.ts` | All "Mission Control" comments → "Jarvis HQ", `MissionControlStore` → `JarvisHQStore` |
| `src/store/index.ts` | Same as above |
| `src/components/panels/agent-squad-panel.tsx` | "ClawdBot session identifier" → "Session identifier" |
| `src/components/panels/log-viewer-panel.tsx` | "ClawdBot gateway and system" → "gateway and system" |

### What Was Preserved
- **LICENSE file** — legally required, untouched
- `useMissionControl` Zustand hook name — internal API, 50+ import sites, renaming = high risk / zero user impact
- `MissionControl/1.0` User-Agent strings in `src/lib/github.ts` and `src/lib/webhooks.ts` — server-side only, no UI exposure
- OpenClaw references in API route internals (`gateway-config`, `command.ts`, etc.) — these are functional integration points, not branding

---

## Phase 2: Paperclip-Inspired Features (Documentation Only)

### What Paperclip Does Well (Worth Adopting)

1. **Org Chart Visualization**
   - Paperclip models companies with hierarchical org charts, reporting lines, and roles
   - We have 7 agents in a hub-and-spoke: Jarvis (center) → Dev, Mira, Zayd, Scout, SukuQi, Friday
   - **Adopt:** Interactive org chart view showing agent relationships and delegation flow

2. **Budget/Cost Per Agent**
   - Paperclip enforces monthly budgets per agent with automatic throttling
   - Mission Control already has `agent-cost-panel.tsx` and `token-dashboard-panel.tsx`
   - **Adopt:** Budget limits per agent, alerts when approaching limit, cost trend sparklines

3. **Goal Alignment / Task Ancestry**
   - Every Paperclip task traces back to company mission through goal hierarchy
   - **Adopt:** Link tasks to high-level objectives (e.g., "Launch Airbnb arbitrage" → subtasks per agent)

4. **Agent Status: idle/working/error in Real-Time**
   - Paperclip shows agent state with heartbeat-based detection
   - Mission Control already has heartbeat API (`/api/agents/[id]/heartbeat`)
   - **Adopt:** Real-time status badges (idle/working/error/offline) on agent cards and org chart

5. **Persistent Agent State Across Sessions**
   - Agents resume context across heartbeats instead of cold-starting
   - **Adopt:** Session persistence indicators, context carry-over tracking

### Features NOT Worth Adopting (For Now)
- Multi-company / multi-tenant isolation — overkill for single-owner setup
- "Clipmart" company templates — not relevant to our use case
- Embedded PostgreSQL — we're fine with SQLite/file-based storage

---

## Phase 2: Implementation Plan

### 2A — Agent Status Dashboard (Week 1-2)
- **Where:** `src/components/panels/agent-squad-panel.tsx` + new `agent-status-badge.tsx` component
- **How:** Extend heartbeat API to include `status: idle | working | error | offline`
- **UI:** Color-coded badges on agent cards, pulsing dot for "working", red for "error"
- **Data:** Use existing `/api/agents/[id]/heartbeat` — add last-seen timestamp logic
  - idle: heartbeat received within 5min, no active session
  - working: active session detected
  - error: last session errored
  - offline: no heartbeat in 10min+

### 2B — Org Chart View (Week 2-3)
- **Where:** New panel `src/components/panels/org-chart-panel.tsx`
- **How:** Add to nav rail under "OBSERVE" group
- **Layout:** Hub-and-spoke SVG/Canvas visualization
  - Jarvis (center, gold) → radiating lines to 6 agents
  - Each node shows: avatar, name, status badge, current task
  - Click node → opens agent detail panel
- **Library options:** `reactflow` (already popular), `d3-hierarchy`, or custom SVG
- **Data:** Agent list from store + heartbeat status + active session info

### 2C — Budget & Cost Controls (Week 3-4)
- **Where:** Extend `src/components/panels/agent-cost-panel.tsx`
- **How:**
  - Add `monthly_budget` field to agent config
  - Show budget utilization bar per agent
  - Alert rule: "Agent X at 80% of monthly budget"
  - Dashboard card: total spend this month vs total budget
- **Data:** Token pricing from `src/lib/token-pricing.ts`, aggregate by agent

### 2D — Goal Alignment (Week 4-5)
- **Where:** Extend task board with "Objective" parent type
- **How:**
  - New entity type: `Objective` (high-level goal, e.g., "Launch Dubai Airbnb")
  - Tasks link to objectives via `objective_id`
  - Objective dashboard showing progress (% tasks complete)
  - Agent detail shows which objectives they're contributing to

---

## Architecture Notes

### Agent Status Integration Points
```
src/app/api/agents/[id]/heartbeat/route.ts  ← Status source
src/store/index.ts                           ← Add status field to Agent type
src/components/ui/agent-avatar.tsx           ← Add status ring/badge
src/components/panels/agent-squad-panel.tsx   ← Show status on cards
src/components/layout/nav-rail.tsx           ← Mini status dots next to agent count
```

### Org Chart Integration Points
```
src/lib/navigation.ts          ← Add 'org-chart' panel route
src/nav-rail.tsx               ← Add nav item
src/app/[[...panel]]/page.tsx  ← Import and render OrgChartPanel
NEW: src/components/panels/org-chart-panel.tsx
```

### Agent Roster (7 Agents)
| Agent | Role | OpenClaw ID |
|-------|------|-------------|
| Jarvis | Hub / Main Orchestrator | main |
| Dev | CTO / Reliability & Delivery | jarvis-dev |
| Mira | Life Management | jarvis-life |
| Zayd | Airbnb Business | bnb-hero |
| Scout | Property Research | hostai-scout |
| SukuQi | SukuQi Agent | sukuqi |
| Friday | Friday Agent | friday |

---

*Created: 2026-03-06*
*Last updated: 2026-03-06*
