import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/db'
import { requireRole } from '@/lib/auth'
import { logger } from '@/lib/logger'

/**
 * GET /api/star-office/state
 * Returns agent states in Star Office format for the pixel office visualization.
 */
export async function GET(request: NextRequest) {
  const auth = requireRole(request, 'viewer')
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const db = getDatabase()
    const workspaceId = auth.user.workspace_id

    const agents = db.prepare(`
      SELECT id, name, openclaw_id, status, role, last_heartbeat,
             json_extract(config, '$.identity.emoji') as identity_emoji,
             json_extract(config, '$.identity.name') as identity_name
      FROM agents
      WHERE workspace_id = ?
      ORDER BY name ASC
    `).all(workspaceId) as any[]

    const statusMap: Record<string, string> = {
      'online': 'idle',
      'offline': 'idle',
      'busy': 'writing',
      'idle': 'idle',
      'error': 'error',
    }

    function stateToArea(state: string) {
      if (state === 'writing' || state === 'researching' || state === 'executing') return 'writing'
      if (state === 'error') return 'error'
      return 'breakroom'
    }

    const starAgents = agents.map(a => {
      const state = statusMap[a.status] || 'idle'
      return {
        id: a.openclaw_id || a.name,
        agentId: a.openclaw_id || a.name,
        name: a.identity_name || a.name,
        state,
        area: stateToArea(state),
        detail: a.role || '',
        emoji: a.identity_emoji || '',
        lastUpdate: a.last_heartbeat || Math.floor(Date.now() / 1000),
      }
    })

    return NextResponse.json({
      state: starAgents[0]?.state || 'idle',
      detail: starAgents[0]?.detail || '',
      agents: starAgents,
      guestAgents: starAgents.slice(1).map(a => ({
        ...a,
        online: a.state !== 'idle',
      })),
    })
  } catch (error) {
    logger.error({ err: error }, 'GET /api/star-office/state error')
    return NextResponse.json({ error: 'Failed to fetch state' }, { status: 500 })
  }
}
