/**
 * @dsh-external/dsh-session-identity — 工具包形态（host 侧）。
 * ① 工具 get_harness_session_identity（模型调用）
 * ② RPC 通道 /dsh-session-identity（client UI 点击调用）
 */
import type { Context } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'
import { getOrCreateAnonymousUserId } from '@deepseek-ai/dsh-anonymous-user-id'

export const name = '@dsh-external/dsh-session-identity'
export const inject = ['tools', 'connection']

const RPC_CHANNEL = '/dsh-session-identity'

export function apply(ctx: Context): void {
  ctx.effect(() => ctx.tools.register(defineTool({
    name: 'get_harness_session_identity',
    description: '获取当前 DSH 会话的 x-deepseek-harness-user-id 与 x-deepseek-harness-session-id',
    parameters: {},
    output: {
      schema: {
        type: 'object',
        properties: {
          'x-deepseek-harness-user-id': { type: 'string', description: '本 harness home 的稳定匿名用户 id' },
          'x-deepseek-harness-session-id': { type: 'string', description: '当前会话 id' },
        },
        additionalProperties: false,
      },
      render: (_args: unknown, value: unknown) => [{ type: 'text', text: JSON.stringify(value, null, 2) }],
    },
    async execute(_args: unknown, exec: any) {
      const sessionId: string | null = exec?.agent?.session?.id ?? process.env.DSH_SESSION_ID ?? null
      return {
        'x-deepseek-harness-user-id': getOrCreateAnonymousUserId(),
        'x-deepseek-harness-session-id': sessionId,
      }
    },
  })), '@dsh-external/dsh-session-identity: identity tool')

  const conn: any = ctx.connection
  if (conn?.rpc?.handle) {
    conn.rpc.handle(RPC_CHANNEL, async (endpoint: string, _payload: unknown, signal: AbortSignal) => {
      if (signal?.aborted) {
        return { ok: false, error: { code: 'cancelled', message: 'cancelled', details: {} } }
      }
      if (endpoint === 'identity.userId') {
        return { ok: true, value: { 'x-deepseek-harness-user-id': getOrCreateAnonymousUserId() } }
      }
      return {
        ok: false,
        error: { code: 'bad-request', message: `unknown endpoint: ${endpoint}`, details: { issues: [{ message: 'unknown endpoint' }] } },
      }
    }, { authority: 'loopback' })
  }
}
