# 助手悬浮窗重构实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 重构悬浮窗为单一助手入口，支持智能识别用户意图创建记录和回答软件使用问题

**Architecture:** 基于现有XiaohuiFab组件重构，移除模式切换，添加意图识别逻辑（AI语义理解 + 关键词匹配降级），实现记录创建和FAQ问答功能

**Tech Stack:** React, Tailwind CSS, Dexie (IndexedDB), AI API

---

## 文件结构

### 修改文件
1. `src/components/XiaohuiFab.jsx` - 重构聊天窗口，移除模式切换，添加意图识别和记录创建功能
2. `src/hooks/useAI.js` - 添加助手专用的意图识别API调用

### 新创建文件
1. `src/utils/intentParser.js` - 关键词匹配意图解析器
2. `src/utils/helpFAQ.js` - 软件帮助预设问答数据

---

## Task 1: 创建意图解析器

**Files:**
- Create: `src/utils/intentParser.js`

- [ ] **Step 1: 创建关键词匹配意图解析器**

```javascript
import { EMOTIONS } from '../constants/emotions'

const MEMO_KEYWORDS = ['备忘', '待办', '任务', '提醒', '需要做', '要做', '记得']
const NOTE_KEYWORDS = ['随笔', '记录', '写点', '想法', '感受', '思考']
const DIARY_KEYWORDS = ['日记', '今天', '今日', '这一天', '一天']
const MOOD_KEYWORDS = ['心情', '情绪', '感觉', '累', '烦', '开心', '难过', '生气', '焦虑', '郁闷', '沮丧', '兴奋', '平静']
const HELP_KEYWORDS = ['怎么', '如何', '哪里', '帮助', '使用', '教程', '请问', '在哪里']

const DETAIL_KEYWORDS = ['备注', '详细', '记录一下', '说说', '写下来']
const TITLE_KEYWORDS = ['标题', '主题']

const EMOTION_MAP = {
  '累': '疲惫',
  '烦': '烦躁',
  '开心': '开心',
  '难过': '难过',
  '生气': '生气',
  '焦虑': '焦虑',
  '郁闷': '烦躁',
  '沮丧': '难过',
  '兴奋': '兴奋',
  '平静': '平静',
  '伤心': '难过',
  '悲伤': '难过',
  '愤怒': '生气',
  '快乐': '开心',
  '高兴': '开心',
}

export function parseIntent(text) {
  const lowerText = text.toLowerCase()
  const originalText = text
  
  let intent = 'chat'
  let recordType = null
  let content = text
  let title = ''
  let emotion = ''
  let isDetailed = false
  let confidence = 0.3

  if (HELP_KEYWORDS.some(kw => text.includes(kw))) {
    intent = 'help'
    confidence = 0.8
    return { intent, recordType, content, title, emotion, isDetailed, confidence }
  }

  let memoMatch = MEMO_KEYWORDS.some(kw => text.includes(kw))
  let noteMatch = NOTE_KEYWORDS.some(kw => text.includes(kw))
  let diaryMatch = DIARY_KEYWORDS.some(kw => text.includes(kw))
  let moodMatch = MOOD_KEYWORDS.some(kw => text.includes(kw))

  if (memoMatch) {
    intent = 'create_memo'
    recordType = 'memo'
    content = extractContent(text, MEMO_KEYWORDS)
    confidence = 0.7
  } else if (diaryMatch) {
    intent = 'create_diary'
    recordType = 'diary'
    content = extractContent(text, DIARY_KEYWORDS)
    confidence = 0.7
  } else if (moodMatch) {
    intent = 'create_mood'
    recordType = 'mood'
    content = extractContent(text, MOOD_KEYWORDS)
    emotion = detectEmotion(text)
    isDetailed = DETAIL_KEYWORDS.some(kw => text.includes(kw))
    confidence = 0.6
  } else if (noteMatch) {
    intent = 'create_note'
    recordType = 'note'
    content = extractContent(text, NOTE_KEYWORDS)
    confidence = 0.6
  }

  if (TITLE_KEYWORDS.some(kw => text.includes(kw))) {
    const titleMatch = text.match(/(标题|主题)[：:]\s*([^。，！？\n]+)/)
    if (titleMatch) {
      title = titleMatch[2].trim()
      content = text.replace(titleMatch[0], '').trim()
    }
  }

  content = content.trim()
  if (!content) content = originalText

  return { intent, recordType, content, title, emotion, isDetailed, confidence }
}

function extractContent(text, keywords) {
  let result = text
  keywords.forEach(kw => {
    result = result.replace(new RegExp(kw, 'gi'), '').trim()
  })
  result = result.replace(/^(帮我|帮|写一个|写|加到|记录|记一下)\s*/, '').trim()
  result = result.replace(/(里面|里)$/, '').trim()
  return result
}

function detectEmotion(text) {
  for (const [keyword, emotionName] of Object.entries(EMOTION_MAP)) {
    if (text.includes(keyword)) {
      return emotionName
    }
  }
  for (const emotion of EMOTIONS) {
    if (text.includes(emotion.name)) {
      return emotion.name
    }
  }
  return '平静'
}
```

