# Content Builder Academy

> Turn your content ideas into working AI tools.

Welcome to **Content Builder Academy**—a hands-on course where you learn Codex
by building something useful. You do not need to be a developer. Bring a
content idea, follow the guided workflow, and turn it into a working tool.

> [!NOTE]
> **Early access:** the course is still evolving, and the guided setup
> currently supports Windows. You may encounter preview course screens while
> we finish the complete learning experience.

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

- a Windows computer;
- [Git](https://git-scm.com/download/win);
- a ChatGPT account with access to Codex;
- an internet connection.

**No coding experience is required.** The setup will check the other tools it
needs and explain anything missing before making changes.

## Start the course on Windows

Open **Command Prompt** or **PowerShell** in the folder where you want to keep
the course. Run these commands one at a time:

```bat
git clone https://github.com/DiligentPenguinn/codex-content-creator-course.git
cd codex-content-creator-course
.\start-course.cmd
```

That is it—the launcher will guide you from there.

## What happens next?

1. You receive a quick welcome and an explanation of the setup process.
2. The launcher checks whether the required tools are ready.
3. If anything is missing, you see what it is, why it is needed, and the exact
   installation command.
4. **Nothing is installed unless you approve it.**
5. The setup app opens and helps you connect your Codex account.
6. You answer a few setup questions and continue into the course experience.

You can safely decline an installation. The launcher will stop and show you
what to do manually.

## Your account and progress

- Codex handles your ChatGPT sign-in through its official login flow.
- The course does not read or store your Codex password or authentication
  tokens.
- Your non-secret setup progress stays on your computer.
- Your account connection is checked again when you reopen the app.

## macOS

Guided macOS startup is not available yet. We will add macOS instructions when
that workflow has been implemented and tested.

## Need help?

If setup does not work as expected, see the
[startup help and recovery guide](prototypes/app-startup-electron-mock/README.md).
It includes prerequisite information, manual recovery commands, stored-data
details, and known limitations.

## For contributors

The links below are for people developing the course itself. Learners do not
need to read them to begin.

<details>
<summary>Open contributor resources</summary>

- [Startup mock technical design](docs/superpowers/specs/2026-07-30-electron-startup-mock-design.md)
- [Interactive team workload map](docs/planning/team-workload-map.html)
- [Pedagogy kernel](prototypes/mvp-0.5-pedagogy-kernel/README.vi.md)
- [Course repository prototype](prototypes/mvp-1-course-repo/README.vi.md)
- [Course experience companion](prototypes/mvp-3-course-experience-companion/README.md)
- [ContentPilot learner starter](starters/contentpilot/README.md)
- [Pilot workspace](pilot-workspace/START_HERE.md)

</details>
