'use client';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { chapterToHtml, chapterWordCount, readableText } from '../lib/story-format';

type Props = { value: string; onChange: (html: string) => void; readOnly?: boolean };
export default function ChapterRichEditor({ value, onChange, readOnly = false }: Props) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: chapterToHtml(value),
    editable: !readOnly,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      if (readOnly) return;
      const html = editor.getHTML();
      onChange(html);
    },
    editorProps: { attributes: { class: readOnly ? 'rich-editor-body rich-reader-body' : 'rich-editor-body', 'aria-label': 'Chapter text' } },
  });
  // Tiptap owns its document while typing. Never call setContent on each
  // parent update: that resets selection and can scroll a long chapter upward.
  // The dashboard remounts this component only on chapter change or file import.
  if (!editor) return;
    // Local typing already changed the editor. Do not re-inject it: setContent
    // can reset selection and cause the page to jump when typing or clicking.
    if (value === lastEmittedHtml.current) return;
    const html = chapterToHtml(value);
    if (editor.getHTML() !== html) editor.commands.setContent(html, { emitUpdate: false });
    lastEmittedHtml.current = value;
  }, [editor, value]);
  if (!editor) return <div className="rich-editor-loading">Loading editor…</div>;
  const toolbar = [
    { label: 'Bold', symbol: 'B', active: editor.isActive('bold'), run: () => editor.chain().focus().toggleBold().run(), title: 'Bold (Ctrl+B)' },
    { label: 'Italic', symbol: 'I', active: editor.isActive('italic'), run: () => editor.chain().focus().toggleItalic().run(), title: 'Italic (Ctrl+I)' },
    { label: 'Strike', symbol: 'S̶', active: editor.isActive('strike'), run: () => editor.chain().focus().toggleStrike().run(), title: 'Strikethrough' },
    { label: 'Blockquote', symbol: '❝', active: editor.isActive('blockquote'), run: () => editor.chain().focus().toggleBlockquote().run(), title: 'Blockquote' },
    { label: 'Bullet list', symbol: '• List', active: editor.isActive('bulletList'), run: () => editor.chain().focus().toggleBulletList().run(), title: 'Bullet list' },
    { label: 'Horizontal rule', symbol: '—', active: false, run: () => editor.chain().focus().setHorizontalRule().run(), title: 'Scene break' },
    { label: 'Undo', symbol: '↶', active: false, run: () => editor.chain().focus().undo().run(), title: 'Undo (Ctrl+Z)' },
    { label: 'Redo', symbol: '↷', active: false, run: () => editor.chain().focus().redo().run(), title: 'Redo (Ctrl+Y)' },
  ];
  return <div className="rich-editor-shell">
    {!readOnly && <div className="rich-toolbar" role="toolbar" aria-label="Chapter formatting">
      {toolbar.map(b => <button key={b.label} type="button" aria-label={b.label} title={b.title} aria-pressed={b.active} className={b.active ? 'active' : ''} onMouseDown={e => e.preventDefault()} onClick={b.run}>{b.symbol}</button>)}
    </div>}
    <EditorContent editor={editor}/>
    {!readOnly && <div className="rich-editor-footer">{chapterWordCount(value).toLocaleString()} words · {readableText(value).length.toLocaleString()} characters</div>}
  </div>;
}
