# DearTTS

DearTTS 是一个基于 Next.js + Electron 的个性化语音合成工具，当前基于小米 MiMo v2.5 TTS 相关模型开发。用户可以在本地填写 MiMo API Key，选择预置音色、设计自定义音色，或上传参考音频进行声音复刻，然后输入文案生成可试听、可下载的 WAV 音频。

> 备注：小米 MiMo 开放平台当前对 MiMo-V2.5-TTS 系列提供限时免费能力，具体定价、额度和活动政策以后续官方公告为准。

## 功能介绍

- API Key 本地保存，输入框默认隐藏，支持小眼睛查看。
- 支持 MiMo v2.5 官方预置音色。
- 支持声音设计：可保存多个本地定制音色，并进行选择、更新、删除。
- 支持声音复刻：可保存多个本地复刻音色，维护名称、备注和参考音频。
- 支持 5000 字以内文案合成。
- 支持音频在线试听和 WAV 下载。
- 支持 Web 运行，也支持 Electron 桌面端运行。

## 技术栈

- Next.js App Router
- React
- TailwindCSS
- Next.js Route Handlers
- MiMo v2.5 TTS API
- Electron
- electron-builder

## 环境要求

- Node.js 22 或更高版本
- npm
- Windows 桌面端打包环境

## 安装依赖

```bash
npm install
```

## 配置 API

项目默认使用 MiMo 官方接口：

```text
https://api.xiaomimimo.com/v1/chat/completions
```

如果需要覆盖接口地址，可以新建 `.env.local`：

```env
MIMO_TTS_ENDPOINT=https://api.xiaomimimo.com/v1/chat/completions
MIMO_VERIFY_ENDPOINT=
```

API Key 不需要写入环境变量。启动应用后，在页面顶部输入 MiMo API Key 即可。Key 会保存到本地浏览器或桌面端本地存储中，不会保存到服务端。

## Web 使用教程

启动开发服务：

```bash
npm run dev
```

访问：

```text
http://127.0.0.1:3000
```

使用步骤：

1. 在顶部输入 MiMo v2.5 API Key。
2. 点击“验证”保存 Key。
3. 在“声音定制”里选择一种方式：
   - 预置：选择官方音色。
   - 设计：填写声音名称和声音描述，并可保存到本地音色库。
   - 复刻：上传 5-30 秒参考音频，保存为本地复刻音色。
4. 在“文案输入”中输入要合成的文本。
5. 点击“生成语音”。
6. 生成完成后可在线试听，并点击“下载 WAV”保存音频。

## 声音设计使用说明

声音设计支持本地维护多个音色：

1. 切换到“设计”。
2. 填写“定制声音名称”。
3. 填写“声音描述”。
4. 点击“保存定制音色”。
5. 后续可以在本地定制音色列表中选择、更新或删除。

这些数据保存在 `localStorage` 中。

## 声音复刻使用说明

声音复刻支持本地维护多个复刻音色：

1. 切换到“复刻”。
2. 填写“复刻声音名称”。
3. 填写维护备注。
4. 上传 5-30 秒参考音频。
5. 点击“保存复刻音色”。
6. 生成语音前，选择需要使用的复刻音色。

复刻音色的名称、备注等元数据保存在 `localStorage` 中；参考音频本体保存在 IndexedDB 中，避免浏览器本地存储容量不足。

## Electron 桌面端开发

启动 Electron 开发模式：

```bash
npm run electron:dev
```

该命令会同时启动 Next.js 开发服务和 Electron 窗口。

## 桌面端打包教程

当前项目默认打包为 Windows 可执行目录：

```bash
npm run electron:pack
```

成功后输出目录：

```text
release/win-unpacked/
```

可执行文件：

```text
release/win-unpacked/DearTTS.exe
```

注意：`win-unpacked` 是“可执行程序 + 运行目录”的形式。运行时不要只单独拷贝 `DearTTS.exe`，需要保留整个 `win-unpacked` 目录。

## 生成安装包

如果需要生成 Windows 安装包，可以执行：

```bash
npm run electron:installer
```

但该命令依赖 electron-builder 下载 NSIS 等构建工具。在当前 Windows 环境中可能遇到：

- GitHub 下载被网络策略拦截。
- `AppData/Local/electron-builder/Cache` 无权限写入。
- `winCodeSign` 解压时无法创建符号链接。

已做的规避：

- 默认 `electron:pack` 改为 `--dir` 模式，稳定生成 `win-unpacked/DearTTS.exe`。
- electron-builder 缓存目录改到项目内 `.cache/electron-builder`。
- Windows 配置中禁用了签名相关流程。

如果必须生成单文件安装包，建议：

1. 确保可以访问 GitHub release 下载地址。
2. 开启 Windows 开发者模式，或使用管理员权限终端。
3. 清理旧缓存后重新执行：

```bash
npm run electron:installer
```

## 常用命令

```bash
npm run dev
npm run build
npm run electron:dev
npm run electron:pack
npm run electron:installer
```

## 项目结构

```text
app/
  api/tts/              Next.js API 路由
  page.tsx              主页面
electron/
  main.cjs              Electron 主进程
  preload.cjs           Electron preload
lib/
  voices.ts             预置音色
  clone-voice-db.ts     复刻音频 IndexedDB 存储
docs/
  PRD.md                产品需求文档
```

## 数据与隐私

- API Key 只保存在本地。
- 定制音色保存在本地。
- 复刻音色参考音频保存在本地 IndexedDB。
- 服务端 Route Handler 只作为 MiMo API 代理，不持久化用户数据。

## 构建验证

当前项目已通过：

```bash
npm run build
npm run electron:pack
```
