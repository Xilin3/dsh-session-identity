// @dsh-external/dsh-session-identity — client 侧（手写 __ModuleLoader__ bundle，等价于 tsdown 产物）。
// 在会话头部注册一个「身份」按钮：点击 → 调 host RPC 拿 user-id，session-id 直接用 slot 的 sessionId prop。
// 依赖模块（react）由 client 模块系统以 require('react') 提供，故无需再打包。
window.__ModuleLoader__.load({ id: "@dsh-external/dsh-session-identity", factory: (require) => {
var module = { exports: {} }; var exports = module.exports;
var React = require("react");

var inject = ["slots", "connection"];
exports.name = "@dsh-external/dsh-session-identity";
exports.inject = inject;

function SessionIdentityAction(props) {
  var sessionId = props.sessionId;
  var getUserId = props.getUserId;

  var openState = React.useState(false);
  var isOpen = openState[0];
  var setOpen = openState[1];
  var loadingState = React.useState(false);
  var isLoading = loadingState[0];
  var setLoading = loadingState[1];
  var resultState = React.useState(null);
  var result = resultState[0];
  var setResult = resultState[1];

  function onClick() {
    if (isOpen) {
      setOpen(false);
      return;
    }
    setOpen(true);
    if (result === null) {
      setLoading(true);
      getUserId()
        .then(function (r) {
          var v = (r && r.value) ? r.value : r;
          setResult({
            "x-deepseek-harness-user-id": (v && v["x-deepseek-harness-user-id"]) != null ? v["x-deepseek-harness-user-id"] : v,
            "x-deepseek-harness-session-id": sessionId != null ? sessionId : null,
          });
        })
        .catch(function (e) {
          setResult({ error: String((e && e.message) ? e.message : e) });
        })
        .finally(function () {
          setLoading(false);
        });
    }
  }

  var button = React.createElement("button", {
    type: "button",
    onClick: onClick,
    title: "获取当前会话身份（x-deepseek-harness-user-id / x-deepseek-harness-session-id）",
    "aria-label": "获取会话身份",
  }, isLoading ? "…" : "身份");

  if (!isOpen) return button;

  var body;
  if (result === null) {
    body = React.createElement("span", null, "获取中…");
  } else if (result.error) {
    body = React.createElement("span", { style: { color: "#f87171" } }, "错误：" + result.error);
  } else {
    body = React.createElement("div", null,
      React.createElement("div", { style: { opacity: 0.65 } }, "x-deepseek-harness-user-id"),
      React.createElement("div", { style: { userSelect: "all", wordBreak: "break-all", margin: "2px 0 10px" } }, result["x-deepseek-harness-user-id"]),
      React.createElement("div", { style: { opacity: 0.65 } }, "x-deepseek-harness-session-id"),
      React.createElement("div", { style: { userSelect: "all", wordBreak: "break-all" } }, result["x-deepseek-harness-session-id"]),
    );
  }

  var panel = React.createElement("div", {
    style: {
      position: "absolute",
      top: "calc(100% + 6px)",
      right: 0,
      zIndex: 1000,
      minWidth: "340px",
      padding: "10px 12px",
      borderRadius: "8px",
      border: "1px solid var(--dsw-alias-border, rgba(128,128,128,0.35))",
      background: "var(--dsw-alias-surface, #1e1e1e)",
      color: "var(--dsw-alias-text-primary, #eeeeee)",
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
      fontSize: "12px",
      boxShadow: "0 6px 24px rgba(0,0,0,0.35)",
    },
  }, body);

  return React.createElement("span", { style: { position: "relative", display: "inline-flex" } }, button, panel);
}

function apply(ctx) {
  var getUserId = function (signal) {
    return ctx.connection.rpc.call("/dsh-session-identity", "identity.userId", {}, signal);
  };

  ctx.effect(function () {
    return ctx.slots.inject("conversation.session.header.utilities", function () {
      return ctx.slots.register({
        name: "conversation.session.header.utilities",
        id: "session-identity-action",
        order: 20,
        inject: function () { return { getUserId: getUserId }; },
      }, SessionIdentityAction);
    });
  }, "@dsh-external/dsh-session-identity: header action");
}
exports.apply = apply;

return module.exports; } });
