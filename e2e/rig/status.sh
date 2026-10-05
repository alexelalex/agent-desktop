#!/bin/bash
# Reports each part of the rig as up or down, with the command that starts it.
E2E=$(cd "$(dirname "$0")/.." && pwd)
check() {
  if lsof -nP -iTCP:"$1" -sTCP:LISTEN >/dev/null 2>&1; then printf 'up    %-6s %s\n' "$1" "$2"
  else printf 'DOWN  %-6s %s — start: %s\n' "$1" "$2" "$3"; fi
}
for p in 38500 38050 37000 34000 38000 36500 41000 42000 33057; do
  check $p "staging forward" "$E2E/rig/forwards.sh"
done
check 2044 "ms_api (worktree, staging)" "$E2E/rig/api.sh"
check 13007 "ms_ai → ms_api :2044" "$E2E/rig/ai.sh"
check 13008 "ms_ai → stub :2034" "$E2E/rig/ai.sh 13008 2034"
for p in 2034 2035 2036 2037; do
  check $p "stub tenant" "node $E2E/stub.mjs"
done
check 2525 "SMTP sink" "node $E2E/smtp-sink.mjs"
