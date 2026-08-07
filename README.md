# Content Builder Academy

> Turn your content ideas into working AI tools.

Welcome to **Content Builder Academy**—a hands-on course where you learn Codex
by building something useful. You do not need to be a developer. Bring a
content idea, follow the guided workflow, and turn it into a working tool.

> [!NOTE]
> **Early access:** guided startup is available for Windows and macOS. The
> course is still evolving, and the current macOS Course Companion uses clearly
> labelled fixture Teacher and practice responses rather than live Codex
> observation.

## What you will learn

- **Build by doing.** Learn Codex through a real project instead of a long
  series of lectures.
- **Turn an idea into a tool.** Start with a content challenge and develop a
  practical app around it.
- **Work with an AI Teacher.** Get guidance, feedback, and help when you are
  stuck.
- **Stay in control.** Learn how to review plans and approve changes safely.
- **Reuse the workflow.** Apply the same process to future content projects.

## Is this course for you?

Content Builder Academy is designed for marketers, creators, and curious
builders who want to make useful software with AI—even if they have never
written code before.

You will feel at home here if you prefer learning through small, practical
steps and want to finish with something you can actually use.

## Before you start

For the current early-access experience, you need:

- a Windows or macOS computer;
- [Git](https://git-scm.com/downloads);
- a ChatGPT account with access to Codex;
- an internet connection; and
- on macOS, Node.js 22 or newer.

**No coding experience is required.** The launcher checks the other tools it
needs and explains anything missing before making changes.

## Start the course on Windows

Open **Command Prompt** or **PowerShell** in the folder where you want to keep
the course. Run these commands one at a time:

```bat
git clone https://github.com/DiligentPenguinn/codex-content-creator-course.git
cd codex-content-creator-course
.\start-course.cmd
```

## Start the course on macOS

Open **Terminal** in the folder where you want to keep the course. Run these
commands one at a time:

```bash
git clone https://github.com/DiligentPenguinn/codex-content-creator-course.git
cd codex-content-creator-course
./start-course.command
```

After cloning, you can also double-click `start-course.command` in Finder.

## What happens next?

1. You receive a quick welcome and an explanation of the setup process.
2. The launcher checks whether the required tools are ready.
3. If local dependencies are needed, you see what will run before it runs.
4. **Nothing is installed unless you approve it.**
5. The course application opens and restores local progress when available.
6. You continue into the current early-access learning experience.

You can safely decline an installation. The launcher will stop and explain the
next manual step.

## Your account and progress

- The Windows setup path uses Codex's official ChatGPT login flow and does not
  read or store your password or authentication tokens.
- The current macOS Course Companion does not connect to a live Teacher or
  observe live Codex tasks; its simulated responses are labelled in the app.
- Non-secret setup and learning progress stay on your computer.
- The application checks the available local state when you reopen it.

## Need help?

- For Windows setup and recovery, see the
  [startup help guide](prototypes/app-startup-electron-mock/README.md).
- For macOS startup, verification, and current limitations, see the
  [Course Companion guide](course-companion/README.md).

## For contributors

The links below are for people developing the course itself. Learners do not
need to read them to begin.

<details>
<summary>Open contributor resources and authority map</summary>

### Current authority

- [Pilot 0.1 workspace](pilot-workspace/START_HERE.md) is the runnable
  Codex-native course authority for `intro`, `module-1`, and `resume`.
- [Course Companion](course-companion/README.md) is the implemented desktop-app
  package; its Teacher and practice adapters are currently fixture-backed.
- [ContentPilot learner starter](starters/contentpilot/README.md) is the
  validated application baseline that learners extend.
- [Planning handoff](docs/planning/content-automation-course-handoff.md) and its
  linked contracts define the approved public-course direction.
- [UI, UX, and interaction review](docs/planning/ui-ux-interaction-review-index.md)
  maps current behavior, planned behavior, and historical references.
- [Interactive team workload map](docs/planning/team-workload-map.html) records
  the current collaboration boundaries.

From the repository root, `$start-course-lesson` and `$course-teacher` delegate
to the skills inside `pilot-workspace/`. They do not fall back to historical
prototype curricula.

### Historical references

- [Windows startup mock technical design](docs/superpowers/specs/2026-07-30-electron-startup-mock-design.md)
- [MVP 0.5 pedagogy kernel](prototypes/mvp-0.5-pedagogy-kernel/README.vi.md)
- [MVP 1 course repository prototype](prototypes/mvp-1-course-repo/README.vi.md)
- [MVP 2 workflow prototype](prototypes/mvp-2-content-workflow-prototype/README.md)
- [MVP 3 course experience visual prototype](prototypes/mvp-3-course-experience-companion/README.md)
- `codex_content_creator_course_plan_v8.html`, the original 13-module strategy

</details>
