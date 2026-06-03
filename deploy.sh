#!/usr/bin/env bash
# Lazarus deploy script.
#
# Run ON THE SERVER as the `deploy` user, from the app directory:
#     cd /opt/vrroom/lazarus && ./deploy.sh
#
# It pulls the latest code, installs deps, syncs the DB schema, builds, and
# restarts the pm2 process — then checks health. The repo's origin is the
# GitHub remote (git@github.com:hostirian-blip/lazarus.git) authenticated via
# the deploy key configured in core.sshCommand.
#
# (During development the working copy is edited elsewhere and synced with:
#     tar czf - <paths> | ssh do-droplet 'tar xzf - -C /opt/vrroom/lazarus'
#  then this script is run on the server.)
set -euo pipefail
cd "$(dirname "$0")"

echo "==> git pull"
git pull --ff-only || echo "(skipping pull — not fast-forward or no upstream)"

echo "==> install dependencies"
npm ci || npm install

echo "==> prisma generate + db push"
npx prisma generate
npx prisma db push

echo "==> typecheck + lint + build"
npm run typecheck
npm run lint
npm run build

echo "==> restart (pm2)"
pm2 restart lazarus --update-env

echo "==> health check"
sleep 2
curl -fsS http://127.0.0.1:3001/api/health && echo "  ... OK"
echo "Deploy complete."
