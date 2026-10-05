#!/bin/bash
# The worktree's v7 ms_ai, calling tools back on an ms_api; vite dev needs a pty.
# `ai.sh` = :13007 → staging ms_api :2044; `ai.sh 13008 2034` = the stub's own pair.
RIG=$(cd "$(dirname "$0")" && pwd)
export AI_PORT=${1:-13007} API_PORT=${2:-2044}
. "$RIG/env.sh"
cd "$WORKTREE/ms_ai"
set -a; . ./.env >/dev/null 2>&1; set +a
. "$RIG/env.sh"
export LANGFUSE_BASEURL=http://127.0.0.1:9
tail -f /dev/null | script -q "$OUT/ai-$AI_PORT.log" node node_modules/vite/bin/vite.js dev --config vite.local.config.ts --port $AI_PORT --strictPort
