#!/usr/bin/env bash
set -euo pipefail

D='/opt/agent-build/current/.vitepress/dist'
T='/tmp/agent-build-dist-aliyun-manual.tgz'
S='/tmp/agent-build-stage-aliyun-manual-20260617090102'
TS="$(date +%Y%m%d%H%M%S)"

rm -rf "$S"
mkdir -p "$S"
tar -xzf "$T" -C "$S"
test -f "$S/index.html"
chmod -R a+rX "$S"
mkdir -p "$(dirname "$D")"
if [ -e "$D" ]; then
  mv "$D" "${D}.bak.${TS}"
fi
mv "$S" "$D"
rm -f "$T"

echo "ROLLBACK_BACKUP=${D}.bak.${TS}"
echo "FILE_COUNT=$(find "$D" -type f | wc -l)"

for p in '' 'lessons/04-the-agent-loop/' 'lessons/07-short-term-memory/' 'rag-advanced/02-hybrid-search/'; do
  code="$(curl -sk -o /dev/null -w '%{http_code}' -H 'Host: songuu.top' "https://127.0.0.1/agent-build/${p}")"
  echo "/agent-build/${p} -> ${code}"
  test "$code" = '200'
done

loop_scene="$(curl -sk -H 'Host: songuu.top' 'https://127.0.0.1/agent-build/lessons/04-the-agent-loop/' | grep -c concept-visual-canvas--loop || true)"
echo "loop_scene=${loop_scene}"
test "$loop_scene" != '0'
