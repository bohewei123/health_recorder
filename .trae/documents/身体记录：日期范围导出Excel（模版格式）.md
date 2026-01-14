## 需求拆解
- 在“身体记录”模块增加：选择日期范围 → 导出 Excel。
- Excel 的第一个工作表按你提供的模版排版（表头、按日期分组列、按时段列、行名），字段以系统现有字段为准。

## 导出格式设计（Excel）
- **Sheet 1：身体感觉和活动日志（模版样式）**
  - 列结构：A 列为“行名”，后续按日期分组，每个日期占 4 列（起床/上午/下午/晚上）。
  - 表头：
    - 第 1 行合并为标题“身体感觉和活动日志”。
    - 第 2 行：A 列“日期”，每个日期对应 4 列合并显示日期。
    - 第 3 行：A 列“时间”，每个日期下重复 4 个时段。
  - 行内容（按当前系统字段映射）：
    - 按**时段**填值（每个日期 4 个格子分别填起床/上午/下午/晚上）：
      - 疼痛感觉（0–10）→ `pain_level`
      - 头晕感觉（0–10）→ `dizziness_level`
      - 情绪状态（0–10）→ `mood_level`
      - 描述身体感觉 → `body_feeling_note`
    - 按**日期**填值（每个日期 4 列合并为一个单元格）：
      - 前夜睡眠情况 → `sleep_note`
      - 当日身体活动情况 → `daily_activity_note`
      - 加重疼痛的活动 → `pain_increasing_activities`
      - 减轻疼痛的活动 → `pain_decreasing_activities`
      - 加重头晕的活动 → `dizziness_increasing_activities`
      - 减轻头晕的活动 → `dizziness_decreasing_activities`
      - 是否使用药物 → `medication_used`（是/否）
      - 用药说明 → `medication_note`
    - 其余系统字段（例如胃/咽喉/干眼/疲劳等日期级评分，以及 notes/triggers/interventions 里的其他项）会放在 Sheet 2，不强行塞进模版主表，避免破坏你提供的版式。
  - 样式：合并单元格、居中、自动换行、列宽/行高、细边框（接近截图的表格感）。

- **Sheet 2：明细（全字段）**
  - 每行一条“日期+时段”记录，导出系统返回的所有字段（包含日期级字段、可选症状评分、notes/triggers/interventions 等），便于后续分析与避免信息丢失。

## 后端实现（推荐后端生成 Excel，以支持模版样式）
- 新增依赖：`openpyxl`（用于合并单元格、边框、对齐等样式）。
- 新增接口：`GET /api/records/export_excel?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD`
  - 读取范围内的 `daily_records`（按时段字段）与 `daily_summaries`（按日期字段），组装成导出数据。
  - 生成 xlsx 并以文件流返回（正确的 content-type 与下载文件名）。
  - 兼容旧时段别名：早起时→起床，中午→下午；缺失时段/缺失日期级数据时留空。

## 前端实现（日期范围选择与下载）
- 在历史记录页 [History.jsx](file:///Users/zhilinyang/Desktop/health_recorder/frontend/src/pages/History.jsx) 增加：
  - `RangePicker` 选择开始/结束日期（默认最近 7 天或最近 30 天）。
  - “导出 Excel”按钮：调用后端导出接口，`responseType: 'blob'`，并触发浏览器下载。
  - 保留现有 CSV 导出不变。

## 验证方式
- 后端：用临时 SQLite 数据构造 2–3 天、多个时段与日期级字段，调用导出函数生成 xlsx，校验：
  - Sheet1 的标题/日期合并/时段列数量正确；
  - 按时段字段只出现在对应时段格；按日期字段跨 4 列合并且值一致；
  - Sheet2 行数与字段齐全。
- 前端：实际选择一个范围导出，确认文件能下载并能在 Excel/WPS 打开。

确认后我会按以上方案开始写代码（后端接口 + 前端按钮 + Excel 样式与双 Sheet 导出）。