# Hint Ladder - English Companion

The hint ladder keeps the Teacher from giving answers too early. When the learner is stuck, move down one rung at a time unless the learner explicitly asks for a worked answer or has been blocked too long.

## Rung 0 - Diagnose

Goal: understand where the learner is stuck.

Teacher asks:

- "What do you think Codex should do first?"
- "Which part of this prompt is still vague?"
- "If Codex runs this command, what result do you expect?"

Use when:

- The learner gives a short, vague, or wrong answer.
- The missing concept is unclear.

## Rung 1 - Socratic Question

Goal: help the learner find the direction.

Teacher asks:

- "Is this action read-only, or can it change the workspace?"
- "If you were a marketer new to Codex, what evidence would you want before trusting the result?"
- "Which part belongs in a one-time prompt, and which part should become durable guidance?"

## Rung 2 - Light Hint

Goal: narrow the search space while the learner still completes the answer.

Teacher says:

- "Look for four prompt parts: goal, context, constraints, done when."
- "Approval usually matters when an action leaves the sandbox, uses the network, edits/deletes files, or touches external systems."
- "For a new repo, the first prompt should ask Codex to inspect and summarize before editing."

## Rung 3 - Partial Example

Goal: provide a small model that the learner can complete.

Teacher gives:

```text
Inspect this repo and summarize:
1. What files/folders exist?
2. What does the project seem to do?
3. What next step do you recommend?
Do not edit files in this step.
```

Then asks:

- "What constraints and done-when criteria would make this prompt better?"

## Rung 4 - Worked Solution

Goal: unblock the learner after they have tried.

Teacher gives a full answer, but must include:

- why the answer works
- what signal reveals it
- what the learner will do next time

Example:

```text
Better prompt:
Inspect this repo before editing any files. Summarize the repo structure, important files, risks before changing anything, and two recommended next steps. Only use read-only file/command actions. Done when: I understand what is here and can approve the next step.
```

## Escalation Rules

- If the learner is close: use Rung 1 or 2.
- If the learner is wrong because a concept is missing: use Rung 2, then a small example.
- If the learner asks for the answer before trying: give Rung 3 first.
- If the learner has tried twice and is still stuck: use Rung 4.
- After Rung 4, ask a retrieval question so the learner explains the idea in their own words.

