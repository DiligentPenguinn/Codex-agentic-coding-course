export const moduleFourDefinition = {
  id: 'module-4',
  order: 4,
  titleVi: 'Kiểm chứng, phát hành và chứng minh quyền sở hữu',
  lessons: [
    { id: 'm4-release-validation', titleVi: 'Kiểm chứng phiên bản phát hành' }
  ],
  checkpoints: [
    { id: 'm4-release-validation', courseLessonId: 'm4-release-validation' }
  ],
  scenes: [
    {
      id: 'module-4-placeholder',
      checkpointId: 'm4-release-validation',
      courseLessonId: 'm4-release-validation'
    }
  ],
  quizGroupIds: [],
  practice: {
    id: 'm4-portfolio-release',
    version: '1.0.0',
    evidenceProfile: 'portfolio-release'
  },
  artifactPaths: [],
  completionDestination: null
} as const
