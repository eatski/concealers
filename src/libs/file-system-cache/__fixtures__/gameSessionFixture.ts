export const gameSessionData = {
  metadata: {
    sessionId: 'session-2024-001',
    startTime: new Date('2024-01-01T10:00:00Z').toISOString(),
    lastUpdated: new Date('2024-01-01T11:30:00Z').toISOString(),
    gameStatus: 'in_progress',
    round: 3,
    settings: {
      timeLimit: 600,
      difficultyLevel: 'medium',
      enabledFeatures: ['hidden_motives', 'time_pressure', 'character_relationships']
    }
  },
  characters: [
    {
      id: 'detective-001',
      name: '新田探偵',
      description: 'ベテラン探偵。冷静な判断力と鋭い洞察力を持つ。',
      hiddenPrompt: '実は被害者の遺産を狙っている。被害者から遺産相続の約束を取り付けていた。',
      status: {
        suspicionLevel: 0.45,
        trustworthiness: 0.75,
        relationships: {
          'detective-002': { type: 'rivalry', strength: 0.8 },
          'victim': { type: 'business', strength: 0.6 }
        },
        inventory: ['手帳', '万年筆', '古い写真'],
        skills: {
          observation: 85,
          deduction: 90,
          persuasion: 70
        }
      }
    },
    {
      id: 'detective-002',
      name: '山下探偵',
      description: '新人探偵。熱心だが経験不足。',
      hiddenPrompt: '被害者の親族から依頼を受けて、新田探偵を監視している。',
      status: {
        suspicionLevel: 0.25,
        trustworthiness: 0.85,
        relationships: {
          'detective-001': { type: 'cautious', strength: 0.4 }
        },
        inventory: ['メモ帳', 'スマートフォン'],
        skills: {
          observation: 65,
          deduction: 60,
          persuasion: 75
        }
      }
    }
  ],
  history: {
    conversations: [
      {
        id: 'conv-001',
        timestamp: new Date('2024-01-01T10:15:00Z').toISOString(),
        speaker: 'detective-001',
        message: '山下君、被害者の部屋から何か気になるものは見つかりましたか？',
        metadata: {
          tone: 'professional',
          intent: 'gathering_information',
          hiddenMotive: 'assessing_knowledge'
        }
      },
      {
        id: 'conv-002',
        timestamp: new Date('2024-01-01T10:16:00Z').toISOString(),
        speaker: 'detective-002',
        message: 'はい、実は気になる書類を見つけました。',
        metadata: {
          tone: 'cautious',
          intent: 'sharing_partial_info',
          hiddenMotive: 'testing_reaction'
        }
      }
    ],
    thoughts: [
      {
        characterId: 'detective-001',
        timestamp: new Date('2024-01-01T10:15:30Z').toISOString(),
        content: '山下が何か隠しているようだ。もう少し様子を見よう。',
        urgency: 1,
        tags: ['suspicious', 'strategy', 'observation']
      },
      {
        characterId: 'detective-002',
        timestamp: new Date('2024-01-01T10:16:30Z').toISOString(),
        content: '新田探偵の行動が怪しい。もっと証拠を集めないと。',
        urgency: 2,
        tags: ['investigation', 'caution', 'evidence']
      }
    ],
    events: [
      {
        id: 'event-001',
        timestamp: new Date('2024-01-01T10:10:00Z').toISOString(),
        type: 'discovery',
        description: '新たな証拠が発見された',
        involvedCharacters: ['detective-002'],
        location: '被害者の書斎',
        importance: 'high'
      }
    ]
  },
  evidence: {
    items: [
      {
        id: 'evidence-001',
        name: '遺言書',
        discoveryTime: new Date('2024-01-01T10:10:00Z').toISOString(),
        discoveredBy: 'detective-002',
        location: '書斎の金庫',
        description: '被害者が記した遺言書。相続人について言及がある。',
        status: 'unverified',
        relatedCharacters: ['detective-001'],
        metadata: {
          condition: 'excellent',
          authenticity: 0.9,
          significance: 'high'
        }
      }
    ],
    connections: [
      {
        from: 'evidence-001',
        to: 'detective-001',
        type: 'implicates',
        strength: 0.7,
        notes: '遺言書の内容が新田探偵の動機と関連している可能性'
      }
    ]
  }
}