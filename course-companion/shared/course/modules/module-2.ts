export const moduleTwoDefinition = {
  id: 'module-2',
  order: 2,
  titleVi: 'Xác định, giới hạn và lập kế hoạch portfolio',
  lessons: [
    { id: 'm2-portfolio-brief', titleVi: 'Xác định portfolio cần truyền đạt điều gì' }
  ],
  checkpoints: [
    { id: 'm2-portfolio-brief', courseLessonId: 'm2-portfolio-brief' },
    { id: 'm2-content-evidence-inventory', courseLessonId: 'm2-portfolio-brief' },
    { id: 'm2-visual-reference', courseLessonId: 'm2-portfolio-brief' },
    { id: 'm2-portfolio-prd', courseLessonId: 'm2-portfolio-brief' },
    { id: 'm2-implementation-contract', courseLessonId: 'm2-portfolio-brief' },
    { id: 'm2-portfolio-planning', courseLessonId: 'm2-portfolio-brief' },
    { id: 'm2-portfolio-mastery', courseLessonId: 'm2-portfolio-brief' },
    { id: 'm2-portfolio-complete', courseLessonId: 'm2-portfolio-brief' }
  ],
  scenes: [
    {
      id: 'module-2-portfolio-placeholder',
      checkpointId: 'm2-portfolio-brief',
      courseLessonId: 'm2-portfolio-brief',
      nextSceneId: 'module-2-portfolio-mastery'
    },
    {
      id: 'module-2-portfolio-mastery',
      checkpointId: 'm2-portfolio-mastery',
      courseLessonId: 'm2-portfolio-brief'
    }
  ],
  quizGroupIds: [],
  practice: {
    id: 'm2-portfolio-planning',
    version: '1.0.0',
    evidenceProfile: 'portfolio-planning'
  },
  artifactPaths: [
    'planning/portfolio-brief.md',
    'planning/content-evidence-inventory.md',
    'planning/reference/reference.md',
    'planning/PRD.md',
    'planning/requirement-validation-map.md',
    'planning/implementation-plan.md',
    'planning/first-bounded-task.md'
  ],
  completionDestination: null
} as const
