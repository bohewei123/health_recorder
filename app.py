import streamlit as st
import pandas as pd
import plotly.express as px
from datetime import date, datetime
from db_manager import DBManager
import json
import random
import re
import uuid
import io

# Page Config
st.set_page_config(page_title="Health Tracker", page_icon="🏥", layout="wide")

# Custom CSS for Warm Theme
st.markdown("""
<style>
    /* Import Google Fonts */
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&family=Nunito:wght@400;700&display=swap');

    /* Global Styles */
    .stApp {
        background-color: #FAFAF5;
        font-family: 'Nunito', 'Noto Sans SC', sans-serif;
    }
    
    h1, h2, h3 {
        color: #5D576B !important;
        font-family: 'Noto Sans SC', sans-serif;
        font-weight: 700;
    }
    
    /* Buttons */
    .stButton>button {
        background-color: #D4A373;
        color: white;
        border-radius: 12px;
        border: none;
        padding: 0.5rem 1.5rem;
        font-weight: 500;
        transition: all 0.3s ease;
        box-shadow: 0 4px 6px rgba(212, 163, 115, 0.3);
    }
    .stButton>button:hover {
        background-color: #C08552;
        box-shadow: 0 6px 8px rgba(212, 163, 115, 0.4);
        transform: translateY(-1px);
        color: white;
    }
    
    /* Encouragement Card */
    .encouragement-card {
        background: linear-gradient(135deg, #FFF0E6 0%, #FFF5EB 100%);
        padding: 1.5rem;
        border-radius: 16px;
        border-left: 6px solid #D4A373;
        margin-bottom: 2rem;
        color: #6B5B54;
        font-size: 1.15rem;
        font-family: 'Noto Sans SC', serif;
        box-shadow: 0 4px 15px rgba(212, 163, 115, 0.1);
        display: flex;
        align-items: center;
    }
    .encouragement-card::before {
        content: "💡";
        font-size: 1.5rem;
        margin-right: 1rem;
    }
    
    /* Input Areas */
    .stTextArea>div>div>textarea {
        background-color: #FFFFFF;
        border: 2px solid #EBE5DF;
        border-radius: 12px;
        color: #4A4A4A;
    }
    .stTextArea>div>div>textarea:focus {
        border-color: #D4A373;
        box-shadow: 0 0 0 2px rgba(212, 163, 115, 0.2);
    }
    
    /* Sliders */
    .stSlider>div>div>div>div {
        background-color: #D4A373;
    }
    
    /* Custom Card Style for Symptoms */
    div[data-testid="stExpander"] {
        background-color: #FFFFFF;
        border-radius: 12px;
        border: 1px solid #F0EFEB;
        box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        margin-bottom: 1rem;
        overflow: hidden;
    }
    
    /* Navigation Sidebar */
    [data-testid="stSidebar"] {
        background-color: #F0EFEB;
    }
</style>
""", unsafe_allow_html=True)

# Encouraging Messages
MESSAGES = [
    "🌟 每一个记录，都是对身体的温柔关照。",
    "💪 今天辛苦了，记得给自己一个拥抱。",
    "🌈 即使有疼痛，生活依然有光。",
    "🍃 慢慢来，身体在用它自己的节奏恢复。",
    "🧘 深呼吸，此刻你是安全的。",
    "✨ 你的坚持很有意义，哪怕是一点点进步。",
    "☕ 累了就休息一会儿，这完全没关系。",
    "🌻 无论今天感觉如何，都请善待自己。"
]

def get_encouragement():
    return random.choice(MESSAGES)

# Initialize DB
@st.cache_resource
def get_db():
    return DBManager()

db = get_db()

# Exercise Helper Functions
def parse_exercise_template(file_path="exercise_template.md"):
    """Parse the markdown template to extract exercise names."""
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
        
        exercises = []
        # Regex to find lines like "## 1、Name"
        matches = re.findall(r'##\s*\d+[、\.]\s*(.+)', content)
        
        for idx, name in enumerate(matches):
            exercises.append({
                "id": str(uuid.uuid4()),
                "name": name.strip(),
                "enabled": True,
                "order": idx
            })
        return exercises
    except Exception as e:
        st.error(f"Error reading template: {e}")
        return []

def init_exercise_config():
    """Initialize exercise config if not exists."""
    config = db.get_exercise_config()
    if not config:
        initial_exercises = parse_exercise_template()
        if initial_exercises:
            db.save_exercise_config(initial_exercises)
            return initial_exercises
    return config

