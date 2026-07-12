import { EMOTIONS } from '../constants/emotions'

const TYPE_KEYWORDS = {
  memo: {
    keywords: ['备忘', '待办', '任务', '提醒', 'todo'],
    priority: 3,
  },
  diary: {
    keywords: ['日记'],
    priority: 2,
  },
  mood: {
    keywords: ['心情', '情绪'],
    priority: 3,
  },
  note: {
    keywords: ['随笔'],
    priority: 2,
  },
}

const EXPLICIT_TYPE_PATTERNS = [
  { pattern: /记到(随笔|备忘|日记|心情)(里面|里边|里)/, typeMap: { '随笔': 'note', '备忘': 'memo', '日记': 'diary', '心情': 'mood' } },
  { pattern: /记在(随笔|备忘|日记|心情)(里面|里边|里)/, typeMap: { '随笔': 'note', '备忘': 'memo', '日记': 'diary', '心情': 'mood' } },
  { pattern: /写到(随笔|备忘|日记|心情)(里面|里边|里)/, typeMap: { '随笔': 'note', '备忘': 'memo', '日记': 'diary', '心情': 'mood' } },
  { pattern: /写在(随笔|备忘|日记|心情)(里面|里边|里)/, typeMap: { '随笔': 'note', '备忘': 'memo', '日记': 'diary', '心情': 'mood' } },
  { pattern: /加到(随笔|备忘|日记|心情)(里面|里边|里)/, typeMap: { '随笔': 'note', '备忘': 'memo', '日记': 'diary', '心情': 'mood' } },
  { pattern: /加在(随笔|备忘|日记|心情)(里面|里边|里)/, typeMap: { '随笔': 'note', '备忘': 'memo', '日记': 'diary', '心情': 'mood' } },
  { pattern: /添加到(随笔|备忘|日记|心情)(里面|里边|里)/, typeMap: { '随笔': 'note', '备忘': 'memo', '日记': 'diary', '心情': 'mood' } },
  { pattern: /记录到(随笔|备忘|日记|心情)(里面|里边|里)/, typeMap: { '随笔': 'note', '备忘': 'memo', '日记': 'diary', '心情': 'mood' } },
  { pattern: /(随笔|备忘|日记|心情)[:：]/, typeMap: { '随笔': 'note', '备忘': 'memo', '日记': 'diary', '心情': 'mood' } },
  { pattern: /写(一篇|个|篇)(随笔|日记|备忘|心情)/, typeMap: { '随笔': 'note', '备忘': 'memo', '日记': 'diary', '心情': 'mood' } },
  { pattern: /记(一篇|个|条|一下)(随笔|日记|备忘|心情)/, typeMap: { '随笔': 'note', '备忘': 'memo', '日记': 'diary', '心情': 'mood' } },
]

const EMOTION_MAP = {
  '烦': '烦躁', '烦躁': '烦躁', '烦人': '烦躁', '郁闷': '烦躁',
  '累': '疲惫', '疲惫': '疲惫', '困': '疲惫',
  '开心': '开心', '高兴': '开心', '快乐': '开心', '愉快': '开心', '幸福': '开心', '不错': '开心',
  '难过': '难过', '伤心': '难过', '悲伤': '难过', '沮丧': '难过', '失落': '难过',
  '生气': '生气', '愤怒': '生气', '气死': '生气', '恼火': '生气',
  '焦虑': '焦虑', '担心': '焦虑', '紧张': '焦虑', '不安': '焦虑', '着急': '焦虑',
  '兴奋': '兴奋', '激动': '兴奋',
  '平静': '平静', '淡定': '平静', '舒服': '平静', '放松': '平静',
  '感动': '感动', '想哭': '感动', '暖心': '感动',
}

const HELP_KEYWORDS = ['怎么', '如何', '哪里', '在哪里', '帮助', '教程', '使用', '功能', '在哪']

const DETAIL_KEYWORDS = ['备注', '详细', '详细记录', '说说']

const INSTRUCTION_PREFIXES = [
  '帮我写', '帮我记录', '帮我记', '帮我添加', '帮我加',
  '写一个', '写一下', '写个',
  '记录一下', '记一下', '记个', '记录个',
  '添加一个', '添加一下', '加个', '加一下',
  '创建一个', '新建一个',
  '记到', '记在', '写到', '写在', '加到', '加在',
  '我要', '我想', '我需要',
]

