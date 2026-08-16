import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const frozenFiles: Record<string, string> = {
  '../pilot-workspace/course/lessons/intro.vi.md': 'cc0f8091cf142fa673cb50818907a86007485ed139b57950294ff8883768dba8',
  '../pilot-workspace/course/lessons/module-1.vi.md': '265ca2877fa90c5a4fc895290754175a38a65b67e537ed8e47a97dc9569f4b69',
  '../pilot-workspace/course/lesson-scripts/intro.script.vi.md': '1226d3c8511b0bd43107d018e6a9f2a673abf861930aff5f2d73f7f8c013cbda',
  '../pilot-workspace/course/lesson-scripts/module-1.script.vi.md': '8ac5f090151a5baf7aeb20e2d656db512c43ae70c6f254064b7067d5cb9b8bbb',
  '../pilot-workspace/course/prompts/start-intro.vi.md': '1092f834e3dd9859a00469342ac828a388a806e202796d3171cd76b9fba09863',
  '../pilot-workspace/course/prompts/start-module-1.vi.md': '792bb07e9197e5ae65002f0aa2e5ac52be6bc6f4896fbbc28b41c70da45bdccf',
  '../pilot-workspace/course/quizzes/intro.quiz.json': 'c9e61547579f9a07389c4f9498dd8a23c674c71f0860181c5fe22021f1c220e1',
  '../pilot-workspace/course/quizzes/module-1.quiz.json': '9114e69cfb0f81e500c85dcb5a453b468b77117c62780a57014a1f09f0fa1fa0',
  '../pilot-workspace/course/practices/m1-codex-safe-setup.json': '14f57b5c4e6964ee6954bea5b35eec84fe145b64bda25412c946e69e49c6557b',
  'content/practices/m1-codex-safe-setup.json': 'a8419692c19539945fb5689efcb4880f3cd34178ae1d2ff3ff5aee1bad23b6b6',
  '../pilot-workspace/course/codex-setup/app.js': '76ee417775f75c302be3758c31442564dbc6371e83ae8942b2c87baccfd7424d',
  '../pilot-workspace/course/codex-setup/images/SOURCES.md': '22d0b74bcef710bb411938ae98d4905ba782af85471d7c03bd9b0885800af3e8',
  '../pilot-workspace/course/codex-setup/images/approval-menu.png': 'aa54394758b3d17e9c67aeeaa8ea93090ef7bc2f01f3d5990986c9ea280581f6',
  '../pilot-workspace/course/codex-setup/images/at-menu.png': '6225554b00c737ae4dc6ad17bb0a608ec0a14cf977674c963b5a765f73ac5091',
  '../pilot-workspace/course/codex-setup/images/model-settings.png': '02ee7752a4cb5870408b1e6b11998db3c55021a446a2e44b0f2a618c7ffb9134',
  '../pilot-workspace/course/codex-setup/images/reasoning-levels.png': '5f14317e0c72cfbefeb40e4562eca54078209b375944302fdb71afc8d9bb78be',
  '../pilot-workspace/course/codex-setup/images/slash-commands.png': '5f9baca5927a058019c411c7ef8d5d76d7bc0c60553557d183cb8656b37660c9',
  '../pilot-workspace/course/codex-setup/index.html': '48162cc7eb5cb6ed652fc62e26fabc6173cf4b15d7e775f59ff6dd52ee9f2558',
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

describe('frozen introduction and Module 1', () => {
  it('keeps authoritative content, UI, images, prompts, quizzes, and Practice files exact', async () => {
    for (const [relativePath, expectedDigest] of Object.entries(frozenFiles)) {
      const content = await readFile(resolve(process.cwd(), relativePath))
      expect(digest(content), relativePath).toBe(expectedDigest)
    }
  })

  it('keeps the existing renderer scenes, navigation, and Module 1 assessment exact', async () => {
    const source = await readFile(resolve(
      process.cwd(),
      'src/renderer/src/surfaces/LearningWindow.tsx'
    ), 'utf8')
    const assessment = source.slice(
      source.indexOf('const setupAssessmentGroup'),
      source.indexOf('const assessmentGroups')
    )
    const scenes = source.slice(
      source.indexOf('const staticScenes'),
      source.indexOf("  'module-2-why-planning'")
    )
    expect(digest(assessment)).toBe('e9569f7111a13d7db61fef221f3a85a436f29899494ece43dc9ced61bde46b65')
    expect(digest(scenes)).toBe('610325d1aef151e9baafa86bb7fd07dd07a3fbbd3f3d9464a16752b5ee104eff')
    expect(scenes).toContain("dialogue: 'Khóa học này dành cho người mới muốn học cách làm việc cùng coding agent, kể cả khi bạn chưa biết lập trình. Sau khi học, bạn sẽ được thực hành bằng cách xây dựng Portfolio cá nhân. Trong quá trình xây dựng Portfolio, bạn cũng sẽ được học những kỹ năng chuyển đổi để có thể áp dụng cho bất kỳ coding agents nào, với bất kỳ ứng dụng nào bạn muốn.'")
    expect(scenes).toContain("choices: [{ label: 'Bắt đầu Module 1', next: 'module-1-codex-orientation', afterSave: 'home', primary: true, preservePrimaryLabel: true }]")
    expect(scenes).toContain("dialogue: 'Module 2 sẽ dùng nền tảng này để xác định người xem, kiểm kê bằng chứng và lập kế hoạch portfolio của bạn trước khi viết code.'")
    expect(scenes).toContain("choices: [{ label: 'Mở Module 2', next: 'module-2-portfolio-workspace', afterSave: 'home', primary: true }]")
  })
})
