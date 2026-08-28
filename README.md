# @l-vm2k/dsh-ayaka-theme

> 神里绫华 · 冰华主题 + 桌面宠物 — DeepSeek Harness Web 客户端主题插件

一个 DSH 标准 bundle 插件，安装后浏览器自动加载：

- 🌸 半透明绫华立绘贴在屏幕右侧
- 🐱 Q 版绫华小头趴在聊天输入框右上角，点击说话（语音 + 文字气泡同步）
- ❄️ 樱花花瓣 + 雪花飘落（混合大小，稀疏密度）
- 🎨 冰蓝色主题配色（亮色/暗色双模式）

---

## 安装

```bash
dsh plugin --profile web add github:l-vm2k/dsh-ayaka-theme
```

然后重启 dsh web：

```bash
dsh --profile web
```

打开浏览器，绫华主题已加载 ✨

## 卸载

```bash
dsh plugin --profile web remove @l-vm2k/dsh-ayaka-theme
```

---

## 插件结构

```
├── package.json          # dsh.bundle + dsh.client 声明
├── cordis.patch.yml      # bundle 层：一行 insert 挂载插件
├── tsconfig.json         # TS 配置
├── tsdown.config.ts      # 构建配置
├── assets/               # 图片 + 音频（打进包里，自包含）
│   ├── ayaka-portrait.png
│   ├── ayaka-head.png
│   ├── ayaka-bg.jpg
│   ├── ayaka-1.wav
│   ├── ayaka-2.wav
│   └── ayaka-3.mp3
└── src/
    ├── index.ts          # Node 半：注册 /ayaka-assets 路由服务静态资源
    ├── ayaka-tokens.ts   # 主题色 token 覆盖
    └── client/
        └── index.ts      # 浏览器半：主题注册 + DOM overlay
```

### 关键：package.json 的 `dsh` 字段

```json
{
  "dsh": {
    "bundle": { "patch": "./cordis.patch.yml" },
    "client": {
      "inject": ["@deepseek-ai/dsh-client-ui-theme"],
      "platform": "web",
      "immediately": true
    }
  }
}
```

- `dsh.bundle.patch` — 声明这是一个 bundle，`dsh plugin add` 靠这个识别
- `dsh.client` — 声明浏览器端插件，modules 扫描器自动发现

### 关键：cordis.patch.yml

```yaml
- insert:
    - id: ui-ayaka-theme
      name: '@l-vm2k/dsh-ayaka-theme'
```

**一行 insert 同时触发两件事**：
1. Loader 挂载 node 半 → `apply()` 注册 `/ayaka-assets` 路由
2. modules 扫描器自动发现 `dsh.client` → 服务浏览器 bundle

> ⚠️ 不要写两行 insert 指向同一个包，会导致 node 半执行两次，重复注册路由报错。

---

## 构建

```bash
# 安装依赖
pnpm install

# 编译 + 打包
pnpm run build
# 或分两步：
pnpm run build      # tsc → lib/types/ + tsdown → lib/index.js + lib/client.js
```

## License

MIT
