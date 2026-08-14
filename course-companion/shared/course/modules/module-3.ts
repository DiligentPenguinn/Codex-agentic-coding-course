export const moduleThreeDefinition = {
  id: 'module-3',
  order: 3,
  titleVi: 'Xây dựng và gỡ lỗi theo từng phần đã kiểm chứng',
  lessons: [
    { id: 'm3-scaffold-baseline', titleVi: 'Tạo nền ứng dụng có thể kiểm chứng' }
  ],
  checkpoints: [
    { id: 'm3-scaffold-baseline', courseLessonId: 'm3-scaffold-baseline' }
  ],
  scenes: [
    {
      id: 'module-3-placeholder',
      checkpointId: 'm3-scaffold-baseline',
      courseLessonId: 'm3-scaffold-baseline'
    }
  ],
  quizGroupIds: [],
  practice: {
    id: 'm3-portfolio-build',
    version: '1.0.0',
    evidenceProfile: 'portfolio-build'
  },
  artifactPaths: [],
  completionDestination: null
} as const
