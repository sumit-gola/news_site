export type Permission = {
    id: number;
    name: string;
    display_name: string;
    group: string | null;
};

export type Role = {
    id: number;
    name: string;
    display_name: string;
    description: string | null;
    color: string;
    permissions?: Permission[];
    users_count?: number;
};

export type User = {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    status: 'active' | 'inactive';
    email_verified_at: string | null;
    two_factor_enabled?: boolean;
    created_at: string;
    updated_at: string;
    roles?: Role[];
    [key: string]: unknown;
};

export type Auth = {
    user: User;
};

export type TwoFactorSetupData = {
    svg: string;
    url: string;
};

export type TwoFactorSecretKey = {
    secretKey: string;
};

export type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

export type Paginated<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: PaginationLink[];
};

export type Category = {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    parent_id: number | null;
    color: string;
    icon: string | null;
    order: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    children?: Category[];
    parent?: Category | null;
};

export type Tag = {
    id: number;
    name: string;
    slug: string;
};

export type ArticleMeta = {
    id: number;
    article_id: number;
    meta_title: string | null;
    meta_description: string | null;
    meta_keywords: string | null;
    og_image: string | null;
    canonical_url: string | null;
    read_time: number | null;
    word_count: number | null;
};

export type Article = {
    id: number;
    title: string;
    slug: string;
    excerpt: string | null;
    content: string;
    user_id: number;
    author?: User;
    featured_image: string | null;
    featured_image_url?: string | null;
    status: 'draft' | 'pending' | 'published' | 'rejected';
    views: number;
    published_at: string | null;
    created_at: string;
    updated_at: string;
    categories?: Category[];
    tags?: Tag[];
    meta?: ArticleMeta | null;
};
