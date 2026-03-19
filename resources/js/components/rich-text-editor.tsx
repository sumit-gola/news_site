import * as React from 'react';

type RichTextEditorProps = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
};

const toolbarButtonClasses =
  'inline-flex items-center justify-center rounded border border-input bg-background px-2 py-1 text-xs font-medium text-foreground shadow-sm transition hover:bg-muted/60 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';

export function RichTextEditor({ value, onChange, className, placeholder }: RichTextEditorProps) {
  const editorRef = React.useRef<HTMLDivElement>(null);

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    syncContent();
  };

  const syncContent = () => {
    if (!editorRef.current) return;
    onChange(editorRef.current.innerHTML);
  };

  const handleInput = () => {
    syncContent();
  };

  React.useEffect(() => {
    if (!editorRef.current) return;
    if (editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  return (
    <div className={className}>
      <div className="flex flex-wrap gap-2 border-b border-border pb-2 mb-2">
        <button type="button" className={toolbarButtonClasses} onClick={() => execCommand('bold')}>
          <strong>B</strong>
        </button>
        <button type="button" className={toolbarButtonClasses} onClick={() => execCommand('italic')}>
          <em>I</em>
        </button>
        <button type="button" className={toolbarButtonClasses} onClick={() => execCommand('underline')}>
          <u>U</u>
        </button>
        <button type="button" className={toolbarButtonClasses} onClick={() => execCommand('insertUnorderedList')}>
          • List
        </button>
        <button type="button" className={toolbarButtonClasses} onClick={() => execCommand('insertOrderedList')}>
          1. List
        </button>
        <button
          type="button"
          className={toolbarButtonClasses}
          onClick={() => {
            const url = window.prompt('Enter URL');
            if (url) execCommand('createLink', url);
          }}
        >
          Link
        </button>
      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        className="min-h-[220px] rounded-md border border-input bg-background p-4 text-base focus:outline-none focus:ring-2 focus:ring-ring"
        data-placeholder={placeholder}
        style={{ whiteSpace: 'pre-wrap' }}
      />
    </div>
  );
}
