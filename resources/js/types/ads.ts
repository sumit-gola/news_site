export type AdType = 'image' | 'html' | 'script';
export type AdPosition =
    | 'header'
    | 'sidebar'
    | 'inline'
    | 'footer'
    | 'popup'
    | 'below_nav'
    | 'left_sidebar_top'
    | 'left_sidebar_bottom'
    | 'right_sidebar_top'
    | 'right_sidebar_bottom'
    | 'in_article'
    | 'between_articles'
    | 'sticky_top'
    | 'sticky_bottom'
    | 'floating_bottom_right'
    | 'floating_bottom_left'
    | 'full_screen_overlay'
    | 'notification_bar';
export type AdPage = 'home' | 'article' | 'category' | 'search' | 'tag' | 'page' | 'news';
export type AdWorkflowStatus = 'draft' | 'pending_review' | 'approved' | 'rejected' | 'active' | 'paused' | 'archived';
export type FrequencyCapType = 'none' | 'session' | 'day' | 'user';
export type DisplayBehavior = 'standard' | 'closable' | 'rotational' | 'sticky' | 'floating' | 'interstitial' | 'expandable' | 'slide_in';

export type ClosableConfig = {
    dismiss_duration_hours: number;
    show_close_after_seconds: number;
    close_button_style: 'icon' | 'text' | 'icon_text';
};

export type RotationalConfig = {
    interval_seconds: number;
    transition: 'fade' | 'slide' | 'none';
    pause_on_hover: boolean;
};

export type StickyConfig = {
    offset_top: number;
    offset_bottom: number;
    z_index: number;
};

export type FloatingConfig = {
    initial_position: 'top-left' | 'top-center' | 'top-right' | 'center-left' | 'center' | 'center-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
    draggable: boolean;
    show_after_seconds: number;
};

export type InterstitialConfig = {
    show_after_pageviews: number;
    skip_after_seconds: number;
};

export type ExpandableConfig = {
    collapsed_height: number;
    expanded_height: number;
    trigger: 'hover' | 'click';
};

export type SlideInConfig = {
    direction: 'bottom' | 'right' | 'left';
    trigger: 'scroll_percent' | 'time';
    trigger_value: number;
    animation_duration_ms: number;
};

export type DisplayConfig = Partial<
    Omit<ClosableConfig, 'trigger'> &
    Omit<RotationalConfig, 'trigger'> &
    StickyConfig &
    FloatingConfig &
    InterstitialConfig &
    Omit<ExpandableConfig, 'trigger'> &
    Omit<SlideInConfig, 'trigger'>
> & {
    trigger?: ExpandableConfig['trigger'] | SlideInConfig['trigger'];
};

export type ScheduleRules = {
    time_slots?: Array<{ start_time: string; end_time: string }>;
    days_of_week?: number[];
    timezone?: string;
    blackout_dates?: string[];
};

export type ExcludeRules = {
    page_ids?: number[];
    category_ids?: number[];
    article_ids?: number[];
    url_patterns?: string[];
};

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
    status: 'draft' | 'active' | 'paused' | 'expired' | 'archived' | 'scheduled';
    raw_status: 'draft' | 'active' | 'paused' | 'expired' | 'archived';
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
    display_behavior: DisplayBehavior;
    is_closable: boolean;
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
    status: 'draft' | 'active' | 'paused' | 'expired' | 'archived';
    display_behavior: DisplayBehavior;
    display_config: DisplayConfig;
    is_closable: boolean;
    close_button_delay_seconds: number;
    schedule_rules: ScheduleRules;
    max_total_impressions: number | null;
    max_daily_impressions: number | null;
    url_patterns: string[];
    exclude_rules: ExcludeRules;
};

export type AdOptionItem = {
    id: number;
    name: string;
};
