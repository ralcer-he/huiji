# 慧记全面重构实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将慧记从双栏布局重构为三栏布局，新增日记流主页、沉浸编辑器、分类体系、漫步页等核心功能，同时保留现有 AI 情绪分析、四种记录类型等核心竞争力。

**Architecture:** 桌面端采用 220px 侧边栏 + 自适应主内容 + 280px 动态右侧面板的三栏布局；手机端改为顶部标题栏 + 底部 5 Tab + 悬浮按钮。所有新功能基于现有 React + Vite + Tailwind CSS + Dexie.js 技术栈实现。

**Tech Stack:** React 18, Vite 5, Tailwind CSS 4, React Router DOM 7, Dexie.js 4, TipTap 3

---

## 文件结构映射

### 新增文件（20+）

| 文件 | 职责 |
|:---|:---|
| `src/components/layout/ThreeColumnLayout.jsx` | 三栏布局容器，管理桌面端三栏排列 |
| `src/components/layout/RightPanel.jsx` | 右侧面板，根据当前路由渲染不同内容 |
| `src/components/layout/TopBar.jsx` | 手机端顶部标题栏（各页面统一） |
| `src/pages/HomePage.jsx` | 日记流主页（默认首页 `/`） |
| `src/pages/StrollPage.jsx` | 漫步页（`/stroll`） |
| `src/pages/StatsPage.jsx` | 统计页（`/stats`，从设置页拆分） |
| `src/components/home/DiaryStream.jsx` | 日记流主组件，卡片列表 + 分类筛选 |
| `src/components/home/DiaryCard.jsx` | 单条日记卡片（瀑布流/列表样式） |
| `src/components/home/CategoryTabs.jsx` | 顶部分类横向滚动标签栏 |
| `src/components/home/EmptyHomeState.jsx` | 日记流空状态 |
| `src/components/stroll/RandomReview.jsx` | 随机回顾大卡片组件 |
| `src/components/stroll/CitySilhouette.jsx` | 城市剪影 SVG 装饰 |
| `src/components/editor/ImmersiveEditor.jsx` | 沉浸模式编辑器 |
| `src/components/editor/EditorToolbar.jsx` | 底部格式工具栏（悬浮卡片样式） |
| `src/components/editor/TemplatePicker.jsx` | 模板选择弹窗 |
| `src/components/settings/AppearanceSettings.jsx` | 外观设置（主题色/字体/行距） |
| `src/components/settings/FontSettings.jsx` | 字体设置子组件 |
| `src/components/settings/CategoryManager.jsx` | 分类管理（增删改查） |
| `src/components/stats/StatsCards.jsx` | 统计页 4 卡片组件 |
| `src/components/ui/FloatingActionButton.jsx` | 手机端右下角悬浮「+」按钮 |

### 修改文件（10+）

| 文件 | 改造内容 |
|:---|:---|
| `src/App.jsx` | 路由扩展为三栏布局，新增 `/` `/stroll` `/stats` 路由 |
| `src/components/layout/Sidebar.jsx` | 导航项扩展为 8 个，新增新建按钮、主题切换入口 |
| `src/components/layout/BottomNav.jsx` | 4 Tab → 5 Tab，调整图标和标签 |
| `src/pages/WritePage.jsx` | 支持 `?mode=quick\|immersive`，新增模式切换 UI |
| `src/pages/TimelinePage.jsx` | 移除标签筛选，改为分类筛选；增加右侧面板适配 |
| `src/pages/CalendarPage.jsx` | 手机端纵向滚动优化 |
| `src/pages/SettingsPage.jsx` | 拆分统计功能到 StatsPage，精简设置项 |
| `src/db/database.js` | 升级 `db.version(3)`，新增 `categories`/`drafts`/`templates` 表 |
| `src/index.css` | 新增主题色 CSS 变量、字体大小变量 |
| `src/components/XiaohuiFab.jsx` | 调整默认初始位置，确保 `z-index` 覆盖右侧面板 |

---

## Phase 1: 核心架构（必须先完成）

> **依赖：** 无。此 Phase 完成后，应用基本框架可用，后续 Phase 可独立或并行开发。

---

### Task 1.1: 数据库 Schema 升级

**Files:**
- Modify: `src/db/database.js`

**背景：** 当前 `db.version(2)`，需要升级到 `version(3)` 新增分类表、草稿表、模板表，并在 `records` 表索引中新增 `category` 和 `privacy` 字段。

- [ ] **Step 1: 在现有 version(2) 下方添加 version(3)**

在 `src/db/database.js` 第 10 行（`db.version(2).stores(...)` 之后）添加：

```javascript
db.version(3).stores({
  records: 'id, type, category, privacy, createdAt, *emotions',
  settings: 'key',
  chatConversations: 'id, mode, createdAt, updatedAt',
  chatMessages: 'id, conversationId, role, createdAt',
  categories: 'id, name, order',
  drafts: 'id, recordId, type, createdAt, updatedAt',
  templates: 'id, type, isSystem, createdAt',
});
```

- [ ] **Step 2: 新增分类 CRUD 函数**

在 `src/db/database.js` 末尾（第 326 行 `getChatMessages` 之后）添加：

```javascript
// ========== 分类相关 ==========

export const getCategories = async () => {
  const categories = await db.categories.orderBy('order').toArray();
  return categories;
};

export const saveCategory = async (category) => {
  const now = new Date().toISOString();
  const cat = { ...category, createdAt: now };
  await db.categories.put(cat);
  return cat;
};

export const deleteCategory = async (id) => {
  await db.categories.delete(id);
  // 将该分类下的记录设为未分类
  await db.records.where('category').equals(id).modify({ category: null });
};

// ========== 草稿相关 ==========

export const getDrafts = async (type = null) => {
  let query = db.drafts.orderBy('updatedAt').reverse();
  if (type) {
    query = query.filter(d => d.type === type);
  }
  return await query.toArray();
};

export const saveDraft = async (draft) => {
  const now = new Date().toISOString();
  const d = { ...draft, updatedAt: now };
  if (!d.createdAt) {
    d.createdAt = now;
  }
  await db.drafts.put(d);
  return d;
};

export const deleteDraft = async (id) => {
  await db.drafts.delete(id);
};

// ========== 模板相关 ==========

export const getTemplates = async (type = null) => {
  let query = db.templates.orderBy('createdAt');
  if (type) {
    query = query.filter(t => t.type === type);
  }
  return await query.toArray();
};

export const saveTemplate = async (template) => {
  const now = new Date().toISOString();
  const t = { ...template, createdAt: now };
  await db.templates.put(t);
  return t;
};

export const deleteTemplate = async (id) => {
  await db.templates.delete(id);
};

// ========== 初始化预设分类 ==========

export const initDefaultCategories = async () => {
  const count = await db.categories.count();
  if (count > 0) return;
  const defaults = [
    { id: 'uncategorized', name: '未分类', color: '#94A3B8', order: 0, isDefault: true },
    { id: 'life', name: '生活随笔', color: '#3B82F6', order: 1, isDefault: false },
    { id: 'work', name: '工作学习', color: '#F59E0B', order: 2, isDefault: false },
    { id: 'emotion', name: '情感记录', color: '#EC4899', order: 3, isDefault: false },
    { id: 'travel', name: '旅行日记', color: '#10B981', order: 4, isDefault: false },
    { id: 'health', name: '健康运动', color: '#8B5CF6', order: 5, isDefault: false },
  ];
  await db.categories.bulkPut(defaults);
};
```

- [ ] **Step 3: 修改 searchRecords 移除标签过滤，增加分类过滤**

修改 `src/db/database.js` 第 91-110 行的 `searchRecords` 函数：

```javascript
export const searchRecords = async (keyword, emotion, category) => {
  let records = await getAllRecords();

  if (keyword && keyword.trim()) {
    const kw = keyword.toLowerCase();
    records = records.filter(r =>
      (r.content && r.content.toLowerCase().includes(kw)) ||
      (r.title && r.title.toLowerCase().includes(kw))
    );
  }

  if (emotion && emotion.trim()) {
    records = records.filter(r =>
      r.emotions && r.emotions.includes(emotion)
    );
  }

  if (category && category.trim()) {
    records = records.filter(r => r.category === category);
  }

  return records;
};
```

- [ ] **Step 4: 在 main.jsx 启动时初始化分类数据**

修改 `src/main.jsx`，在 `ReactDOM.createRoot` 之前添加：

```javascript
import { initDefaultCategories } from './db/database';

// 初始化预设分类
initDefaultCategories().catch(console.error);
```

- [ ] **Step 5: 验证数据库升级**

运行：`cd d:\编程\慧记\huiji && npm run dev`
Expected: 开发服务器正常启动，浏览器控制台无 Dexie schema 错误。

- [ ] **Step 6: Commit**

