import React, { useEffect, useState } from 'react';
import { Table, Button, Popconfirm, message, Typography } from 'antd';
import { useDispatch } from 'react-redux';
import { deleteRecord } from '../store/recordsSlice';
import api from '../api';

const { Title } = Typography;

const History = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/records');
            setData(res.data);
        } catch (e) {
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
        } catch (e) {
            message.error('删除失败');
        }
    };

    const columns = [
        { title: '日期', dataIndex: 'date', key: 'date', sorter: (a, b) => a.date.localeCompare(b.date) },
        { title: '时段', dataIndex: 'time_of_day', key: 'time_of_day' },
        { title: '疼痛', dataIndex: 'pain_level', key: 'pain_level' },
        { title: '头晕', dataIndex: 'dizziness_level', key: 'dizziness_level' },
        { title: '操作', key: 'action', render: (_, record) => (
            <Popconfirm title="确定删除吗？" onConfirm={() => handleDelete(record.id)}>
                <Button danger type="link">删除</Button>
            </Popconfirm>
        )}
    ];

    const handleExport = () => {
        const csvContent = "data:text/csv;charset=utf-8," 
            + ["ID,Date,Time,Pain,Dizziness,Notes"].join(",") + "\n"
            + data.map(row => `${row.id},${row.date},${row.time_of_day},${row.pain_level},${row.dizziness_level},"${(row.notes?.General||'').replace(/"/g, '""')}"`).join("\n");
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "health_records.csv");
        document.body.appendChild(link);
        link.click();
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <Title level={3} style={{ margin: 0 }}>🗂️ 历史记录</Title>
                <Button onClick={handleExport}>📥 导出 CSV</Button>
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
