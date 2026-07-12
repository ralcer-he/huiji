const EASTER_EGG_USERS = [
  {
    name: '周文烯',
    nicknames: ['文烯', '烯烯', '烯宝', '小烯', 'wency', 'Wency'],
    gender: 'female',
    greetings: [
      '好久不见，文烯～',
      '文烯，今天过得怎么样呀？',
      '烯烯来啦～欢迎回来',
      '嗨，小烯，想我了吗？',
    ],
  },
  {
    name: '许彤彤',
    nicknames: ['彤彤', '小彤', '彤宝', '彤彤酱', '🍋', '柠檬不秃头'],
    gender: 'female',
    greetings: [
      '好久不见，彤彤～',
      '彤彤，今天过得开心吗？',
      '小彤来啦，真高兴见到你',
      '嗨，彤宝，今天想聊点什么？',
    ],
  },
  {
    name: '陈美欣',
    nicknames: ['美欣', '欣欣', '欣宝', '小欣', '好运芝士'],
    gender: 'female',
    greetings: [
      '好久不见，美欣～',
      '美欣，最近好吗？',
      '欣欣，欢迎回来',
      '嗨，欣宝，今天过得怎么样？',
    ],
  },
  {
    name: '代心怡',
    nicknames: ['心怡', '怡怡', '怡宝', '小怡'],
    gender: 'female',
    greetings: [
      '好久不见，心怡～',
      '心怡，今天心情怎么样？',
      '怡怡，真高兴你来了',
      '嗨，小怡，想聊点什么呢？',
    ],
  },
  {
    name: '朱昱丰',
    nicknames: ['昱丰', '丰丰', '小丰', '丰哥', 'Eyfon', 'eyfon'],
    gender: 'male',
    greetings: [
      '好久不见，昱丰～',
      '昱丰，最近忙什么呢？',
      '丰丰，欢迎回来',
      '嗨，小丰，今天过得怎么样？',
    ],
  },
]

function matchEasterEggUser(profile) {
  if (!profile) return null

  const nickname = (profile.nickname || '').trim().toLowerCase()
  const gender = profile.gender || ''
  const birthday = profile.birthday || ''
  const mbti = (profile.mbti || '').trim().toUpperCase()
  const bio = (profile.bio || '').toLowerCase()
  const hobbies = (profile.hobbies || '').toLowerCase()

  for (const user of EASTER_EGG_USERS) {
    let score = 0

    if (nickname === user.name.toLowerCase()) {
      score += 100
    }

    for (const nick of user.nicknames) {
      if (nickname === nick.toLowerCase()) {
        score += 80
      }
      if (nickname.includes(nick.toLowerCase()) && nick.length >= 2) {
        score += 40
      }
    }

    if (gender && gender === user.gender) {
      score += 10
    }

    if (bio.includes(user.name.toLowerCase()) || hobbies.includes(user.name.toLowerCase())) {
      score += 50
    }

    for (const nick of user.nicknames) {
      if (bio.includes(nick.toLowerCase()) || hobbies.includes(nick.toLowerCase())) {
        score += 30
      }
    }

    if (score >= 50) {
      return { user, score }
    }
  }

  return null
}

function getEasterEggGreeting(userInfo) {
  if (!userInfo) return ''
  const { user } = userInfo
  const greetings = user.greetings
  const index = Math.floor(Math.random() * greetings.length)
  return greetings[index]
}

export { EASTER_EGG_USERS, matchEasterEggUser, getEasterEggGreeting }
