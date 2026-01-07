import React, { useEffect, useState } from 'react';
import { Tabs, Table, Button, Form, Input, Select, DatePicker, message, Card, InputNumber, Switch } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import dayjs from 'dayjs';
import { fetchExerciseConfig, updateExerciseConfig, saveExerciseLog, exportExerciseLogs } from '../store/exercisesSlice';
import api from '../api';

const { TextArea } = Input;

const Exercises = () => {
    const dispatch = useDispatch();
    const config = useSelector(state => state.exercises.config);
    const [date, setDate] = useState(dayjs());
    const [form] = Form.useForm();

    useEffect(() => {
        dispatch(fetchExerciseConfig());
    }, [dispatch]);

    useEffect(() => {
        const fetchLog = async () => {
            try {
                const res = await api.get(`/exercises/logs/${date.format('YYYY-MM-DD')}`);
                if (res.data && res.data.data) {
                    const data = res.data.data;
                    // Set form values
                    const formValues = {};
                    Object.keys(data).forEach(k => {
                        formValues[`status_${k}`] = data[k].status;
                        formValues[`feedback_${k}`] = data[k].feedback;
                    });
                    form.setFieldsValue(formValues);
                } else {
                    form.resetFields();
                }
            } catch {
                form.resetFields();
            }
        };
        fetchLog();
    }, [date, form]);

    const handleFeedbackSubmit = async (values) => {
        const activeExercises = config.filter(e => e.enabled);
        const data = {};
        activeExercises.forEach(ex => {
            data[ex.id] = {
                id: ex.id,
                name: ex.name,
                status: values[`status_${ex.id}`] || '完成',
                feedback: values[`feedback_${ex.id}`] || ''
            };
        });
        
        try {
            await dispatch(saveExerciseLog({ date: date.format('YYYY-MM-DD'), data })).unwrap();
            message.success('训练记录已保存！');
        } catch {
            message.error('保存失败');
        }
    };

    // Actually, handling editable table with Redux properly requires local state.
    const [editableConfig, setEditableConfig] = useState([]);
    useEffect(() => {
        setEditableConfig(config);
    }, [config]);

    const handleLocalConfigChange = (index, key, value) => {
        const newConfig = [...editableConfig];
        newConfig[index] = { ...newConfig[index], [key]: value };
        setEditableConfig(newConfig);
    };

    const handleSaveConfig = async (newConfig) => {
        try {
            await dispatch(updateExerciseConfig(newConfig)).unwrap();
            message.success('配置已更新');
        } catch {
            message.error('更新失败');
        }
    };

    const addExercise = () => {
        const newConfig = [...editableConfig, { id: '', name: '新项目', enabled: true, order: 99 }];
        setEditableConfig(newConfig);
    };

    const handleExport = async () => {
        try {
            const dateStr = date.format('YYYY-MM-DD');
            const blob = await dispatch(exportExerciseLogs({ startDate: dateStr, endDate: dateStr })).unwrap();
            
            // Create download link
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `training_feedback_${dateStr}.md`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            
            message.success('导出成功');
        } catch {
            message.error('导出失败或无数据');
        }
    };

    const activeExercises = config.filter(e => e.enabled).sort((a, b) => a.order - b.order);

    const items = [
        {
            key: '1',
            label: '📝 训练反馈',
            children: (
                <>
                    <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <DatePicker value={date} onChange={setDate} allowClear={false} />
                        <Button onClick={handleExport}>📥 导出当前日期数据</Button>
                    </div>
                    <Form form={form} onFinish={handleFeedbackSubmit} layout="vertical">
                        {activeExercises.map(ex => (
                            <Card key={ex.id} title={ex.name} size="small" style={{ marginBottom: 10 }}>
                                <div style={{ display: 'flex', gap: 20 }}>
                                    <Form.Item name={`status_${ex.id}`} label="状态" initialValue="完成" style={{ width: 150, marginBottom: 0 }}>
                                        <Select>
                                            <Select.Option value="完成">完成</Select.Option>
                                            <Select.Option value="部分完成">部分完成</Select.Option>
                                            <Select.Option value="未进行">未进行</Select.Option>
                                        </Select>
                                    </Form.Item>
                                    <Form.Item name={`feedback_${ex.id}`} label="感受反馈" style={{ flex: 1, marginBottom: 0 }}>
                                        <TextArea rows={1} />
                                    </Form.Item>
                                </div>
                            </Card>
                        ))}
                        <Button type="primary" htmlType="submit" style={{ marginTop: 20 }}>💾 保存训练记录</Button>
                    </Form>
                </>
            ),
        },
        {
            key: '2',
            label: '⚙️ 项目管理',
            children: (
                <>
                    <Button onClick={addExercise} type="dashed" style={{ marginBottom: 16 }}>+ 添加项目</Button>
                    <Table 
                        dataSource={editableConfig} 
                        columns={[
                            { title: '项目名称', dataIndex: 'name', key: 'name', render: (text, record, index) => (
                                <Input value={text} onChange={e => handleLocalConfigChange(index, 'name', e.target.value)} />
                            )},
                            { title: '启用', dataIndex: 'enabled', key: 'enabled', render: (val, record, index) => (
                                <Switch checked={val} onChange={checked => handleLocalConfigChange(index, 'enabled', checked)} />
                            )},
                            { title: '排序', dataIndex: 'order', key: 'order', render: (val, record, index) => (
                                <InputNumber value={val} onChange={v => handleLocalConfigChange(index, 'order', v)} />
                            )},
                            { title: '操作', key: 'action', render: (_, record, index) => (
                                <Button danger onClick={() => {
                                    const newConfig = [...editableConfig];
                                    newConfig.splice(index, 1);
                                    setEditableConfig(newConfig);
                                }}>删除</Button>
                            )}
                        ]}
                        rowKey="id"
                        pagination={false}
                    />
                    <Button type="primary" onClick={() => handleSaveConfig(editableConfig)} style={{ marginTop: 16 }}>💾 保存配置</Button>
                </>
            ),
        },
    ];

    return (
        <div>
            <Tabs defaultActiveKey="1" items={items} />
        </div>
    );
};

export default Exercises;
