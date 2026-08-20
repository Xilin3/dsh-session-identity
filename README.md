# dsh-session-identity

一键获取当前 DeepSeek Harness 会话的两个身份头，**替代 reqable 抓包**：

| 头 | 来源 |
|---|---|
| `x-deepseek-harness-user-id` | `$DSH_HOME/.anonymous-user-id`（稳定匿名用户 id，与 dsh-llm-deepseek 每次 provider 请求携带的值一致） |
| `x-deepseek-harness-session-id` | 当前会话 id（= `GenerateOptions.sessionId`） |

## 获取方式（二选一）

1. **点击按钮**：刷新页面后，会话标题旁出现「身份」按钮，点击弹出面板显示两个值（可鼠标选中复制）。
2. **模型工具**：让模型直接调用 `get_harness_session_identity`（无参，返回含两个头的对象）。

## 固定会话身份头（复用灰测会话）

DSH 每次向 provider 发请求都会带上这两个头。把某个「命中灰测」的会话的两个头固定进一个自定义 provider 的 `headers`，之后所有走该 provider 的请求都会复用这套身份，**稳定命中灰测**。

### 步骤

1. 打开一个已命中灰测的会话，用本插件（点「身份」按钮，或让模型调工具）拿到两个头的值。
2. 打开 DSH 设置，新增一个 provider（参考下方模板），把两个值填进 `headers`。
3. 保存后（通常无需重启）切换/使用该 provider 即可。

### provider 模板（settings 里的 `deepseek` 段）

```yaml
deepseek:
  apiKeyEnv: DEEPSEEK_API_KEY
  displayName: Test DeepSeek
  baseURL: https://api.deepseek.com/v1
  headers:
    "x-deepseek-harness-user-id": "<你的 user-id>"
    "x-deepseek-harness-session-id": "<你的 session-id>"
  models:
    - id: deepseek-v4-pro
      reasoningEfforts:
        off: null
        low: low
        high: high
        max: max
      compat:
        thinkingFormat: deepseek
        supportsReasoningEffort: true
    - id: deepseek-v4-flash
      reasoningEfforts:
        off: null
        low: low
        high: high
        max: max
      compat:
        thinkingFormat: deepseek
        supportsReasoningEffort: true
```

> ⚠️ 同一时间只跑一个「Test」provider 会话即可，多个并发可能造成 kvcache 串扰（未实测）。

## 安装

在 dsh-super-injector 环境内：

```
dev_inject_plugin <本目录>
```

或作为 bundle 持久装配（重启后官方接管）：

```
dev_install_package <本目录>
```

## 运行时依赖

注入器环境内已就绪，无需手动安装：

- `@deepseek-ai/dsh-tools`（`defineTool`）
- `@deepseek-ai/dsh-anonymous-user-id`（`getOrCreateAnonymousUserId`）
- client 侧 `react`（由 client 模块系统以 `require('react')` 提供）

## 结构

- `lib/index.js` — host 入口：模型工具 + RPC 通道 `/dsh-session-identity`（loopback-only）
- `lib/client.js` — client bundle：会话头部「身份」按钮
- `src/` — 等价 TypeScript 源码（本机无 DSH 源码 checkout，`lib/` 为手写产物，可直接注入，无需编译）

## License

[BSD-3-Clause](./LICENSE)
