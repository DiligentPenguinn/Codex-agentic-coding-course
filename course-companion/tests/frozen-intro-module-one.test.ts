import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const frozenFiles: Record<string, string> = {
  '../pilot-workspace/course/lessons/intro.vi.md': '85b293c5ecf0d07f5aba6ad00181be185f4def7da0faaadcde40aaaf01b39ed9',
  '../pilot-workspace/course/lessons/module-1.vi.md': '39f52e6e0cb4dd9ac183a1b44400af4282d0556210d5c5d650ed0cde53581cac',
  '../pilot-workspace/course/lesson-scripts/intro.script.vi.md': 'ac50c545ed4c301b7fee15f5277d7b482fef34c980d4102513c1fd2cf9a54d82',
  '../pilot-workspace/course/lesson-scripts/module-1.script.vi.md': '42e741dd968857b441d517b3d3ca609966ea6a3413bb4dc6780f40d35c85c0f0',
  '../pilot-workspace/course/prompts/start-intro.vi.md': '1092f834e3dd9859a00469342ac828a388a806e202796d3171cd76b9fba09863',
  '../pilot-workspace/course/prompts/start-module-1.vi.md': '90f5d64ba50b282531febe3cfb72ce11a8c69c6d5686bf2a2ec02ca6970dbe54',
  '../pilot-workspace/course/quizzes/intro.quiz.json': 'c9e61547579f9a07389c4f9498dd8a23c674c71f0860181c5fe22021f1c220e1',
  '../pilot-workspace/course/quizzes/module-1.quiz.json': '0223603f1976dac6273ffa62705b97c27ef5b7d673f647c174d5f34aef5c5412',
  '../pilot-workspace/course/practices/m1-codex-safe-setup.json': '1851d2679c3a5a6ced8d05fb3f9809b59d77c74dd44d51852cdc1a761fb2f2e9',
  'content/practices/m1-codex-safe-setup.json': 'a1b960cf0708264dac0e977b6fddb284d5a3e4084a174d3ff6017b92f7fe0838',
  '../pilot-workspace/course/codex-setup/app.js': '76ee417775f75c302be3758c31442564dbc6371e83ae8942b2c87baccfd7424d',
  '../pilot-workspace/course/codex-setup/images/SOURCES.md': '22d0b74bcef710bb411938ae98d4905ba782af85471d7c03bd9b0885800af3e8',
  '../pilot-workspace/course/codex-setup/images/approval-menu.png': 'aa54394758b3d17e9c67aeeaa8ea93090ef7bc2f01f3d5990986c9ea280581f6',
  '../pilot-workspace/course/codex-setup/images/at-menu.png': '6225554b00c737ae4dc6ad17bb0a608ec0a14cf977674c963b5a765f73ac5091',
  '../pilot-workspace/course/codex-setup/images/model-settings.png': '02ee7752a4cb5870408b1e6b11998db3c55021a446a2e44b0f2a618c7ffb9134',
  '../pilot-workspace/course/codex-setup/images/reasoning-levels.png': '5f14317e0c72cfbefeb40e4562eca54078209b375944302fdb71afc8d9bb78be',
  '../pilot-workspace/course/codex-setup/images/slash-commands.png': '5f9baca5927a058019c411c7ef8d5d76d7bc0c60553557d183cb8656b37660c9',
  '../pilot-workspace/course/codex-setup/index.html': 'b2f81260dce6bddc59dfa422205362f3651dc82ca3f04ab6af6ee832c2460d52',
  '../pilot-workspace/course/codex-setup/styles.css': '3c40f22cf620789ff94a7e12eca49c160611a5212d4f94e7a551eff3e17e1676',
  '../pilot-workspace/course/onboarding/app.js': '75006ce0ec2f1f224c54265e9a61202ed6cfb8a4ff9c63a202095ad9586441e2',
  '../pilot-workspace/course/onboarding/images/SOURCES.md': 'e256b39a05931c56083ad7f53ba75998f103f712cb64f19ebb5f062187ddadfb',
  '../pilot-workspace/course/onboarding/images/codex-app-interface.webp': '71eb7bfc4437898ecbf1507e612bcc90c4a82fe9f6a93f22ecdf0821fe520114',
  '../pilot-workspace/course/onboarding/images/codex-terminal-interface.webp': '90c03e8104d027a06c6b5d71fbe5d3b074bc2efeacd4624daeac08159b7000df',
  '../pilot-workspace/course/onboarding/images/mission-room.webp': '612c0b908aa9596a8a71a3cc95b9744cdc4624323fc44de6b4563208bf995e82',
  '../pilot-workspace/course/onboarding/images/skybound-quest.webp': '015990be55e4ecb9ab981a352075e5d432dc23a0462e7173c33e3cae920c73d3',
  '../pilot-workspace/course/onboarding/index.html': '95312c413bc421c12145ff5406beb2d4411256f9a63b498232dbda6c4f656d90',
  '../pilot-workspace/course/onboarding/styles.css': '8cea9ffbb5f74da2d7408be1b0d50e5fbb809ed09ca2096b8e651c8c9e7a5245'
}