- [ ] **Step 2: 验证文件创建成功**

Run: `ls -la src/utils/intentParser.js`
Expected: 文件存在

- [ ] **Step 3: Commit**

```bash
git add src/utils/intentParser.js
git commit -m "feat: 添加意图解析器，支持关键词匹配"
```

---

## Task 2: 创建帮助FAQ数据

**Files:**
- Create: `src/utils/helpFAQ.js`

- [ ] **Step 1: 创建FAQ数据文件**

```javascript
const FAQ_MAP = [
  {
    keywords: ['历史记录', '历史', '记录在哪里', '查看记录', '所有记录'],
    answer: '去回忆页面查看所有历史记录，里面按时间顺序展示了你的所有随笔、日记、心情和备忘。'
  },
  {
    keywords: ['添加标题', '标题', '怎么加标题', '设置标题'],
    answer: '在编写页面顶部有一个"添加标题（可选）"输入框，你可以在那里输入标题。如果不添加，系统会自动截取内容前50字作为标题。'
  },
  {
    keywords: ['删除记录', '删除', '怎么删除', '移除记录'],
    answer: '在回忆页面点击记录卡片打开详情弹窗，在弹窗底部可以找到删除按钮。请注意，删除后无法恢复哦~'
  },
  {
    keywords: ['分享记录', '分享', '怎么分享', '分享卡片'],
    answer: '在记录详情弹窗中点击分享按钮，系统会生成一张精美的分享卡片，你可以保存图片后分享给朋友。'
  },
  {
    keywords: ['切换主题', '主题', '深色模式', '浅色模式'],
    answer: '在设置页面可以切换深色/浅色主题，点击左侧导航栏的设置图标即可进入。'
  },
  {
    keywords: ['添加标签', '标签', '怎么加标签', '标签怎么弄'],
    answer: '在编写页面底部输入标签，多个标签用逗号分隔，例如：工作,心情。标签可以帮助你更好地分类和搜索记录。'
  },
  {
    keywords: ['心情记录', '心情在哪里', '查看心情', '情绪记录'],
    answer: '在回忆页面或日历页面可以查看心情记录，日历页面还可以看到心情趋势图。'
  },
  {
    keywords: ['备忘', '待办', '任务', '提醒'],
    answer: '备忘功能可以帮你记录待办事项。在编写页面选择"备忘"类型，输入内容即可。完成后可以标记为已完成。'
  },
  {
    keywords: ['随笔', '随笔是什么', '什么是随笔'],
    answer: '随笔是一种自由的记录方式，可以记录你的想法、感受、灵感等。没有固定格式，想到什么写什么~'
  },
  {
    keywords: ['日记', '日记是什么', '什么是日记'],
    answer: '日记功能可以记录你每一天的生活。选择"日记"类型，你还可以添加天气、地点等信息，让记录更加丰富。'
  },
  {
    keywords: ['日历', '日历页面', '查看日历'],
    answer: '点击左侧导航栏的日历图标进入日历页面，可以按日期查看记录，还能看到心情趋势和统计信息。'
  },
  {
    keywords: ['统计', '统计页面', '数据统计'],
    answer: '点击左侧导航栏的统计图标进入统计页面，可以查看你的记录统计、心情分布等数据可视化内容。'
  },
]

export function findAnswer(question) {
  for (const faq of FAQ_MAP) {
    if (faq.keywords.some(kw => question.includes(kw))) {
      return faq.answer
    }
  }
  return null
}

export function getSuggestions() {
  return [
    '帮我写一个背单词的备忘',
    '我现在好烦，加到随笔里面',
    '今天去了公园，很开心',
    '在哪里查看历史记录',
    '如何添加标题',
  ]
}
```

