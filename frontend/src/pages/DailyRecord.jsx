import React, { useEffect, useState } from 'react';
import { Form, DatePicker, Select, Slider, Input, Button, Card, Row, Col, Typography, message, Collapse } from 'antd';
import { useDispatch } from 'react-redux';
import dayjs from 'dayjs';
import { addRecord } from '../store/recordsSlice';
import api from '../api';

import { SYMPTOMS_CONFIG, ENCOURAGEMENT_MESSAGES } from '../constants';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Panel } = Collapse;

const DailyRecord = () => {
    const [form] = Form.useForm();
    const dispatch = useDispatch();
    const [encouragement] = useState(ENCOURAGEMENT_MESSAGES[Math.floor(Math.random() * ENCOURAGEMENT_MESSAGES.length)]);
    const [loading, setLoading] = useState(false);

    // Initial values
    const [date, setDate] = useState(dayjs());
    const [timeOfDay, setTimeOfDay] = useState('上午');

    const handleFetchRecord = async () => {
        setLoading(true);
        try {
            const dateStr = date.format('YYYY-MM-DD');
            const res = await api.get(`/records/${dateStr}/${timeOfDay}`);
            if (res.data) {
                const data = res.data;
                form.setFieldsValue({
                    ...data,
                    // Flatten nested objects for form
                    ...Object.keys(data.notes || {}).reduce((acc, k) => ({...acc, [`note_${k}`]: data.notes[k]}), {}),
                    ...Object.keys(data.triggers || {}).reduce((acc, k) => ({...acc, [`trig_${k}`]: data.triggers[k]}), {}),
                    ...Object.keys(data.interventions || {}).reduce((acc, k) => ({...acc, [`int_${k}`]: data.interventions[k]}), {}),
                    general_note: data.notes?.General
                });
                message.info(`Found existing record for ${dateStr} ${timeOfDay}`);
            } else {
                // No record found (200 OK with null), reset form
                form.resetFields();
            }
        } catch (error) {
            console.error("Error fetching record:", error);
            // On real error, also reset or handle gracefully
            form.resetFields();
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        handleFetchRecord();
    }, [date, timeOfDay]);

    const onFinish = async (values) => {
        setLoading(true);
        try {
            // Construct payload
            const payload = {
                date: date.format('YYYY-MM-DD'),
                time_of_day: timeOfDay,
                pain_level: values.pain_level || 0,
                dizziness_level: values.dizziness_level || 0,
                stomach_level: values.stomach_level || 0,
                throat_level: values.throat_level || 0,
                dry_eye_level: values.dry_eye_level || 0,
                fatigue_level: values.fatigue_level || 0,
                notes: { General: values.general_note },
                triggers: {},
                interventions: {}
            };

            SYMPTOMS_CONFIG.forEach(sym => {
                if (values[`note_${sym.name}`]) payload.notes[sym.name] = values[`note_${sym.name}`];
                if (values[`trig_${sym.name}`]) payload.triggers[sym.name] = values[`trig_${sym.name}`];
                if (values[`int_${sym.name}`]) payload.interventions[sym.name] = values[`int_${sym.name}`];
            });

            await dispatch(addRecord(payload)).unwrap();
            message.success('记录已保存！');
        } catch (err) {
            message.error('保存失败: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <Card style={{ marginBottom: 20, background: 'linear-gradient(135deg, #FFF0E6 0%, #FFF5EB 100%)', borderColor: '#D4A373' }}>
                <Text style={{ fontSize: '16px', color: '#6B5B54' }}>💡 {encouragement}</Text>
            </Card>

            <Title level={3}>📝 记录今日身体状况</Title>

            <div style={{ marginBottom: 20 }}>
                <Row gutter={16}>
                    <Col span={12}>
                        <DatePicker value={date} onChange={setDate} style={{ width: '100%' }} />
                    </Col>
                    <Col span={12}>
                        <Select value={timeOfDay} onChange={setTimeOfDay} style={{ width: '100%' }}>
                            {["早起时", "上午", "中午", "下午", "晚上"].map(t => (
                                <Select.Option key={t} value={t}>{t}</Select.Option>
                            ))}
                        </Select>
                    </Col>
                </Row>
            </div>

            <Form form={form} onFinish={onFinish} layout="vertical">
                <Collapse defaultActiveKey={['general']} items={[
                    {
                        key: 'general',
                        header: '通用/其他备注',
                        children: <Form.Item name="general_note" label="整体感受或其他症状">
                             <TextArea placeholder="整体感受或其他症状..." autoSize={{ minRows: 2, maxRows: 6 }} />
                         </Form.Item>
                    }
                ]} />

                
                <div style={{ marginTop: 20 }}>
                    <Row gutter={[16, 16]}>
                        {SYMPTOMS_CONFIG.map((sym) => (
                            <Col xs={24} md={12} key={sym.key}>
                                <Card title={sym.label} size="small">
                                    <Form.Item name={sym.key} label="评分 (0-10)">
                                        <Slider min={0} max={10} marks={{0:0, 5:5, 10:10}} />
                                    </Form.Item>
                                    <Form.Item name={`note_${sym.name}`} label="具体症状">
                                        <TextArea placeholder="描述..." autoSize={{ minRows: 1, maxRows: 6 }} />
                                    </Form.Item>
                                    <Form.Item name={`trig_${sym.name}`} label="诱因">
                                        <TextArea placeholder="诱因..." autoSize={{ minRows: 1, maxRows: 6 }} />
                                    </Form.Item>
                                    <Form.Item name={`int_${sym.name}`} label="应对">
                                        <TextArea placeholder="应对..." autoSize={{ minRows: 1, maxRows: 6 }} />
                                    </Form.Item>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </div>

                <div style={{ marginTop: 20, textAlign: 'center' }}>
                    <Button type="primary" htmlType="submit" size="large" loading={loading} style={{ width: '200px' }}>
                        💾 保存记录
                    </Button>
                </div>
            </Form>
        </div>
    );
};

export default DailyRecord;