function digest(content: string | Uint8Array): string {
  return createHash('sha256').update(content).digest('hex')
}

describe('frozen introduction and approved Module 1', () => {
  it('keeps authoritative content, UI, images, prompts, quizzes, and Practice files exact', async () => {
    for (const [relativePath, expectedDigest] of Object.entries(frozenFiles)) {
      const textFile = /\.(?:css|html|js|json|md)$/.test(relativePath)
      const content = await readFile(resolve(process.cwd(), relativePath), textFile ? 'utf8' : undefined)
      expect(digest(typeof content === 'string' ? content.replace(/\r\n/g, '\n') : content), relativePath)
        .toBe(expectedDigest)
    }
  })

  it('keeps the existing renderer scenes, navigation, and Module 1 assessment exact', async () => {
    const source = await readFile(resolve(
      process.cwd(),
      'src/renderer/src/surfaces/LearningWindow.tsx'
    ), 'utf8').then((content) => content.replace(/\r\n/g, '\n'))
    const assessment = source.slice(
      source.indexOf('const setupAssessmentGroup'),
      source.indexOf('const assessmentGroups')
    )
    const scenes = source.slice(
      source.indexOf('const staticScenes'),
      source.indexOf("  'module-2-why-planning'")
    )
    const masteryScene = scenes.slice(
      scenes.indexOf("'module-1-mastery': {"),
      scenes.indexOf("'module-1-complete': {")
    )
    expect(digest(assessment)).toBe('e9569f7111a13d7db61fef221f3a85a436f29899494ece43dc9ced61bde46b65')
    // Owner-approved removal of the Model requirement, 15 November 2026.
    expect(digest(scenes)).toBe('0761468cb6a22991c4bdd6c75729b2b34155e3f89be12fb61036d0fea8034a2a')
    expect(scenes).toContain("dialogue: 'Trong khoá học này, bạn sẽ được học cách dùng coding agents thông qua một dự án thực hành: Xây Portfolio cá nhân.'")
    expect(scenes).toContain("dialogue: 'Cuối khoá này, bạn sẽ có một web portfolio thật để có thể gửi cho nhà tuyển dụng.'")
    expect(scenes).toContain("dialogue: 'Những kỹ năng bạn học được trong khoá này không chỉ giúp bạn xây Portfolio, mà còn trang bị cho bạn kiến thức để tạo bất kỳ công cụ nào bạn muốn với AI'")
    expect(scenes).toContain("choices: [{ label: 'Bắt đầu Module 1', next: 'module-1-codex-orientation', afterSave: 'home', primary: true, preservePrimaryLabel: true }]")
    expect(scenes).toContain("choices: [{ label: 'Tiếp theo: AGENTS.md', next: 'module-1-agents-intro', primary: true }]")
    expect(scenes).toContain("'module-1-agents-intro': {")
    expect(scenes).toContain("objective: 'Lưu thông tin để agent ghi nhớ qua nhiều task'")
    expect(scenes).toContain("'module-1-skills-intro': {")
    expect(scenes).toContain("Đó là lúc ta sử dụng Skill.")
    expect(scenes).toContain("'module-1-skills-portfolio': {")
    expect(scenes).toContain("choices: [{ label: 'Tiếp theo: hai skill cho portfolio', next: 'module-1-skills-portfolio', primary: true }]")
    expect(scenes).toContain("choices: [{ label: 'Tiếp theo: thực hành cấu hình', next: 'module-1-setup-checklist', action: 'practice', primary: true }]")
    expect(scenes).not.toContain("'module-1-model-choice': {")
    expect(scenes).not.toContain("Dùng cấu hình đã chọn")
    expect(scenes).toContain("panelStatus: 'BỘ QUY LUẬT CHO CODING AGENTS'")
    expect(scenes).toContain("{ label: 'FRONTEND-DESIGN', value: 'Thiết kế và kiểm tra giao diện' }")
    expect(scenes).toContain("dialogue: 'Bây giờ hãy cùng nhau trả lời các câu hỏi ôn tập để củng cố kiến thức vừa học nhen!'")
    expect(masteryScene).toContain('showTitle: false')
    expect(masteryScene).toContain('showPanel: false')
    expect(scenes).toContain("dialogue: 'Module 2 sẽ dùng nền tảng này để xác định người xem, kiểm kê bằng chứng và lập kế hoạch portfolio của bạn trước khi viết code.'")
    expect(scenes).toContain("choices: [{ label: 'Mở Module 2', next: 'module-2-portfolio-workspace', afterSave: 'home', primary: true }]")
  })
})
