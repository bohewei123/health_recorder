import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Card, DatePicker, Empty, Grid, Input, List, Popconfirm, Space, Typography, message } from 'antd';
import dayjs from 'dayjs';
import { useDispatch, useSelector } from 'react-redux';
import { createNote, deleteNote, selectNote, updateNoteContent } from '../store/painNotesSlice';
import { savePainNotesState } from '../store/painNotesStorage';
import { renderMarkdownToHtml } from '../utils/renderMarkdownToHtml';

const PainNotes = () => {
  const dispatch = useDispatch();
  const painNotesState = useSelector((state) => state.painNotes);
  const notes = painNotesState.notes;
  const selectedNoteId = painNotesState.selectedNoteId;
  const selectedNote = useMemo(
    () => notes.find((n) => n.id === selectedNoteId) ?? null,
    [notes, selectedNoteId],
  );
  const textareaRef = useRef(null);
  const painNotesStateRef = useRef(painNotesState);
  const { md } = Grid.useBreakpoint();
  const [createdAtRange, setCreatedAtRange] = useState(null);

  useEffect(() => {
    painNotesStateRef.current = painNotesState;
  }, [painNotesState]);

  useEffect(() => {
    if (notes.length > 0 && !selectedNoteId) {
      dispatch(selectNote(notes[0].id));
    }
  }, [dispatch, notes, selectedNoteId]);

  useEffect(() => {
    const saveNow = () => savePainNotesState(painNotesStateRef.current);
    const timer = setInterval(saveNow, 30_000);
    window.addEventListener('blur', saveNow);
    document.addEventListener('visibilitychange', saveNow);
    return () => {
      clearInterval(timer);
      window.removeEventListener('blur', saveNow);
      document.removeEventListener('visibilitychange', saveNow);
    };
  }, []);

  const ensureNote = () => {
    if (selectedNote) return selectedNote.id;
    dispatch(createNote({ content: '# 新笔记\n\n' }));
    return null;
  };

  const getTextarea = () => {
    const node = textareaRef.current;
    return node?.resizableTextArea?.textArea ?? null;
  };

  const applyEdit = ({ before, after, placeholder = '' }) => {
    const id = ensureNote();
    if (!id) return;
    const target = notes.find((n) => n.id === id);
    if (!target) return;

    const textarea = getTextarea();
    const value = target.content ?? '';
    const start = textarea?.selectionStart ?? value.length;
    const end = textarea?.selectionEnd ?? value.length;
    const selectedText = value.slice(start, end) || placeholder;
    const nextValue = value.slice(0, start) + before + selectedText + after + value.slice(end);

    if (nextValue.length > 2000) {
      message.warning('每篇笔记最多 2000 字符');
      return;
    }

    dispatch(updateNoteContent({ id, content: nextValue }));

    if (textarea) {
      const selectionStart = start + before.length;
      const selectionEnd = selectionStart + selectedText.length;
      requestAnimationFrame(() => {
        textarea.focus();
        textarea.setSelectionRange(selectionStart, selectionEnd);
      });
    }
  };

  const applyHeading = (level) => {
    const id = ensureNote();
    if (!id) return;
    const target = notes.find((n) => n.id === id);
    if (!target) return;

    const textarea = getTextarea();
    const value = target.content ?? '';
    const caret = textarea?.selectionStart ?? value.length;
    const lineStart = value.lastIndexOf('\n', caret - 1) + 1;
    const prefix = `${'#'.repeat(level)} `;
    const nextValue = value.slice(0, lineStart) + prefix + value.slice(lineStart);

    if (nextValue.length > 2000) {
      message.warning('每篇笔记最多 2000 字符');
      return;
    }

    dispatch(updateNoteContent({ id, content: nextValue }));

    if (textarea) {
      const nextCaret = caret + prefix.length;
      requestAnimationFrame(() => {
        textarea.focus();
        textarea.setSelectionRange(nextCaret, nextCaret);
      });
    }
  };

  const markdownHtml = useMemo(() => renderMarkdownToHtml(selectedNote?.content ?? ''), [selectedNote?.content]);

  const visibleNotes = useMemo(() => {
    const sorted = [...notes].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    if (!createdAtRange || createdAtRange.length !== 2 || !createdAtRange[0] || !createdAtRange[1]) return sorted;

    const start = dayjs(createdAtRange[0]).startOf('day').valueOf();
    const end = dayjs(createdAtRange[1]).endOf('day').valueOf();
    return sorted.filter((n) => {
      const ts = dayjs(n.createdAt).valueOf();
      return ts >= start && ts <= end;
    });
  }, [createdAtRange, notes]);

  const getExcerpt = (content) => {
    const text = String(content ?? '')
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
      .replace(/[#>*_`~-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return text.length > 60 ? `${text.slice(0, 60)}…` : text;
  };

  return (
    <div>
      <Typography.Title level={3} style={{ marginTop: 0 }}>
        慢性疼痛管理课程学习笔记
      </Typography.Title>

      <div style={{ display: 'flex', gap: 16, flexDirection: md ? 'row' : 'column' }}>
        <Card
          title="笔记列表"
          style={{ width: md ? 320 : '100%' }}
          extra={
            <Space>
              <Button
                onClick={() => {
                  try {
                    const rangeText =
                      createdAtRange && createdAtRange[0] && createdAtRange[1]
                        ? `${dayjs(createdAtRange[0]).format('YYYY-MM-DD')}_${dayjs(createdAtRange[1]).format('YYYY-MM-DD')}`
                        : 'all';
                    const exportDate = dayjs().format('YYYY-MM-DD_HH-mm');
                    const lines = [];
                    lines.push('# 慢性疼痛管理课程学习笔记（导出）');
                    lines.push('');
                    lines.push(`导出时间：${dayjs().format('YYYY-MM-DD HH:mm:ss')}`);
                    lines.push(
                      createdAtRange && createdAtRange[0] && createdAtRange[1]
                        ? `筛选范围：${dayjs(createdAtRange[0]).format('YYYY-MM-DD')} ~ ${dayjs(createdAtRange[1]).format('YYYY-MM-DD')}`
                        : '筛选范围：全部',
                    );
                    lines.push('');
                    lines.push('---');
                    lines.push('');

                    for (const note of visibleNotes) {
                      lines.push(`## ${dayjs(note.createdAt).format('YYYY-MM-DD')}`);
                      lines.push('');
                      lines.push(`创建：${dayjs(note.createdAt).format('YYYY-MM-DD HH:mm:ss')}`);
                      lines.push(`最后修改：${dayjs(note.updatedAt).format('YYYY-MM-DD HH:mm:ss')}`);
                      lines.push('');
                      lines.push(String(note.content ?? '').trimEnd());
                      lines.push('');
                      lines.push('---');
                      lines.push('');
                    }

                    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.setAttribute('download', `pain_course_notes_${rangeText}_${exportDate}.md`);
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                    window.URL.revokeObjectURL(url);
                    message.success('已导出 Markdown');
                  } catch {
                    message.error('导出失败');
                  }
                }}
                disabled={visibleNotes.length === 0}
              >
                导出
              </Button>
              <Button type="primary" onClick={() => dispatch(createNote({ content: '# 新笔记\n\n' }))}>
                新建
              </Button>
            </Space>
          }
        >
          <DatePicker.RangePicker
            style={{ width: '100%', marginBottom: 12 }}
            value={createdAtRange}
            onChange={(range) => setCreatedAtRange(range)}
            allowClear
          />

          {notes.length === 0 ? (
            <Empty description="还没有笔记" />
          ) : (
            <List
              dataSource={visibleNotes}
              renderItem={(note) => {
                const createdDate = dayjs(note.createdAt).format('YYYY-MM-DD');
                const selected = note.id === selectedNoteId;
                return (
                  <List.Item
                    style={{
                      cursor: 'pointer',
                      borderRadius: 8,
                      paddingInline: 8,
                      background: selected ? 'rgba(212, 163, 115, 0.12)' : 'transparent',
                    }}
                    onClick={() => dispatch(selectNote(note.id))}
                    actions={[
                      <Popconfirm
                        key="delete"
                        title="删除这篇笔记？"
                        okText="删除"
                        cancelText="取消"
                        onConfirm={() => dispatch(deleteNote(note.id))}
                      >
                        <Button size="small" danger>
                          删除
                        </Button>
                      </Popconfirm>,
                    ]}
                  >
                    <List.Item.Meta
                      title={createdDate}
                      description={
                        <div>
                          <div>{getExcerpt(note.content)}</div>
                          <div style={{ fontSize: 12, opacity: 0.65 }}>
                            最后修改：{dayjs(note.updatedAt).format('YYYY-MM-DD HH:mm')}
                          </div>
                        </div>
                      }
                    />
                  </List.Item>
                );
              }}
            />
          )}
        </Card>

        {!selectedNote ? (
          <Card style={{ flex: 1 }}>
            <Empty description="请选择或新建一篇笔记" />
          </Card>
        ) : (
          <div style={{ display: 'flex', gap: 16, flex: 1, flexDirection: md ? 'row' : 'column' }}>
            <Card
              title="编辑"
              style={{ flex: 1 }}
              extra={<span>{(selectedNote.content ?? '').length}/2000</span>}
            >
              <Space wrap style={{ marginBottom: 12 }}>
                <Button size="small" onClick={() => applyEdit({ before: '**', after: '**', placeholder: '加粗文本' })}>
                  加粗
                </Button>
                <Button size="small" onClick={() => applyEdit({ before: '*', after: '*', placeholder: '斜体文本' })}>
                  斜体
                </Button>
                <Button size="small" onClick={() => applyHeading(1)}>
                  H1
                </Button>
                <Button size="small" onClick={() => applyHeading(2)}>
                  H2
                </Button>
                <Button size="small" onClick={() => applyHeading(3)}>
                  H3
                </Button>
                <Button
                  size="small"
                  onClick={() => applyEdit({ before: '- ', after: '', placeholder: '列表项' })}
                >
                  列表
                </Button>
                <Button
                  size="small"
                  onClick={() => applyEdit({ before: '[', after: '](https://example.com)', placeholder: '链接文本' })}
                >
                  链接
                </Button>
                <Button
                  size="small"
                  onClick={() => applyEdit({ before: '```\n', after: '\n```', placeholder: '代码' })}
                >
                  代码块
                </Button>
              </Space>

              <Input.TextArea
                ref={textareaRef}
                value={selectedNote.content ?? ''}
                maxLength={2000}
                autoSize={{ minRows: 12 }}
                onChange={(e) => dispatch(updateNoteContent({ id: selectedNote.id, content: e.target.value }))}
                onBlur={() => savePainNotesState(painNotesState)}
                placeholder="开始记录你的课程学习笔记（Markdown）…"
              />
            </Card>

            <Card title="预览" style={{ flex: 1 }}>
              <div className="markdown-preview" dangerouslySetInnerHTML={{ __html: markdownHtml }} />
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default PainNotes;
