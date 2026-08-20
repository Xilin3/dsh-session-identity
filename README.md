# dsh-session-identity

获取当前 DeepSeek Harness 会话身份的两个请求头：

| 头 | 来源 |
|---|---|
| `x-deepseek-harness-user-id` | `$DSH_HOME/.anonymous-user-id`（稳定匿名用户 id，与 dsh-llm-deepseek 每次 provider 请求携带的值一致） |
| `x-deepseek-harness-session-id` | 当前会话 id（= `GenerateOptions.sessionId`） |

提供两种调用方式：

1. **模型工具** `get_harness_session_identity`（无参，返回含两个头的对象）
2. **UI 按钮**：刷新页面后，会话标题旁出现「身份」按钮，点击弹出面板显示两个值（可鼠标选中复制）

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
