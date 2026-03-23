export type AdType = 'image' | 'html' | 'script';
export type AdPosition = 'header' | 'sidebar' | 'inline' | 'footer' | 'popup';
export type AdPage = 'home' | 'article' | 'category' | 'search';

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
    title: string;
    ad_type: AdType;
    image_path: string;
    image_file: File | null;
    html_code: string;
    script_code: string;
    target_url: string;
    open_in_new_tab: boolean;
    width: number | null;
    height: number | null;
    position: AdPosition;
    pages: AdPage[];
    category_ids: number[];
    start_date: string;
    end_date: string;
    priority: number;
    rotation_type: 'sequential' | 'random';
    status: 'active' | 'inactive';
};
