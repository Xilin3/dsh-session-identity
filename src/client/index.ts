/**
 * @dsh-external/dsh-session-identity — client 侧（会话头部「身份」按钮）。
 * 点击 → 调 host RPC 拿 user-id；session-id 直接用 slot 的 sessionId prop。
 * 构建产物为 lib/client.js（手写 __ModuleLoader__ bundle，等价于 tsdown 输出）。
 */
import * as React from 'react'

type ClientContext = {
  slots: any
  connection: any
}

export const inject = ['slots', 'connection']
export const name = '@dsh-external/dsh-session-identity'

interface ActionProps {
  sessionId?: string | null
  getUserId: (signal?: AbortSignal) => Promise<any>
}

function SessionIdentityAction(props: ActionProps) {
  const { sessionId, getUserId } = props
  const [isOpen, setOpen] = React.useState(false)
  const [isLoading, setLoading] = React.useState(false)
  const [result, setResult] = React.useState<any>(null)

  const onClick = () => {
    if (isOpen) {
      setOpen(false)
      return
    }
    setOpen(true)
    if (result === null) {
      setLoading(true)
      getUserId()
        .then((r) => {
          const v = r?.value ?? r
          setResult({
            'x-deepseek-harness-user-id': v?.['x-deepseek-harness-user-id'] ?? v,
            'x-deepseek-harness-session-id': sessionId ?? null,
          })
        })
        .catch((e) => setResult({ error: String(e?.message ?? e) }))
        .finally(() => setLoading(false))
    }
  }

  const button = React.createElement('button', {
    type: 'button',
    onClick,
    title: '获取当前会话身份（x-deepseek-harness-user-id / x-deepseek-harness-session-id）',
    'aria-label': '获取会话身份',
  }, isLoading ? '…' : '身份')

  if (!isOpen) return button

  const body = result === null
    ? React.createElement('span', null, '获取中…')
    : result.error
      ? React.createElement('span', { style: { color: '#f87171' } }, `错误：${result.error}`)
      : React.createElement('div', null,
          React.createElement('div', { style: { opacity: 0.65 } }, 'x-deepseek-harness-user-id'),
          React.createElement('div', { style: { userSelect: 'all', wordBreak: 'break-all', margin: '2px 0 10px' } }, result['x-deepseek-harness-user-id']),
          React.createElement('div', { style: { opacity: 0.65 } }, 'x-deepseek-harness-session-id'),
          React.createElement('div', { style: { userSelect: 'all', wordBreak: 'break-all' } }, result['x-deepseek-harness-session-id']),
        )

  const panel = React.createElement('div', {
    style: {
      position: 'absolute',
      top: 'calc(100% + 6px)',
      right: 0,
      zIndex: 1000,
      minWidth: '340px',
      padding: '10px 12px',
      borderRadius: '8px',
      border: '1px solid var(--dsw-alias-border, rgba(128,128,128,0.35))',
      background: 'var(--dsw-alias-surface, #1e1e1e)',
      color: 'var(--dsw-alias-text-primary, #eeeeee)',
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
      fontSize: '12px',
      boxShadow: '0 6px 24px rgba(0,0,0,0.35)',
    },
  }, body)

  return React.createElement('span', { style: { position: 'relative', display: 'inline-flex' } }, button, panel)
}

export function apply(ctx: ClientContext): void {
  const getUserId = (signal?: AbortSignal) =>
    ctx.connection.rpc.call('/dsh-session-identity', 'identity.userId', {}, signal)

  ctx.effect(() => ctx.slots.inject('conversation.session.header.actions', () =>
    ctx.slots.register({
      name: 'conversation.session.header.actions',
      id: 'session-identity-action',
      order: 20,
      inject: () => ({ getUserId }),
    }, SessionIdentityAction),
  ), '@dsh-external/dsh-session-identity: header action')
}
