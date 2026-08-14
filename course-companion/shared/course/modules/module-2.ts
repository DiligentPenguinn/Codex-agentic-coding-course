export const moduleTwoDefinition = {
  id: 'module-2',
  order: 2,
  titleVi: 'Xác định, giới hạn và lập kế hoạch portfolio',
  lessons: [
    { id: 'm2-portfolio-brief', titleVi: 'Xác định portfolio cần truyền đạt điều gì' }
  ],
  checkpoints: [
    { id: 'm2-portfolio-brief', courseLessonId: 'm2-portfolio-brief' }
  ],
  scenes: [
    {
      id: 'module-2-portfolio-placeholder',
      checkpointId: 'm2-portfolio-brief',
      courseLessonId: 'm2-portfolio-brief'
    }
  ],
  quizGroupIds: [],
  practice: {
    id: 'm2-portfolio-planning',
    version: '1.0.0',
    evidenceProfile: 'portfolio-planning'
  },
  artifactPaths: [],
  completionDestination: null
} as const