```bash
cd d:\编程\慧记\huiji
git add src/db/database.js src/main.jsx
git commit -m "feat: upgrade db schema to v3, add categories/drafts/templates tables"
```

---

### Task 1.2: 三栏布局框架

**Files:**
- Create: `src/components/layout/ThreeColumnLayout.jsx`
- Create: `src/components/layout/RightPanel.jsx`
- Modify: `src/App.jsx`

**背景：** 当前桌面端是 `fixed` 定位的双栏（侧边栏 + 主内容区），需要改为 `flex` 三栏布局。

- [ ] **Step 1: 创建 ThreeColumnLayout.jsx**

```jsx
import { useLocation } from 'react-router-dom';

function ThreeColumnLayout({ sidebar, children, rightPanel }) {
  const location = useLocation();
  const hideRightPanel = location.pathname === '/settings' || location.pathname === '/write';

  return (
    <div className="hidden lg:flex flex-1 h-screen overflow-hidden">
      {/* 左侧边栏 */}
      <aside className="w-[220px] flex-shrink-0 h-full overflow-y-auto border-r" style={{ borderColor: 'var(--rule)', backgroundColor: 'var(--bg)' }}>
        {sidebar}
      </aside>

      {/* 中间主内容 */}
      <main className="flex-1 h-full overflow-y-auto" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <div className="flex justify-center min-h-full py-8 px-6">
          <div className="w-full max-w-[900px]">
            {children}
          </div>
        </div>
      </main>

      {/* 右侧面板 */}
      {!hideRightPanel && (
        <aside className="w-[280px] flex-shrink-0 h-full overflow-y-auto border-l" style={{ borderColor: 'var(--rule)', backgroundColor: 'var(--bg)' }}>
          {rightPanel}
        </aside>
      )}
    </div>
  );
}

export default ThreeColumnLayout;
```

- [ ] **Step 2: 创建 RightPanel.jsx**

```jsx
import { useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getRecordsByDateRange } from '../../db/database';
import Icon from '../ui/Icon';

function RightPanel() {
  const location = useLocation();
  const [recentRecords, setRecentRecords] = useState([]);

  useEffect(() => {
    const loadRecent = async () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 7);
      const records = await getRecordsByDateRange(start, end);
      setRecentRecords(records.slice(0, 5));
    };
    loadRecent();
  }, []);

  const renderContent = () => {
    switch (location.pathname) {
      case '/':
        return <HomePanel records={recentRecords} />;
      case '/timeline':
        return <TimelinePanel />;
      case '/calendar':
        return <CalendarPanel />;
      case '/stroll':
        return <StrollPanel />;
      default:
        return <DefaultPanel records={recentRecords} />;
    }
  };

  return (
    <div className="p-4">
      {renderContent()}
    </div>
  );
}

function HomePanel({ records }) {
  return (
    <div>
      <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--ink-strong)' }}>最近记录</h3>
      <div className="space-y-2">
        {records.map(r => (
          <div key={r.id} className="p-2 rounded-lg text-xs" style={{ backgroundColor: 'var(--bg2)' }}>
            <span style={{ color: 'var(--muted)' }}>{new Date(r.createdAt).toLocaleDateString('zh-CN')}</span>
            <p className="mt-1 truncate" style={{ color: 'var(--ink)' }}>{r.title || r.content?.slice(0, 30) || '无标题'}</p>
          </div>
        ))}
        {records.length === 0 && <p className="text-xs" style={{ color: 'var(--muted)' }}>暂无记录</p>}
      </div>
    </div>
  );
}

function TimelinePanel() {
  return (
    <div>
      <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--ink-strong)' }}>筛选</h3>
      <p className="text-xs" style={{ color: 'var(--muted)' }}>在时间线页面使用筛选功能</p>
    </div>
  );
}

function CalendarPanel() {
  const handleBackToToday = () => {
    window.dispatchEvent(new CustomEvent('calendar-back-to-today'));
  };

  return (
    <div>
      <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--ink-strong)' }}>日历</h3>
      <button
        onClick={handleBackToToday}
        className="w-full px-3 py-2 rounded-lg text-xs font-medium transition-all"
        style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)' }}
      >
        回到今日
      </button>
    </div>
  );
}

function StrollPanel() {
  return (
    <div>
      <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--ink-strong)' }}>往年今日</h3>
      <p className="text-xs" style={{ color: 'var(--muted)' }}>在漫步页面查看往年今日</p>
    </div>
  );
}

function DefaultPanel({ records }) {
  return <HomePanel records={records} />;
}

export default RightPanel;
```

- [ ] **Step 3: 重构 App.jsx 为三栏布局**

完整替换 `src/App.jsx`：

```jsx
import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import BottomNav from './components/layout/BottomNav';
import Sidebar from './components/layout/Sidebar';
import ThreeColumnLayout from './components/layout/ThreeColumnLayout';
import RightPanel from './components/layout/RightPanel';
import TopBar from './components/layout/TopBar';
import XiaohuiFab from './components/XiaohuiFab';
import PINLock from './components/PINLock';
import WritePage from './pages/WritePage';
import TimelinePage from './pages/TimelinePage';
import CalendarPage from './pages/CalendarPage';
import SettingsPage from './pages/SettingsPage';
import HomePage from './pages/HomePage';
import StrollPage from './pages/StrollPage';
import StatsPage from './pages/StatsPage';
import { getSetting } from './db/database';
import { initReminder } from './utils/reminder';

function DesktopContent() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/write" element={<WritePage />} />
      <Route path="/timeline" element={<TimelinePage />} />
      <Route path="/calendar" element={<CalendarPage />} />
      <Route path="/stroll" element={<StrollPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/stats" element={<StatsPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function MobileContent() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/write" element={<WritePage />} />
      <Route path="/timeline" element={<TimelinePage />} />
      <Route path="/calendar" element={<CalendarPage />} />
      <Route path="/stroll" element={<StrollPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/stats" element={<StatsPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  const [pinEnabled, setPinEnabled] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [checkingPIN, setCheckingPIN] = useState(true);

  useEffect(() => {
    checkPINStatus();
    initReminder();
  }, []);

  const checkPINStatus = async () => {
    const enabled = await getSetting('pinEnabled');
    setPinEnabled(!!enabled);
    if (!enabled) {
      setIsUnlocked(true);
    }
    setCheckingPIN(false);
  };

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && pinEnabled && isUnlocked) {
        setIsUnlocked(false);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [pinEnabled, isUnlocked]);

  const handleUnlock = () => {
    setIsUnlocked(true);
  };

  if (checkingPIN) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg)', color: 'var(--ink)' }}>
        <div className="animate-pulse" style={{ color: 'var(--muted)' }}>加载中...</div>
      </div>
    );
  }

  if (pinEnabled && !isUnlocked) {
    return <PINLock onUnlock={handleUnlock} />;
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg)', color: 'var(--ink)' }}>
      {/* 桌面端三栏布局 (lg+) */}
      <ThreeColumnLayout
        sidebar={<Sidebar />}
        rightPanel={<RightPanel />}
      >
        <DesktopContent />
      </ThreeColumnLayout>

      {/* 平板端布局 (md-lg) */}
      <div className="hidden md:flex lg:hidden flex-1 h-screen overflow-hidden">
        <aside className="w-16 flex-shrink-0 h-full border-r" style={{ borderColor: 'var(--rule)', backgroundColor: 'var(--bg)' }}>
          <Sidebar compact />
        </aside>
        <main className="flex-1 h-full overflow-y-auto" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <div className="max-w-lg mx-auto px-6 py-6">
            <MobileContent />
          </div>
        </main>
      </div>

      {/* 移动端布局 (< md) */}
      <div className="md:hidden flex-1 flex flex-col h-screen overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto page-content">
          <MobileContent />
        </main>
        <BottomNav />
      </div>

      <XiaohuiFab />
    </div>
  );
}

export default App;
```

- [ ] **Step 4: 创建 TopBar.jsx（手机端顶部标题栏）**

```jsx
import { useLocation, useNavigate } from 'react-router-dom';
import Icon from '../ui/Icon';

const PAGE_TITLES = {
  '/': '日记流',
  '/write': '编写',
  '/timeline': '时间线',
  '/calendar': '日历',
  '/stroll': '漫步',
  '/settings': '设置',
  '/stats': '统计',
};

function TopBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const title = PAGE_TITLES[location.pathname] || '慧记';

  return (
    <header className="flex items-center justify-between px-4 h-12 border-b flex-shrink-0" style={{ borderColor: 'var(--rule)', backgroundColor: 'var(--bg)' }}>
      <div className="flex items-center gap-2">
        <button onClick={() => navigate(-1)} className="p-1 rounded-lg" style={{ color: 'var(--muted)' }}>
          <Icon name="back" size={20} strokeWidth={1.5} />
        </button>
        <h1 className="text-base font-semibold" style={{ color: 'var(--ink-strong)' }}>{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        <button className="p-2 rounded-lg" style={{ color: 'var(--muted)' }}>
          <Icon name="search" size={20} strokeWidth={1.5} />
        </button>
        <button className="p-2 rounded-lg" style={{ color: 'var(--muted)' }}>
          <Icon name="more" size={20} strokeWidth={1.5} />
        </button>
      </div>
    </header>
  );
}

export default TopBar;
```