- [ ] **Step 2: 验证文件创建成功**

Run: `ls -la src/utils/helpFAQ.js`
Expected: 文件存在

- [ ] **Step 3: Commit**

```bash
git add src/utils/helpFAQ.js
git commit -m "feat: 添加软件帮助FAQ数据"
```

---

## Task 3: 修改AI钩子添加意图识别API

**Files:**
- Modify: `src/hooks/useAI.js`

- [ ] **Step 1: 查看useAI.js文件结构**

Run: `cat src/hooks/useAI.js | head -50`
Expected: 查看文件开头结构

- [ ] **Step 2: 添加意图识别方法**

```javascript
export function useAI() {
  // ... 现有代码 ...

  const analyzeIntent = useCallback(async (text) => {
    if (!isEnabled.value) {
      throw new Error('AI not enabled')
    }

    const prompt = `你是一个笔记应用"慧记"的智能助手，负责帮用户创建记录和回答使用问题。

用户输入可能包含以下意图：
1. 创建备忘：包含"备忘"、"待办"等词
2. 创建随笔：包含"随笔"、"记录"等词
3. 创建日记：包含"日记"、"今天"等词
4. 创建心情：包含情绪词（累、烦、开心、难过等）
5. 软件帮助：包含"怎么"、"如何"、"哪里"等词
6. 闲聊：其他内容

请严格返回JSON格式，不要包含其他文字：
{
  "intent": "create_note|create_memo|create_diary|create_mood|help|chat",
  "recordType": "note|memo|diary|mood|null",
  "content": "提取的内容（去掉关键词）",
  "title": "标题（可选，没有则为空字符串）",
  "emotion": "情绪名称（心情类型，如：开心、难过、累等）",
  "isDetailed": true|false,
  "confidence": 0-1
}

用户输入：${text}`

    const result = await fetchAI(prompt)
    try {
      const jsonStr = result.content.match(/\{[\s\S]*\}/)?.[0]
      if (jsonStr) {
        return JSON.parse(jsonStr)
      }
    } catch (e) {
      console.error('Failed to parse intent:', e)
    }
    return null
  }, [isEnabled])

  return {
    // ... 现有返回值 ...
    analyzeIntent,
  }
}
```

- [ ] **Step 3: 验证修改成功**

Run: `cat src/hooks/useAI.js | grep -A 5 "analyzeIntent"`
Expected: 看到analyzeIntent函数定义

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useAI.js
git commit -m "feat: 添加AI意图识别方法"
```

---

## Task 4: 重构悬浮窗聊天组件 - 界面部分

**Files:**
- Modify: `src/components/XiaohuiFab.jsx`

- [ ] **Step 1: 修改头部标题为"助手"**

```javascript
// 将
<h3 className="font-bold text-sm" style={{ color: 'var(--ink)' }}>
  小慧 · {XIAOHUI_MODES[mode].name}
</h3>
<p className="text-xs" style={{ color: 'var(--muted)' }}>
  {mode === 'assistant' && '帮你分析日记、搜索记录'}
  {mode === 'mailbox' && '写信倾诉，我会认真回复'}
  {mode === 'treehole' && '匿名倾诉，只有你我知道'}
</p>

// 修改为
<h3 className="font-bold text-sm" style={{ color: 'var(--ink)' }}>
  助手
</h3>
<p className="text-xs" style={{ color: 'var(--muted)' }}>
  帮你创建记录，解答使用问题
</p>
```

- [ ] **Step 2: 移除模式切换栏**

删除以下代码块：
```javascript
<div className="flex px-4 py-2 border-b no-drag" style={{ borderColor: 'var(--rule)', backgroundColor: 'var(--bg)' }}>
  <div className="huiji-segmented w-full">
    {Object.entries(XIAOHUI_MODES).map(([key, val]) => (
      <button
        key={key}
        onClick={() => {
          setMode(key)
          setShowHistory(false)
        }}
        className={`flex-1 ${mode === key ? 'active' : ''}`}
      >
        <Icon name={MODE_ICONS[key]} size={14} color={mode === key ? 'var(--accent)' : 'var(--muted)'} strokeWidth={1.5} />
        {val.name}
      </button>
    ))}
  </div>
