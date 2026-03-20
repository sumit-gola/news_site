import * as React from 'react';

type RichTextEditorProps = {
  value: string;
  onChange: (value: string) => void;
  uploadUrl?: string;
  placeholder?: string;
};

type LoadedEditor = {
  CKEditor: React.ComponentType<any>;
  ClassicEditor: unknown;
  config: Record<string, unknown>;
};

function buildEditorConfig(ckeditor: Record<string, unknown>, placeholder?: string, uploadUrl?: string) {
  const plugins = [
    ckeditor.Essentials,
    ckeditor.Paragraph,
    ckeditor.Heading,
    ckeditor.Alignment,
    ckeditor.Autoformat,
    ckeditor.AutoImage,
    ckeditor.AutoLink,
    ckeditor.Bold,
    ckeditor.Italic,
    ckeditor.Underline,
    ckeditor.Strikethrough,
    ckeditor.Subscript,
    ckeditor.Superscript,
    ckeditor.Code,
    ckeditor.BlockQuote,
    ckeditor.CodeBlock,
    ckeditor.FontFamily,
    ckeditor.FontSize,
    ckeditor.FontColor,
    ckeditor.FontBackgroundColor,
    ckeditor.Highlight,
    ckeditor.HorizontalLine,
    ckeditor.GeneralHtmlSupport,
    ckeditor.HtmlEmbed,
    ckeditor.Link,
    ckeditor.BulletedList,
    ckeditor.NumberedList,
    ckeditor.TodoList,
    ckeditor.ListProperties,
    ckeditor.Indent,
    ckeditor.IndentBlock,
    ckeditor.MediaEmbed,
    ckeditor.PasteFromOffice,
    ckeditor.RemoveFormat,
    ckeditor.SelectAll,
    ckeditor.ShowBlocks,
    ckeditor.SourceEditing,
    ckeditor.SpecialCharacters,
    ckeditor.SpecialCharactersEssentials,
    ckeditor.SpecialCharactersMathematical,
    ckeditor.SpecialCharactersText,
    ckeditor.Table,
    ckeditor.TableToolbar,
    ckeditor.TableProperties,
    ckeditor.TableCellProperties,
  ].filter(Boolean);

  const config: Record<string, unknown> = {
    licenseKey: 'GPL',
    plugins,
    placeholder,
    toolbar: {
      items: [
        'undo',
        'redo',
        '|',
        'findAndReplace',
        'selectAll',
        'showBlocks',
        'sourceEditing',
        '|',
        'heading',
        'fontFamily',
        'fontSize',
        'fontColor',
        'fontBackgroundColor',
        'highlight',
        '|',
        'bold',
        'italic',
        'underline',
        'strikethrough',
        'subscript',
        'superscript',
        'code',
        'removeFormat',
        '|',
        'alignment',
        'bulletedList',
        'numberedList',
        'todoList',
        'outdent',
        'indent',
        '|',
        'link',
        'blockQuote',
        'insertTable',
        'mediaEmbed',
        'specialCharacters',
        'horizontalLine',
        'codeBlock',
        'htmlEmbed',
      ],
      shouldNotGroupWhenFull: false,
    },
    heading: {
      options: [
        { model: 'paragraph', title: 'Paragraph', class: 'ck-heading_paragraph' },
        { model: 'heading2', view: 'h2', title: 'Heading 2', class: 'ck-heading_heading2' },
        { model: 'heading3', view: 'h3', title: 'Heading 3', class: 'ck-heading_heading3' },
        { model: 'heading4', view: 'h4', title: 'Heading 4', class: 'ck-heading_heading4' },
      ],
    },
    link: {
      addTargetToExternalLinks: true,
      defaultProtocol: 'https://',
      decorators: {
        openInNewTab: {
          mode: 'manual',
          label: 'Open in a new tab',
          attributes: {
            target: '_blank',
            rel: 'noopener noreferrer',
          },
        },
      },
    },
    list: {
      properties: {
        styles: true,
        startIndex: true,
        reversed: true,
      },
    },
    table: {
      contentToolbar: [
        'tableColumn',
        'tableRow',
        'mergeTableCells',
        'tableProperties',
        'tableCellProperties',
      ],
    },
    htmlSupport: {
      allow: [
        {
          name: /.*/,
          attributes: true,
          classes: true,
          styles: true,
        },
      ],
    },
    mediaEmbed: {
      previewsInData: true,
    },
  };

  if (ckeditor.FindAndReplace) {
    plugins.push(ckeditor.FindAndReplace);
  }

  if (uploadUrl && ckeditor.SimpleUploadAdapter) {
    plugins.push(ckeditor.SimpleUploadAdapter);
    config.simpleUpload = {
      uploadUrl,
      withCredentials: true,
    };
  }

  return config;
}

export function RichTextEditor({ value, onChange, uploadUrl, placeholder }: RichTextEditorProps) {
  const [loadedEditor, setLoadedEditor] = React.useState<LoadedEditor | null>(null);

  React.useEffect(() => {
    let isActive = true;

    const loadEditor = async () => {
      const [{ CKEditor }, ckeditor] = await Promise.all([
        import('@ckeditor/ckeditor5-react'),
        import('ckeditor5'),
      ]);

      if (!isActive) {
        return;
      }

      setLoadedEditor({
        CKEditor,
        ClassicEditor: ckeditor.ClassicEditor,
        config: buildEditorConfig(ckeditor, placeholder, uploadUrl),
      });
    };

    void loadEditor();

    return () => {
      isActive = false;
    };
  }, [placeholder, uploadUrl]);

  if (!loadedEditor) {
    return (
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-h-[320px] w-full rounded-md border border-input bg-background px-4 py-3 text-base leading-7 outline-none focus:ring-2 focus:ring-ring"
      />
    );
  }

  const { CKEditor, ClassicEditor, config } = loadedEditor;

  return (
    <div className="ckeditor-shell overflow-hidden rounded-md border border-input bg-background shadow-sm">
      <CKEditor
        editor={ClassicEditor}
        config={config}
        data={value}
        onChange={(_event: unknown, editor: { getData: () => string }) => {
          onChange(editor.getData());
        }}
      />
    </div>
  );
}
