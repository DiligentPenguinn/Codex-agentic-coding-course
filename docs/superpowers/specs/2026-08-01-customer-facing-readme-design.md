# Customer-Facing Root README Design

**Status:** Approved design; copy implemented | **Date:** 1 August 2026 |
**Audience:** Potential learners and customers

## Purpose

Turn the root README into the welcoming entrance to Content Builder Academy.
A new visitor should quickly understand what the course offers, whether it is
for them, what they need, and how to begin.

The README must speak to learners rather than the internal project team.

## Voice

Use a **creative workshop** personality with the clarity of a **friendly
guide**:

- warm and encouraging;
- practical and outcome-focused;
- plain English;
- reassuring to people who do not identify as developers;
- concise enough to scan comfortably.

The central promise is: bring a content idea and turn it into a working tool.

## Page structure

1. **Course identity and promise**
   - Name Content Builder Academy.
   - Lead with the practical outcome.
   - Welcome non-developers explicitly.
2. **Early-access note**
   - Say briefly that the course is evolving.
   - State that the current guided startup supports Windows.
3. **What learners will do**
   - Learn by building.
   - Work with an AI Teacher.
   - Create a practical content tool.
   - Learn a workflow they can reuse.
4. **Before starting**
   - Windows computer.
   - Git.
   - ChatGPT/Codex subscription.
   - No prior coding experience required.
5. **Windows quick start**
   - Show only the three commands needed to clone, enter, and start.
   - State that the commands work in Command Prompt and PowerShell.
   - Do not mix comments into the command block.
6. **What happens next**
   - Check the computer.
   - Explain anything missing.
   - Ask permission before installation.
   - Open setup, connect Codex, and begin.
7. **macOS**
   - State that guided macOS startup is not available yet.
   - Do not present an untested manual workflow as equivalent support.
8. **Help**
   - Link to startup troubleshooting and technical details.
9. **For contributors**
   - Keep internal and technical links at the bottom.
   - Make clear that this section is not required to take the course.

## Opening copy direction

Use this message or a close, equally concise refinement:

> Welcome to Content Builder Academy—a hands-on course where you learn Codex
> by building something useful. You do not need to be a developer. Bring a
> content idea, follow the guided workflow, and turn it into a working tool.

## Content boundaries

Customer-facing sections must not mention:

- Duy or Triết;
- internal workload ownership;
- fixture content;
- MVP numbers;
- implementation architecture;
- internal approval or collaboration status.

Technical accuracy remains mandatory:

- do not imply macOS support exists;
- do not imply setup is production-ready;
- do not promise that every prerequisite is installed automatically;
- say clearly that nothing is installed without permission;
- keep authentication claims limited to the implemented Codex connection
  flow.

## Acceptance criteria

The redesigned README is ready when:

1. the first screenful explains the course, audience, outcome, and status;
2. a Windows learner can find and copy the startup commands quickly;
3. setup behavior is explained without engineering jargon;
4. macOS availability is honest;
5. internal team language appears only in linked planning documents;
6. contributor links remain available but visually secondary;
7. Markdown links and formatting are valid.
