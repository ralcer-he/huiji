# 慧记 - AI情绪感知日记

一款温柔、克制、有温度的日记与情绪记录应用。帮助你看见自己的情绪变化，记录每一个值得记住的瞬间。

## ✨ 功能特点

### 情绪洞察
- **情绪日历**：用颜色标记每一天的心情，直观看到情绪变化
- **统计分析**：情绪趋势、主导情绪占比、关键词云
- **情绪提醒**：定期总结情绪状态，帮助自我观察

### AI小慧
- **智能日记助手**：记住你的每一句话，懂你的心事
- **书信陪伴**：特殊日子收到小慧的亲笔书信
- **长期记忆**：持续记录，建立深度连接

### 快速记录
- **悬浮窗助手**：点击即可快速记录待办、随笔、心情
- **多类型记录**：日记、随笔、心情、备忘四种类型
- **内置画板**：随手涂鸦，记录灵感

### 隐私保护
- **本地优先**：数据完全存储在本地设备
- **PIN码保护**：加密保护你的私密记录
- **数据导出**：支持数据备份和迁移

### 自定义体验
- **编写页定制**：调整四个记录类型的顺序和显示
- **工具栏自定义**：按需求增删编辑工具
- **主题切换**：支持日间/夜间模式

## 🛠️ 技术栈

| 分类 | 技术 |
|------|------|
| 框架 | React 18 + Vite |
| UI | Tailwind CSS 4 |
| 路由 | React Router DOM |
| 编辑器 | TipTap |
| 图标 | Lucide React |
| 图表 | Recharts |
| 数据库 | Dexie.js (IndexedDB) |
| 桌面端 | Tauri 2 |
| 移动端 | Capacitor 8 |

## 📦 安装与运行

### 环境要求

- Node.js >= 18
- npm >= 9

### 开发模式

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 构建生产版本

```bash
# 构建前端
npm run build

# 预览构建结果
npm run preview
```

### 桌面端构建（Tauri）

```bash
# 开发模式
npm run tauri:dev

# 构建生产版本
npm run tauri:build
```

### 移动端构建（Capacitor）

```bash
# 同步 Capacitor 配置
npm run cap:sync

# 构建 Android 版本
npm run cap:build
```

## 📁 项目结构

```
huiji/
├── public/          # 静态资源
├── src/
│   ├── components/  # 组件
│   ├── pages/       # 页面
│   ├── hooks/       # 自定义 Hooks
│   ├── utils/       # 工具函数
│   ├── constants/   # 常量定义
│   ├── db/          # 数据库操作
│   └── store/       # 状态管理
├── src-tauri/       # Tauri 桌面端配置
├── android/         # Capacitor 移动端（构建后生成）
├── vite.config.js   # Vite 配置
├── tailwind.config.js # Tailwind 配置
└── package.json     # 项目依赖
```

## 🔒 隐私说明

- 所有数据均存储在本地设备，不会上传到任何服务器
- AI 功能使用用户自行配置的 API Key，数据通过用户配置的服务处理
- 支持数据导出为 JSON 格式，方便备份和迁移

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

**慧记** - 让每一份记录，都值得被温柔对待。
