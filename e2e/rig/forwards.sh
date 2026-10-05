#!/bin/bash
# Staging service forwards for the rig, each on 30000+<service port>; a dropped forward reconnects.
CTX=arn:aws:eks:us-east-1:654654251344:cluster/staging
forward() {
  while true; do
    kubectl --context "$CTX" -n app port-forward --address 127.0.0.1 "svc/$1" "$2:80"
    echo "[$(date +%T)] forward $1:$2 exited, reconnecting" >&2
    sleep 2
  done
}
forward customers 38500 &
forward detection 38050 &
forward alert 37000 &
forward snapshot 34000 &
forward account 38000 &
forward paths 36500 &
forward standards 41000 &
forward views 42000 &
forward cost 33057 &
trap 'kill $(jobs -p) 2>/dev/null; pkill -f "port-forward --address 127.0.0.1 svc/.* 3[0-9]{4}:80"; exit' INT TERM
wait
