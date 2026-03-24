import { CKEditor } from '@ckeditor/ckeditor5-react';
import {
    Alignment,
    Autoformat,
    AutoImage,
    AutoLink,
    BlockQuote,
    Bold,
    ClassicEditor,
    Code,
    CodeBlock,
    Essentials,
    FindAndReplace,
    FontBackgroundColor,
    FontColor,
    FontFamily,
    FontSize,
    GeneralHtmlSupport,
    Heading,
    Highlight,
    HorizontalLine,
    HtmlEmbed,
    Image,
    ImageBlock,
    ImageCaption,
    ImageInline,
    ImageInsert,
    ImageInsertViaUrl,
    ImageResize,
    ImageStyle,
    ImageToolbar,
    ImageUpload,
    Indent,
    IndentBlock,
    Italic,
    Link,
    LinkImage,
    List,       // handles both bulleted and numbered lists in v47+
    ListProperties,
    MediaEmbed,
    Mention,
    PageBreak,
    Paragraph,
    PasteFromOffice,
    PictureEditing,
    RemoveFormat,
    SelectAll,
    ShowBlocks,
    SimpleUploadAdapter,
    SourceEditing,
    SpecialCharacters,
    SpecialCharactersArrows,
    SpecialCharactersCurrency,
    SpecialCharactersEssentials,
    SpecialCharactersLatin,
    SpecialCharactersMathematical,
    SpecialCharactersText,
    Strikethrough,
    Style,
    Subscript,
    Superscript,
    Table,
    TableCaption,
    TableCellProperties,
    TableColumnResize,
    TableProperties,
    TableToolbar,
    TodoList,
    Underline,
    WordCount,
} from 'ckeditor5';

import 'ckeditor5/ckeditor5.css';

import * as React from 'react';

type WordCountData = { words: number; characters: number };

type RichTextEditorProps = {
    value: string;
    onChange: (value: string) => void;
    /** Pass false to disable image uploads. Defaults to /editor/images/upload */
    uploadUrl?: string | false;
    placeholder?: string;
};

const BASE_PLUGINS = [
    Essentials,
    Paragraph,
    Autoformat,
    AutoLink,
    AutoImage,
    PasteFromOffice,
    SelectAll,
    RemoveFormat,
    FindAndReplace,
    ShowBlocks,
    SourceEditing,
    WordCount,
    PageBreak,
    Bold,
    Italic,
    Underline,
    Strikethrough,
    Subscript,
    Superscript,
    Code,
    Highlight,
    Heading,
    FontFamily,
    FontSize,
    FontColor,
    FontBackgroundColor,
    Alignment,
    Indent,
    IndentBlock,
    List,
    TodoList,
    ListProperties,
    BlockQuote,
    CodeBlock,
    HorizontalLine,
    Link,
    LinkImage,
    Image,
    ImageBlock,
    ImageCaption,
    ImageInline,
    ImageInsert,
    ImageInsertViaUrl,
    ImageResize,
    ImageStyle,
    ImageToolbar,
    ImageUpload,
    PictureEditing,
    Table,
    TableToolbar,
    TableProperties,
    TableCellProperties,
    TableColumnResize,
    TableCaption,
    MediaEmbed,
    SpecialCharacters,
    SpecialCharactersEssentials,
    SpecialCharactersMathematical,
    SpecialCharactersText,
    SpecialCharactersArrows,
    SpecialCharactersCurrency,
    SpecialCharactersLatin,
    GeneralHtmlSupport,
    HtmlEmbed,
    Mention,
    Style,
];

