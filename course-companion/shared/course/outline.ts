import type { LessonId, SceneId } from '../contracts'
import { moduleTwoOutlineSections } from './modules/module-2'

export type OutlineSection = { title: string; startSceneId: SceneId }

export const courseOutline: Record<LessonId, readonly OutlineSection[]> = {
  intro: [
    { title: 'Bạn sẽ xây gì trong khóa học?', startSceneId: 'intro-visual-onboarding' },
    { title: 'Kết quả cuối khóa', startSceneId: 'intro-course-overview-2' },
    { title: 'Áp dụng kỹ năng sau khóa học', startSceneId: 'intro-learning-method' }
  ],
  'module-1': [
    { title: 'Codex và coding agent', startSceneId: 'module-1-codex-orientation' },
    { title: 'Approval: quyền thực hiện thao tác', startSceneId: 'module-1-codex-examples' },
    { title: 'Model và mức suy luận', startSceneId: 'module-1-codex-model-intro' },
    { title: 'Lệnh / và menu @', startSceneId: 'module-1-codex-slash-commands' },
    { title: 'AGENTS.md và Skills', startSceneId: 'module-1-agents-intro' },
    { title: 'Thực hành: Thiết lập Codex', startSceneId: 'module-1-setup-checklist' },
    { title: 'Kiểm tra cuối Module 1', startSceneId: 'module-1-mastery' },
    { title: 'Tổng kết Module 1', startSceneId: 'module-1-final-summary' }
  ],
  'module-2': [
    'module-2-portfolio-workspace',
    'module-2-prd-definition',
    'module-2-prd-review-workflow',
    'module-2-prd-agent-workflow',
    'module-2-implementation-plan-intro',
    'module-2-portfolio-practice',
    'module-2-portfolio-mastery',
    'module-2-portfolio-mastery-summary'
  ].map((startSceneId, index) => ({ title: moduleTwoOutlineSections[index]!, startSceneId: startSceneId as SceneId })),
  'module-3': [
    { title: 'Debug cùng coding agent', startSceneId: 'module-3-debugging-intro' },
    { title: 'Git và GitHub', startSceneId: 'module-3-git-intro' },
    { title: 'Thực hành đưa repo lên GitHub', startSceneId: 'module-3-github-publish' },
    { title: 'Tổng hợp trước Practice', startSceneId: 'module-3-pre-practice-summary' },
    { title: 'Practice: Xây portfolio', startSceneId: 'module-3-portfolio-practice' },
    { title: 'Kiểm tra cuối Module 3', startSceneId: 'module-3-portfolio-mastery' },
    { title: 'Tổng kết Module 3', startSceneId: 'module-3-mastery-summary' }
  ],
  'module-4': [
    { title: 'Hosting là gì?', startSceneId: 'module-4-hosting-intro' },
    { title: 'Vercel và các bản website', startSceneId: 'module-4-vercel-benefits' },
    { title: 'Hosting và kiểm tra portfolio', startSceneId: 'module-4-release-intro' },
    { title: 'Nội dung và quyền truy cập', startSceneId: 'module-4-security-intro' },
    { title: 'Đưa portfolio lên Vercel và xem thử', startSceneId: 'module-4-preview-intro' },
    { title: 'Công bố, cập nhật và khôi phục', startSceneId: 'module-4-production-intro' },
    { title: 'Chỉnh sửa portfolio sau khi công bố', startSceneId: 'module-4-update-workflow' },
    { title: 'Xử lý lỗi và khôi phục', startSceneId: 'module-4-deploy-errors' },
    { title: 'Quản lý portfolio và áp dụng kỹ năng', startSceneId: 'module-4-ownership-intro' },
    { title: 'Practice: Phát hành portfolio', startSceneId: 'module-4-portfolio-practice' },
    { title: 'Kiểm tra cuối Module 4', startSceneId: 'module-4-portfolio-mastery' },
    { title: 'Tổng kết Module 4', startSceneId: 'module-4-mastery-summary' }
  ]
}

// Sections partition the existing page order; they never create or skip pages.
export function outlineSectionIndex(sections: readonly OutlineSection[], pages: readonly SceneId[], sceneId: SceneId): number {
  const pageIndex = pages.indexOf(sceneId)
  for (let index = sections.length - 1; index >= 0; index -= 1) {
    const startIndex = pages.indexOf(sections[index]!.startSceneId)
    if (startIndex >= 0 && startIndex <= pageIndex) return index
  }
  return -1
}

export function adjacentOutlinePage(pages: readonly SceneId[], sceneId: SceneId, direction: -1 | 1): SceneId | undefined {
  const index = pages.indexOf(sceneId)
  return index < 0 ? undefined : pages[index + direction]
}
