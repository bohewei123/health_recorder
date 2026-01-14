import React, { useEffect, useMemo, useState } from 'react';
import { Table, Button, Popconfirm, message, Typography, Tag, DatePicker } from 'antd';
import { useDispatch } from 'react-redux';
import { deleteRecord } from '../store/recordsSlice';
import api from '../api';
import dayjs from 'dayjs';

const { Title } = Typography;
const { RangePicker } = DatePicker;

const History = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [dateRange, setDateRange] = useState([dayjs().subtract(7, 'day'), dayjs()]);
    const dispatch = useDispatch();

    const safeText = (value) => {
        if (value === null || value === undefined) return '';
        return String(value).replace(/"/g, '""').replace(/\r?\n/g, ' ');
    };

    const normalizeTimeOfDay = (v) => {
        if (v === '早起时') return '起床';
        if (v === '中午') return '下午';
        return v;
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/records');
            setData(res.data);
        } catch {
            message.error('加载失败');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleDelete = async (id) => {
        try {
            await dispatch(deleteRecord(id)).unwrap();
            message.success('删除成功');
            fetchData(); // Refresh
        } catch {
            message.error('删除失败');
        }
    };

    const columns = useMemo(() => [
        { title: '日期', dataIndex: 'date', key: 'date', sorter: (a, b) => a.date.localeCompare(b.date) },
        { title: '时段', dataIndex: 'time_of_day', key: 'time_of_day', render: (v) => normalizeTimeOfDay(v) },
        { title: '疼痛', dataIndex: 'pain_level', key: 'pain_level' },
        { title: '头晕', dataIndex: 'dizziness_level', key: 'dizziness_level' },
        { title: '情绪', dataIndex: 'mood_level', key: 'mood_level', render: (v) => (v ?? 0) },
        {
            title: '用药',
            key: 'medication_used',
            render: (_, record) => (record.medication_used ? <Tag color="blue">是</Tag> : <Tag>否</Tag>)
        },
        {
            title: '摘要',
            key: 'summary',
            render: (_, record) => {
                const bodyFeeling = record.body_feeling_note || '';
                const parts = [
                    bodyFeeling && `身体感觉：${bodyFeeling}`,
                    record.sleep_note && `睡眠：${record.sleep_note}`,
                    record.daily_activity_note && `活动：${record.daily_activity_note}`,
                    record.pain_increasing_activities && `疼痛↑：${record.pain_increasing_activities}`,
                    record.pain_decreasing_activities && `疼痛↓：${record.pain_decreasing_activities}`,
                    record.dizziness_increasing_activities && `头晕↑：${record.dizziness_increasing_activities}`,
                    record.dizziness_decreasing_activities && `头晕↓：${record.dizziness_decreasing_activities}`,
                    record.medication_used && record.medication_note && `用药：${record.medication_note}`
                ].filter(Boolean);
                return <span>{parts.slice(0, 2).join('；')}{parts.length > 2 ? '…' : ''}</span>;
            }
        },
        { title: '操作', key: 'action', render: (_, record) => (
            <Popconfirm title="确定删除吗？" onConfirm={() => handleDelete(record.id)}>
                <Button danger type="link">删除</Button>
            </Popconfirm>
        )}
    ], []);

    const handleExport = () => {
        const headers = [
            'ID',
            'Date',
            'Time',
            'Pain(0-10)',
            'Dizziness(0-10)',
            'Mood(0-10)',
            'BodyFeeling',
            'SleepLastNight',
            'DailyActivity',
            'PainIncreasingActivities',
            'PainDecreasingActivities',
            'DizzinessIncreasingActivities',
            'DizzinessDecreasingActivities',
            'MedicationUsed',
            'MedicationNote'
        ];

        const rows = data.map((row) => {
            const bodyFeeling = row.body_feeling_note || '';
            const values = [
                row.id,
                row.date,
                row.time_of_day,
                row.pain_level ?? 0,
                row.dizziness_level ?? 0,
                row.mood_level ?? 0,
                bodyFeeling,
                row.sleep_note || '',
                row.daily_activity_note || '',
                row.pain_increasing_activities || '',
                row.pain_decreasing_activities || '',
                row.dizziness_increasing_activities || '',
                row.dizziness_decreasing_activities || '',
                row.medication_used ? 'true' : 'false',
                row.medication_note || ''
            ];

            return values.map((v) => `"${safeText(v)}"`).join(',');
        });

        const csvContent = `data:text/csv;charset=utf-8,${headers.join(',')}\n${rows.join('\n')}`;
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "health_records.csv");
        document.body.appendChild(link);
        link.click();
    };

    const handleExportExcel = async () => {
        const start = dateRange?.[0]?.format?.('YYYY-MM-DD');
        const end = dateRange?.[1]?.format?.('YYYY-MM-DD');
        if (!start || !end) {
            message.error('请选择日期范围');
            return;
        }

        try {
            const res = await api.get('/records/export_excel', {
                params: { start_date: start, end_date: end },
                responseType: 'blob'
            });
            const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `health_records_${start.replaceAll('-', '')}_${end.replaceAll('-', '')}.xlsx`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (e) {
            message.error('导出失败');
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
                <Title level={3} style={{ margin: 0 }}>🗂️ 历史记录</Title>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <RangePicker value={dateRange} onChange={setDateRange} />
                    <Button onClick={handleExportExcel}>📤 导出 Excel</Button>
                    <Button onClick={handleExport}>📥 导出 CSV</Button>
                </div>
            </div>
            <Table 
                columns={columns} 
                dataSource={data} 
                rowKey="id" 
                loading={loading}
            />
        </div>
    );
};

export default History;