</div>
```

- [ ] **Step 3: 移除历史对话按钮和相关功能**

删除历史对话相关的按钮和状态管理代码。

- [ ] **Step 4: 更新欢迎消息**

将欢迎消息改为：
```javascript
'你好！我是慧记助手，可以帮你创建记录或解答问题。试试说"帮我写一个背单词的备忘"~'
```

- [ ] **Step 5: 更新快捷提问**

将快捷提问改为：
```javascript
['帮我写一个背单词的备忘', '我现在好烦，加到随笔里面', '今天去了公园，很开心', '在哪里查看历史记录']
```

- [ ] **Step 6: Commit**

```bash
git add src/components/XiaohuiFab.jsx
git commit -m "feat: 重构悬浮窗界面，移除模式切换，改为单一助手入口"
```

---

## Task 5: 重构悬浮窗聊天组件 - 意图识别和记录创建逻辑

**Files:**
- Modify: `src/components/XiaohuiFab.jsx`

- [ ] **Step 1: 添加导入**

```javascript
import { parseIntent } from '../utils/intentParser'
import { findAnswer, getSuggestions } from '../utils/helpFAQ'
import { saveRecord } from '../db/database'
import { EMOTIONS } from '../constants/emotions'
```

- [ ] **Step 2: 修改handleSend函数实现意图识别和记录创建**

```javascript
const handleSend = async () => {
  if (!input.trim() || loading) return

  const userText = input.trim()
  const userMsg = {
    id: Date.now(),
    isUser: true,
    content: userText,
  }
  setMessages(prev => [...prev, userMsg])
  setInput('')
  setLoading(true)

  try {
    let intentResult = null
    
    if (aiStatus?.enabled) {
      try {
        intentResult = await analyzeIntent(userText)
      } catch (e) {
        console.warn('AI intent analysis failed, falling back to keyword matching')
      }
    }

    if (!intentResult || intentResult.confidence < 0.5) {
      intentResult = parseIntent(userText)
    }

    const { intent, recordType, content, title, emotion, isDetailed } = intentResult

    if (intent === 'help') {
      const answer = findAnswer(userText)
      if (answer) {
        const aiMsg = {
          id: Date.now() + 1,
          isUser: false,
          content: answer + '\n\n还有其他问题吗？',
        }
        setMessages(prev => [...prev, aiMsg])
      } else {
        const aiMsg = {
          id: Date.now() + 1,
          isUser: false,
          content: '抱歉，我不太明白你的问题。你可以试试问：\n- 在哪里查看历史记录\n- 如何添加标题\n- 怎么删除记录',
        }
        setMessages(prev => [...prev, aiMsg])
      }
    } else if (intent.startsWith('create_')) {
      await createRecord(recordType, content, title, emotion, isDetailed)
    } else {
      if (aiStatus?.enabled) {
        const result = await chatWithXiaohui(userText, 'assistant', [])
        const aiMsg = {
          id: Date.now() + 1,
          isUser: false,
          content: result.content,
        }
        setMessages(prev => [...prev, aiMsg])
      } else {
        const aiMsg = {
          id: Date.now() + 1,
          isUser: false,
          content: '我不太明白，你可以试试说：\n- 帮我写一个背单词的备忘\n- 我现在好烦，加到随笔里面\n- 在哪里查看历史记录',
        }
        setMessages(prev => [...prev, aiMsg])
      }
    }
  } catch (err) {
    const errorMsg = {
      id: Date.now() + 1,
      isUser: false,
      content: '抱歉，遇到问题，请稍后再试',
    }
    setMessages(prev => [...prev, errorMsg])
  }
  
  setLoading(false)
}
```

- [ ] **Step 3: 添加createRecord函数**

```javascript
const createRecord = async (type, content, title = '', emotion = '', isDetailed = false) => {
  const timestamp = Date.now()
  let record = {
    id: `${type}_${timestamp}`,
    type,
    content,
    title: title || '',
    tags: [],
  }

  if (type === 'memo') {
    record.completed = false
  }

  if (type === 'mood') {
    const matchedEmotion = EMOTIONS.find(e => e.name === emotion) || EMOTIONS.find(e => e.name === '平静')
    record.emotions = [matchedEmotion?.name || '平静']
    record.intensity = 3
    if (isDetailed && content) {
      record.content = content
    } else {
      record.content = ''
    }
  }

  try {
    await saveRecord(record)
    
    const successMessages = {
      memo: '备忘已添加！还有什么需要帮助的？',
      note: '随笔已记录！还需要我做什么吗？',
      diary: '日记已保存！今天过得怎么样？',
      mood: '心情已记录！照顾好自己哦~',
    }
    
    const aiMsg = {
      id: Date.now() + 1,
      isUser: false,
      content: successMessages[type] || '记录已添加！',
    }
    setMessages(prev => [...prev, aiMsg])
  } catch (e) {
    console.error('Failed to create record:', e)
    const errorMsg = {
      id: Date.now() + 1,
      isUser: false,
      content: '抱歉，创建失败，请重试',
    }
    setMessages(prev => [...prev, errorMsg])
  }
}
```

- [ ] **Step 4: 更新加载状态文本**

```javascript
const getLoadingText = () => {
  return '正在思考...'
}
```

- [ ] **Step 5: 更新AI状态显示**

```javascript
{aiStatus && aiStatus.enabled && (
  <div className="flex items-center gap-1 mt-1">
    <span 
      className="text-xs px-1.5 py-0.5 rounded font-medium"
      style={{ 
        backgroundColor: aiStatus.level === 1 
          ? 'rgba(16, 185, 129, 0.2)' 
          : aiStatus.level === 2 
            ? 'var(--accent-light)' 
            : 'rgba(245, 158, 11, 0.2)',
        color: aiStatus.level === 1 
          ? '#10b981' 
          : aiStatus.level === 2 
            ? '#3b82f6' 
            : '#f59e0b',
      }}
    >
      L{aiStatus.level}
    </span>
    {aiStatus.level === 2 && (
      <span className="text-xs" style={{ color: 'var(--muted)' }}>
        剩余 {aiStatus.dailyRemaining} 次
      </span>
    )}
  </div>
)}
```

- [ ] **Step 6: Commit**

```bash
git add src/components/XiaohuiFab.jsx
git commit -m "feat: 添加意图识别和记录创建功能"
```

---

## Task 6: 测试和验证

**Files:**
- Test: `src/components/XiaohuiFab.jsx`

- [ ] **Step 1: 启动开发服务器**

Run: `npm run dev`
Expected: 服务器正常启动

- [ ] **Step 2: 测试创建备忘**

在悬浮窗中输入："帮我写一个背单词的备忘"
Expected: 创建备忘记录，显示"备忘已添加！还有什么需要帮助的？"

- [ ] **Step 3: 测试创建随笔**

在悬浮窗中输入："我现在好烦，加到随笔里面"
Expected: 创建随笔记录，显示"随笔已记录！还需要我做什么吗？"

- [ ] **Step 4: 测试创建日记**

在悬浮窗中输入："今天去了公园，很开心"
Expected: 创建日记记录，显示"日记已保存！今天过得怎么样？"

- [ ] **Step 5: 测试创建心情（快速）**

在悬浮窗中输入："我现在很累"
Expected: 创建心情记录（情绪：疲惫），显示"心情已记录！照顾好自己哦~"

- [ ] **Step 6: 测试软件帮助**

在悬浮窗中输入："在哪里查看历史记录"
Expected: 回答FAQ中对应的内容

- [ ] **Step 7: 测试闲聊（AI可用时）**

在悬浮窗中输入："你好"
Expected: AI回复问候语

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "test: 验证助手悬浮窗功能正常"
```

---

## Self-Review

### 1. Spec coverage
- ✅ 简化界面：移除模式切换，改为单一助手入口
- ✅ 智能识别：根据AI等级自动选择语义理解或关键词匹配
- ✅ 创建记录：支持通过自然语言创建备忘、随笔、日记、心情记录
- ✅ 软件帮助：回答软件使用问题
- ✅ 用户反馈：提供友好的操作反馈和引导

### 2. Placeholder scan
- No placeholders found

### 3. Type consistency
- 类型和方法签名一致

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-07-08-helper-fab.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?"