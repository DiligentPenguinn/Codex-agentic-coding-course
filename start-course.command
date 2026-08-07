#!/bin/zsh

set -u

COURSE_ROOT="$(cd -- "$(dirname -- "$0")" && pwd -P)"
STARTUP_SCRIPT="$COURSE_ROOT/scripts/macos-course-startup.mjs"

if [[ "$(uname -s)" != "Darwin" ]]; then
  print -u2 "This launcher is for macOS."
  print -u2 "Use the platform-specific startup command for this computer."
  exit 3
fi

if ! command -v node >/dev/null 2>&1; then
  print -u2 "Course Companion needs Node.js 22 or newer."
  print -u2 "Download it from https://nodejs.org/en/download, then run this launcher again."
  exit 3
fi

exec node "$STARTUP_SCRIPT" "$@"
