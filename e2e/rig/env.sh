# Shared by api.sh and ai.sh: fresh non-prod SSO creds and the forwarded staging services.
# AI_PORT/API_PORT pick which ms_ai and which ms_api (tool callbacks) the pair uses.
AI_PORT=${AI_PORT:-13007} API_PORT=${API_PORT:-2044}
WORKTREE=${LIGHTLYTICS_WORKTREE:-$HOME/git/lightlytics-worktrees/ai-sdk-v7-demo-chat}
OUT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/.out; mkdir -p "$OUT"
eval "$(aws configure export-credentials --profile ${AWS_SSO_PROFILE:-RND_Non_Prod-654654251344} --format env)"
export AWS_REGION=us-east-1
export NODE_CONFIG='{"services":{"ai":{"host":"127.0.0.1","port":'$AI_PORT'},"api":{"host":"127.0.0.1","port":'$API_PORT'},"customers":{"host":"127.0.0.1","port":38500},"detection":{"host":"127.0.0.1","port":38050},"events":{"host":"127.0.0.1","port":37000},"snapshot":{"host":"127.0.0.1","port":34000},"accounts":{"host":"127.0.0.1","port":38000},"paths":{"host":"127.0.0.1","port":36500},"standards":{"host":"127.0.0.1","port":41000},"views":{"host":"127.0.0.1","port":42000},"cost":{"host":"127.0.0.1","port":33057}}}'
export API_SERVICE_HOST=127.0.0.1 API_SERVICE_PORT=$API_PORT
export CUSTOMERS_SERVICE_HOST=127.0.0.1 CUSTOMERS_SERVICE_PORT=38500
export DETECTION_SERVICE_HOST=127.0.0.1 DETECTION_SERVICE_PORT=38050
export ALERT_SERVICE_HOST=127.0.0.1 ALERT_SERVICE_PORT=37000
export SNAPSHOT_SERVICE_HOST=127.0.0.1 SNAPSHOT_SERVICE_PORT=34000
export ACCOUNT_SERVICE_HOST=127.0.0.1 ACCOUNT_SERVICE_PORT=38000
export PATHS_SERVICE_HOST=127.0.0.1 PATHS_SERVICE_PORT=36500
export STANDARDS_SERVICE_HOST=127.0.0.1 STANDARDS_SERVICE_PORT=41000
export VIEWS_SERVICE_HOST=127.0.0.1 VIEWS_SERVICE_PORT=42000
export COST_SERVICE_HOST=127.0.0.1 COST_SERVICE_PORT=33057
