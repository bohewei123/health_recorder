import React, { useEffect, useMemo, useState } from 'react';
import { Form, DatePicker, Select, Slider, Input, Button, Card, Row, Col, Typography, message, Collapse, Switch, Divider, Alert } from 'antd';
import { useDispatch } from 'react-redux';
import dayjs from 'dayjs';
import { addRecord } from '../store/recordsSlice';
import api from '../api';

import { SYMPTOMS_CONFIG, ENCOURAGEMENT_MESSAGES } from '../constants';

const { Title, Text } = Typography;
const { TextArea } = Input;

const DailyRecord = () => {
    const [form] = Form.useForm();
    const dispatch = useDispatch();
    const [encouragement] = useState(ENCOURAGEMENT_MESSAGES[Math.floor(Math.random() * ENCOURAGEMENT_MESSAGES.length)]);
    const [loading, setLoading] = useState(false);

    // Initial values
    const [date, setDate] = useState(dayjs());
    const [timeOfDay, setTimeOfDay] = useState('上午');

    const customSliderStyle = {
        trackStyle: { backgroundColor: '#9C6644' },
        handleStyle: { borderColor: '#9C6644', backgroundColor: '#9C6644' }
    };

    const optionalSymptoms = useMemo(
        () => SYMPTOMS_CONFIG.filter((sym) => !['pain', 'dizziness'].includes(sym.name)),
        []
    );

    const handleFetchRecord = async () => {
        setLoading(true);
        try {
            const dateStr = date.format('YYYY-MM-DD');
            const [recordRes, summaryRes] = await Promise.all([
                api.get(`/records/${dateStr}/${timeOfDay}`),
                api.get(`/daily_summaries/${dateStr}`).catch(() => ({ data: null }))
            ]);

            const recordData = recordRes.data || null;
            const summaryData = summaryRes.data || null;

            if (!recordData && !summaryData) {
                form.resetFields();
                form.setFieldsValue({ medication_used: false });
                return;
            }

            const dateFieldsSource = summaryData || recordData || {};
            const slotFieldsSource = recordData || {};

            form.setFieldsValue({
                ...dateFieldsSource,
                pain_level: slotFieldsSource.pain_level ?? 0,
                dizziness_level: slotFieldsSource.dizziness_level ?? 0,
                mood_level: slotFieldsSource.mood_level ?? 0,
                body_feeling_note: slotFieldsSource.body_feeling_note || '',
                pain_increasing_activities: dateFieldsSource.pain_increasing_activities ?? dateFieldsSource.triggers?.pain,
                pain_decreasing_activities: dateFieldsSource.pain_decreasing_activities ?? dateFieldsSource.interventions?.pain,
                dizziness_increasing_activities: dateFieldsSource.dizziness_increasing_activities ?? dateFieldsSource.triggers?.dizziness,
                dizziness_decreasing_activities: dateFieldsSource.dizziness_decreasing_activities ?? dateFieldsSource.interventions?.dizziness,
                medication_used: !!dateFieldsSource.medication_used,
                medication_note: dateFieldsSource.medication_note,
                ...Object.keys(dateFieldsSource.notes || {}).reduce((acc, k) => ({ ...acc, [`note_${k}`]: dateFieldsSource.notes[k] }), {}),
                ...Object.keys(dateFieldsSource.triggers || {}).reduce((acc, k) => ({ ...acc, [`trig_${k}`]: dateFieldsSource.triggers[k] }), {}),
                ...Object.keys(dateFieldsSource.interventions || {}).reduce((acc, k) => ({ ...acc, [`int_${k}`]: dateFieldsSource.interventions[k] }), {}),
                general_note: dateFieldsSource.notes?.General
            });

            if (recordData) {
                message.info(`Found existing record for ${dateStr} ${timeOfDay}`);
            }
        } catch (error) {
            console.error("Error fetching record:", error);
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
                mood_level: values.mood_level || 0,
                body_feeling_note: values.body_feeling_note || '',
                sleep_note: values.sleep_note || '',
                daily_activity_note: values.daily_activity_note || '',
                pain_increasing_activities: values.pain_increasing_activities || '',
                pain_decreasing_activities: values.pain_decreasing_activities || '',
                dizziness_increasing_activities: values.dizziness_increasing_activities || '',
                dizziness_decreasing_activities: values.dizziness_decreasing_activities || '',
                medication_used: !!values.medication_used,
                medication_note: values.medication_note || '',
                notes: { General: values.general_note || '' },
                triggers: {
                    pain: values.pain_increasing_activities || '',
                    dizziness: values.dizziness_increasing_activities || ''
                },
                interventions: {
                    pain: values.pain_decreasing_activities || '',
                    dizziness: values.dizziness_decreasing_activities || ''
                }
            };

            optionalSymptoms.forEach(sym => {
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

            <Card style={{ marginBottom: 16 }} size="small" title="评分参考（帮助更客观）">
                <Alert
                    type="info"
                    showIcon
                    message="建议优先按“对活动的影响程度”来给分，而不是按情绪强度或对未来的担心来给分。"
                />
                <div style={{ marginTop: 12, overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
                        <thead>
                            <tr>
                                <th style={{ border: '1px solid #d9d9d9', padding: 8, width: 100, background: '#fafafa' }}>评分</th>
                                <th style={{ border: '1px solid #d9d9d9', padding: 8, background: '#fafafa' }}>身体感觉 / 活动</th>
                                <th style={{ border: '1px solid #d9d9d9', padding: 8, background: '#fafafa' }}>情绪反应</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style={{ border: '1px solid #d9d9d9', padding: 8, textAlign: 'center' }}>0</td>
                                <td style={{ border: '1px solid #d9d9d9', padding: 8 }}>身体无痛感；对活动无影响</td>
                                <td style={{ border: '1px solid #d9d9d9', padding: 8 }}>无消极情绪</td>
                            </tr>
                            <tr>
                                <td style={{ border: '1px solid #d9d9d9', padding: 8, textAlign: 'center' }}>1～4</td>
                                <td style={{ border: '1px solid #d9d9d9', padding: 8 }}>身体轻度痛感；对活动有较小影响</td>
                                <td style={{ border: '1px solid #d9d9d9', padding: 8 }}>轻度消极情绪（沮丧、失望）</td>
                            </tr>
                            <tr>
                                <td style={{ border: '1px solid #d9d9d9', padding: 8, textAlign: 'center' }}>5～6</td>
                                <td style={{ border: '1px solid #d9d9d9', padding: 8 }}>身体中度痛感，同时肌肉紧张；对活动有中度限制</td>
                                <td style={{ border: '1px solid #d9d9d9', padding: 8 }}>中度消极情绪（焦虑、悲伤、易怒）</td>
                            </tr>
                            <tr>
                                <td style={{ border: '1px solid #d9d9d9', padding: 8, textAlign: 'center' }}>7～8</td>
                                <td style={{ border: '1px solid #d9d9d9', padding: 8 }}>身体明显痛感，同时运动困难；活动减少</td>
                                <td style={{ border: '1px solid #d9d9d9', padding: 8 }}>明显消极情绪，同时活动困难（恐惧、愤怒、抑郁）</td>
                            </tr>
                            <tr>
                                <td style={{ border: '1px solid #d9d9d9', padding: 8, textAlign: 'center' }}>9～10</td>
                                <td style={{ border: '1px solid #d9d9d9', padding: 8 }}>身体严重痛感，同时不能运动；仅能参加较少活动；卧床</td>
                                <td style={{ border: '1px solid #d9d9d9', padding: 8 }}>严重消极情绪，同时思维明显受损（抑郁、焦虑或绝望）</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <Divider />
                <div style={{ marginTop: 12, overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
                        <thead>
                            <tr>
                                <th style={{ border: '1px solid #d9d9d9', padding: 8, width: 100, background: '#fafafa' }}>评分</th>
                                <th style={{ border: '1px solid #d9d9d9', padding: 8, background: '#fafafa' }}>身体平衡感 / 躯体活动能力</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style={{ border: '1px solid #d9d9d9', padding: 8, textAlign: 'center' }}>0</td>
                                <td style={{ border: '1px solid #d9d9d9', padding: 8 }}>步态稳健; 在任何表面行走均无晃动感; 对日常生活无任何影响。</td>
                            </tr>
                            <tr>
                                <td style={{ border: '1px solid #d9d9d9', padding: 8, textAlign: 'center' }}>1～4</td>
                                <td style={{ border: '1px solid #d9d9d9', padding: 8 }}>轻度不稳; 仅在快速转身或黑暗中略有摇晃; 能独立完成所有家务/工作, 影响较小。</td>
                            </tr>
                            <tr>
                                <td style={{ border: '1px solid #d9d9d9', padding: 8, textAlign: 'center' }}>5～6</td>
                                <td style={{ border: '1px solid #d9d9d9', padding: 8 }}>中度不稳/肌肉僵硬; 行走如“踩棉花”或像在船上; 需通过收紧颈部或躯干肌肉来维持平衡; 活动中度受限(如不敢登高)。</td>
                            </tr>
                            <tr>
                                <td style={{ border: '1px solid #d9d9d9', padding: 8, textAlign: 'center' }}>7～8</td>
                                <td style={{ border: '1px solid #d9d9d9', padding: 8 }}>明显不稳/运动困难; 行走需扶墙或借助他人支撑; 步态明显蹒跚; 活动量显著减少, 非必要不出门。</td>
                            </tr>
                            <tr>
                                <td style={{ border: '1px solid #d9d9d9', padding: 8, textAlign: 'center' }}>9～10</td>
                                <td style={{ border: '1px solid #d9d9d9', padding: 8 }}>严重不稳/无法独自站立; 身体摇晃剧烈, 随时有倾倒感; 无法进行日常活动; 大部分时间卧床或久坐。</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </Card>

            <div style={{ marginBottom: 20 }}>
                <Row gutter={16}>
                    <Col span={12}>
                        <DatePicker value={date} onChange={setDate} style={{ width: '100%' }} />
                    </Col>
                    <Col span={12}>
                        <Select value={timeOfDay} onChange={setTimeOfDay} style={{ width: '100%' }}>
                            {["起床", "上午", "下午", "晚上"].map(t => (
                                <Select.Option key={t} value={t}>{t}</Select.Option>
                            ))}
                        </Select>
                    </Col>
                </Row>
            </div>

            <Form form={form} onFinish={onFinish} layout="vertical">
                <Card title="身体感觉和活动日志" size="small">
                    <Form.Item name="pain_level" label="疼痛感觉（0～10）">
                        <Slider min={0} max={10} marks={{0:0, 5:5, 10:10}} {...customSliderStyle} />
                    </Form.Item>
                    <Form.Item name="dizziness_level" label="头晕感觉（0～10）">
                        <Slider min={0} max={10} marks={{0:0, 5:5, 10:10}} {...customSliderStyle} />
                    </Form.Item>
                    <Form.Item name="mood_level" label="情绪状态（0～10）">
                        <Slider min={0} max={10} marks={{0:0, 5:5, 10:10}} {...customSliderStyle} />
                    </Form.Item>

                    <Form.Item name="body_feeling_note" label="描述身体感觉">
                        <TextArea placeholder="描述身体感觉..." autoSize={{ minRows: 2, maxRows: 6 }} />
                    </Form.Item>
                    <Form.Item name="sleep_note" label="前夜睡眠情况">
                        <TextArea placeholder="睡眠时长/质量/醒来次数等..." autoSize={{ minRows: 2, maxRows: 6 }} />
                    </Form.Item>
                    <Form.Item name="daily_activity_note" label="当日身体活动情况">
                        <TextArea placeholder="散步/工作姿势/运动量等..." autoSize={{ minRows: 2, maxRows: 6 }} />
                    </Form.Item>

                    <Divider style={{ marginTop: 8, marginBottom: 16 }} />

                    <Form.Item name="pain_increasing_activities" label="加重疼痛的活动">
                        <TextArea placeholder="哪些活动会加重疼痛..." autoSize={{ minRows: 2, maxRows: 6 }} />
                    </Form.Item>
                    <Form.Item name="pain_decreasing_activities" label="减轻疼痛的活动">
                        <TextArea placeholder="哪些活动能减轻疼痛..." autoSize={{ minRows: 2, maxRows: 6 }} />
                    </Form.Item>
                    <Form.Item name="dizziness_increasing_activities" label="加重头晕的活动">
                        <TextArea placeholder="哪些活动会加重头晕..." autoSize={{ minRows: 2, maxRows: 6 }} />
                    </Form.Item>
                    <Form.Item name="dizziness_decreasing_activities" label="减轻头晕的活动">
                        <TextArea placeholder="哪些活动能减轻头晕..." autoSize={{ minRows: 2, maxRows: 6 }} />
                    </Form.Item>

                    <Divider style={{ marginTop: 8, marginBottom: 16 }} />

                    <Form.Item name="medication_used" label="是否使用药物" valuePropName="checked">
                        <Switch checkedChildren="是" unCheckedChildren="否" />
                    </Form.Item>

                    <Form.Item noStyle shouldUpdate={(prev, curr) => prev.medication_used !== curr.medication_used}>
                        {({ getFieldValue }) =>
                            getFieldValue('medication_used') ? (
                                <Form.Item name="medication_note" label="用药说明">
                                    <TextArea placeholder="药名/剂量/次数/效果等..." autoSize={{ minRows: 2, maxRows: 6 }} />
                                </Form.Item>
                            ) : null
                        }
                    </Form.Item>
                </Card>

                <Collapse style={{ marginTop: 16 }} items={[
                    {
                        key: 'others',
                        header: '其他症状与备注（可选）',
                        children: (
                            <>
                                <Form.Item name="general_note" label="其他备注">
                                    <TextArea placeholder="其他备注..." autoSize={{ minRows: 2, maxRows: 6 }} />
                                </Form.Item>
                                <Row gutter={[16, 16]}>
                                    {optionalSymptoms.map((sym) => (
                                        <Col xs={24} md={12} key={sym.key}>
                                            <Card title={sym.label} size="small">
                                                <Form.Item name={sym.key} label="评分 (0-10)">
                                                    <Slider min={0} max={10} marks={{0:0, 5:5, 10:10}} {...customSliderStyle} />
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
                            </>
                        )
                    }
                ]} />

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
