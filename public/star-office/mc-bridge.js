/**
 * MC Bridge: Translates Mission Control agent API to Star Office state format.
 *
 * Star Office expects:
 *   /status  -> { state: "idle"|"writing"|"researching"|"executing"|"syncing"|"error", detail: "..." }
 *   /agents  -> [{ agentId, name, area: "breakroom"|"writing"|"error", avatar, ... }]
 *
 * MC provides:
 *   /api/star-office/state -> { state, detail, agents, guestAgents }
 */

const MC_API_BASE = window.MC_API_BASE || '';

// Map MC agent statuses to Star Office states
function mcStatusToStarOffice(mcStatus) {
  const map = {
    'online': 'idle',
    'offline': 'idle',
    'busy': 'writing',
    'idle': 'idle',
    'error': 'error',
  };
  return map[mcStatus] || 'idle';
}

// Map Star Office state to area for guest agents
function stateToArea(state) {
  if (state === 'writing' || state === 'researching' || state === 'executing') return 'writing';
  if (state === 'error') return 'error';
  return 'breakroom';
}

// Cache to avoid hammering the API
let cachedState = null;
let cacheTime = 0;
const CACHE_TTL = 3000; // 3 seconds

async function fetchMCState() {
  const now = Date.now();
  if (cachedState && (now - cacheTime) < CACHE_TTL) return cachedState;

  try {
    const res = await fetch(`${MC_API_BASE}/api/star-office/state`, {
      headers: { 'x-api-key': window.MC_API_KEY || '' },
      cache: 'no-store',
    });
    if (!res.ok) return cachedState;
    cachedState = await res.json();
    cacheTime = now;
    return cachedState;
  } catch (err) {
    console.error('[MC Bridge] Failed to fetch agent states:', err);
    return cachedState;
  }
}

// Override fetch to intercept Star Office API calls
const originalFetch = window.fetch;
window.fetch = function (url, options) {
  const urlStr = typeof url === 'string' ? url : url.toString();

  // Intercept /status calls
  if (urlStr === '/status' || urlStr.startsWith('/status?')) {
    return fetchMCState().then(data => {
      const payload = data || { state: 'idle', detail: 'Waiting...' };
      return new Response(JSON.stringify({
        state: payload.state || 'idle',
        detail: payload.detail || '',
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });
  }

  // Intercept /agents calls
  if (urlStr.startsWith('/agents')) {
    return fetchMCState().then(data => {
      const agents = (data && data.guestAgents) || [];
      return new Response(JSON.stringify(agents), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });
  }

  // Intercept /set_state (no-op in MC, state comes from agents)
  if (urlStr.startsWith('/set_state')) {
    return Promise.resolve(new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }));
  }

  // Intercept /yesterday-memo (not available in MC)
  if (urlStr.startsWith('/yesterday-memo')) {
    return Promise.resolve(new Response(JSON.stringify({ memo: '' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }));
  }

  // Pass through everything else
  return originalFetch.apply(this, arguments);
};

// Export for direct use
window.MCBridge = { fetchMCState, mcStatusToStarOffice, stateToArea };

console.log('[MC Bridge] Initialized - Star Office will use Mission Control agent data');
