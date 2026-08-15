export const moduleThreeDefinition = {
  id: 'module-3',
  order: 3,
  titleVi: 'Xây dựng và gỡ lỗi theo từng phần đã kiểm chứng',
  lessons: [
    { id: 'm3-scaffold-baseline', titleVi: 'Tạo nền ứng dụng có thể kiểm chứng' },
    { id: 'm3-complete-first-version', titleVi: 'Xây phiên bản đầu tiên theo bốn phần' },
    { id: 'm3-whole-page-revision', titleVi: 'Xem lại và cải thiện toàn trang' },
    { id: 'm3-evidence-debugging', titleVi: 'Gỡ một lỗi từ bằng chứng' },
    { id: 'm3-independent-enhancement', titleVi: 'Tự định hướng một cải tiến nhỏ' }
  ],
  checkpoints: [
    { id: 'm3-scaffold-baseline', courseLessonId: 'm3-scaffold-baseline' },
    { id: 'm3-complete-first-version', courseLessonId: 'm3-complete-first-version' },
    { id: 'm3-whole-page-revision', courseLessonId: 'm3-whole-page-revision' },
    { id: 'm3-evidence-debugging', courseLessonId: 'm3-evidence-debugging' },
    { id: 'm3-independent-enhancement', courseLessonId: 'm3-independent-enhancement' },
    { id: 'm3-portfolio-build', courseLessonId: 'm3-independent-enhancement' },
    { id: 'm3-mastery', courseLessonId: 'm3-independent-enhancement' },
    { id: 'm3-complete', courseLessonId: 'm3-independent-enhancement' }
  ],
  scenes: [
    { id: 'module-3-readiness', checkpointId: 'm3-scaffold-baseline', courseLessonId: 'm3-scaffold-baseline', nextSceneId: 'module-3-scaffold-intro' },
    { id: 'module-3-scaffold-intro', checkpointId: 'm3-scaffold-baseline', courseLessonId: 'm3-scaffold-baseline', nextSceneId: 'module-3-check-scaffold-boundary' },
    { id: 'module-3-check-scaffold-boundary', checkpointId: 'm3-scaffold-baseline', courseLessonId: 'm3-scaffold-baseline' },
    { id: 'module-3-first-version-intro', checkpointId: 'm3-complete-first-version', courseLessonId: 'm3-complete-first-version', nextSceneId: 'module-3-check-slice-gate' },
    { id: 'module-3-check-slice-gate', checkpointId: 'm3-complete-first-version', courseLessonId: 'm3-complete-first-version' },
    { id: 'module-3-revision-intro', checkpointId: 'm3-whole-page-revision', courseLessonId: 'm3-whole-page-revision', nextSceneId: 'module-3-check-revision-scope' },
    { id: 'module-3-check-revision-scope', checkpointId: 'm3-whole-page-revision', courseLessonId: 'm3-whole-page-revision' },
    { id: 'module-3-debugging-intro', checkpointId: 'm3-evidence-debugging', courseLessonId: 'm3-evidence-debugging', nextSceneId: 'module-3-check-debug-order' },
    { id: 'module-3-check-debug-order', checkpointId: 'm3-evidence-debugging', courseLessonId: 'm3-evidence-debugging' },
    { id: 'module-3-enhancement-intro', checkpointId: 'm3-independent-enhancement', courseLessonId: 'm3-independent-enhancement', nextSceneId: 'module-3-check-enhancement-boundary' },
    { id: 'module-3-check-enhancement-boundary', checkpointId: 'm3-independent-enhancement', courseLessonId: 'm3-independent-enhancement' },
    { id: 'module-3-portfolio-practice', checkpointId: 'm3-portfolio-build', courseLessonId: 'm3-independent-enhancement', nextSceneId: 'module-3-portfolio-mastery' },
    { id: 'module-3-portfolio-mastery', checkpointId: 'm3-mastery', courseLessonId: 'm3-independent-enhancement', nextSceneId: 'module-3-mastery-scaffold' },
    { id: 'module-3-mastery-scaffold', checkpointId: 'm3-mastery', courseLessonId: 'm3-independent-enhancement' },
    { id: 'module-3-mastery-slice', checkpointId: 'm3-mastery', courseLessonId: 'm3-independent-enhancement' },
    { id: 'module-3-mastery-debug', checkpointId: 'm3-mastery', courseLessonId: 'm3-independent-enhancement' },
    { id: 'module-3-mastery-owned-revision', checkpointId: 'm3-mastery', courseLessonId: 'm3-independent-enhancement' },
    { id: 'module-3-mastery-owned-enhancement', checkpointId: 'm3-mastery', courseLessonId: 'm3-independent-enhancement' },
    { id: 'module-3-mastery-summary', checkpointId: 'm3-mastery', courseLessonId: 'm3-independent-enhancement' },
    { id: 'module-3-complete', checkpointId: 'm3-complete', courseLessonId: 'm3-independent-enhancement' }
  ],
  quizGroupIds: [
    'scaffold-retrieval',
    'first-version-retrieval',
    'revision-retrieval',
    'debugging-retrieval',
    'enhancement-retrieval',
    'm3-final-assessment'
  ],
  practice: {
    id: 'm3-portfolio-build',
    version: '1.0.0',
    evidenceProfile: 'portfolio-build'
  },
  artifactPaths: [
    'evidence/module-3/scaffold-report.md',
    'evidence/module-3/design-direction.md',
    'evidence/module-3/build-log.md',
    'evidence/module-3/browser-validation.md',
    'evidence/module-3/revision-record.md',
    'evidence/module-3/debugging-report.md',
    'evidence/module-3/enhancement-plan.md',
    'evidence/module-3/final-change-summary.md'
  ],
  completionDestination: null
} as const
