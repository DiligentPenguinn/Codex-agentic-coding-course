export const moduleFourDefinition = {
  id: 'module-4',
  order: 4,
  titleVi: 'Kiểm chứng, phát hành và chứng minh quyền sở hữu',
  lessons: [
    { id: 'm4-release-validation', titleVi: 'Kiểm chứng phiên bản phát hành' },
    { id: 'm4-security-publication', titleVi: 'Duyệt an toàn và phạm vi công bố' },
    { id: 'm4-preview-deployment', titleVi: 'Tạo và kiểm chứng Preview' },
    { id: 'm4-production-decision', titleVi: 'Quyết định có đưa lên Production hay không' },
    { id: 'm4-ownership-transfer', titleVi: 'Chứng minh quyền sở hữu và chuyển giao kỹ năng' }
  ],
  checkpoints: [
    { id: 'm4-release-validation', courseLessonId: 'm4-release-validation' },
    { id: 'm4-security-publication', courseLessonId: 'm4-security-publication' },
    { id: 'm4-preview-deployment', courseLessonId: 'm4-preview-deployment' },
    { id: 'm4-production-decision', courseLessonId: 'm4-production-decision' },
    { id: 'm4-ownership-transfer', courseLessonId: 'm4-ownership-transfer' },
    { id: 'm4-portfolio-release', courseLessonId: 'm4-ownership-transfer' },
    { id: 'm4-mastery', courseLessonId: 'm4-ownership-transfer' },
    { id: 'm4-complete', courseLessonId: 'm4-ownership-transfer' }
  ],
  scenes: [
    { id: 'module-4-hosting-intro', checkpointId: 'm4-release-validation', courseLessonId: 'm4-release-validation', nextSceneId: 'module-4-hosting-roles' },
    { id: 'module-4-hosting-roles', checkpointId: 'm4-release-validation', courseLessonId: 'm4-release-validation', nextSceneId: 'module-4-release-intro' },
    { id: 'module-4-release-intro', checkpointId: 'm4-release-validation', courseLessonId: 'm4-release-validation', nextSceneId: 'module-4-check-release-evidence' },
    { id: 'module-4-check-release-evidence', checkpointId: 'm4-release-validation', courseLessonId: 'm4-release-validation' },
    { id: 'module-4-security-intro', checkpointId: 'm4-security-publication', courseLessonId: 'm4-security-publication', nextSceneId: 'module-4-check-protection-scope' },
    { id: 'module-4-check-protection-scope', checkpointId: 'm4-security-publication', courseLessonId: 'm4-security-publication' },
    { id: 'module-4-preview-intro', checkpointId: 'm4-preview-deployment', courseLessonId: 'm4-preview-deployment', nextSceneId: 'module-4-check-preview-evidence' },
    { id: 'module-4-check-preview-evidence', checkpointId: 'm4-preview-deployment', courseLessonId: 'm4-preview-deployment' },
    { id: 'module-4-production-intro', checkpointId: 'm4-production-decision', courseLessonId: 'm4-production-decision', nextSceneId: 'module-4-check-production-choice' },
    { id: 'module-4-check-production-choice', checkpointId: 'm4-production-decision', courseLessonId: 'm4-production-decision' },
    { id: 'module-4-ownership-intro', checkpointId: 'm4-ownership-transfer', courseLessonId: 'm4-ownership-transfer', nextSceneId: 'module-4-check-transfer-boundary' },
    { id: 'module-4-check-transfer-boundary', checkpointId: 'm4-ownership-transfer', courseLessonId: 'm4-ownership-transfer' },
    { id: 'module-4-portfolio-practice', checkpointId: 'm4-portfolio-release', courseLessonId: 'm4-ownership-transfer', nextSceneId: 'module-4-portfolio-mastery' },
    { id: 'module-4-portfolio-mastery', checkpointId: 'm4-mastery', courseLessonId: 'm4-ownership-transfer', nextSceneId: 'module-4-mastery-release' },
    { id: 'module-4-mastery-release', checkpointId: 'm4-mastery', courseLessonId: 'm4-ownership-transfer' },
    { id: 'module-4-mastery-security', checkpointId: 'm4-mastery', courseLessonId: 'm4-ownership-transfer' },
    { id: 'module-4-mastery-preview', checkpointId: 'm4-mastery', courseLessonId: 'm4-ownership-transfer' },
    { id: 'module-4-mastery-production', checkpointId: 'm4-mastery', courseLessonId: 'm4-ownership-transfer' },
    { id: 'module-4-mastery-owned-release', checkpointId: 'm4-mastery', courseLessonId: 'm4-ownership-transfer' },
    { id: 'module-4-mastery-owned-transfer', checkpointId: 'm4-mastery', courseLessonId: 'm4-ownership-transfer' },
    { id: 'module-4-mastery-summary', checkpointId: 'm4-mastery', courseLessonId: 'm4-ownership-transfer' },
    { id: 'module-4-complete', checkpointId: 'm4-complete', courseLessonId: 'm4-ownership-transfer' }
  ],
  quizGroupIds: [
    'release-validation-retrieval',
    'security-publication-retrieval',
    'preview-deployment-retrieval',
    'production-decision-retrieval',
    'ownership-transfer-retrieval',
    'm4-final-assessment'
  ],
  practice: {
    id: 'm4-portfolio-release',
    version: '1.0.0',
    evidenceProfile: 'portfolio-release'
  },
  artifactPaths: [],
  completionDestination: null
} as const
