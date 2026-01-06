#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="${ROOT_DIR}/backend"
FRONTEND_DIR="${ROOT_DIR}/frontend"

BACKEND_PORT="${BACKEND_PORT:-8000}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"

backend_pid=""
frontend_pid=""

cleanup() {
  if [[ -n "${backend_pid}" ]] && kill -0 "${backend_pid}" >/dev/null 2>&1; then
    kill "${backend_pid}" >/dev/null 2>&1 || true
  fi
  if [[ -n "${frontend_pid}" ]] && kill -0 "${frontend_pid}" >/dev/null 2>&1; then
    kill "${frontend_pid}" >/dev/null 2>&1 || true
  fi
  wait >/dev/null 2>&1 || true
}

trap cleanup EXIT INT TERM

if [[ ! -d "${BACKEND_DIR}" ]]; then
  echo "找不到 backend/ 目录：${BACKEND_DIR}"
  exit 1
fi

if [[ ! -d "${FRONTEND_DIR}" ]]; then
  echo "找不到 frontend/ 目录：${FRONTEND_DIR}"
  exit 1
fi

if [[ ! -x "${BACKEND_DIR}/venv/bin/python" ]]; then
  (cd "${BACKEND_DIR}" && python3 -m venv venv)
fi

(cd "${BACKEND_DIR}" && ./venv/bin/pip install -r requirements.txt)

if [[ ! -d "${FRONTEND_DIR}/node_modules" ]]; then
  (cd "${FRONTEND_DIR}" && npm install)
fi

echo "后端：http://localhost:${BACKEND_PORT}"
echo "前端：http://localhost:${FRONTEND_PORT}"
echo "API 文档：http://localhost:${BACKEND_PORT}/docs"
echo "按 Ctrl+C 退出"

(cd "${BACKEND_DIR}" && ./venv/bin/python -m uvicorn app.main:app --reload --port "${BACKEND_PORT}") &
backend_pid="$!"

(cd "${FRONTEND_DIR}" && npm run dev -- --port "${FRONTEND_PORT}") &
frontend_pid="$!"

wait

