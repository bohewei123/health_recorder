# 🏥 慢性健康状况追踪 (Health Recorder) - v2.0

这是一个现代化的个人健康追踪应用，采用前后端分离架构，旨在帮助用户记录每日身体状况、追踪慢性症状变化趋势，并管理康复训练计划。

> **注意**: 旧版 Streamlit 应用已移动至 `legacy/` 目录。

## ✨ 主要功能

### 1. 📝 每日健康记录

- **症状追踪**：支持记录多种症状的严重程度（0-10 分），包括肩颈疼痛、头晕、胃部不适等。
- **详细反馈**：记录具体的感受、诱因及应对措施。
- **响应式设计**：完美支持手机和桌面端访问。

### 2. 🧘 康复训练管理

- **训练反馈**：记录每日康复动作的完成情况和感受。
- **项目管理**：动态配置训练项目。
- **数据导出**：支持导出训练反馈。

### 3. 📈 数据可视化与分析

- **趋势图表**：交互式折线图展示症状变化趋势。
- **历史记录**：查看和管理所有历史数据。

### 4. 📚 慢性疼痛管理课程学习笔记

- **Markdown 笔记**：支持标题、列表、链接、代码块等基础语法，并提供实时预览。
- **笔记管理**：自动记录创建/最后修改时间，按日期排序，支持日期范围筛选。
- **本地存储**：所有笔记保存在浏览器本地（localStorage），支持导出为 Markdown 文件。

### 5. 🌗 主题切换

- **暗黑/明亮模式**：支持一键切换并持久化保存偏好设置。

## 🛠️ 技术栈 (v2.0)

- **Frontend**: React.js, Vite, Ant Design, Redux Toolkit, Recharts
- **Backend**: FastAPI, Python, SQLite (Pydantic Models)

## 🚀 快速开始

详细部署指南请参考 [DEPLOYMENT.md](DEPLOYMENT.md)。

### 一键启动（推荐开发方式）

在项目根目录执行：

```bash
chmod +x dev.sh         # 仅首次需要
./dev.sh
```

脚本会自动：

- 为后端创建/使用虚拟环境并安装依赖
- 为前端安装依赖（如未安装）
- 启动 FastAPI 后端（默认端口 `8000`）
- 启动 React 前端开发服务器（默认端口 `3000`）

环境变量：

- `BACKEND_PORT`：自定义后端端口（默认 `8000`）
- `FRONTEND_PORT`：自定义前端端口（默认 `3000`）

启动后可以访问：

- 前端页面：http://localhost:3000
- 后端 API：http://localhost:8000
- API 文档：http://localhost:8000/docs

### 手动启动（可选）

#### 后端 (Backend)

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

#### 前端 (Frontend)

```bash
cd frontend
npm install
npm run dev
```

## 📂 项目结构

```
health_recorder/
├── backend/                # FastAPI 后端
│   ├── app/
│   │   ├── api/            # API 路由
│   │   ├── services/       # 业务逻辑
│   │   ├── db/             # 数据库操作
│   │   └── schemas/        # Pydantic 模型
│   └── requirements.txt
├── frontend/               # React 前端
│   ├── src/
│   │   ├── components/     # UI 组件
│   │   ├── pages/          # 页面
│   │   ├── store/          # Redux 状态管理
│   │   └── constants.js    # 配置常量
├── legacy/                 # 旧版 Streamlit 应用
├── API_DOCS.md             # API 文档
├── DEPLOYMENT.md           # 部署指南
└── DESIGN.md               # 设计文档
```
