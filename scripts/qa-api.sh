#!/usr/bin/env bash
# QA API — flujos con usuarios demo (API en :3000)
set -euo pipefail

BASE="${QA_API_BASE:-http://localhost:3000}"
failures=0

login() {
  local email="$1"
  curl -sS -X POST "$BASE/auth/login" \
    -H 'Content-Type: application/json' \
    -d "{\"email\":\"$email\",\"password\":\"123456\"}" \
    | python3 -c 'import sys,json; print(json.load(sys.stdin)["access_token"])'
}

get_auth() {
  local token="$1" path="$2"
  curl -sS "$BASE$path" -H "Authorization: Bearer $token"
}

post_auth() {
  local token="$1" path="$2" body="${3:-{}}"
  curl -sS -X POST "$BASE$path" \
    -H "Authorization: Bearer $token" \
    -H 'Content-Type: application/json' \
    -d "$body"
}

assert_ok() {
  local name="$1"
  shift
  if "$@"; then
    echo "OK $name"
  else
    echo "FAIL $name" >&2
    failures=$((failures + 1))
  fi
}

echo "=== Dojapp QA API ($BASE) ==="

assert_ok 'health/db' bash -c '
  db=$(curl -sS "'"$BASE"'/health/db")
  echo "$db" | grep -qi connected
'

studentToken=""
senseiToken=""
adminToken=""
dojoId=""
contentId=""

assert_ok 'login demo users' bash -c '
  studentToken=$(login alumno@dojo.cl)
  senseiToken=$(login sensei@dojo.cl)
  adminToken=$(login admin@dojo.cl)
  test -n "$studentToken" && test -n "$senseiToken" && test -n "$adminToken"
  # export for later steps via temp files
  printf "%s" "$studentToken" > /tmp/dojapp_qa_student.token
  printf "%s" "$senseiToken" > /tmp/dojapp_qa_sensei.token
  printf "%s" "$adminToken" > /tmp/dojapp_qa_admin.token
'

studentToken=$(cat /tmp/dojapp_qa_student.token 2>/dev/null || true)
senseiToken=$(cat /tmp/dojapp_qa_sensei.token 2>/dev/null || true)
adminToken=$(cat /tmp/dojapp_qa_admin.token 2>/dev/null || true)

assert_ok 'student contents' bash -c '
  contents=$(get_auth "'"$studentToken"'" /students/me/contents)
  echo "$contents" | python3 -c "import sys,json; d=json.load(sys.stdin); n=sum(len(x.get(\"contents\",[])) for x in d); raise SystemExit(0 if n>=2 else 1)"
'

assert_ok 'professor dojos' bash -c '
  dojos=$(get_auth "'"$senseiToken"'" /dojos/mine)
  echo "$dojos" | python3 -c "import sys,json; d=json.load(sys.stdin); raise SystemExit(0 if len(d)>=1 else 1)"
  echo "$dojos" | python3 -c "import sys,json; print(json.load(sys.stdin)[0][\"id\"])" > /tmp/dojapp_qa_dojo.id
'

dojoId=$(cat /tmp/dojapp_qa_dojo.id 2>/dev/null || true)

assert_ok 'attendance save' bash -c '
  attDate=$(date +%F)
  att=$(get_auth "'"$senseiToken"'" "/dojos/'"$dojoId"'/attendance?date=$attDate")
  body=$(echo "$att" | python3 -c "import sys,json,os; d=json.load(sys.stdin); day=os.environ.get(\"D\",\"\");
import json as J; print(J.dumps([{\"userId\":x[\"userId\"],\"present\":True,\"date\":\"'"$attDate"'\"} for x in d]))")
  post_auth "'"$senseiToken"'" "/dojos/'"$dojoId"'/attendance" "$body" >/dev/null
'

assert_ok 'dojo metrics' bash -c '
  metrics=$(get_auth "'"$senseiToken"'" "/metrics/dojos/'"$dojoId"'/metrics")
  test -n "$metrics"
'

assert_ok 'admin stats' bash -c '
  stats=$(get_auth "'"$adminToken"'" /admin/stats)
  echo "$stats" | python3 -c "import sys,json; d=json.load(sys.stdin); raise SystemExit(0 if d.get(\"users\",0)>=3 else 1)"
'

rm -f /tmp/dojapp_qa_student.token /tmp/dojapp_qa_sensei.token /tmp/dojapp_qa_admin.token /tmp/dojapp_qa_dojo.id

echo
if [ "$failures" -eq 0 ]; then
  echo "=== QA API completado sin fallos ==="
  exit 0
fi

echo "=== QA API falló ($failures) ===" >&2
exit 1
