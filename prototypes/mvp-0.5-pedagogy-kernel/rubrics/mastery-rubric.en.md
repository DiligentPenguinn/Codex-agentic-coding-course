# Mastery Rubric - English Companion

This rubric assesses collaboration with Codex, not general programming knowledge. The Teacher uses it to decide whether the learner can move to the next submodule or needs more practice.

## Scale

- **0 - No evidence yet**: the learner has not tried or the answer is unrelated.
- **1 - Recognizes with support**: the learner can do it with heavy Teacher guidance.
- **2 - Performs with checking**: the learner can do it with light guidance and can name evidence.
- **3 - Independent**: the learner can give clear instructions, classify risk, inspect results, and explain the reasoning.

## Core Module 0 Skills

| Skill | 0 | 1 | 2 | 3 |
| --- | --- | --- | --- | --- |
| Repo inspection before edits | Asks for edits immediately or does not know inspection matters | Accepts inspection when prompted | Writes a read-only inspection prompt with done-when | Independently asks for inspection, scopes it, and names needed evidence |
| Prompt structure | Vague prompt, missing goal | Has a goal but lacks context/constraints | Includes goal, context, constraints, done-when | Splits large work into small reviewable prompts |
| Approval awareness | Does not distinguish risky actions | Recognizes some approval actions | Classifies read-only, edit, network, destructive | Stops and asks approval before risky actions |
| Teacher vs Executor | Confuses explanation and action requests | Distinguishes with examples | Writes two requests: explain and action | Knows when to ask for coaching vs execution |
| Evidence review | Trusts vague summaries | Asks Teacher whether it is done | Checks file/log/diff/test with guidance | Names the evidence needed and summarizes results |
| Reflection and transfer | Cannot restate the lesson | Repeats definitions | Explains using the lesson example | Transfers the skill to another marketing/content scenario |

## Module 0 Mastery Gate

The learner passes Module 0 when all are true:

- Scores 2 or higher on 4 of 6 skills.
- No skill is at 0.
- Writes a first prompt asking Codex to inspect the repo before editing.
- Correctly classifies at least 4 of 5 actions: read-only, file edit, network, dependency install, destructive action.
- Explains the difference between Teacher and Executor in a short paragraph.

## Feedback Examples

### Passing

"You passed Module 0. Evidence: your inspection prompt has goal/context/constraints/done-when, you classified the main approval risks correctly, and you explained when to use Teacher vs Executor. Next is Module 1: create the first Brand Brain."

### Nearly Passing

"You are close. The skill to practice is approval awareness: you recognized file edits, but missed that network and dependency installation also need a pause. We'll do a 3-minute classification drill before Module 1."

### Not Passing Yet

"We should not move on yet if the safety habit is still shaky. That's okay. Let's return to the first prompt: what should Codex read, what must it not do, and what evidence proves inspection is complete?"

