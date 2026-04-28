import * as React from 'react';
import { AdBanner }   from '@/components/ads/AdBanner';
import { AdFloating } from '@/components/ads/AdFloating';
import { AdInline }   from '@/components/ads/AdInline';
import { AdPopup }    from '@/components/ads/AdPopup';
import { AdSlider }   from '@/components/ads/AdSlider';
import { AdSticky }   from '@/components/ads/AdSticky';
import type { AdPlacement } from '@/types';

interface AdManagerProps {
    placement: AdPlacement;
    pageUrl?: string;
    className?: string;
}

/**
 * Placement orchestrator — renders the right component for each placement slot.
 * Drop a single <AdManager placement="X" /> anywhere in the layout.
 *
 * Mapping:
 *   header  → AdBanner (full-width leaderboard)
 *   footer  → AdBanner + AdSticky (static + scroll-triggered)
 *   sidebar → AdSlider (300×250 carousel)
 *   inline  → AdInline (between-content native card)
 *   popup   → AdPopup + AdFloating (modal popup + corner float)
 */
export function AdManager({ placement, pageUrl, className }: AdManagerProps) {
    switch (placement) {
        case 'header':
            return <AdBanner placement="header" pageUrl={pageUrl} className={className} />;

        case 'footer':
            return (
                <>
                    <AdBanner placement="footer" pageUrl={pageUrl} className={className} />
                    <AdSticky pageUrl={pageUrl} />
                </>
            );

        case 'sidebar':
            return <AdSlider placement="sidebar" pageUrl={pageUrl} className={className} />;

        case 'inline':
            return <AdInline pageUrl={pageUrl} className={className} />;

        case 'popup':
            return (
                <>
                    <AdPopup pageUrl={pageUrl} />
                    <AdFloating pageUrl={pageUrl} />
                </>
            );

        default:
            return null;
    }
}
