#!/usr/bin/env bash
# 发布到 reader-server：同步游戏文件并重启服务（data/ 目录中的账号与存档不会被覆盖）
# 首次部署加参数 --init：安装 systemd 服务、Nginx 站点并申请 HTTPS 证书
set -euo pipefail
cd "$(dirname "$0")/.."
HOST=${HOST:-reader-server}
APP=/opt/apps/mhxy
FILES="index.html style.css src assets server.js deploy"

node --test tests/game.test.mjs tests/server.test.cjs
ssh "$HOST" "sudo mkdir -p $APP/data && sudo chown -R ubuntu:ubuntu $APP"
# 先清掉旧版本的程序文件（只删下面列出的路径，data/ 中的账号与存档不受影响）
ssh "$HOST" "cd $APP && rm -rf index.html style.css src assets server.js deploy classic.css classic.js world.js cloud.js"
tar -cf - $FILES | ssh "$HOST" "tar -xf - -C $APP"

if [ "${1:-}" = "--init" ]; then
  ssh "$HOST" "set -e
    sudo install -m 755 $APP/deploy/mhxy-deploy /usr/local/bin/mhxy-deploy
    sudo cp $APP/deploy/app-mhxy.service /etc/systemd/system/app-mhxy.service
    sudo systemctl daemon-reload && sudo systemctl enable --now app-mhxy
    if [ ! -f /etc/nginx/sites-available/mhxy.liyucheng.me ]; then   # 已存在则保留 certbot 写入的 HTTPS 配置
      sudo cp $APP/deploy/mhxy.liyucheng.me.nginx /etc/nginx/sites-available/mhxy.liyucheng.me
      sudo ln -sf /etc/nginx/sites-available/mhxy.liyucheng.me /etc/nginx/sites-enabled/mhxy.liyucheng.me
      sudo nginx -t && sudo systemctl reload nginx
      sudo certbot --nginx -d mhxy.liyucheng.me --non-interactive --redirect
    fi"
fi
ssh "$HOST" "sudo systemctl restart app-mhxy && sleep 1 && systemctl is-active app-mhxy && curl -fsS http://127.0.0.1:4195/api/me"
echo; echo "已发布：https://mhxy.liyucheng.me"
