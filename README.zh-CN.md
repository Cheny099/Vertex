# Vertex Quant 前端

[English](README.md) | [简体中文](README.zh-CN.md)

[![CI](https://github.com/Cheny099/Vertex/actions/workflows/ci.yml/badge.svg)](https://github.com/Cheny099/Vertex/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

量化交易平台的 React 前端。身份验证、数据和交易操作需要由兼容的后端提供。

## 主要功能

- 用户仪表盘、策略、信号、交易历史、账户和设置
- 运维、内容、审计和统计等管理端界面
- 英文和简体中文界面
- React 18、TypeScript、Vite、TanStack Query、Tailwind CSS 和 Radix UI

## 环境要求

- Node.js 20.19+ 或 22.12+
- npm
- 兼容的后端 API

## 快速开始

```powershell
git clone https://github.com/Cheny099/Vertex.git
Set-Location Vertex
npm ci
Copy-Item .env.example .env.local
npm run dev
```

开发服务器启动后，打开 `http://127.0.0.1:8080`。

## 配置

| 变量 | 默认值 | 用途 |
| --- | --- | --- |
| `VITE_API_URL` | 空 | 后端基础地址；为空时使用本地 `/api` 代理 |
| `DEV_SERVER_HOST` | `127.0.0.1` | 开发服务器监听地址 |
| `DEV_SERVER_ALLOWED_HOSTS` | 空 | 额外允许的开发主机名 |

当 `VITE_API_URL` 为空时，本地 `/api` 请求会代理到
`http://localhost:8000`。API 路径和请求类型属于前端源代码，部署地址和凭证
不属于源代码。

## 常用命令

```powershell
npm run lint
npm run typecheck
npm test
npm run build
```

## 安全注意

- 不要在 `VITE_*` 变量中存放秘密，因为 Vite 会将其暴露给浏览器。
- 不要将环境文件、交易所凭证、日志或账户截图提交到 Git。
- 使用真实账户前，请验证后端权限和交易行为。

## 参与贡献

提交 Issue 或 Pull Request 前，请阅读
[CONTRIBUTING.zh-CN.md](CONTRIBUTING.zh-CN.md)。安全漏洞请按照
[SECURITY.zh-CN.md](SECURITY.zh-CN.md) 私下报告。

## 风险声明

交易和自动执行具有重大财务风险。本软件用于开发和研究，不构成财务建议。

## 许可证

[MIT](LICENSE)
