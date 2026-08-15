import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const frozenFiles: Record<string, string> = {
  '../pilot-workspace/course/lessons/intro.vi.md': 'cc0f8091cf142fa673cb50818907a86007485ed139b57950294ff8883768dba8',
  '../pilot-workspace/course/lessons/module-1.vi.md': 'bd54b4623f64f15217813da7ed25677e704b77d1bcff84864054275fa4df5ace',
  '../pilot-workspace/course/lesson-scripts/intro.script.vi.md': '234e5f0be2ea4e93e09801d6410218a6cffdfceef070b7b98492abb5a63cdd1e',
  '../pilot-workspace/course/lesson-scripts/module-1.script.vi.md': '096a67840619924b22178f3e0595aef906a8926f1da7fa4dfc5c44628e96136d',
  '../pilot-workspace/course/prompts/start-intro.vi.md': '1092f834e3dd9859a00469342ac828a388a806e202796d3171cd76b9fba09863',
  '../pilot-workspace/course/prompts/start-module-1.vi.md': 'da45a13ddbb7e315e14e7e8f262d043480707a78712680940ace43069343c25e',
  '../pilot-workspace/course/quizzes/intro.quiz.json': 'c9e61547579f9a07389c4f9498dd8a23c674c71f0860181c5fe22021f1c220e1',
  '../pilot-workspace/course/quizzes/module-1.quiz.json': '04166791e9e49958fef42a12e3193801cc01245d3b97b2668621c999aa9913b8',
  '../pilot-workspace/course/practices/m1-codex-safe-setup.json': '14f57b5c4e6964ee6954bea5b35eec84fe145b64bda25412c946e69e49c6557b',
  'content/practices/m1-codex-safe-setup.json': 'a8419692c19539945fb5689efcb4880f3cd34178ae1d2ff3ff5aee1bad23b6b6',
  '../pilot-workspace/course/codex-setup/app.js': 'e19dc03cf4b12d11deaa25c4f61877d0d2fea6be2e6203c7db45ab14f4ef3f8e',
  '../pilot-workspace/course/codex-setup/images/SOURCES.md': '22d0b74bcef710bb411938ae98d4905ba782af85471d7c03bd9b0885800af3e8',
  '../pilot-workspace/course/codex-setup/images/approval-menu.png': 'aa54394758b3d17e9c67aeeaa8ea93090ef7bc2f01f3d5990986c9ea280581f6',
  '../pilot-workspace/course/codex-setup/images/at-menu.png': '6225554b00c737ae4dc6ad17bb0a608ec0a14cf977674c963b5a765f73ac5091',
  '../pilot-workspace/course/codex-setup/images/model-settings.png': '02ee7752a4cb5870408b1e6b11998db3c55021a446a2e44b0f2a618c7ffb9134',
  '../pilot-workspace/course/codex-setup/images/reasoning-levels.png': '5f14317e0c72cfbefeb40e4562eca54078209b375944302fdb71afc8d9bb78be',
  '../pilot-workspace/course/codex-setup/images/slash-commands.png': '5f9baca5927a058019c411c7ef8d5d76d7bc0c60553557d183cb8656b37660c9',
  '../pilot-workspace/course/codex-setup/index.html': '0542733354485bad70fda8a5904461dc61de091140f497553b36dac1639884c6',
  '../pilot-workspace/course/codex-setup/styles.css': '8a2a26e5bc59cdbf81abb0e27f4ddf9a038d93903d28b414db6fa598f5210d93',
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
    expect(digest(scenes)).toBe('e566dd6903ca96c8093bef9d05eb2525a1e8edec8b67a95161837c67aadb0fb4')
    expect(scenes).toContain("dialogue: 'Module 2 sẽ dùng nền tảng này để xác định người xem, kiểm kê bằng chứng và lập kế hoạch portfolio của bạn trước khi viết code.'")
    expect(scenes).toContain("choices: [{ label: 'Mở Module 2', next: 'module-2-portfolio-workspace', afterSave: 'home', primary: true }]")
  })
})
