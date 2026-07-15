# 参与贡献

[English](CONTRIBUTING.md) | [简体中文](CONTRIBUTING.zh-CN.md)

感谢你参与 Vertex Quant 的开发。

## 开始之前

- 创建新 Issue 前先搜索是否已有相同问题。
- GitHub Issues 只用于具体、可复现的问题或范围明确的功能请求。
- 不要在公开 Issue 中发布凭证、令牌、私有 URL、个人数据或安全漏洞。
- 安全漏洞请按照 `SECURITY.zh-CN.md` 私下报告。

## 开发环境

```powershell
npm ci
Copy-Item .env.example .env.local
npm run dev
```

前端需要兼容的后端。API 路径、方法、参数和响应处理必须与后端契约保持一致。

## Pull Request

每个 Pull Request 应只处理一个明确问题。提交前请运行：

```powershell
npm run lint
npm run typecheck
npm test
npm run build
```

Pull Request 应说明：

- 解决了什么用户可见问题
- 如何复现该问题
- 为什么实现符合现有架构
- 执行了哪些检查

不要提交生成的构建产物、环境文件、凭证、数据库转储、包含个人数据的截图、
或与本次修改无关的格式化变更。

## Commit 信息

Commit 信息使用简洁英文。建议使用 `fix:`、`feat:`、`refactor:`、`docs:`、
`test:`、`build:` 或 `chore:` 等前缀。
