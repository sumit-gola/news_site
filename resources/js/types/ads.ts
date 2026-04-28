export type AdPlacement = 'header' | 'sidebar' | 'inline' | 'footer' | 'popup';
export type AdDevice = 'all' | 'desktop' | 'tablet' | 'mobile';
export type AdStatus = 'active' | 'inactive' | 'draft';
export type AdMediaType = 'image' | 'video';

export type Advertisement = {
    id: number;
    title: string;
    description: string | null;
    media_url: string | null;
    media_type: AdMediaType;
    media_full_url: string | null;
    redirect_url: string;
    placement_type: AdPlacement;
    device_target: AdDevice;
    start_datetime: string | null;
    end_datetime: string | null;
    status: AdStatus;
    priority: number;
    is_dismissible: boolean;
    impressions_count: number;
    clicks_count: number;
    created_by: number | null;
    creator?: { id: number; name: string } | null;
    created_at: string;
    updated_at: string;
};