def render_exercise_page():
    st.header("🧘 康复训练反馈")
    
    # Initialize config
    config = init_exercise_config()
    
    tab1, tab2, tab3 = st.tabs(["📝 训练反馈", "⚙️ 项目管理", "📊 历史与导出"])
    
    with tab1:
        # Date selection
        col1, col2 = st.columns([1, 2])
        with col1:
            selected_date = st.date_input("训练日期", date.today(), key="ex_date")
        
        # Load existing log
        date_str = str(selected_date)
        existing_log = db.get_exercise_log(date_str)
        log_data = existing_log if existing_log else {}
        
        with st.form("exercise_feedback_form"):
            # Sort config by order
            active_exercises = sorted([e for e in config if e.get('enabled', True)], key=lambda x: x.get('order', 0))
            
            feedback_data = {}
            for ex in active_exercises:
                ex_id = ex['id']
                st.markdown(f"### {ex['name']}")
                
                # Get existing values
                ex_log = log_data.get(ex_id, {})
                
                col_status, col_feedback = st.columns([1, 3])
                with col_status:
                    status_options = ["完成", "部分完成", "未进行"]
                    current_status = ex_log.get('status', '完成')
                    if current_status not in status_options:
                        status_options.append(current_status)
                        
                    status = st.selectbox(
                        "完成状态", 
                        status_options, 
                        key=f"status_{ex_id}",
                        index=status_options.index(current_status)
                    )
                with col_feedback:
                    feedback = st.text_area(
                        "感受反馈", 
                        value=ex_log.get('feedback', ''), 
                        key=f"feedback_{ex_id}",
                        height=100
                    )
                
                feedback_data[ex_id] = {
                    "name": ex['name'],
                    "status": status,
                    "feedback": feedback
                }
                st.divider()
            
            submitted = st.form_submit_button("💾 保存训练记录")
            if submitted:
                db.save_exercise_log(date_str, feedback_data)
                st.success("✅ 记录已保存！")
                
    with tab2:
        st.subheader("管理训练项目")
        
        # Display editable dataframe
        if config:
            df = pd.DataFrame(config)
        else:
            df = pd.DataFrame(columns=["id", "name", "enabled", "order"])

        edited_df = st.data_editor(
            df,
            column_config={
                "name": "项目名称",
                "enabled": "启用",
                "order": st.column_config.NumberColumn("排序", help="数字越小排在越前面"),
                "id": None 
            },
            disabled=["id"],
            num_rows="dynamic",
            key="editor_config",
            use_container_width=True
        )
        
        if st.button("💾 更新项目配置"):
            # Convert back to list of dicts
            new_config = edited_df.to_dict('records')
            # Ensure IDs exist for new rows
            for item in new_config:
                if not item.get('id'):
                    item['id'] = str(uuid.uuid4())
                # Ensure other fields
                if 'enabled' not in item: item['enabled'] = True
                if 'order' not in item: item['order'] = 99
            
            db.save_exercise_config(new_config)
            st.success("配置已更新！请刷新页面查看变化。")
            st.rerun()
            
    with tab3:
        st.subheader("📊 历史记录与导出")
        
        # Export Section
        with st.expander("📤 导出数据", expanded=True):
            col_ex1, col_ex2 = st.columns(2)
            with col_ex1:
                start_date = st.date_input("开始日期", date.today().replace(day=1))
            with col_ex2:
                end_date = st.date_input("结束日期", date.today())
                
            if st.button("生成导出文件"):
                # Fetch logs
                all_logs = db.get_all_exercise_logs()
                # Filter
                filtered_logs = [
                    l for l in all_logs 
                    if start_date <= datetime.strptime(l['date'], '%Y-%m-%d').date() <= end_date
                ]
                
                if not filtered_logs:
                    st.warning("该时间段无记录。")
                else:
                    # Generate Markdown
                    md_output = ""
                    for log in filtered_logs:
                        md_output += f"# {log['date']} 训练反馈\n\n"
                        data = log['data']
                        
                        # Create a map of id -> order
                        order_map = {item['id']: item.get('order', 999) for item in config}
                        
                        # Convert log dict to list and sort
                        log_items = []
                        for eid, info in data.items():
                            log_items.append({
                                "id": eid,
                                "name": info.get('name', 'Unknown'),
                                "status": info.get('status', ''),
                                "feedback": info.get('feedback', '')
                            })
                        
                        # Sort
                        log_items.sort(key=lambda x: order_map.get(x['id'], 999))
                        
                        for i, item in enumerate(log_items, 1):
                            md_output += f"## {i}、{item['name']}\n"
                            md_output += f"**状态**: {item['status']}\n\n"
                            md_output += f"{item['feedback']}\n\n"
                        
                        md_output += "---\n\n"
                    
                    st.download_button(
                        label="⬇️ 下载 Markdown",
                        data=md_output,
                        file_name=f"training_feedback_{start_date}_{end_date}.md",
                        mime="text/markdown"
                    )
        
        st.divider()
        st.markdown("#### 📅 历史记录概览")
        
        all_logs = db.get_all_exercise_logs()
        if all_logs:
            history_data = []
            for log in all_logs:
                # Count completed
                data = log['data']
                completed = sum(1 for v in data.values() if v.get('status') == '完成')
                total = len(data)
                history_data.append({
                    "日期": log['date'],
                    "项目数": total,
                    "完成数": completed,
                    "完成率": f"{int(completed/total*100) if total > 0 else 0}%"
                })
            
            st.dataframe(pd.DataFrame(history_data), use_container_width=True)
        else:
            st.info("暂无历史记录")

