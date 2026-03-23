<?php

namespace App\Services;

use HTMLPurifier;
use HTMLPurifier_Config;

/**
 * Thin wrapper around HTMLPurifier for sanitising rich-text editor output
 * before it is persisted to the database.
 *
 * Usage:
 *   use App\Services\HtmlSanitizer;
 *   $clean = HtmlSanitizer::clean($request->input('content'));
 */
class HtmlSanitizer
{
    private static ?HTMLPurifier $instance = null;

    /**
     * Sanitise an HTML string and return safe HTML.
     */
    public static function clean(?string $html): string
    {
        if ($html === null || $html === '') {
            return '';
        }

        return static::purifier()->purify($html);
    }

    private static function purifier(): HTMLPurifier
    {
        if (static::$instance === null) {
            $config = HTMLPurifier_Config::createDefault();

            // Cache directory (writable at runtime)
            $cacheDir = storage_path('app/htmlpurifier');
            if (!is_dir($cacheDir)) {
                mkdir($cacheDir, 0755, true);
            }
            $config->set('Cache.SerializerPath', $cacheDir);

            // Register custom HTML5 elements not bundled in default definitions.
            $config->set('HTML.DefinitionID', 'newsportal-html5');
            $config->set('HTML.DefinitionRev', 1);

            // Allow a rich subset suitable for a news article editor
            $config->set('HTML.Allowed',
                'p,br,strong,b,em,i,u,s,del,ins,' .
                'h1,h2,h3,h4,h5,h6,' .
                'ul,ol,li,' .
                'blockquote,pre,code,' .
                'a[href|title|target|rel],' .
                'img[src|alt|title|width|height],' .
                'table,thead,tbody,tfoot,tr,th[scope],td[colspan|rowspan],' .
                'figure,figcaption,' .
                'div[class],span[class]'
            );

            // Force rel="noopener noreferrer" on external links
            $config->set('HTML.TargetBlank', true);
            $config->set('HTML.TargetNoreferrer', true);

            if ($def = $config->maybeGetRawHTMLDefinition()) {
                $def->addElement('figure', 'Block', 'Flow', 'Common');
                $def->addElement('figcaption', 'Block', 'Flow', 'Common');
            }

            static::$instance = new HTMLPurifier($config);
        }

        return static::$instance;
    }
}
