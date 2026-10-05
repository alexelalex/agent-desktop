#!/bin/bash
# The worktree's ms_api on :2044 (2024 is hardcoded and often taken), schedulers suppressed.
RIG=$(cd "$(dirname "$0")" && pwd)
. "$RIG/env.sh"
cd "$WORKTREE/ms_api"
export NODE_ENV=development LISTEN_PORT=2044
exec node --require "$RIG/no-schedulers.cjs" \
  --import "$RIG/listen-port.mjs" --import tsx src/index.ts