- [ ] **Step 5: 验证布局**

运行：`cd d:\编程\慧记\huiji && npm run dev`
Expected: 
- 桌面端显示三栏布局（侧边栏+内容+右侧面板）
- 默认路由 `/` 重定向问题（因为 HomePage 还未创建，会显示空白）
- 无编译错误

- [ ] **Step 6: Commit**

```bash
cd d:\编程\慧记\huiji
git add src/components/layout/ThreeColumnLayout.jsx src/components/layout/RightPanel.jsx src/components/layout/TopBar.jsx src/App.jsx
git commit -m "feat: implement three-column layout framework, add TopBar, update routes"
```

---

### Task 1.3: 侧边栏与底部导航重构

**Files:**
- Modify: `src/components/layout/Sidebar.jsx`
- Modify: `src/components/layout/BottomNav.jsx`

- [ ] **Step 1: 重构 Sidebar.jsx**

完整替换 `src/components/layout/Sidebar.jsx`：

```jsx
import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import Icon from '../ui/Icon';

const navItems = [
  { to: '/', label: '日记流', icon: 'home' },
  { to: '/write', label: '编写', icon: 'edit' },
  { to: '/timeline', label: '时间线', icon: 'clock' },
  { to: '/calendar', label: '日历', icon: 'calendar' },
  { to: '/stroll', label: '漫步', icon: 'shuffle' },
];

const bottomItems = [
  { to: '/stats', label: '统计', icon: 'bar-chart' },
  { to: '/settings', label: '设置', icon: 'settings' },
];

function Sidebar({ compact = false }) {
  const navigate = useNavigate();
  const [showNewMenu, setShowNewMenu] = useState(false);

  if (compact) {
    return (
      <div className="flex flex-col items-center py-4 space-y-2">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: 'var(--accent-light)' }}>
          <Icon name="edit" size={20} color="var(--accent)" strokeWidth={1.5} />
        </div>
        {navItems.map(item => (
          <NavLink key={item.to} to={item.to}>
            {({ isActive }) => (
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${isActive ? 'bg-[var(--accent-light)]' : 'hover:bg-[var(--bg2)]'}`}>
                <Icon name={item.icon} size={20} color={isActive ? 'var(--accent)' : 'var(--muted)'} strokeWidth={1.5} />
              </div>
            )}
          </NavLink>
        ))}
      </div>
    );
  }

  return (
    <aside className="w-[220px] h-full border-r flex flex-col" style={{ borderColor: 'var(--rule)', backgroundColor: 'var(--bg)' }}>
      {/* Logo */}
      <div className="flex-shrink-0 pt-5 pb-3 px-4 flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--accent-light)', border: '1px solid var(--accent-border)' }}>
          <Icon name="edit" size={20} color="var(--accent)" strokeWidth={1.5} />
        </div>
        <h1 className="text-[17px] font-semibold" style={{ color: 'var(--ink-strong)' }}>慧记</h1>
      </div>

      {/* 新建按钮 */}
      <div className="px-4 pb-3">
        <button
          onClick={() => setShowNewMenu(!showNewMenu)}
          className="w-full h-10 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-all"
          style={{ backgroundColor: 'var(--accent)', color: 'white' }}
        >
          <Icon name="plus" size={18} strokeWidth={2} />
          <span>新建</span>
        </button>
        {showNewMenu && (
          <div className="mt-2 p-2 rounded-lg space-y-1" style={{ backgroundColor: 'var(--bg2)', border: '1px solid var(--rule)' }}>
            {[
              { type: 'note', label: '随笔', icon: 'note', color: '#3B82F6' },
              { type: 'mood', label: '心情', icon: 'mood', color: '#F59E0B' },
              { type: 'memo', label: '备忘', icon: 'memo', color: '#10B981' },
              { type: 'diary', label: '日记', icon: 'diary', color: '#8B5CF6' },
            ].map(item => (
              <button
                key={item.type}
                onClick={() => { navigate(`/write?type=${item.type}`); setShowNewMenu(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all hover:bg-[var(--bg)]"
                style={{ color: 'var(--ink)' }}
              >
                <Icon name={item.icon} size={16} color={item.color} strokeWidth={1.5} />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 主导航 */}
      <nav className="flex-1 space-y-0.5 px-3">
        {navItems.map(item => (
          <NavLink key={item.to} to={item.to}>
            {({ isActive }) => (
              <div className="relative flex items-center gap-3 px-4 h-10 rounded-lg transition-all cursor-pointer hover:bg-[var(--bg2)]" style={{ backgroundColor: isActive ? 'var(--accent-light)' : 'transparent' }}>
                {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-5 rounded-full" style={{ backgroundColor: 'var(--accent)' }} />}
                <Icon name={item.icon} size={18} color={isActive ? 'var(--accent)' : 'var(--muted)'} strokeWidth={1.5} />
                <span className="text-[14px]" style={{ color: isActive ? 'var(--accent)' : 'var(--ink)', fontWeight: isActive ? 600 : 400 }}>{item.label}</span>
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* 底部分隔线 + 功能入口 */}
      <div className="px-4 pb-2">
        <div className="h-px mb-2" style={{ backgroundColor: 'var(--rule)' }} />
        <div className="space-y-0.5">
          {bottomItems.map(item => (
            <NavLink key={item.to} to={item.to}>
              {({ isActive }) => (
                <div className="flex items-center gap-3 px-4 h-10 rounded-lg transition-all cursor-pointer hover:bg-[var(--bg2)]" style={{ backgroundColor: isActive ? 'var(--accent-light)' : 'transparent' }}>
                  <Icon name={item.icon} size={18} color={isActive ? 'var(--accent)' : 'var(--muted)'} strokeWidth={1.5} />
                  <span className="text-[14px]" style={{ color: isActive ? 'var(--accent)' : 'var(--ink)', fontWeight: isActive ? 600 : 400 }}>{item.label}</span>
                </div>
              )}
            </NavLink>
          ))}
        </div>
      </div>

      {/* 主题切换 + 版本号 */}
      <div className="px-4 pb-4">
        <div className="h-px mb-2" style={{ backgroundColor: 'var(--rule)' }} />
        <div className="flex items-center justify-between px-2">
          <button className="p-2 rounded-lg hover:bg-[var(--bg2)] transition-all" title="切换主题" style={{ color: 'var(--muted)' }}>
            <Icon name="sun" size={18} strokeWidth={1.5} />
          </button>
          <span className="text-[11px] tracking-wider" style={{ color: 'var(--muted)', opacity: 0.85 }}>慧记 v1.0.0</span>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
```

- [ ] **Step 2: 重构 BottomNav.jsx**

完整替换 `src/components/layout/BottomNav.jsx`：

```jsx
import { NavLink } from 'react-router-dom';
import Icon from '../ui/Icon';

const navItems = [
  { to: '/', label: '笔记', icon: 'home' },
  { to: '/timeline', label: '时间线', icon: 'clock' },
  { to: '/calendar', label: '日历', icon: 'calendar' },
  { to: '/stroll', label: '漫步', icon: 'shuffle' },
  { to: '/settings', label: '我的', icon: 'user' },
];

function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 safe-area-bottom flex-shrink-0 z-40" style={{ backgroundColor: 'var(--bg)', borderTop: '1px solid var(--rule)' }}>
      <div className="flex items-center justify-around h-14">
        {navItems.map(item => (
          <NavLink key={item.to} to={item.to}>
            {({ isActive }) => (
              <div className="flex flex-col items-center justify-center py-1 px-3 transition-all" style={{ color: isActive ? 'var(--accent)' : 'var(--muted)' }}>
                <Icon name={item.icon} size={22} color={isActive ? 'var(--accent)' : 'var(--muted)'} strokeWidth={1.5} />
                <span className="text-[11px] mt-0.5 font-medium">{item.label}</span>
              </div>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

export default BottomNav;
```

- [ ] **Step 3: 验证导航**

运行：`npm run dev`
Expected:
- 桌面端侧边栏显示 8 个导航项 + 新建按钮 + 主题切换
- 手机端底部显示 5 个 Tab
- 点击导航可切换页面（页面内容可能空白因为还未创建）

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/Sidebar.jsx src/components/layout/BottomNav.jsx
git commit -m "feat: refactor Sidebar with 8 nav items + new button, BottomNav 5 tabs"
```

---

## Phase 2: 日记流主页（P1）

> **依赖：** Phase 1 完成。

---

### Task 2.1: 日记流主页基础结构

**Files:**
- Create: `src/pages/HomePage.jsx`
- Create: `src/components/home/DiaryStream.jsx`
- Create: `src/components/home/DiaryCard.jsx`
- Create: `src/components/home/CategoryTabs.jsx`

- [ ] **Step 1: 创建 DiaryCard.jsx**

```jsx
import { useNavigate } from 'react-router-dom';
import Icon from '../ui/Icon';
import { RECORD_TYPE_MAP } from '../../constants/types';
import { stripHtml } from '../../utils/recordHelpers';

function DiaryCard({ record, style = 'card' }) {
  const navigate = useNavigate();
  const config = RECORD_TYPE_MAP[record.type] || RECORD_TYPE_MAP.note;
  const time = new Date(record.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  const dateStr = new Date(record.createdAt).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  const plainText = stripHtml(record.content || '').slice(0, 80);

  const handleClick = () => {
    navigate(`/write?editId=${record.id}`);
  };

  return (
    <div
      onClick={handleClick}
      className="bg-white rounded-xl p-4 cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
    >
      {/* 类型标签 */}
      <div className="flex items-center gap-2 mb-2">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: config.color + '15', color: config.color }}>
          <Icon name={config.iconName} size={12} color={config.color} />
          {config.label}
        </span>
        <span className="text-xs" style={{ color: 'var(--muted)' }}>{dateStr} · {time}</span>
      </div>

      {/* 标题（如有） */}
      {record.title && (
        <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--ink-strong)' }}>{record.title}</h3>
      )}

      {/* 内容摘要 */}
      <p className="text-sm line-clamp-3 leading-relaxed" style={{ color: 'var(--ink)' }}>
        {plainText || '暂无内容'}
      </p>

      {/* 底部元信息 */}
      <div className="flex items-center gap-2 mt-3">
        {record.emotions?.map(name => (
          <span key={name} className="text-xs" style={{ color: 'var(--muted)' }}>{name}</span>
        ))}
        {record.weather && (
          <span className="text-xs flex items-center gap-0.5" style={{ color: 'var(--muted)' }}>
            <Icon name="weather-sun" size={12} />
            {record.weather}
          </span>
        )}
      </div>
    </div>
  );
}

export default DiaryCard;
```

- [ ] **Step 2: 创建 CategoryTabs.jsx**

```jsx
import { useState, useEffect } from 'react';
import { getCategories } from '../../db/database';

function CategoryTabs({ activeCategory, onChange }) {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const load = async () => {
      const cats = await getCategories();
      setCategories([{ id: 'all', name: '全部', color: 'var(--accent)' }, ...cats]);
    };
    load();
  }, []);

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {categories.map(cat => (
        <button
          key={cat.id}
          onClick={() => onChange(cat.id === 'all' ? null : cat.id)}
          className="flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap"
          style={{
            backgroundColor: activeCategory === (cat.id === 'all' ? null : cat.id) ? 'var(--accent)' : 'var(--bg2)',
            color: activeCategory === (cat.id === 'all' ? null : cat.id) ? 'white' : 'var(--ink)',
          }}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
}

export default CategoryTabs;
```

- [ ] **Step 3: 创建 DiaryStream.jsx**

```jsx
import { useState, useEffect } from 'react';
import { getAllRecords } from '../../db/database';
import DiaryCard from './DiaryCard';
import CategoryTabs from './CategoryTabs';
import EmptyHomeState from './EmptyHomeState';

function DiaryStream() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(null);

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const all = await getAllRecords();
      setRecords(all);
    } catch (e) {
      console.error('加载记录失败:', e);
    }
    setLoading(false);
  };

  const filtered = activeCategory
    ? records.filter(r => r.category === activeCategory)
    : records;

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="animate-spin w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full mx-auto" />
      </div>
    );
  }

  if (records.length === 0) {
    return <EmptyHomeState />;
  }

  return (
    <div>
      <CategoryTabs activeCategory={activeCategory} onChange={setActiveCategory} />
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(record => (
          <DiaryCard key={record.id} record={record} />
        ))}
      </div>
      {filtered.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-sm" style={{ color: 'var(--muted)' }}>该分类下暂无记录</p>
        </div>
      )}
    </div>
  );
}

export default DiaryStream;
```

- [ ] **Step 4: 创建 EmptyHomeState.jsx**

```jsx
import { useNavigate } from 'react-router-dom';
import Icon from '../ui/Icon';

function EmptyHomeState() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: 'var(--accent-light)' }}>
        <Icon name="edit" size={32} color="var(--accent)" strokeWidth={1.5} />
      </div>
      <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--ink-strong)' }}>记录你的第一天</h3>
      <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>开始写日记，记录生活中的点滴</p>
      <button
        onClick={() => navigate('/write')}
        className="px-6 py-2.5 rounded-xl text-sm font-medium transition-all"
        style={{ backgroundColor: 'var(--accent)', color: 'white' }}
      >
        开始记录
      </button>
    </div>
  );
}

export default EmptyHomeState;
```

- [ ] **Step 5: 创建 HomePage.jsx**

```jsx
import DiaryStream from '../components/home/DiaryStream';

function HomePage() {
  return (
    <div className="animate-fade-in">
      <DiaryStream />
    </div>
  );
}

export default HomePage;
```

- [ ] **Step 6: 验证日记流主页**

运行：`npm run dev`
Expected:
- 访问 `http://localhost:5173/` 显示日记流主页
- 顶部显示分类标签（全部/未分类/生活随笔/...）
- 下方显示日记卡片网格（两列）
- 点击分类可筛选
- 空状态显示「记录你的第一天」

- [ ] **Step 7: Commit**

```bash
git add src/pages/HomePage.jsx src/components/home/
git commit -m "feat: add diary stream homepage with category tabs and card grid"
```

---

## Phase 3: 沉浸编辑器 + 分类体系（P1）

> **依赖：** Phase 1 完成。

---

### Task 3.1: 沉浸编辑器

**Files:**
- Create: `src/components/editor/ImmersiveEditor.jsx`
- Create: `src/components/editor/EditorToolbar.jsx`
- Modify: `src/pages/WritePage.jsx`

- [ ] **Step 1: 创建 EditorToolbar.jsx**

```jsx
import Icon from '../ui/Icon';

const TOOLS = [
  { name: 'bold', icon: 'bold', title: '粗体' },
  { name: 'italic', icon: 'italic', title: '斜体' },
  { name: 'list', icon: 'list', title: '列表' },
  { name: 'check-square', icon: 'check-square', title: '待办' },
  { name: 'image', icon: 'image', title: '图片' },
  { name: 'link', icon: 'link', title: '链接' },
];

function EditorToolbar({ onToolClick }) {
  return (
    <div className="flex items-center gap-1 px-3 py-2 rounded-xl bg-white" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
      {TOOLS.map(tool => (
        <button
          key={tool.name}
          onClick={() => onToolClick(tool.name)}
          className="w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:bg-[var(--bg2)]"
          title={tool.title}
          style={{ color: 'var(--muted)' }}
        >
          <Icon name={tool.icon} size={18} strokeWidth={1.5} />
        </button>
      ))}
    </div>
  );
}

export default EditorToolbar;
```

- [ ] **Step 2: 创建 ImmersiveEditor.jsx**

```jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../ui/Icon';
import EditorToolbar from './EditorToolbar';
import { saveRecord } from '../../db/database';

function ImmersiveEditor({ type = 'note', customDate, editRecord, onSaved }) {
  const navigate = useNavigate();
  const [title, setTitle] = useState(editRecord?.title || '');
  const [content, setContent] = useState(editRecord?.content || '');
  const [weather, setWeather] = useState(editRecord?.weather || '');
  const [location, setLocation] = useState(editRecord?.location || '');
  const [saving, setSaving] = useState(false);

  const date = customDate || new Date();
  const dateStr = date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' });

  const handleSave = async () => {
    if (!content.trim() && !title.trim()) return;
    setSaving(true);
    try {
      const record = {
        id: editRecord?.id || `record_${Date.now()}`,
        type,
        title: title.trim(),
        content: content.trim(),
        weather,
        location,
        createdAt: editRecord?.createdAt || date.toISOString(),
      };
      await saveRecord(record);
      onSaved?.(record);
      navigate('/');
    } catch (e) {
      console.error('保存失败:', e);
    }
    setSaving(false);
  };

  const handleToolClick = (tool) => {
    // TODO: 接入 TipTap 编辑器命令
    console.log('tool:', tool);
  };

  return (
    <div className="flex flex-col h-full">
      {/* 顶部栏 */}
      <div className="flex items-center justify-between px-4 h-14 border-b flex-shrink-0" style={{ borderColor: 'var(--rule)' }}>
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg" style={{ color: 'var(--muted)' }}>
          <Icon name="back" size={20} strokeWidth={1.5} />
        </button>
        <span className="text-sm font-medium" style={{ color: 'var(--ink)' }}>{dateStr}</span>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 h-8 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
          style={{ backgroundColor: 'var(--accent)', color: 'white' }}
        >
          {saving ? '保存中...' : '保存'}
        </button>
      </div>

      {/* 编辑器区域 */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[680px] mx-auto px-6 py-8">
          {/* 标题 */}
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="标题（可选）"
            className="w-full text-xl font-semibold bg-transparent outline-none placeholder:text-[var(--muted)] mb-4"
            style={{ color: 'var(--ink-strong)' }}
          />

          {/* 正文 */}
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="记录今日..."
            className="w-full min-h-[300px] text-base bg-transparent outline-none resize-none placeholder:text-[var(--muted)] leading-relaxed"
            style={{ color: 'var(--ink)' }}
          />
        </div>
      </div>

      {/* 底部信息栏 */}
      <div className="flex items-center gap-4 px-4 h-10 border-t flex-shrink-0 text-xs" style={{ borderColor: 'var(--rule)', color: 'var(--muted)' }}>
        <button className="flex items-center gap-1 hover:text-[var(--accent)] transition-colors">
          <Icon name="weather-sun" size={14} />
          <span>{weather || '天气'}</span>
        </button>
        <button className="flex items-center gap-1 hover:text-[var(--accent)] transition-colors">
          <Icon name="location" size={14} />
          <span>{location || '地点'}</span>
        </button>
        <span className="ml-auto">{content.length} 字</span>
      </div>

      {/* 底部工具栏 */}
      <div className="flex justify-center px-4 py-3 border-t flex-shrink-0" style={{ borderColor: 'var(--rule)' }}>
        <EditorToolbar onToolClick={handleToolClick} />
      </div>
    </div>
  );
}

export default ImmersiveEditor;
```

- [ ] **Step 3: 修改 WritePage.jsx 支持模式切换**

在 `WritePage.jsx` 中增加模式切换逻辑。由于修改量较大，关键改动如下：

1. 新增 `mode` 状态（从 URL `?mode=` 读取，默认 'quick'）
2. 顶部增加「快速/沉浸」胶囊切换按钮
3. 当 `mode === 'immersive'` 时渲染 `ImmersiveEditor`，否则渲染现有编辑器

```jsx
// 在 WritePage.jsx 的状态中增加：
const [mode, setMode] = useState(searchParams.get('mode') || 'quick');

// 在 renderEditor() 中修改：
const renderEditor = () => {
  if (mode === 'immersive') {
    return (
      <ImmersiveEditor
        type={activeType}
        customDate={customDate}
        editRecord={editingRecord}
        onSaved={handleSaved}
      />
    );
  }
  // 原有的快速模式渲染逻辑...
};

// 在顶部操作栏中增加模式切换按钮（在「最近记录」按钮旁边）：
<div className="flex items-center gap-1 rounded-lg p-0.5" style={{ backgroundColor: 'var(--bg2)' }}>
  <button
    onClick={() => setMode('quick')}
    className={`px-3 h-8 rounded-md text-[13px] transition-all ${mode === 'quick' ? 'bg-white shadow-sm font-medium' : ''}`}
    style={{ color: mode === 'quick' ? 'var(--accent)' : 'var(--muted)' }}
  >
    快速
  </button>
  <button
    onClick={() => setMode('immersive')}
    className={`px-3 h-8 rounded-md text-[13px] transition-all ${mode === 'immersive' ? 'bg-white shadow-sm font-medium' : ''}`}
    style={{ color: mode === 'immersive' ? 'var(--accent)' : 'var(--muted)' }}
  >
    沉浸
  </button>
</div>
```

- [ ] **Step 4: 验证沉浸编辑器**

运行：`npm run dev`
Expected:
- 访问 `/write?mode=immersive` 显示沉浸编辑器
- 顶部显示日期和保存按钮
- 中间是大面积编辑区（最大宽度 680px 居中）
- 底部显示天气/地点/字数和格式工具栏
- 保存后跳转到首页

- [ ] **Step 5: Commit**

```bash
git add src/components/editor/ src/pages/WritePage.jsx
git commit -m "feat: add immersive editor with mode toggle in WritePage"
```

---

### Task 3.2: 分类体系集成

**Files:**
- Create: `src/components/settings/CategoryManager.jsx`
- Modify: `src/components/editor/ImmersiveEditor.jsx`（增加分类选择）
- Modify: `src/components/home/DiaryCard.jsx`（显示分类）

- [ ] **Step 1: 创建 CategoryManager.jsx**

```jsx
import { useState, useEffect } from 'react';
import { getCategories, saveCategory, deleteCategory } from '../../db/database';
import Icon from '../ui/Icon';

function CategoryManager() {
  const [categories, setCategories] = useState([]);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#3B82F6');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const cats = await getCategories();
    setCategories(cats);
  };

  const handleAdd = async () => {
    if (!newName.trim()) return;
    await saveCategory({
      id: `cat_${Date.now()}`,
      name: newName.trim(),
      color: newColor,
      order: categories.length,
      isDefault: false,
    });
    setNewName('');
    loadCategories();
  };

  const handleDelete = async (id) => {
    if (!confirm('确定删除此分类？该分类下的记录将变为未分类。')) return;
    await deleteCategory(id);
    loadCategories();
  };

  return (
    <div>
      <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--ink-strong)' }}>分类管理</h3>

      {/* 添加新分类 */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          placeholder="新分类名称"
          className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
          style={{ backgroundColor: 'var(--bg2)', color: 'var(--ink)', border: '1px solid var(--rule)' }}
        />
        <input
          type="color"
          value={newColor}
          onChange={e => setNewColor(e.target.value)}
          className="w-10 h-10 rounded-lg cursor-pointer border-0"
        />
        <button
          onClick={handleAdd}
          className="px-4 h-10 rounded-lg text-sm font-medium transition-all"
          style={{ backgroundColor: 'var(--accent)', color: 'white' }}
        >
          添加
        </button>
      </div>

      {/* 分类列表 */}
      <div className="space-y-2">
        {categories.map(cat => (
          <div key={cat.id} className="flex items-center justify-between px-3 py-2.5 rounded-lg" style={{ backgroundColor: 'var(--bg2)' }}>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
              <span className="text-sm" style={{ color: 'var(--ink)' }}>{cat.name}</span>
              {cat.isDefault && <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)' }}>默认</span>}
            </div>
            {!cat.isDefault && (
              <button onClick={() => handleDelete(cat.id)} className="p-1.5 rounded-lg hover:bg-red-50 transition-all" style={{ color: 'var(--muted)' }}>
                <Icon name="trash" size={16} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default CategoryManager;
```

- [ ] **Step 2: 在沉浸编辑器中增加分类选择**

在 `ImmersiveEditor.jsx` 中增加分类选择下拉框（放在标题输入框上方）：

```jsx
// 新增 state
const [category, setCategory] = useState(editRecord?.category || null);
const [categories, setCategories] = useState([]);

useEffect(() => {
  const loadCats = async () => {
    const cats = await getCategories();
    setCategories(cats);
  };
  loadCats();
}, []);

// 在保存逻辑中包含 category
const record = {
  // ...其他字段
  category,
};

// 在 JSX 中（标题上方）添加分类选择
<div className="mb-3">
  <select
    value={category || ''}
    onChange={e => setCategory(e.target.value || null)}
    className="px-3 py-1.5 rounded-lg text-sm outline-none bg-transparent"
    style={{ border: '1px solid var(--rule)', color: 'var(--muted)' }}
  >
    <option value="">选择分类</option>
    {categories.map(cat => (
      <option key={cat.id} value={cat.id}>{cat.name}</option>
    ))}
  </select>
</div>
```

- [ ] **Step 3: 在日记卡片中显示分类**

修改 `DiaryCard.jsx`，在类型标签旁边显示分类：

```jsx
// 在类型标签和时间之间插入分类标签
{record.category && (
  <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--bg2)', color: 'var(--muted)' }}>
    {getCategoryName(record.category)}
  </span>
)}

// 需要传入 categories 或单独查询分类名称
```

- [ ] **Step 4: 在设置页中增加分类管理入口**

修改 `SettingsPage.jsx`，在外观设置下方增加分类管理区域：

```jsx
import CategoryManager from '../components/settings/CategoryManager';

// 在设置项容器中添加：
<div className="mt-6">
  <CategoryManager />
</div>
```

- [ ] **Step 5: Commit**

```bash
git add src/components/settings/CategoryManager.jsx src/components/editor/ImmersiveEditor.jsx src/components/home/DiaryCard.jsx src/pages/SettingsPage.jsx
git commit -m "feat: add category system with manager, editor selector, and card display"
```

---

## Phase 4: 漫步页 + 统计拆分（P2）

> **依赖：** Phase 1 + Phase 2 完成。

---

### Task 4.1: 漫步页

**Files:**
- Create: `src/pages/StrollPage.jsx`
- Create: `src/components/stroll/RandomReview.jsx`
- Create: `src/components/stroll/CitySilhouette.jsx`

- [ ] **Step 1: 创建 CitySilhouette.jsx**

```jsx
function CitySilhouette() {
  return (
    <div className="w-full h-16 opacity-20">
      <svg viewBox="0 0 400 60" className="w-full h-full" preserveAspectRatio="none">
        <path
          d="M0,60 L0,40 L20,40 L20,30 L40,30 L40,45 L60,45 L60,20 L80,20 L80,35 L100,35 L100,25 L120,25 L120,40 L140,40 L140,15 L160,15 L160,30 L180,30 L180,45 L200,45 L200,10 L220,10 L220,35 L240,35 L240,25 L260,25 L260,40 L280,40 L280,20 L300,20 L300,45 L320,45 L320,30 L340,30 L340,40 L360,40 L360,25 L380,25 L380,45 L400,45 L400,60 Z"
          fill="currentColor"
          style={{ color: 'var(--ink)' }}
        />
      </svg>
    </div>
  );
}

export default CitySilhouette;
```

- [ ] **Step 2: 创建 RandomReview.jsx**

```jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllRecords } from '../../db/database';
import Icon from '../ui/Icon';
import CitySilhouette from './CitySilhouette';

function RandomReview() {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const all = await getAllRecords();
      // 只保留有正文的日记和随笔
      const eligible = all.filter(r => (r.type === 'diary' || r.type === 'note') && (r.content || r.title));
      // 随机打乱
      const shuffled = eligible.sort(() => Math.random() - 0.5);
      setRecords(shuffled);
      setLoading(false);
    };
    load();
  }, []);

  const current = records[currentIndex];

  const handlePrev = () => {
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : records.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev < records.length - 1 ? prev + 1 : 0));
  };

  const handleRandom = () => {
    const randomIndex = Math.floor(Math.random() * records.length);
    setCurrentIndex(randomIndex);
  };

  if (loading) {
    return <div className="py-20 text-center"><div className="animate-spin w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full mx-auto" /></div>;
  }

  if (!current) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-sm" style={{ color: 'var(--muted)' }}>还没有日记，快去写一篇吧</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-8 px-4">
      {/* 大卡片 */}
      <div
        className="w-full max-w-lg rounded-2xl p-8 mb-6 cursor-pointer transition-all hover:shadow-lg"
        style={{ backgroundColor: 'var(--bg)', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}
        onClick={() => navigate(`/write?editId=${current.id}`)}
      >
        <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--ink-strong)' }}>
          {current.title || '无标题'}
        </h3>
        <p className="text-base leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--ink)' }}>
          {current.content?.slice(0, 300)}{current.content?.length > 300 ? '...' : ''}
        </p>
        <div className="mt-4 text-xs" style={{ color: 'var(--muted)' }}>
          {new Date(current.createdAt).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* 滑动控制 */}
      <div className="flex items-center gap-6 mb-4">
        <button onClick={handlePrev} className="p-3 rounded-full transition-all hover:bg-[var(--bg2)]" style={{ color: 'var(--muted)' }}>
          <Icon name="chevron-left" size={24} strokeWidth={1.5} />
        </button>
        <div className="flex gap-1.5">
          {records.slice(0, Math.min(records.length, 5)).map((_, i) => (
            <div key={i} className="w-2 h-2 rounded-full transition-all" style={{ backgroundColor: i === currentIndex % 5 ? 'var(--accent)' : 'var(--rule)' }} />
          ))}
        </div>
        <button onClick={handleNext} className="p-3 rounded-full transition-all hover:bg-[var(--bg2)]" style={{ color: 'var(--muted)' }}>
          <Icon name="chevron-right" size={24} strokeWidth={1.5} />
        </button>
      </div>

      {/* 随机按钮 */}
      <button
        onClick={handleRandom}
        className="px-4 py-2 rounded-lg text-sm transition-all hover:bg-[var(--bg2)]"
        style={{ color: 'var(--muted)' }}
      >
        换一篇
      </button>

      <p className="text-xs mt-4" style={{ color: 'var(--muted)' }}>随机回顾时光</p>

      <CitySilhouette />
    </div>
  );
}

export default RandomReview;
```

- [ ] **Step 3: 创建 StrollPage.jsx**

```jsx
import RandomReview from '../components/stroll/RandomReview';

function StrollPage() {
  return (
    <div className="animate-fade-in h-full flex flex-col">
      <RandomReview />
    </div>
  );
}

export default StrollPage;
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/StrollPage.jsx src/components/stroll/
git commit -m "feat: add stroll page with random review and city silhouette"
```

---

### Task 4.2: 统计页拆分

**Files:**
- Create: `src/pages/StatsPage.jsx`
- Create: `src/components/stats/StatsCards.jsx`
- Modify: `src/pages/SettingsPage.jsx`

- [ ] **Step 1: 创建 StatsCards.jsx**

```jsx
function StatsCards({ stats }) {
  const cards = [
    { label: '总记录', value: stats.total },
    { label: '记录天数', value: stats.days },
    { label: '连续天数', value: stats.streak },
    { label: '心情记录', value: stats.moods },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cards.map(card => (
        <div key={card.label} className="p-4 rounded-xl text-center" style={{ backgroundColor: 'var(--accent-light)' }}>
          <div className="text-xl font-semibold mb-1" style={{ color: 'var(--accent)' }}>{card.value}</div>
          <div className="text-xs" style={{ color: 'var(--muted)' }}>{card.label}</div>
        </div>
      ))}
    </div>
  );
}

export default StatsCards;
```

- [ ] **Step 2: 创建 StatsPage.jsx**

```jsx
import { useState, useEffect, useMemo } from 'react';
import { getAllRecords } from '../db/database';
import { calculateStreak } from '../utils/recordHelpers';
import StatsCards from '../components/stats/StatsCards';
import InsightSection from '../components/settings/InsightSection';
import YearInPixels from '../components/YearInPixels';
import AnnualReviewReport from '../components/AnnualReviewReport';

function StatsPage() {
  const [allRecords, setAllRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAnnualReview, setShowAnnualReview] = useState(false);

  useEffect(() => {
    const load = async () => {
      const records = await getAllRecords();
      setAllRecords(records);
      setLoading(false);
    };
    load();
  }, []);

  const stats = useMemo(() => {
    if (allRecords.length === 0) return { total: 0, days: 0, streak: 0, moods: 0 };
    const dates = new Set(allRecords.map(r => new Date(r.createdAt).toISOString().split('T')[0]));
    return {
      total: allRecords.length,
      days: dates.size,
      streak: calculateStreak(allRecords),
      moods: allRecords.filter(r => r.type === 'mood').length,
    };
  }, [allRecords]);

  if (loading) {
    return <div className="py-20 text-center"><div className="animate-spin w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full mx-auto" /></div>;
  }

  return (
    <div className="animate-fade-in space-y-6">
      <StatsCards stats={stats} />
      <InsightSection records={allRecords} />
      <YearInPixels records={allRecords} onDayClick={() => {}} />
      <button
        onClick={() => setShowAnnualReview(true)}
        className="w-full py-3 rounded-xl text-sm font-medium transition-all"
        style={{ backgroundColor: 'var(--accent)', color: 'white' }}
      >
        查看年度回顾
      </button>
      {showAnnualReview && (
        <AnnualReviewReport onClose={() => setShowAnnualReview(false)} />
      )}
    </div>
  );
}

export default StatsPage;
```

- [ ] **Step 3: 精简 SettingsPage.jsx**

从 `SettingsPage.jsx` 中移除统计卡、AI 洞察、年度像素图相关代码，只保留：
- 外观设置（主题色/字体/行距）
- AI 设置（`AISettingsPanel`）
- 隐私设置（`PrivacySettingsPanel`）
- 提醒设置（`ReminderSettingsPanel`）
- 数据管理（`DataManagementModal`）
- 分类管理（`CategoryManager`）
- 关于

- [ ] **Step 4: Commit**

```bash
git add src/pages/StatsPage.jsx src/components/stats/StatsCards.jsx src/pages/SettingsPage.jsx
git commit -m "feat: split stats from settings into dedicated StatsPage"
```

---

## Phase 5: 字体设置 + 主题色 + 草稿箱 + 模板（P2）

> **依赖：** Phase 1 + Phase 3 完成。

---

### Task 5.1: 字体设置与主题色

**Files:**
- Create: `src/components/settings/FontSettings.jsx`
- Create: `src/components/settings/AppearanceSettings.jsx`
- Modify: `src/index.css`
- Modify: `src/store/AppContext.jsx`

- [ ] **Step 1: 修改 index.css 增加主题色变量**

在 `src/index.css` 的 `:root` 和 `.dark` 中添加：

```css
:root {
  /* 现有变量保留 */
  
  /* 新增：主题色变量（默认蓝色） */
  --primary: #3B82F6;
  --primary-light: #DBEAFE;
  --primary-bg: #EFF6FF;
  
  /* 新增：字体变量 */
  --font-size-base: 16px;
  --line-height-base: 1.5;
}

/* 主题色方案 */
[data-theme="cyan"] {
  --primary: #14B8A6;
  --primary-light: #CCFBF1;
  --primary-bg: #F0FDFA;
}

[data-theme="pink"] {
  --primary: #F472B6;
  --primary-light: #FCE7F3;
  --primary-bg: #FDF2F8;
}

[data-theme="purple"] {
  --primary: #A78BFA;
  --primary-light: #EDE9FE;
  --primary-bg: #F5F3FF;
}

[data-theme="green"] {
  --primary: #22C55E;
  --primary-light: #DCFCE7;
  --primary-bg: #F0FDF4;
}
```

- [ ] **Step 2: 创建 FontSettings.jsx**

```jsx
import { useState, useEffect } from 'react';

function FontSettings() {
  const [fontSize, setFontSize] = useState('16');
  const [lineHeight, setLineHeight] = useState('1.5');

  useEffect(() => {
    const savedSize = localStorage.getItem('huiji-font-size') || '16';
    const savedHeight = localStorage.getItem('huiji-line-height') || '1.5';
    setFontSize(savedSize);
    setLineHeight(savedHeight);
    document.documentElement.style.setProperty('--font-size-base', `${savedSize}px`);
    document.documentElement.style.setProperty('--line-height-base', savedHeight);
  }, []);

  const handleSizeChange = (size) => {
    setFontSize(size);
    localStorage.setItem('huiji-font-size', size);
    document.documentElement.style.setProperty('--font-size-base', `${size}px`);
  };

  const handleHeightChange = (height) => {
    setLineHeight(height);
    localStorage.setItem('huiji-line-height', height);
    document.documentElement.style.setProperty('--line-height-base', height);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium block mb-2" style={{ color: 'var(--ink)' }}>字号</label>
        <div className="flex gap-2">
          {['14', '16', '18', '20'].map(size => (
            <button
              key={size}
              onClick={() => handleSizeChange(size)}
              className="flex-1 py-2 rounded-lg text-sm transition-all"
              style={{
                backgroundColor: fontSize === size ? 'var(--accent)' : 'var(--bg2)',
                color: fontSize === size ? 'white' : 'var(--ink)',
              }}
            >
              {size}px
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-sm font-medium block mb-2" style={{ color: 'var(--ink)' }}>行间距</label>
        <div className="flex gap-2">
          {['1.2', '1.5', '1.8', '2.0'].map(h => (
            <button
              key={h}
              onClick={() => handleHeightChange(h)}
              className="flex-1 py-2 rounded-lg text-sm transition-all"
              style={{
                backgroundColor: lineHeight === h ? 'var(--accent)' : 'var(--bg2)',
                color: lineHeight === h ? 'white' : 'var(--ink)',
              }}
            >
              {h}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default FontSettings;
```

- [ ] **Step 3: 创建 AppearanceSettings.jsx**

```jsx
import { useState, useEffect } from 'react';
import FontSettings from './FontSettings';

const THEMES = [
  { id: 'blue', name: '日系蓝', color: '#3B82F6' },
  { id: 'cyan', name: '清新青', color: '#14B8A6' },
  { id: 'pink', name: '温柔粉', color: '#F472B6' },
  { id: 'purple', name: '淡雅紫', color: '#A78BFA' },
  { id: 'green', name: '活力绿', color: '#22C55E' },
];

function AppearanceSettings() {
  const [activeTheme, setActiveTheme] = useState('blue');

  useEffect(() => {
    const saved = localStorage.getItem('huiji-theme-color') || 'blue';
    setActiveTheme(saved);
    document.documentElement.setAttribute('data-theme', saved);
  }, []);

  const handleThemeChange = (themeId) => {
    setActiveTheme(themeId);
    localStorage.setItem('huiji-theme-color', themeId);
    document.documentElement.setAttribute('data-theme', themeId);
  };

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--ink-strong)' }}>主题色</h4>
        <div className="flex gap-3">
          {THEMES.map(theme => (
            <button
              key={theme.id}
              onClick={() => handleThemeChange(theme.id)}
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all"
              style={{
                backgroundColor: activeTheme === theme.id ? theme.color + '20' : 'var(--bg2)',
                border: activeTheme === theme.id ? `2px solid ${theme.color}` : '2px solid transparent',
              }}
            >
              <div className="w-8 h-8 rounded-full" style={{ backgroundColor: theme.color }} />
              <span className="text-xs" style={{ color: activeTheme === theme.id ? theme.color : 'var(--muted)' }}>{theme.name}</span>
            </button>
          ))}
        </div>
      </div>
      <div>
        <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--ink-strong)' }}>字体设置</h4>
        <FontSettings />
      </div>
    </div>
  );
}

export default AppearanceSettings;
```

- [ ] **Step 4: 在 SettingsPage 中集成外观设置**

在 `SettingsPage.jsx` 的外观设置区域替换为：

```jsx
import AppearanceSettings from '../components/settings/AppearanceSettings';

// 替换原有的外观设置代码：
<div className="mb-6">
  <AppearanceSettings />
</div>
```

- [ ] **Step 5: Commit**

```bash
git add src/components/settings/FontSettings.jsx src/components/settings/AppearanceSettings.jsx src/index.css src/pages/SettingsPage.jsx
git commit -m "feat: add theme color switcher and font settings"
```

---

### Task 5.2: 草稿箱

**Files:**
- Modify: `src/components/editor/ImmersiveEditor.jsx`（自动保存到草稿）
- Create: `src/components/settings/DraftManager.jsx`（草稿管理 UI）

- [ ] **Step 1: 在沉浸编辑器中增加自动保存草稿**

在 `ImmersiveEditor.jsx` 中增加：

```jsx
import { saveDraft, deleteDraft } from '../../db/database';

// 新增 useEffect：每 30 秒自动保存草稿
useEffect(() => {
  const interval = setInterval(async () => {
    if (!content.trim()) return;
    await saveDraft({
      id: editRecord?.id ? `draft_${editRecord.id}` : `draft_new_${type}`,
      recordId: editRecord?.id || null,
      type,
      content: { title, content, weather, location, category },
      isAutoSave: true,
    });
  }, 30000);
  return () => clearInterval(interval);
}, [content, title, weather, location, category, type, editRecord]);

// 在 handleSave 成功后删除草稿
const handleSave = async () => {
  // ...保存逻辑
  await deleteDraft(editRecord?.id ? `draft_${editRecord.id}` : `draft_new_${type}`);
  // ...
};
```

- [ ] **Step 2: 创建 DraftManager.jsx**

```jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDrafts, deleteDraft } from '../../db/database';
import Icon from '../ui/Icon';

function DraftManager() {
  const navigate = useNavigate();
  const [drafts, setDrafts] = useState([]);

  useEffect(() => {
    loadDrafts();
  }, []);

  const loadDrafts = async () => {
    const list = await getDrafts();
    setDrafts(list);
  };

  const handleContinue = (draft) => {
    const params = new URLSearchParams();
    params.set('type', draft.type);
    if (draft.recordId) params.set('editId', draft.recordId);
    navigate(`/write?${params.toString()}`);
  };

  const handleDelete = async (id) => {
    if (!confirm('确定删除此草稿？')) return;
    await deleteDraft(id);
    loadDrafts();
  };

  return (
    <div>
      <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--ink-strong)' }}>草稿箱</h3>
      {drafts.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--muted)' }}>暂无草稿</p>
      ) : (
        <div className="space-y-2">
          {drafts.map(draft => (
            <div key={draft.id} className="flex items-center justify-between px-3 py-2.5 rounded-lg" style={{ backgroundColor: 'var(--bg2)' }}>
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate" style={{ color: 'var(--ink)' }}>
                  {draft.content?.title || draft.content?.content?.slice(0, 30) || '无标题草稿'}
                </p>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>
                  {new Date(draft.updatedAt).toLocaleString('zh-CN')} · 自动保存
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => handleContinue(draft)} className="p-1.5 rounded-lg hover:bg-[var(--bg)] transition-all" style={{ color: 'var(--accent)' }}>
                  <Icon name="edit" size={16} />
                </button>
                <button onClick={() => handleDelete(draft.id)} className="p-1.5 rounded-lg hover:bg-red-50 transition-all" style={{ color: 'var(--muted)' }}>
                  <Icon name="trash" size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default DraftManager;
```

- [ ] **Step 3: 在 SettingsPage 中增加草稿箱入口**

```jsx
import DraftManager from '../components/settings/DraftManager';

// 在设置页中添加：
<div className="mt-6">
  <DraftManager />
</div>
```

- [ ] **Step 4: Commit**

```bash
git add src/components/settings/DraftManager.jsx src/components/editor/ImmersiveEditor.jsx src/pages/SettingsPage.jsx
git commit -m "feat: add auto-save drafts and draft manager"
```

---

### Task 5.3: 日记模板

**Files:**
- Create: `src/components/editor/TemplatePicker.jsx`
- Modify: `src/components/editor/ImmersiveEditor.jsx`

- [ ] **Step 1: 创建 TemplatePicker.jsx**

```jsx
import { useState, useEffect } from 'react';
import { getTemplates, saveTemplate } from '../../db/database';
import Icon from '../ui/Icon';

const SYSTEM_TEMPLATES = [
  { id: 'tpl_daily', name: '今日日记', type: 'diary', title: '', content: '今天发生了什么有趣的事呢？\n\n我的感受是...\n\n明天想...' },
  { id: 'tpl_gratitude', name: '感恩三件事', type: 'note', title: '感恩三件事', content: '1. \n2. \n3. ' },
  { id: 'tpl_mood', name: '今日心情', type: 'mood', title: '', content: '' },
  { id: 'tpl_plan', name: '明日计划', type: 'memo', title: '明日计划', content: '- [ ] \n- [ ] \n- [ ] ' },
];

function TemplatePicker({ type, onSelect, onClose }) {
  const [templates, setTemplates] = useState([]);

  useEffect(() => {
    const load = async () => {
      const userTemplates = await getTemplates(type);
      setTemplates([...SYSTEM_TEMPLATES.filter(t => t.type === type), ...userTemplates]);
    };
    load();
  }, [type]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center animate-fade-in" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div className="w-full max-w-sm mx-4 rounded-xl p-5 animate-slide-up" style={{ backgroundColor: 'var(--bg)' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold" style={{ color: 'var(--ink-strong)' }}>选择模板</h3>
          <button onClick={onClose} className="p-1 rounded-lg" style={{ color: 'var(--muted)' }}>
            <Icon name="close" size={20} />
          </button>
        </div>
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {templates.map(tpl => (
            <button
              key={tpl.id}
              onClick={() => { onSelect(tpl); onClose(); }}
              className="w-full text-left px-4 py-3 rounded-lg transition-all hover:bg-[var(--bg2)]"
              style={{ border: '1px solid var(--rule)' }}
            >
              <p className="text-sm font-medium" style={{ color: 'var(--ink)' }}>{tpl.name}</p>
              <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--muted)' }}>{tpl.content?.slice(0, 50) || '空白模板'}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default TemplatePicker;
```

- [ ] **Step 2: 在沉浸编辑器中集成模板选择**

在 `ImmersiveEditor.jsx` 中：

```jsx
import TemplatePicker from './TemplatePicker';

// 新增 state
const [showTemplatePicker, setShowTemplatePicker] = useState(false);

// 在顶部栏中添加模板按钮
<button
  onClick={() => setShowTemplatePicker(true)}
  className="text-sm transition-colors hover:text-[var(--accent)]"
  style={{ color: 'var(--muted)' }}
>
  模板
</button>

// 在 JSX 底部添加弹窗
{showTemplatePicker && (
  <TemplatePicker
    type={type}
    onSelect={(tpl) => {
      setTitle(tpl.title);
      setContent(tpl.content);
    }}
    onClose={() => setShowTemplatePicker(false)}
  />
)}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/editor/TemplatePicker.jsx src/components/editor/ImmersiveEditor.jsx
git commit -m "feat: add diary template picker with system templates"
```

---

## Phase 6: 手机端优化 + 清理收尾（P3）

> **依赖：** Phase 1-5 完成。

---

### Task 6.1: 手机端悬浮按钮 + 编辑器适配

**Files:**
- Create: `src/components/ui/FloatingActionButton.jsx`
- Modify: `src/App.jsx`（手机端添加悬浮按钮）
- Modify: `src/components/editor/ImmersiveEditor.jsx`（手机端适配）

- [ ] **Step 1: 创建 FloatingActionButton.jsx**

```jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from './Icon';

function FloatingActionButton() {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

  const actions = [
    { type: 'note', label: '随笔', icon: 'note', color: '#3B82F6' },
    { type: 'mood', label: '心情', icon: 'mood', color: '#F59E0B' },
    { type: 'memo', label: '备忘', icon: 'memo', color: '#10B981' },
    { type: 'diary', label: '日记', icon: 'diary', color: '#8B5CF6' },
  ];

  return (
    <div className="fixed bottom-20 right-4 z-50 flex flex-col items-end gap-2">
      {expanded && actions.map(action => (
        <button
          key={action.type}
          onClick={() => { navigate(`/write?type=${action.type}`); setExpanded(false); }}
          className="flex items-center gap-2 px-3 py-2 rounded-full text-sm text-white shadow-lg animate-slide-up"
          style={{ backgroundColor: action.color }}
        >
          <Icon name={action.icon} size={16} />
          <span>{action.label}</span>
        </button>
      ))}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all"
        style={{ backgroundColor: 'var(--accent)', color: 'white' }}
      >
        <Icon name={expanded ? 'close' : 'plus'} size={24} strokeWidth={2} />
      </button>
    </div>
  );
}

export default FloatingActionButton;
```

- [ ] **Step 2: 在 App.jsx 手机端添加悬浮按钮**

```jsx
import FloatingActionButton from './components/ui/FloatingActionButton';

// 在移动端布局中添加：
<div className="md:hidden">
  <FloatingActionButton />
</div>
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/FloatingActionButton.jsx src/App.jsx
git commit -m "feat: add mobile floating action button with quick create"
```

---

### Task 6.2: 最终清理与验证

- [ ] **Step 1: 全局搜索移除未使用的标签相关代码**

搜索并清理：
- `tags` 相关导入（不再使用的 `PRESET_TAGS`、`getTagColor` 等）
- `searchTag` 状态（`TimelinePage.jsx`）
- 确保无编译警告

- [ ] **Step 2: 运行构建验证**

```bash
cd d:\编程\慧记\huiji
npm run build
```
Expected: 构建成功，无错误。

- [ ] **Step 3: 端到端功能验证清单**

| 检查项 | 桌面端 | 手机端 |
|:---|:---|:---|
| 日记流主页显示卡片 | ✓ | ✓ |
| 分类标签可筛选 | ✓ | ✓ |
| 沉浸编辑器可切换 | ✓ | ✓ |
| 模板选择可用 | ✓ | ✓ |
| 分类管理可增删 | ✓ | ✓ |
| 漫步页随机回顾 | ✓ | ✓ |
| 统计页独立显示 | ✓ | ✓ |
| 主题色切换生效 | ✓ | ✓ |
| 字体大小调整生效 | ✓ | ✓ |
| 草稿自动保存 | ✓ | ✓ |
| 三栏布局正确 | ✓ | N/A |
| 底部 Tab 导航 | N/A | ✓ |
| 悬浮按钮可用 | N/A | ✓ |

- [ ] **Step 4: 最终 Commit**

```bash
git add .
git commit -m "feat: complete huiji v1.0 reconstruction - 3-column layout, diary stream, immersive editor, categories, stroll, themes, drafts, templates"
```

---

## 附录：常见问题

### Q1: 构建失败 "Cannot find module 'xxx'"
确保所有新创建的文件路径正确，且 import 路径使用相对路径（如 `../../db/database`）。

### Q2: Dexie schema 升级后数据丢失
Dexie.js 的 schema 升级不会删除数据，只会新增表和索引。如果出现问题，检查浏览器 DevTools → Application → IndexedDB 确认数据存在。

### Q3: 主题色切换不生效
检查 `index.css` 中的 `[data-theme]` 选择器是否正确，且 `document.documentElement.setAttribute('data-theme', ...)` 被正确调用。

### Q4: 三栏布局在某些页面异常
`RightPanel.jsx` 中 `hideRightPanel` 逻辑确保 `/settings` 和 `/write` 页面不显示右侧面板。

---

*计划版本：v1.0*
*日期：2026-07-03*
*对应设计文档：`docs/superpowers/specs/2026-07-03-huiji-reconstruct-design.md`*