export function parseIntent(text) {
  const originalText = text.trim()

  let intent = 'chat'
  let recordType = null
  let content = originalText
  let title = ''
  let emotion = ''
  let isDetailed = false
  let confidence = 0.3

  if (HELP_KEYWORDS.some(kw => originalText.includes(kw))) {
    intent = 'help'
    confidence = 0.85
    return { intent, recordType, content: originalText, title, emotion, isDetailed, confidence }
  }

  const detectedType = detectRecordType(originalText)
  const detectedEmotion = detectEmotion(originalText)

  if (detectedType) {
    recordType = detectedType
    intent = `create_${detectedType}`
    confidence = 0.75

    if (detectedType === 'mood') {
      emotion = detectedEmotion
      isDetailed = DETAIL_KEYWORDS.some(kw => originalText.includes(kw))
    }
  } else if (detectedEmotion !== '平静') {
    recordType = 'mood'
    intent = 'create_mood'
    emotion = detectedEmotion
    isDetailed = DETAIL_KEYWORDS.some(kw => originalText.includes(kw))
    confidence = 0.65
  }

  content = extractCoreContent(originalText, detectedType)

  if (recordType === 'mood' && emotion === '平静') {
    const textEmotion = detectEmotion(originalText)
    if (textEmotion !== '平静') {
      emotion = textEmotion
    }
  }

  const titleResult = extractTitle(content)
  if (titleResult.title) {
    title = titleResult.title
    content = titleResult.remaining
  }

  content = cleanContent(content)

  if (!content || content.length === 0) {
    if (recordType === 'mood' && emotion) {
      content = emotion
    } else {
      content = originalText
    }
  }

  return { intent, recordType, content, title, emotion, isDetailed, confidence }
}

function detectRecordType(text) {
  for (const { pattern, typeMap } of EXPLICIT_TYPE_PATTERNS) {
    const match = text.match(pattern)
    if (match) {
      const typeName = match[1]
      if (typeMap[typeName]) {
        return typeMap[typeName]
      }
    }
  }

  let bestMatch = null
  let bestPriority = Infinity

  for (const [type, config] of Object.entries(TYPE_KEYWORDS)) {
    if (config.keywords.some(kw => text.includes(kw))) {
      if (config.priority < bestPriority) {
        bestPriority = config.priority
        bestMatch = type
      }
    }
  }

  return bestMatch
}

function extractCoreContent(text, type) {
  let result = text

  for (const { pattern } of EXPLICIT_TYPE_PATTERNS) {
    result = result.replace(pattern, '')
  }

  for (const prefix of INSTRUCTION_PREFIXES) {
    while (result.includes(prefix)) {
      result = result.replace(prefix, '')
    }
  }

  const allTypeKeywords = []
  for (const config of Object.values(TYPE_KEYWORDS)) {
    allTypeKeywords.push(...config.keywords)
  }

  for (const kw of allTypeKeywords) {
    result = result.replace(new RegExp(kw, 'g'), '')
  }

  // 清理 DETAIL_KEYWORDS（备注/详细/说说等）及其前面的连接词
  for (const kw of DETAIL_KEYWORDS) {
    result = result.replace(new RegExp(`[，,和与跟]\\s*${kw}`, 'g'), '')
    result = result.replace(new RegExp(kw, 'g'), '')
  }

  result = result.replace(/(里面|里边|里|一下|个|吧|哦|呢|啊|的|啦|呀|和|与|跟)\s*$/g, '')
  result = result.replace(/^[，,。！？、\s]+/, '')
  result = result.replace(/[，,。！？、\s]+$/, '')

  return result.trim()
}

function extractTitle(text) {
  const titlePatterns = [
    /标题[：:]\s*([^。，！？\n]+)/,
    /主题[：:]\s*([^。，！？\n]+)/,
    /名字叫[：:]\s*([^。，！？\n]+)/,
  ]

  for (const pattern of titlePatterns) {
    const match = text.match(pattern)
    if (match) {
      const title = match[1].trim()
      const remaining = text.replace(match[0], '').trim()
      return { title, remaining }
    }
  }

  return { title: '', remaining: text }
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

function cleanContent(text) {
  if (!text) return ''

  text = text.replace(/[\s\n]+/g, ' ')
  text = text.replace(/^[的\s]+/, '')
  text = text.replace(/[\s的]+$/, '')

  return text.trim()
}
