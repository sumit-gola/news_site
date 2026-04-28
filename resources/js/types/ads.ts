export type AdPlacement  = 'header' | 'sidebar' | 'inline' | 'footer' | 'popup';
export type AdDevice     = 'all' | 'desktop' | 'tablet' | 'mobile';
export type AdStatus     = 'active' | 'inactive' | 'draft';
export type AdMediaType  = 'image' | 'video' | 'html' | 'script';
export type AdType       = 'fixed' | 'closable' | 'floating' | 'popup' | 'inline' | 'sticky';
export type FloatPos     = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
export type FloatAnim    = 'slide' | 'fade' | 'bounce';

export type AdVariant = {
    id: number;
    advertisement_id: number;
    label: 'A' | 'B';
    media_url: string | null;
    media_full_url: string | null;
    embed_code: string | null;
    cta_label: string | null;
    weight: number;
    impressions_count: number;
    clicks_count: number;
    ctr: number;
};

export type AdSchedule = {
    id: number;
    advertisement_id: number;
    days_of_week: number[] | null;
    time_from: string | null;
    time_to: string | null;
    timezone: string;
};

export type Advertisement = {
    id: number;
    title: string;
    description: string | null;
    ad_type: AdType;
    media_url: string | null;
    media_type: AdMediaType;
    media_full_url: string | null;
    embed_code: string | null;
    redirect_url: string;
    cta_label: string | null;
    bg_color: string | null;
    placement_type: AdPlacement;
    device_target: AdDevice;
    float_position: FloatPos | null;
    float_animation: FloatAnim | null;
    popup_delay_seconds: number;
    popup_frequency_minutes: number | null;
    sticky_offset_px: number;
    ab_testing_enabled: boolean;
    start_datetime: string | null;
    end_datetime: string | null;
    status: AdStatus;
    priority: number;
    is_dismissible: boolean;
    impressions_count: number;
    clicks_count: number;
    ctr: number;
    created_by: number | null;
    creator?: { id: number; name: string } | null;
    variants?: AdVariant[];
    schedule?: AdSchedule | null;
    deleted_at?: string | null;
    created_at: string;
    updated_at: string;
};

/** Lightweight DTO returned by the public /api/ads endpoint */
export type AdServedDTO = {
    id: number;
    title: string;
    description: string | null;
    ad_type: AdType;
    media_type: AdMediaType;
    media_full_url: string | null;
    embed_code: string | null;
    redirect_url: string;
    cta_label: string | null;
    bg_color: string | null;
    placement_type: AdPlacement;
    device_target: AdDevice;
    is_dismissible: boolean;
    float_position: FloatPos | null;
    float_animation: FloatAnim | null;
    popup_delay_seconds: number;
    popup_frequency_minutes: number | null;
    sticky_offset_px: number;
    priority: number;
    variant_label: 'A' | 'B' | null;
};

// ── Analytics types ──────────────────────────────────────────────────────────

export type AdTimeSeriesPoint = {
    date: string;
    impressions: number;
    clicks: number;
};

export type AdTopPerformer = {
    advertisement_id: number;
    title: string;
    placement_type: AdPlacement | null;
    ad_type: AdType | null;
    status: AdStatus | null;
    impressions: number;
    clicks: number;
    ctr: number;
};

export type AdPlacementStat = {
    placement: AdPlacement;
    impressions: number;
    clicks: number;
    ctr: number;
};

export type AdAnalyticsSummary = {
    impressions: number;
    clicks: number;
    ctr: number;
    active_ads: number;
};
