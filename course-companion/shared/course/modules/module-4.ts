export const moduleFourDefinition = {
  id: 'module-4',
  order: 4,
  titleVi: 'Kiểm chứng, phát hành và chứng minh quyền sở hữu',
  lessons: [
    { id: 'm4-release-validation', titleVi: 'Hosting và chuẩn bị triển khai' },
    { id: 'm4-security-publication', titleVi: 'Bảo mật và quyền truy cập' },
    { id: 'm4-preview-deployment', titleVi: 'Đưa portfolio lên Vercel và xem thử' },
    { id: 'm4-production-decision', titleVi: 'Công bố, cập nhật và khôi phục' },
    { id: 'm4-ownership-transfer', titleVi: 'Quản lý portfolio và áp dụng kỹ năng' }
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
    { id: 'module-4-hosting-intro', checkpointId: 'm4-release-validation', courseLessonId: 'm4-release-validation', nextSceneId: 'module-4-vercel-benefits' },
    { id: 'module-4-vercel-benefits', checkpointId: 'm4-release-validation', courseLessonId: 'm4-release-validation', nextSceneId: 'module-4-after-video' },
    { id: 'module-4-after-video', checkpointId: 'm4-release-validation', courseLessonId: 'm4-release-validation', nextSceneId: 'module-4-access-check' },
    { id: 'module-4-access-check', checkpointId: 'm4-security-publication', courseLessonId: 'm4-security-publication', nextSceneId: 'module-4-vercel-preview' },
    { id: 'module-4-vercel-preview', checkpointId: 'm4-preview-deployment', courseLessonId: 'm4-preview-deployment', nextSceneId: 'module-4-update-local' },
    { id: 'module-4-update-local', checkpointId: 'm4-preview-deployment', courseLessonId: 'm4-preview-deployment', nextSceneId: 'module-4-update-preview' },
    { id: 'module-4-update-preview', checkpointId: 'm4-preview-deployment', courseLessonId: 'm4-preview-deployment', nextSceneId: 'module-4-preview-review' },
    { id: 'module-4-preview-review', checkpointId: 'm4-preview-deployment', courseLessonId: 'm4-preview-deployment', nextSceneId: 'module-4-production-intro' },
    { id: 'module-4-production-intro', checkpointId: 'm4-production-decision', courseLessonId: 'm4-production-decision', nextSceneId: 'module-4-production-publish' },
    { id: 'module-4-production-publish', checkpointId: 'm4-production-decision', courseLessonId: 'm4-production-decision', nextSceneId: 'module-4-production-checks' },
    { id: 'module-4-production-checks', checkpointId: 'm4-production-decision', courseLessonId: 'm4-production-decision', nextSceneId: 'module-4-share-details' },
    { id: 'module-4-share-details', checkpointId: 'm4-production-decision', courseLessonId: 'm4-production-decision', nextSceneId: 'module-4-update-workflow' },
    { id: 'module-4-update-workflow', checkpointId: 'm4-production-decision', courseLessonId: 'm4-production-decision', nextSceneId: 'module-4-update-verify' },
    { id: 'module-4-update-verify', checkpointId: 'm4-production-decision', courseLessonId: 'm4-production-decision', nextSceneId: 'module-4-deploy-errors' },
    { id: 'module-4-deploy-errors', checkpointId: 'm4-production-decision', courseLessonId: 'm4-production-decision', nextSceneId: 'module-4-rollback' },
    { id: 'module-4-rollback', checkpointId: 'm4-production-decision', courseLessonId: 'm4-production-decision', nextSceneId: 'module-4-rollback-resume' },
    { id: 'module-4-rollback-resume', checkpointId: 'm4-production-decision', courseLessonId: 'm4-production-decision', nextSceneId: 'module-4-ownership-intro' },
    { id: 'module-4-ownership-intro', checkpointId: 'm4-ownership-transfer', courseLessonId: 'm4-ownership-transfer', nextSceneId: 'module-4-handover' },
    { id: 'module-4-handover', checkpointId: 'm4-ownership-transfer', courseLessonId: 'm4-ownership-transfer', nextSceneId: 'module-4-transfer' },
    { id: 'module-4-transfer', checkpointId: 'm4-ownership-transfer', courseLessonId: 'm4-ownership-transfer', nextSceneId: 'module-4-portfolio-practice' },
    { id: 'module-4-portfolio-practice', checkpointId: 'm4-portfolio-release', courseLessonId: 'm4-ownership-transfer', nextSceneId: 'module-4-portfolio-mastery' },
    { id: 'module-4-portfolio-mastery', checkpointId: 'm4-mastery', courseLessonId: 'm4-ownership-transfer', nextSceneId: 'module-4-mastery-release' },
    { id: 'module-4-mastery-release', checkpointId: 'm4-mastery', courseLessonId: 'm4-ownership-transfer' },
    { id: 'module-4-mastery-security', checkpointId: 'm4-mastery', courseLessonId: 'm4-ownership-transfer' },
    { id: 'module-4-mastery-preview', checkpointId: 'm4-mastery', courseLessonId: 'm4-ownership-transfer' },
    { id: 'module-4-mastery-production', checkpointId: 'm4-mastery', courseLessonId: 'm4-ownership-transfer' },
    { id: 'module-4-mastery-update', checkpointId: 'm4-mastery', courseLessonId: 'm4-ownership-transfer' },
    { id: 'module-4-mastery-recovery', checkpointId: 'm4-mastery', courseLessonId: 'm4-ownership-transfer' },
    { id: 'module-4-mastery-owned-release', checkpointId: 'm4-mastery', courseLessonId: 'm4-ownership-transfer' },
    { id: 'module-4-mastery-owned-transfer', checkpointId: 'm4-mastery', courseLessonId: 'm4-ownership-transfer' },
    { id: 'module-4-mastery-summary', checkpointId: 'm4-mastery', courseLessonId: 'm4-ownership-transfer' },
    { id: 'module-4-complete', checkpointId: 'm4-complete', courseLessonId: 'm4-ownership-transfer' }
  ],
  quizGroupIds: [
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
