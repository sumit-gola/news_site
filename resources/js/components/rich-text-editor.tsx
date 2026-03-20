import * as React from 'react';

type RichTextEditorProps = {
  value: string;
  onChange: (value: string) => void;
  uploadUrl?: string;
  placeholder?: string;
};

const toolbarButtonClasses =
  'inline-flex h-8 min-w-8 items-center justify-center rounded border border-input bg-background px-2 text-xs font-medium text-foreground shadow-sm transition hover:bg-muted/60 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';

const emptyMarkup = '<p></p>';

function normalizeEditorHtml(html: string): string {
  const trimmed = html.trim();

  if (trimmed === '' || trimmed === '<br>' || trimmed === '<p><br></p>') {
    return emptyMarkup;
  }

  return html;
}

function isVisuallyEmpty(html: string): boolean {
  return html
    .replace(/<br\s*\/?>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .trim() === '';
}

export function RichTextEditor({ value, onChange, uploadUrl: _uploadUrl, placeholder }: RichTextEditorProps) {
  const editorRef = React.useRef<HTMLDivElement>(null);
  const [isEmpty, setIsEmpty] = React.useState(isVisuallyEmpty(value));

  const syncContent = React.useCallback(() => {
    if (!editorRef.current) {
      return;
    }

    const nextValue = normalizeEditorHtml(editorRef.current.innerHTML);
    setIsEmpty(isVisuallyEmpty(nextValue));

    if (nextValue !== value) {
      onChange(nextValue);
    }
  }, [onChange, value]);

  const focusEditor = () => {
    editorRef.current?.focus();
  };

  const runCommand = (command: string, commandValue?: string) => {
    focusEditor();
    document.execCommand(command, false, commandValue);
    syncContent();
  };

  const insertHeading = (tagName: 'H2' | 'H3' | 'P') => {
    const block = tagName === 'P' ? 'defaultParagraphSeparator' : 'formatBlock';
    const blockValue = tagName === 'P' ? 'p' : tagName;

    runCommand(block, blockValue);
  };

  const handleLink = () => {
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim() ?? '';
    const currentValue = selectedText === '' ? 'https://' : selectedText;
    const nextUrl = window.prompt('Enter a URL', currentValue);

    if (!nextUrl) {
      return;
    }

    runCommand('createLink', nextUrl);
  };

  React.useEffect(() => {
    if (!editorRef.current) {
      return;
    }

    const nextValue = normalizeEditorHtml(value);

    if (editorRef.current.innerHTML !== nextValue) {
      editorRef.current.innerHTML = nextValue;
    }

    setIsEmpty(isVisuallyEmpty(nextValue));
  }, [value]);

  React.useEffect(() => {
    document.execCommand('defaultParagraphSeparator', false, 'p');
  }, []);

  return (
    <div className="w-full rounded-md border border-input bg-background p-1">
      <div className="flex flex-wrap gap-2 border-b border-border px-2 py-2">
        <button type="button" className={toolbarButtonClasses} onClick={() => insertHeading('H2')}>H2</button>
        <button type="button" className={toolbarButtonClasses} onClick={() => insertHeading('H3')}>H3</button>
        <button type="button" className={toolbarButtonClasses} onClick={() => insertHeading('P')}>P</button>
        <button type="button" className={toolbarButtonClasses} onClick={() => runCommand('bold')}><strong>B</strong></button>
        <button type="button" className={toolbarButtonClasses} onClick={() => runCommand('italic')}><em>I</em></button>
        <button type="button" className={toolbarButtonClasses} onClick={() => runCommand('underline')}><u>U</u></button>
        <button type="button" className={toolbarButtonClasses} onClick={() => runCommand('insertUnorderedList')}>List</button>
        <button type="button" className={toolbarButtonClasses} onClick={() => runCommand('insertOrderedList')}>1.</button>
        <button type="button" className={toolbarButtonClasses} onClick={() => runCommand('formatBlock', 'blockquote')}>Quote</button>
        <button type="button" className={toolbarButtonClasses} onClick={handleLink}>Link</button>
        <button type="button" className={toolbarButtonClasses} onClick={() => runCommand('removeFormat')}>Clear</button>
      </div>

      <div className="relative">
        {isEmpty && placeholder ? (
          <div className="pointer-events-none absolute left-4 top-4 text-sm text-muted-foreground">
            {placeholder}
          </div>
        ) : null}

        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={syncContent}
          onBlur={syncContent}
          className="min-h-[320px] px-4 py-4 text-base leading-7 outline-none"
          style={{ whiteSpace: 'pre-wrap' }}
        />
      </div>
    </div>
  );
}
