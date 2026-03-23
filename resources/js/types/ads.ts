export type AdType = 'image' | 'html' | 'script';
export type AdPosition = 'header' | 'sidebar' | 'inline' | 'footer' | 'popup';
export type AdPage = 'home' | 'article' | 'category' | 'search';
export type AdWorkflowStatus = 'draft' | 'pending_review' | 'approved' | 'rejected' | 'active' | 'paused' | 'archived';
export type FrequencyCapType = 'none' | 'session' | 'day' | 'user';

export type AdvertiserClient = {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
};

export type AdSlotItem = {
    id: number;
    name: string;
    position: AdPosition;
    page: string | null;
};

export type AdvertisementRecord = {
    id: number;
    title: string;
    ad_type: AdType;
    image_path: string | null;
    advertiser: { id: number; name: string } | null;
    position: AdPosition;
    pages: AdPage[];
    width: number | null;
    height: number | null;
    start_date: string | null;
    end_date: string | null;
    priority: number;
    status: 'active' | 'inactive' | 'scheduled' | 'expired';
    raw_status: 'active' | 'inactive';
    workflow_status: AdWorkflowStatus | null;
    ad_slot_id: number | null;
    advertiser_id: number | null;
    is_pinned: boolean;
    is_house_ad: boolean;
    frequency_cap_type: FrequencyCapType;
    frequency_cap_value: number | null;
    device_targets: string[];
    audience_tags: string[];
    ctr: number;
    total_impressions: number;
    total_clicks: number;
};

export type AdCategoryOption = {
    id: number;
    name: string;
};

export type AdFormData = {
    advertiser_id: number | null;
    ad_slot_id: number | null;
    fallback_ad_id: number | null;
    title: string;
    ad_type: AdType;
    image_path: string;
    image_file: File | null;
    video_embed_url: string;
    html_code: string;
    script_code: string;
    target_url: string;
    open_in_new_tab: boolean;
    width: number | null;
    height: number | null;
    position: AdPosition;
    pages: AdPage[];
    category_ids: number[];
    device_targets: Array<'desktop' | 'tablet' | 'mobile'>;
    geo_countries: string[];
    language_locales: string[];
    audience_tags: string[];
    utm_source: string;
    utm_medium: string;
    utm_campaign: string;
    utm_term: string;
    utm_content: string;
    start_date: string;
    end_date: string;
    recurrence_type: 'always' | 'weekdays' | 'weekends' | 'custom';
    recurrence_days: number[];
    frequency_cap_type: FrequencyCapType;
    frequency_cap_value: number | null;
    priority: number;
    workflow_status: AdWorkflowStatus;
    reviewer_notes: string;
    internal_comments: string;
    is_pinned: boolean;
    is_house_ad: boolean;
    is_fallback: boolean;
    supported_sizes: string[];
    variant_enabled: boolean;
    variant_split: number;
    winner_metric: 'ctr' | 'clicks' | 'impressions';
    rotation_type: 'sequential' | 'random';
    status: 'active' | 'inactive';
};

export type AdOptionItem = {
    id: number;
    name: string;
};
