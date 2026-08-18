export const moduleTwoOutlineSections = [
  'Lập kế hoạch trước khi xây',
  'PRD là gì và dùng để làm gì?',
  'Dùng coding agent để tạo, review và duyệt PRD',
  'Một task Codex, năm lần duyệt',
  'Năm giai đoạn, năm tài liệu',
  'Thực hành: Lập kế hoạch cho portfolio'
] as const

export const moduleTwoDefinition = {
  id: 'module-2',
  order: 2,
  titleVi: 'Planning và PRD trước khi code với AI',
  lessons: [
    { id: 'm2-portfolio-brief', titleVi: 'Mục đích của portfolio này là gì?' },
    { id: 'm2-content-evidence-inventory', titleVi: 'Hiện tại bạn đang có những gì?' },
    { id: 'm2-visual-reference', titleVi: 'Bạn muốn portfolio của mình trông như thế nào?' },
    { id: 'm2-portfolio-prd', titleVi: 'Hoàn thành PRD' },
    { id: 'm2-implementation-contract', titleVi: 'Tạo kế hoạch triển khai' }
  ],
  checkpoints: [
    { id: 'm2-portfolio-brief', courseLessonId: 'm2-portfolio-brief' },
    { id: 'm2-content-evidence-inventory', courseLessonId: 'm2-content-evidence-inventory' },
    { id: 'm2-visual-reference', courseLessonId: 'm2-visual-reference' },
    { id: 'm2-portfolio-prd', courseLessonId: 'm2-portfolio-prd' },
    { id: 'm2-implementation-contract', courseLessonId: 'm2-implementation-contract' },
    { id: 'm2-portfolio-planning', courseLessonId: 'm2-implementation-contract' },
    { id: 'm2-portfolio-mastery', courseLessonId: 'm2-implementation-contract' },
    { id: 'm2-portfolio-complete', courseLessonId: 'm2-implementation-contract' }
  ],
  scenes: [
    { id: 'module-2-portfolio-workspace', checkpointId: 'm2-portfolio-brief', courseLessonId: 'm2-portfolio-brief', nextSceneId: 'module-2-prd-definition' },
    { id: 'module-2-prd-definition', checkpointId: 'm2-portfolio-brief', courseLessonId: 'm2-portfolio-brief', nextSceneId: 'module-2-prd-review-workflow' },
    { id: 'module-2-prd-review-workflow', checkpointId: 'm2-portfolio-brief', courseLessonId: 'm2-portfolio-brief', nextSceneId: 'module-2-prd-introduction' },
    { id: 'module-2-prd-introduction', checkpointId: 'm2-portfolio-brief', courseLessonId: 'm2-portfolio-brief', nextSceneId: 'module-2-prd-agent-workflow' },
    { id: 'module-2-prd-agent-workflow', checkpointId: 'm2-portfolio-brief', courseLessonId: 'm2-portfolio-brief', nextSceneId: 'module-2-portfolio-practice-intro' },
    { id: 'module-2-portfolio-practice-intro', checkpointId: 'm2-portfolio-brief', courseLessonId: 'm2-portfolio-brief', nextSceneId: 'module-2-portfolio-folder' },
    { id: 'module-2-portfolio-folder', checkpointId: 'm2-portfolio-brief', courseLessonId: 'm2-portfolio-brief', nextSceneId: 'module-2-portfolio-brief' },
    { id: 'module-2-portfolio-brief', checkpointId: 'm2-portfolio-brief', courseLessonId: 'm2-portfolio-brief', nextSceneId: 'module-2-portfolio-brief-example' },
    { id: 'module-2-portfolio-brief-example', checkpointId: 'm2-portfolio-brief', courseLessonId: 'm2-portfolio-brief', nextSceneId: 'module-2-check-brief-viewer' },
    { id: 'module-2-check-brief-viewer', checkpointId: 'm2-portfolio-brief', courseLessonId: 'm2-portfolio-brief' },
    { id: 'module-2-check-brief-success', checkpointId: 'm2-portfolio-brief', courseLessonId: 'm2-portfolio-brief' },
    { id: 'module-2-content-evidence-inventory', checkpointId: 'm2-content-evidence-inventory', courseLessonId: 'm2-content-evidence-inventory', nextSceneId: 'module-2-content-evidence-example' },
    { id: 'module-2-content-evidence-example', checkpointId: 'm2-content-evidence-inventory', courseLessonId: 'm2-content-evidence-inventory', nextSceneId: 'module-2-check-evidence-status' },
    { id: 'module-2-check-evidence-status', checkpointId: 'm2-content-evidence-inventory', courseLessonId: 'm2-content-evidence-inventory' },
    { id: 'module-2-check-evidence-permission', checkpointId: 'm2-content-evidence-inventory', courseLessonId: 'm2-content-evidence-inventory' },
    { id: 'module-2-visual-reference', checkpointId: 'm2-visual-reference', courseLessonId: 'm2-visual-reference', nextSceneId: 'module-2-visual-reference-example' },
    { id: 'module-2-visual-reference-example', checkpointId: 'm2-visual-reference', courseLessonId: 'm2-visual-reference', nextSceneId: 'module-2-check-reference-boundary' },
    { id: 'module-2-check-reference-boundary', checkpointId: 'm2-visual-reference', courseLessonId: 'm2-visual-reference' },
    { id: 'module-2-check-reference-record', checkpointId: 'm2-visual-reference', courseLessonId: 'm2-visual-reference' },
    { id: 'module-2-portfolio-prd', checkpointId: 'm2-portfolio-prd', courseLessonId: 'm2-portfolio-prd', nextSceneId: 'module-2-portfolio-prd-example' },
    { id: 'module-2-portfolio-prd-example', checkpointId: 'm2-portfolio-prd', courseLessonId: 'm2-portfolio-prd', nextSceneId: 'module-2-check-prd-requirement' },
    { id: 'module-2-check-prd-requirement', checkpointId: 'm2-portfolio-prd', courseLessonId: 'm2-portfolio-prd' },
    { id: 'module-2-check-prd-accessibility', checkpointId: 'm2-portfolio-prd', courseLessonId: 'm2-portfolio-prd' },
    { id: 'module-2-implementation-contract', checkpointId: 'm2-implementation-contract', courseLessonId: 'm2-implementation-contract', nextSceneId: 'module-2-implementation-contract-example' },
    { id: 'module-2-implementation-contract-example', checkpointId: 'm2-implementation-contract', courseLessonId: 'm2-implementation-contract', nextSceneId: 'module-2-check-delayed-scope' },
    { id: 'module-2-check-delayed-scope', checkpointId: 'm2-implementation-contract', courseLessonId: 'm2-implementation-contract' },
    { id: 'module-2-check-delayed-evidence', checkpointId: 'm2-implementation-contract', courseLessonId: 'm2-implementation-contract' },
    { id: 'module-2-portfolio-practice', checkpointId: 'm2-portfolio-planning', courseLessonId: 'm2-implementation-contract', nextSceneId: 'module-2-portfolio-mastery' },
    { id: 'module-2-portfolio-mastery', checkpointId: 'm2-portfolio-mastery', courseLessonId: 'm2-implementation-contract', nextSceneId: 'module-2-mastery-scenario-viewer' },
    { id: 'module-2-mastery-scenario-viewer', checkpointId: 'm2-portfolio-mastery', courseLessonId: 'm2-implementation-contract' },
    { id: 'module-2-mastery-scenario-evidence', checkpointId: 'm2-portfolio-mastery', courseLessonId: 'm2-implementation-contract' },
    { id: 'module-2-mastery-scenario-reference', checkpointId: 'm2-portfolio-mastery', courseLessonId: 'm2-implementation-contract' },
    { id: 'module-2-mastery-scenario-prd', checkpointId: 'm2-portfolio-mastery', courseLessonId: 'm2-implementation-contract' },
    { id: 'module-2-mastery-scenario-validation', checkpointId: 'm2-portfolio-mastery', courseLessonId: 'm2-implementation-contract' },
    { id: 'module-2-mastery-scenario-first-task', checkpointId: 'm2-portfolio-mastery', courseLessonId: 'm2-implementation-contract' },
    { id: 'module-2-mastery-owned-audience', checkpointId: 'm2-portfolio-mastery', courseLessonId: 'm2-implementation-contract' },
    { id: 'module-2-mastery-owned-scope', checkpointId: 'm2-portfolio-mastery', courseLessonId: 'm2-implementation-contract' },
    { id: 'module-2-mastery-owned-evidence', checkpointId: 'm2-portfolio-mastery', courseLessonId: 'm2-implementation-contract' },
    { id: 'module-2-mastery-owned-validation', checkpointId: 'm2-portfolio-mastery', courseLessonId: 'm2-implementation-contract' },
    { id: 'module-2-portfolio-mastery-summary', checkpointId: 'm2-portfolio-mastery', courseLessonId: 'm2-implementation-contract' },
    { id: 'module-2-portfolio-complete', checkpointId: 'm2-portfolio-complete', courseLessonId: 'm2-implementation-contract' }
  ],
  quizGroupIds: [
    'brief-retrieval',
    'evidence-retrieval',
    'reference-retrieval',
    'prd-retrieval',
    'planning-retrieval',
    'final-assessment'
  ],
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
  completionDestination: { moduleId: 'module-3', sceneId: 'module-3-readiness' }
} as const
