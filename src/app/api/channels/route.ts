import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/db'
import { requireRole } from '@/lib/auth'

/**
 * GET /api/channels - List active channel bindings
 * Query params: agent, platform
 */
export async function GET(request: NextRequest) {
  const auth = requireRole(request, 'viewer')
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const db = getDatabase()
  const { searchParams } = new URL(request.url)
  const agent = searchParams.get('agent')
  const platform = searchParams.get('platform')

  let query = `SELECT * FROM channel_bindings WHERE workspace_id = ?`
  const params: any[] = [auth.user.workspace_id]

  if (agent) {
    query += ` AND agent_name = ?`
    params.push(agent)
  }

  if (platform) {
    query += ` AND platform = ?`
    params.push(platform)
  }

  query += ` ORDER BY agent_name, platform, channel_id`

  const bindings = db.prepare(query).all(...params)

  return NextResponse.json({ bindings, total: bindings.length })
}