# Title and Encouragement
st.title("🏥 慢性健康状况追踪")
st.markdown(f'<div class="encouragement-card">{get_encouragement()}</div>', unsafe_allow_html=True)

# Sidebar for Navigation
st.sidebar.title("导航")
page = st.sidebar.radio("Go to", ["📝 每日记录", "🧘 康复训练", "📈 趋势分析", "🗂️ 历史数据"], label_visibility="collapsed")


# Helper function to map time of day to sortable index
def time_to_index(t):
    if t == "早起 (Morning)": return 0
    if t == "早起时": return 0
    if t == "上午": return 1
    if t == "中午": return 2
    if t == "中午/下午 (Afternoon)": return 2 # Legacy
    if t == "下午": return 3
    if t == "晚上": return 4
    if t == "晚上 (Evening)": return 4 # Legacy
    return 5

# Symptoms Configuration
SYMPTOMS_CONFIG = [
    {"key": "pain_level", "label": "😖 肩颈/背/腰疼痛僵硬", "name": "pain"},
    {"key": "dizziness_level", "label": "😵 头晕", "name": "dizziness"},
    {"key": "stomach_level", "label": "🤢 胃部不适/反流", "name": "stomach"},
    {"key": "throat_level", "label": "😷 咽喉不适", "name": "throat"},
    {"key": "dry_eye_level", "label": "👁️ 干眼症状", "name": "dry_eye"},
    {"key": "fatigue_level", "label": "😫 疲劳/困倦", "name": "fatigue"}
]

if page == "📝 每日记录":
    st.header("📝 记录今日身体状况")
    
    col1, col2 = st.columns(2)
    with col1:
        selected_date = st.date_input("日期", date.today())
    with col2:
        time_options = ["早起时", "上午", "中午", "下午", "晚上"]
        selected_time = st.selectbox("时段", time_options)

    # Check for existing record
    existing_record = db.get_record(str(selected_date), selected_time)
    
    # Defaults
    defaults = {
        'pain_level': 0, 'dizziness_level': 0, 'stomach_level': 0,
        'throat_level': 0, 'dry_eye_level': 0, 'fatigue_level': 0,
        'notes': {}, 'triggers': {}, 'interventions': {}
    }
    
    if existing_record:
        st.info(f"📅 发现 {selected_date} {selected_time} 的已有记录，您可以修改它。")
        defaults.update(existing_record)

    with st.form("health_record_form"):
        st.subheader("症状评分与详细记录")
        st.caption("请为每项症状评分（0-10），并填写具体的描述、诱因和应对措施。")
        
        scores = {}
        notes_dict = {}
        triggers_dict = {}
        interventions_dict = {}
        
        # General Notes (Optional)
        with st.expander("� 通用/其他备注 (General)", expanded=False):
             general_note = st.text_area("整体感受或其他症状", value=defaults['notes'].get('General', ""), height=80)
             if general_note:
                 notes_dict['General'] = general_note

        # Iterate through symptoms
        st.markdown("### 📝 症状记录")
        
        # Split into 2 columns for better layout
        left_col, right_col = st.columns(2)
        
        for idx, sym in enumerate(SYMPTOMS_CONFIG):
            # Assign to left or right column
            current_col = left_col if idx % 2 == 0 else right_col
            
            with current_col:
                with st.expander(f"{sym['label']}", expanded=True):
                    # Score Slider with custom formatting
                    score = st.slider(f"评分 (0-10)", 0, 10, defaults[sym['key']], key=f"slider_{sym['key']}")
                    scores[sym['key']] = score
                    
                    # Details
                    st.markdown("#### 详细情况")
                    n = st.text_area("具体症状", value=defaults['notes'].get(sym['name'], ""), key=f"note_{sym['name']}", height=68, placeholder="描述...")
                    t = st.text_area("诱因", value=defaults['triggers'].get(sym['name'], ""), key=f"trig_{sym['name']}", height=68, placeholder="诱因...")
                    i = st.text_area("应对", value=defaults['interventions'].get(sym['name'], ""), key=f"int_{sym['name']}", height=68, placeholder="应对...")
                
                    if n: notes_dict[sym['name']] = n
                    if t: triggers_dict[sym['name']] = t
                    if i: interventions_dict[sym['name']] = i
        
        st.markdown("---")
        submitted = st.form_submit_button("💾 保存记录", type="primary")
        
        if submitted:
            symptoms = scores
            # notes_dict, triggers_dict, interventions_dict are already populated
            
            db.add_record(str(selected_date), selected_time, symptoms, notes_dict, triggers_dict, interventions_dict)
            st.success("✅ 记录已保存！")

