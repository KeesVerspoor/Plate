'use client';

import { useCallback, useRef, useState } from 'react';
import { Plate, PlateContent, usePlateEditor } from '@udecode/plate/react';
import { BoldPlugin, ItalicPlugin, UnderlinePlugin, StrikethroughPlugin, CodePlugin } from '@udecode/plate-basic-marks/react';
import { HeadingPlugin } from '@udecode/plate-heading/react';
import { BlockquotePlugin } from '@udecode/plate-block-quote/react';
import { CodeBlockPlugin } from '@udecode/plate-code-block/react';
import { ListPlugin } from '@udecode/plate-list/react';
import { cn } from '@/lib/utils';

interface PlateEditorProps {
  initialContent?: string | null;
  onSave?: (content: string) => Promise<void>;
  readOnly?: boolean;
  className?: string;
}

const DEFAULT_VALUE = [
  { type: 'p', children: [{ text: '' }] },
];

function Toolbar({ editor }: { editor: ReturnType<typeof usePlateEditor> }) {
  const tools = [
    { label: 'B', title: 'Bold', key: 'bold', style: 'font-bold' },
    { label: 'I', title: 'Italic', key: 'italic', style: 'italic' },
    { label: 'U', title: 'Underline', key: 'underline', style: 'underline' },
    { label: 'S', title: 'Strikethrough', key: 'strikethrough', style: 'line-through' },
  ];

  const headings = [
    { label: 'H1', title: 'Heading 1', type: 'h1' },
    { label: 'H2', title: 'Heading 2', type: 'h2' },
    { label: 'H3', title: 'Heading 3', type: 'h3' },
  ];

  const toggleMark = (markType: string) => {
    editor.tf.toggleMark({ key: markType });
    editor.tf.focus();
  };

  const toggleBlock = (blockType: string) => {
    const isActive = editor.api.some({
      match: { type: blockType },
    });
    editor.tf.setNodes(
      { type: isActive ? 'p' : blockType },
      { match: (n: { type?: string }) => editor.api.isBlock(n) }
    );
    editor.tf.focus();
  };

  return (
    <div className="flex items-center gap-1 p-2 border-b border-gray-200 bg-white flex-wrap">
      {tools.map((tool) => (
        <button
          key={tool.key}
          onMouseDown={(e) => {
            e.preventDefault();
            toggleMark(tool.key);
          }}
          title={tool.title}
          className={cn(
            'w-8 h-8 flex items-center justify-center rounded text-sm transition-colors',
            'hover:bg-gray-100 text-gray-600 hover:text-gray-900',
            tool.style
          )}
        >
          {tool.label}
        </button>
      ))}

      <div className="w-px h-5 bg-gray-200 mx-1" />

      {headings.map((h) => (
        <button
          key={h.type}
          onMouseDown={(e) => {
            e.preventDefault();
            toggleBlock(h.type);
          }}
          title={h.title}
          className="px-2 h-8 flex items-center justify-center rounded text-xs font-medium transition-colors hover:bg-gray-100 text-gray-600 hover:text-gray-900"
        >
          {h.label}
        </button>
      ))}

      <div className="w-px h-5 bg-gray-200 mx-1" />

      <button
        onMouseDown={(e) => {
          e.preventDefault();
          toggleBlock('blockquote');
        }}
        title="Blockquote"
        className="px-2 h-8 flex items-center justify-center rounded text-sm transition-colors hover:bg-gray-100 text-gray-600 hover:text-gray-900"
      >
        ❝
      </button>

      <button
        onMouseDown={(e) => {
          e.preventDefault();
          toggleBlock('ul');
        }}
        title="Bullet List"
        className="px-2 h-8 flex items-center justify-center rounded text-sm transition-colors hover:bg-gray-100 text-gray-600 hover:text-gray-900"
      >
        •≡
      </button>

      <button
        onMouseDown={(e) => {
          e.preventDefault();
          toggleBlock('ol');
        }}
        title="Numbered List"
        className="px-2 h-8 flex items-center justify-center rounded text-sm transition-colors hover:bg-gray-100 text-gray-600 hover:text-gray-900"
      >
        1≡
      </button>

      <button
        onMouseDown={(e) => {
          e.preventDefault();
          toggleBlock('code_block');
        }}
        title="Code Block"
        className="px-2 h-8 flex items-center justify-center rounded text-xs font-mono transition-colors hover:bg-gray-100 text-gray-600 hover:text-gray-900"
      >
        {'</>'}
      </button>
    </div>
  );
}

export default function PlateEditor({ initialContent, onSave, readOnly = false, className }: PlateEditorProps) {
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');

  const initialValue = (() => {
    if (!initialContent) return DEFAULT_VALUE;
    try {
      return JSON.parse(initialContent);
    } catch {
      return DEFAULT_VALUE;
    }
  })();

  const editor = usePlateEditor({
    plugins: [
      BoldPlugin,
      ItalicPlugin,
      UnderlinePlugin,
      StrikethroughPlugin,
      CodePlugin,
      HeadingPlugin,
      BlockquotePlugin,
      CodeBlockPlugin,
      ListPlugin,
    ],
    value: initialValue,
  });

  const handleChange = useCallback(
    ({ value }: { value: unknown[] }) => {
      if (!onSave || readOnly) return;

      setSaveStatus('unsaved');
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(async () => {
        setSaveStatus('saving');
        try {
          await onSave(JSON.stringify(value));
          setSaveStatus('saved');
        } catch {
          setSaveStatus('unsaved');
        }
      }, 1000);
    },
    [onSave, readOnly]
  );

  return (
    <div className={cn('flex flex-col', className)}>
      {!readOnly && (
        <div className="flex items-center justify-between border-b border-gray-200">
          <Toolbar editor={editor} />
          <div className="px-4 text-xs text-gray-400">
            {saveStatus === 'saved' && '✓ Saved'}
            {saveStatus === 'saving' && 'Saving...'}
            {saveStatus === 'unsaved' && 'Unsaved'}
          </div>
        </div>
      )}

      <Plate editor={editor} onValueChange={handleChange} readOnly={readOnly}>
        <PlateContent
          className={cn(
            'plate-content outline-none flex-1 px-8 py-6 min-h-[400px]',
            'text-gray-800 leading-relaxed',
            '[&_h1]:text-3xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:mt-6',
            '[&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:mb-3 [&_h2]:mt-5',
            '[&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mb-2 [&_h3]:mt-4',
            '[&_p]:mb-2',
            '[&_blockquote]:border-l-4 [&_blockquote]:border-gray-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-gray-600 [&_blockquote]:my-3',
            '[&_ul]:list-disc [&_ul]:list-inside [&_ul]:mb-2 [&_ul]:space-y-1',
            '[&_ol]:list-decimal [&_ol]:list-inside [&_ol]:mb-2 [&_ol]:space-y-1',
            '[&_code]:bg-gray-100 [&_code]:rounded [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-sm',
            '[&_pre]:bg-gray-900 [&_pre]:text-gray-100 [&_pre]:rounded-lg [&_pre]:p-4 [&_pre]:my-3 [&_pre]:overflow-x-auto',
          )}
          placeholder="Start writing..."
        />
      </Plate>
    </div>
  );
}