function buildConfig(
    onWordCount: (data: WordCountData) => void,
    placeholder?: string,
    uploadUrl?: string | false,
) {
    const plugins = uploadUrl ? [...BASE_PLUGINS, SimpleUploadAdapter] : BASE_PLUGINS;

    const config: Record<string, unknown> = {
        licenseKey: 'GPL',
        plugins,
        placeholder,
        toolbar: {
            items: [
                'undo', 'redo',
                '|', 'findAndReplace', 'selectAll', 'showBlocks', 'sourceEditing',
                '|', 'heading', 'style',
                '|', 'fontFamily', 'fontSize', 'fontColor', 'fontBackgroundColor', 'highlight',
                '|', 'bold', 'italic', 'underline',
                {
                    label: 'More text',
                    icon: 'threeVerticalDots',
                    items: ['strikethrough', 'subscript', 'superscript', 'code', 'removeFormat'],
                },
                '|', 'alignment',
                '|', 'bulletedList', 'numberedList', 'todoList', 'outdent', 'indent',
                '|', 'insertImage', 'link', 'insertTable', 'mediaEmbed', 'blockQuote', 'codeBlock', 'htmlEmbed',
                '|', 'specialCharacters', 'horizontalLine', 'pageBreak',
            ],
            shouldNotGroupWhenFull: true,
        },
        heading: {
            options: [
                { model: 'paragraph', title: 'Paragraph', class: 'ck-heading_paragraph' },
                { model: 'heading1', view: 'h1', title: 'Heading 1', class: 'ck-heading_heading1' },
                { model: 'heading2', view: 'h2', title: 'Heading 2', class: 'ck-heading_heading2' },
                { model: 'heading3', view: 'h3', title: 'Heading 3', class: 'ck-heading_heading3' },
                { model: 'heading4', view: 'h4', title: 'Heading 4', class: 'ck-heading_heading4' },
                { model: 'heading5', view: 'h5', title: 'Heading 5', class: 'ck-heading_heading5' },
                { model: 'heading6', view: 'h6', title: 'Heading 6', class: 'ck-heading_heading6' },
            ],
        },
        style: {
            definitions: [
                { name: 'Article category', element: 'h3', classes: ['category'] },
                { name: 'Lead paragraph', element: 'p', classes: ['lead'] },
                { name: 'Info box', element: 'p', classes: ['info-box'] },
                { name: 'Warning', element: 'p', classes: ['warning'] },
                { name: 'Code (dark)', element: 'pre', classes: ['fancy-code', 'fancy-code-dark'] },
                { name: 'Code (bright)', element: 'pre', classes: ['fancy-code', 'fancy-code-bright'] },
                { name: 'Marker', element: 'span', classes: ['marker'] },
                { name: 'Spoiler', element: 'span', classes: ['spoiler'] },
                { name: 'Badge', element: 'span', classes: ['badge'] },
            ],
        },
        fontFamily: { supportAllValues: true },
        fontSize: {
            options: [10, 11, 12, 13, 14, 15, 16, 17, 18, 20, 22, 24, 28, 32, 36, 48],
            supportAllValues: true,
        },
        highlight: {
            options: [
                { model: 'yellowMarker', class: 'marker-yellow', title: 'Yellow marker', color: 'var(--ck-highlight-marker-yellow)', type: 'marker' },
                { model: 'greenMarker', class: 'marker-green', title: 'Green marker', color: 'var(--ck-highlight-marker-green)', type: 'marker' },
                { model: 'pinkMarker', class: 'marker-pink', title: 'Pink marker', color: 'var(--ck-highlight-marker-pink)', type: 'marker' },
                { model: 'blueMarker', class: 'marker-blue', title: 'Blue marker', color: 'var(--ck-highlight-marker-blue)', type: 'marker' },
                { model: 'redPen', class: 'pen-red', title: 'Red pen', color: 'var(--ck-highlight-pen-red)', type: 'pen' },
                { model: 'greenPen', class: 'pen-green', title: 'Green pen', color: 'var(--ck-highlight-pen-green)', type: 'pen' },
            ],
        },
        image: {
            toolbar: [
                'toggleImageCaption', 'imageTextAlternative',
                '|', 'imageStyle:inline', 'imageStyle:wrapText', 'imageStyle:breakText', 'imageStyle:side',
                '|', 'resizeImage:25', 'resizeImage:50', 'resizeImage:75', 'resizeImage:original',
                '|', 'linkImage',
            ],
            resizeOptions: [
                { name: 'resizeImage:original', value: null, label: 'Original' },
                { name: 'resizeImage:25', value: '25', label: '25%' },
                { name: 'resizeImage:50', value: '50', label: '50%' },
                { name: 'resizeImage:75', value: '75', label: '75%' },
            ],
            insert: {
                integrations: uploadUrl ? ['upload', 'url'] : ['url'],
            },
        },
        link: {
            addTargetToExternalLinks: true,
            defaultProtocol: 'https://',
            decorators: {
                openInNewTab: {
                    mode: 'manual',
                    label: 'Open in a new tab',
                    attributes: { target: '_blank', rel: 'noopener noreferrer' },
                },
            },
        },
        list: {
            properties: { styles: true, startIndex: true, reversed: true },
        },
        table: {
            contentToolbar: [
                'tableColumn', 'tableRow', 'mergeTableCells',
                'tableProperties', 'tableCellProperties',
                '|', 'toggleTableCaption',
            ],
        },
        codeBlock: {
            languages: [
                { language: 'plaintext', label: 'Plain text' },
                { language: 'c', label: 'C' },
                { language: 'cs', label: 'C#' },
                { language: 'cpp', label: 'C++' },
                { language: 'css', label: 'CSS' },
                { language: 'diff', label: 'Diff' },
                { language: 'html', label: 'HTML' },
                { language: 'java', label: 'Java' },
                { language: 'javascript', label: 'JavaScript' },
                { language: 'php', label: 'PHP' },
                { language: 'python', label: 'Python' },
                { language: 'ruby', label: 'Ruby' },
                { language: 'sql', label: 'SQL' },
                { language: 'typescript', label: 'TypeScript' },
                { language: 'xml', label: 'XML' },
            ],
        },
        htmlSupport: {
            allow: [{ name: /.*/, attributes: true, classes: true, styles: true }],
        },
        mediaEmbed: { previewsInData: true },
        mention: { feeds: [] },
        wordCount: {
            onUpdate: (stats: WordCountData) => onWordCount(stats),
        },
        ...(uploadUrl && {
            simpleUpload: {
                uploadUrl,
                withCredentials: true,
                headers: {
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '',
                },
            },
        }),
    };

    return config;
}

export function RichTextEditor({
    value,
    onChange,
    uploadUrl = '/editor/images/upload',
    placeholder,
}: RichTextEditorProps) {
    const [wordCount, setWordCount] = React.useState<WordCountData>({ words: 0, characters: 0 });

    const config = React.useMemo(
        () => buildConfig(setWordCount, placeholder, uploadUrl),
        [placeholder, uploadUrl],
    );

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
            <div className="flex items-center justify-end gap-4 border-t border-input px-3 py-1.5 text-xs text-muted-foreground">
                <span>{wordCount.words.toLocaleString()} words</span>
                <span>{wordCount.characters.toLocaleString()} characters</span>
            </div>
        </div>
    );
}

export default RichTextEditor;
