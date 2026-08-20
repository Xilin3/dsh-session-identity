// @dsh-external/dsh-session-identity — 工具包插件（host 侧，纯 ESM）。
//
// 两个能力：
//   1) 工具 `get_harness_session_identity`（模型可调用）
//   2) RPC 通道 `/dsh-session-identity`（client UI 点击调用，loopback-only）
//
// 身份头来源：
//   - x-deepseek-harness-user-id    = getOrCreateAnonymousUserId()（$DSH_HOME/.anonymous-user-id，
//                                    与 dsh-llm-deepseek 每次 provider 请求携带的值一致）
//   - x-deepseek-harness-session-id = 当前 agent 的 session.id（= GenerateOptions.sessionId）
//
// 规范：资源注册挂 ctx.effect（热重载/卸载时 fiber dispose 自动注销）。
import { defineTool } from '@deepseek-ai/dsh-tools'
import { getOrCreateAnonymousUserId } from '@deepseek-ai/dsh-anonymous-user-id'

export const name = '@dsh-external/dsh-session-identity'
export const inject = ['tools', 'connection']

const RPC_CHANNEL = '/dsh-session-identity'

export function apply(ctx) {
  // 1) 模型可调用的工具
  ctx.effect(() => ctx.tools.register(defineTool({
    name: 'get_harness_session_identity',
    description: '获取当前 DSH 会话的 x-deepseek-harness-user-id 与 x-deepseek-harness-session-id',
    parameters: {},
    output: {
      schema: {
        type: 'object',
        properties: {
          'x-deepseek-harness-user-id': {
            type: 'string',
            description: '本 harness home 的稳定匿名用户 id（随每次 DeepSeek provider 请求头携带）',
          },
          'x-deepseek-harness-session-id': {
            type: 'string',
            description: '当前会话 id（随每次 DeepSeek provider 请求头携带）',
          },
        },
        additionalProperties: false,
      },
      render: (_args, value) => [{ type: 'text', text: JSON.stringify(value, null, 2) }],
    },
    async execute(_args, exec) {
      const sessionId = exec?.agent?.session?.id ?? process.env.DSH_SESSION_ID ?? null
      return {
        'x-deepseek-harness-user-id': getOrCreateAnonymousUserId(),
        'x-deepseek-harness-session-id': sessionId,
      }
    },
  })), '@dsh-external/dsh-session-identity: identity tool')

  // 2) client UI 点击调用的 RPC 通道（loopback-only，防外部调用）
  const conn = ctx.connection
  if (conn?.rpc?.handle) {
    conn.rpc.handle(RPC_CHANNEL, async (endpoint, _payload, signal) => {
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
