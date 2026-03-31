import AppLogoIcon from '@/components/app-logo-icon';

export default function AppLogo() {
    return (
        <>
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-red-700 shadow-sm text-white">
                <AppLogoIcon className="size-5 fill-current" />
            </div>
            <div className="ml-1 grid flex-1 text-left">
                <span className="truncate text-sm font-bold leading-tight tracking-tight">
                    Tejyug News
                </span>
                <span className="truncate text-[10px] font-medium text-sidebar-foreground/50 leading-tight">
                    Admin Portal
                </span>
            </div>
        </>
    );
}
