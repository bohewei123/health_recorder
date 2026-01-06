import React, { useEffect, useState } from 'react';
import { DatePicker, Select, Card, Typography } from 'antd';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../api';
import dayjs from 'dayjs';
import { SYMPTOMS_CONFIG } from '../constants';

const { RangePicker } = DatePicker;
const { Title } = Typography;

const Trends = () => {
    const [data, setData] = useState([]);
    const [dateRange, setDateRange] = useState([dayjs().subtract(1, 'month'), dayjs()]);
    const [selectedSymptoms, setSelectedSymptoms] = useState(['pain_level', 'dizziness_level']);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await api.get('/records');
                // Filter by date
                let filtered = res.data.filter(r => {
                    const d = dayjs(r.date);
                    return d.isAfter(dateRange[0]) && d.isBefore(dateRange[1].add(1, 'day'));
                });
                
                // Sort by date and time
                const timeMap = {
                    "早起时": "07:00", "上午": "10:00", "中午": "12:00", "下午": "16:00", "晚上": "20:00"
                };
                
                filtered = filtered.map(r => ({
                    ...r,
                    datetime: `${r.date} ${timeMap[r.time_of_day] || "12:00"}`,
                    displayDate: `${r.date} ${r.time_of_day}`
                })).sort((a, b) => new Date(a.datetime) - new Date(b.datetime));

                setData(filtered);
            } catch (e) {
                console.error(e);
            }
        };
        fetchData();
    }, [dateRange]);

    return (
        <div>
            <Title level={3}>📈 症状变化趋势</Title>
            <div style={{ marginBottom: 20, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                <RangePicker value={dateRange} onChange={setDateRange} />
                <Select
                    mode="multiple"
                    style={{ minWidth: 300 }}
                    placeholder="选择症状"
                    value={selectedSymptoms}
                    onChange={setSelectedSymptoms}
                >
                    {SYMPTOMS_CONFIG.map(s => (
                        <Select.Option key={s.key} value={s.key}>{s.label}</Select.Option>
                    ))}
                </Select>
            </div>
            
            <Card>
                <div style={{ width: '100%', height: 400 }}>
                    <ResponsiveContainer>
                        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="displayDate" />
                            <YAxis domain={[0, 10]} />
                            <Tooltip />
                            <Legend />
                            {selectedSymptoms.map(key => {
                                const conf = SYMPTOMS_CONFIG.find(c => c.key === key);
                                return (
                                    <Line 
                                        key={key}
                                        type="monotone" 
                                        dataKey={key} 
                                        name={conf?.label || key} 
                                        stroke={conf?.color || "#8884d8"} 
                                        activeDot={{ r: 8 }} 
                                    />
                                );
                            })}
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </Card>
        </div>
    );
};

export default Trends;
