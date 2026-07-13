# 慧记 v1.0.0 — 打包指南

## 项目结构

```
huiji/
├── src/                  # 前端源码
├── src-tauri/            # Tauri 桌面端配置（exe）
├── capacitor.config.ts   # Capacitor 手机端配置（apk）
├── public/icons/         # 应用图标
├── dist/                 # 构建产物
└── package.json
```

---

## 一、打包 Windows 桌面端 (.exe)

### 前置条件

1. **安装 Rust**（仅需一次）：
   ```powershell
   winget install Rustlang.Rustup
   ```
   安装完后**关闭并重新打开终端**。

2. 验证安装：
   ```powershell
   rustc --version   # 应显示版本号如 1.8x.x
   cargo --version   # 应显示版本号
   ```

### 打包命令

```powershell
cd d:\编程\慧记\huiji

# 开发模式（带热更新的桌面窗口）
npm run tauri:dev

# 打包为 exe 安装程序
npm run tauri:build
```

### 输出位置

```
src-tauri/target/release/bundle/
├── nsis/
│   └── 慧记_1.0.0_x64-setup.exe    # NSIS 安装包
└── msi/
    └── 慧记_1.0.0_x64.msi          # MSI 安装包
```

### 首次打包注意事项

- 首次运行 `tauri build` 会下载和编译 Rust 依赖，可能需要 **5-15 分钟**。
- 后续打包会快很多（约 1-2 分钟）。
- 如果遇到 "Microsoft Visual Studio" 相关错误，确保安装了 **Visual Studio Build Tools**（你已安装）。

---

## 二、打包 Android 手机端 (.apk)

### 前置条件

1. **安装 JDK 17**：
   ```powershell
   winget install Microsoft.OpenJDK.17
   ```

2. **安装 Android Studio**：
   - 下载：https://developer.android.com/studio
   - 安装时勾选 **Android SDK** 和 **SDK Platform-Tools**
   - 安装完后打开 Android Studio → Settings → SDK Manager → 安装 **Android SDK 34**

3. **设置环境变量**（Android Studio 安装后）：
   ```
   ANDROID_HOME = C:\Users\hp\AppData\Local\Android\Sdk
   ```

### 打包命令

```powershell
cd d:\编程\慧记\huiji

# 1. 先构建前端
npm run build

# 2. 初始化 Android 项目（仅首次）
npx cap add android

# 3. 同步前端代码到 Android 项目
npx cap sync

# 4. 打开 Android Studio 打包
npx cap open android
```

### 在 Android Studio 中打包 APK

1. Android Studio 打开后，等待 Gradle 同步完成（右下角进度条）
2. 菜单 → **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
3. 等待构建完成
4. 点击右下角 **locate** 找到 APK 文件

### 输出位置

```
android/app/build/outputs/apk/debug/
└── app-debug.apk         # 调试版 APK

android/app/build/outputs/apk/release/
└── app-release.apk       # 发布版 APK（需要签名）
```

### 发布版签名

要生成发布版 APK：
1. Android Studio → **Build** → **Generate Signed Bundle / APK**
2. 选择 APK → 创建或选择 keystore 文件
3. 填写信息 → 选择 release → Finish

---

## 三、注意事项

### IndexedDB 兼容性
- **桌面端 (Tauri)**：使用系统 WebView，IndexedDB 完全支持 ✅
- **手机端 (Capacitor)**：Android WebView 支持 IndexedDB ✅
- 原来 PWA 版本的数据**无法直接迁移**到原生版本（域名不同）

### AI API 调用
- 桌面端和手机端都需要**网络连接**才能使用 AI 功能
- CSP 配置已允许连接 `https:` 协议的所有域名

### 应用图标
- 桌面端：使用 `src-tauri/icons/icon.png`（已从 icon-512.png 复制）
- 手机端：Capacitor 会自动从 `public/icons/icon-512.png` 读取

---

## 四、快速命令速查

| 操作 | 命令 |
|------|------|
| 开发模式（桌面） | `npm run tauri:dev` |
| 打包 exe | `npm run tauri:build` |
| 构建前端 | `npm run build` |
| 同步到 Android | `npx cap sync` |
| 打开 Android Studio | `npx cap open android` |
