# Portfolio Course Vercel Rehearsal — 16 August 2026

- **Status:** Rehearsal complete; provider-flow decision pending owner approval
- **Scope:** Disposable Vite applications, a temporary private GitHub repository,
  and temporary Vercel projects only
- **Course repository:** Not pushed or deployed
- **Observed platform:** macOS 26.5.2 on Apple silicon; Windows runtime remains
  unverified

## Purpose

This M4.0 spike tested the current Git-connected Vercel dashboard flow and the
smallest CLI-based alternatives before learner-facing Module 4 content is
written. It records observed behavior rather than assuming that a Preview URL
is private or that a command without `--prod` can never affect Production.

## Disposable evidence

### Git-connected dashboard flow

1. A neutral React, TypeScript, and Vite application passed its local build.
2. A private GitHub repository was created for the disposable source.
3. Vercel login required the account's two-factor authentication.
4. The existing Vercel GitHub App installation did not automatically include
   the new private repository. GitHub sudo-mode verification was required
   before access could be expanded to that repository only.
5. Importing the repository from `main` created the project's first deployment
   as **Production**. It did not create a Preview-first project.
6. Pushing a separate `preview-rehearsal` branch then created a Preview
   deployment. The deployment detail reported:
   - environment `Preview`;
   - status `Ready`;
   - source branch and commit;
   - build duration of five seconds;
   - visible build logs for clone, dependency installation, and
     `npm run build`.
7. The project used Vercel Authentication with `Require Log In` enabled and
   `Standard Protection`. The dashboard explained that visitors must be logged
   in to Vercel and belong to the team.
8. The live Preview rendered the expected content at `1440 x 900` and
   `390 x 844`. At the mobile viewport, both body and document scroll widths
   were 390 pixels. No warning or error attributable to the deployed page was
   present in the filtered browser console.

### CLI linked-project flow

The current CLI was run temporarily through `npx`; the observed version was
59.1.3. Device authorization required a browser approval. After the disposable
folder was linked to the existing temporary Vercel project:

- `vercel deploy --yes --logs` created a Preview;
- `vercel inspect` reported `target preview` and `Ready`;
- build output showed the Vite build command and a ready deployment;
- `vercel curl` generated a temporary protection bypass and returned the
  deployed HTML without making the Preview public.

Linking also created local Vercel metadata and an environment file, and updated
the ignore rules. Module 4 must treat these as deployment side effects, prevent
credentials from entering Git, and explain which local files are retained or
removed during recovery.

### CLI-only new-project flow

A second clean Vite application tested whether CLI alone could create a new
project without touching Production.

1. The local Vite build passed.
2. The first `vercel deploy` created the project successfully, but Vercel
   assigned that first deployment to **Production** and created the stable
   project alias. The CLI explicitly reported `target production` and stated
   that the first deployment receives Production even without `--prod`.
3. A second `vercel deploy` created a Preview. `vercel inspect` reported
   `target preview` and `Ready`.
4. An anonymous HTTP check reached the stable Production URL directly, while
   the Preview URL redirected to the Vercel login flow. This matches the
   observed Standard Protection scope: the Preview was protected, while the
   current Production domain remained public.

The provider's current first-deployment behavior means that neither dashboard
import nor CLI-only project creation can satisfy a literal "new project with no
Production deployment" contract. A safe beginner path must acknowledge and
control that bootstrap deployment rather than describing Vercel as Preview-only
from the first action.

## Cleanup and recovery evidence

- Both temporary Vercel projects and all of their deployments were removed with
  the CLI. The first project's absence was also verified in the team dashboard.
- The temporary private GitHub repository was permanently deleted, and GitHub
  confirmed the deletion.
- Both temporary local directories were deleted.
- The temporary CLI sessions were logged out.
- No existing Vercel project, domain, production deployment, or course remote
  was changed.

The deleted remote projects, deployments, repository, and temporary local
directories are not recoverable through this workspace. They contained only
disposable neutral rehearsal material.

## Observed comparison

| Concern | Git-connected dashboard | CLI-first |
|---|---|---|
| New-project first deployment | Production from `main` | Production even without `--prod` |
| Actual portfolio Preview | Requires a non-production branch push | Second deployment is Preview |
| Private GitHub permission | GitHub App access and possible sudo verification | Not required |
| Login | Vercel 2FA | Vercel device authorization |
| Logs and target | Clear in deployment detail | Clear in command output and `vercel inspect` |
| Preview verification | Open URL and inspect dashboard | `vercel inspect`, `vercel curl`, and open URL |
| Protection evidence | Project setting plus live login requirement | Inspect setting and compare anonymous URL behavior |
| Recovery | Delete project in dashboard or CLI | `vercel remove` with explicit approval |
| Beginner risk | Git permissions and `main` can publish the portfolio immediately | First deployment still publishes whatever bootstrap source is used |

## Recommended decision for approval

Use a **Codex-operated CLI flow with a neutral bootstrap deployment** as the
primary Module 4 path:

1. Pass local release checks and the privacy checklist.
2. Explain and obtain approval for all external and local side effects.
3. Create the new Vercel project from a disposable page containing no learner
   identity, portfolio content, credentials, or private assets. Vercel will
   label this public bootstrap as Production.
4. Verify or enable Vercel Authentication with Standard Protection before the
   real portfolio is uploaded.
5. Link the learner's portfolio folder to that project, inspect the generated
   local files, and confirm that secrets remain ignored.
6. Deploy the real portfolio with CLI, without `--prod`.
7. Require `vercel inspect` to report `target preview` and `Ready`, inspect the
   logs, open the Preview, repeat desktop/mobile and critical behavior checks,
   and verify that anonymous access is blocked or explicitly approved.
8. Keep portfolio Production publication as a separate optional decision.

Use the dashboard as the recovery and inspection route: verify protection,
read deployment status and logs, and remove the project if the learner declines
the bootstrap exposure or cannot establish safe Preview protection.

This recommendation avoids GitHub App permission work and prevents the
learner's actual portfolio from becoming the unavoidable first public
Production deployment. Its tradeoff is an explicit, temporary, publicly
reachable neutral bootstrap page. The learner must approve that exposure; if
they decline, Module 4 should stop rather than silently publish the portfolio.

## Remaining verification risk

The full flow was observed only on macOS. The recommended commands avoid
OS-specific shell syntax, but Module 4 still needs a Windows rehearsal before
the release candidate can claim Windows support.

## Current official references

- [Vercel deployment environments](https://vercel.com/docs/deployments/environments)
  documents the normal Preview behavior for CLI deployments without `--prod`.
- [Vercel domain deployment behavior](https://vercel.com/docs/domains/working-with-domains/deploying-and-redirecting)
  documents the important exception that a new project's first deployment is
  marked Production.
- [Deploying a project from the CLI](https://vercel.com/docs/projects/deploy-from-cli)
  documents the ongoing `vercel deploy`, `vercel inspect`/logs, and explicit
  `vercel deploy --prod` workflow after the project exists.
- [Vercel Deployment Protection](https://vercel.com/docs/deployment-protection)
  documents that Hobby Standard Protection covers Preview and deployment URLs
  while the up-to-date Production domain remains public.
