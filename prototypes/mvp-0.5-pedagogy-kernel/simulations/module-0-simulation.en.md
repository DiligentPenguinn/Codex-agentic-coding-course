# Module 0 Simulation Script - Orientation: Use Codex As A Work Partner

This script dry-runs Teacher behavior inside Codex. It is not meant to create new code. The Teacher should call Executor only when repo inspection or a read-only command demonstration is useful.

## Default Inputs

- Learner: marketer/content creator new to Codex.
- Suggested time: 20 minutes.
- Learner state: none.
- Language: Vietnamese.
- Session artifact: a first prompt asking Codex to inspect the repo before editing.

## Flow

| Step | Time | Goal | Artifact |
| --- | ---: | --- | --- |
| 1. Scenario | 3 min | Set roles for Teacher/Executor/Learner | Learner names session goal |
| 2. First thread | 5 min | Write a read-only repo inspection prompt | First prompt |
| 3. Safe execution | 5 min | Classify approval risk | Five-action classification |
| 4. Teacher vs Executor | 4 min | Distinguish explanation from action | Two sample requests |
| 5. Exit ticket | 3 min | Run a light mastery gate | Exit-ticket answer |

## Step 1 - Scenario

Teacher says briefly:

"Today we will treat Codex as a technical work partner. You are the decision-maker; Teacher helps you understand and give clear instructions; Executor acts only when needed. The 20-minute goal: you can write a first prompt asking Codex to inspect the repo before editing any file."

Teacher asks:

"If you only have 20 minutes, what would you like to leave with: understanding what is in this repo, or a reusable first prompt?"

Evidence:

- Learner chooses a goal or accepts the default.

## Step 2 - First Thread: Repo Inspection Before Edits

Teacher asks for prediction:

"Before letting Codex do anything in a new repo, what do you think the first action should be?"

If the learner is vague, use hint ladder Rung 1-2.

Teacher asks the learner to write a prompt with four parts:

- Goal
- Context
- Constraints
- Done when

Worked example if Rung 4 is needed:

```text
Inspect this repo before editing any files. Summarize the repo structure, important files, what the project seems to do, and two recommended next steps. Use read-only actions only. Done when: I understand what is here and can approve the next step.
```

If calling Executor to inspect the repo, Teacher must say:

- "This action is read-only."
- "Risk is low: it only reads files and lists structure."
- "What files do you predict we will see?"
- "I will not edit files in this step."

Evidence:

- Learner creates an inspection prompt with goal/context/constraints/done-when.

## Step 3 - Safe Execution And Approvals

Teacher gives classification quiz:

"Mark which actions need an approval pause:"

1. List files in the repo.
2. Read README.
3. Edit `README.md`.
4. Install a package from the internet.
5. Delete an old build folder.

Expected answer:

- 1 read-only, usually safe.
- 2 read-only, usually safe.
- 3 file edit, requires clear purpose and should be approved in the lesson.
- 4 network/dependency install, requires approval.
- 5 destructive action, requires explicit approval.

Evidence:

- Learner classifies at least 4 of 5 correctly.

## Step 4 - Teacher vs Executor

Teacher explains briefly:

"Ask Teacher when you need understanding, strategy, or a thinking check. Ask Executor when you want Codex to read, edit, run commands, create files, or test."

Teacher asks:

"Write two separate requests:
1. A Teacher request for explanation.
2. An Executor request for a read-only action."

Passing example:

```text
Teacher: Explain why we should inspect a repo before editing files.
Executor: List files in the repo and summarize README, without editing files.
```

Evidence:

- Learner writes two requests with the correct purpose.

## Step 5 - Exit Ticket

Teacher asks:

1. What is your first repo-inspection prompt?
2. If Codex wants to install a dependency, what do you do before approving?
3. What is the difference between Teacher and Executor?

Pass if:

- Prompt includes read-before-write and done-when.
- Learner says they need purpose, risk, and approval before dependency installation.
- Learner distinguishes coaching/explanation from execution/read-edit-run.