elif page == "🧘 康复训练":
    render_exercise_page()

elif page == "📈 趋势分析":
    st.header("📈 症状变化趋势")
    
    df = db.get_all_records()
    
    if not df.empty:
        # Date Filter
        min_date = pd.to_datetime(df['date']).min().date()
        max_date = pd.to_datetime(df['date']).max().date()
        
        col1, col2 = st.columns(2)
        with col1:
            start_date = st.date_input("开始日期", min_date)
        with col2:
            end_date = st.date_input("结束日期", max_date)
            
        # Filter Data
        mask = (pd.to_datetime(df['date']).dt.date >= start_date) & (pd.to_datetime(df['date']).dt.date <= end_date)
        filtered_df = df.loc[mask].copy()
        
        if not filtered_df.empty:
            time_map = {
                "早起 (Morning)": "08:00:00", 
                "早起时": "07:00:00",
                "上午": "10:00:00",
                "中午": "12:00:00",
                "中午/下午 (Afternoon)": "14:00:00", 
                "下午": "16:00:00",
                "晚上": "20:00:00",
                "晚上 (Evening)": "20:00:00"
            }
            # Handle unknown keys gracefully or ensure all are covered
            filtered_df['time_str'] = filtered_df['time_of_day'].map(time_map).fillna("12:00:00")
            filtered_df['datetime_str'] = filtered_df['date'] + ' ' + filtered_df['time_str']
            filtered_df['datetime'] = pd.to_datetime(filtered_df['datetime_str'])
            filtered_df = filtered_df.sort_values('datetime')

            symptom_map = {item['key']: item['label'] for item in SYMPTOMS_CONFIG}
            
            selected_symptoms = st.multiselect(
                "选择要显示的症状", 
                options=list(symptom_map.keys()), 
                format_func=lambda x: symptom_map[x],
                default=['pain_level', 'dizziness_level']
            )
            
            if selected_symptoms:
                melted_df = filtered_df.melt(id_vars=['datetime', 'date', 'time_of_day'], value_vars=selected_symptoms, var_name='Symptom', value_name='Score')
                melted_df['Symptom Name'] = melted_df['Symptom'].map(symptom_map)
                
                fig = px.line(melted_df, x='datetime', y='Score', color='Symptom Name', markers=True,
                              title='症状评分随时间变化', hover_data=['date', 'time_of_day'])
                fig.update_yaxes(range=[-0.5, 10.5])
                st.plotly_chart(fig, use_container_width=True)
            else:
                st.warning("请至少选择一个症状进行显示。")
        else:
            st.info("所选日期范围内没有记录。")
    else:
        st.info("暂无数据，请先去'每日记录'页面添加数据。")

elif page == "🗂️ 历史数据":
    st.header("🗂️ 历史记录明细")
    
    df = db.get_all_records()
    if not df.empty:
        # Display simplified table first with selection
        st.info("💡 提示：点击表格左侧的复选框可选择记录，然后点击下方按钮进行删除。")
        
        display_cols = ['id', 'date', 'time_of_day', 'pain_level', 'dizziness_level', 'stomach_level', 'throat_level', 'fatigue_level']
        
        event = st.dataframe(
            df[display_cols],
            use_container_width=True,
            hide_index=True,
            on_select="rerun",
            selection_mode="multi-row"
        )
        
        selected_rows = event.selection.rows
        if selected_rows:
            st.warning(f"您选择了 {len(selected_rows)} 条记录。")
            if st.button("🗑️ 删除选中记录", type="primary"):
                ids_to_delete = df.iloc[selected_rows]['id'].tolist()
                for rid in ids_to_delete:
                    db.delete_record(rid)
                st.success(f"已删除 {len(ids_to_delete)} 条记录。")
                st.rerun()
        
        with st.expander("查看原始详细数据 (JSON格式)"):
             st.dataframe(df)

        st.subheader("数据导出")
        csv = df.to_csv(index=False).encode('utf-8')
        st.download_button(
            "📥 下载所有数据为CSV",
            csv,
            "health_records.csv",
            "text/csv",
            key='download-csv'
        )
    else:
        st.info("暂无数据。")
