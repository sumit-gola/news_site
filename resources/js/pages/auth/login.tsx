import { Form, Head, Link } from '@inertiajs/react';
import { Mail, Lock, ArrowRight, Newspaper, TrendingUp, Users, Globe, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { Spinner } from '@/components/ui/spinner';
import { register } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';

type Props = {
    status?: string;
    canResetPassword: boolean;
    canRegister: boolean;
};

const FEATURES = [
    { icon: Newspaper,   text: 'Access 10,000+ curated news articles across every category' },
    { icon: TrendingUp,  text: 'Real-time trending stories and breaking news alerts' },
    { icon: Globe,       text: 'Coverage from local cities to global headlines' },
];

const STATS = [
    { value: '156+', label: 'Articles' },
    { value: '12+',  label: 'Categories' },
    { value: '5+',   label: 'Authors' },
];

export default function Login({ status, canResetPassword, canRegister }: Props) {
    const [showPass, setShowPass] = useState(false);

    return (
        <div className="flex min-h-screen">
            <Head title="Sign In — NewsPortal" />

            {/* ── LEFT PANEL ─────────────────────────────────────── */}
            <div className="relative hidden w-1/2 overflow-hidden lg:flex lg:flex-col">
                {/* gradient background */}
                <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-red-950 to-gray-900" />

                {/* decorative grid */}
                <div className="absolute inset-0 opacity-[0.04]"
                    style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '48px 48px' }} />

                {/* blobs */}
                <div className="absolute -top-32 -left-32 size-96 rounded-full bg-red-600/20 blur-3xl" />
                <div className="absolute bottom-0 right-0 size-80 rounded-full bg-red-800/20 blur-3xl" />
                <div className="absolute top-1/2 left-1/2 size-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-700/10 blur-2xl" />

                <div className="relative flex flex-1 flex-col px-12 py-10">
                    {/* logo */}
                    <Link href="/" className="flex items-center gap-2.5 w-fit">
                        <div className="flex size-10 items-center justify-center rounded-xl bg-red-600 shadow-lg">
                            <Newspaper className="size-5 text-white" />
                        </div>
                        <span className="text-xl font-black tracking-tight text-white">
                            NEWS<span className="text-red-400">PORTAL</span>
                        </span>
                    </Link>

                    {/* hero text */}
                    <div className="mt-auto mb-auto flex flex-col gap-8 py-16">
                        <div>
                            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-red-400">
                                <span className="size-1.5 animate-pulse rounded-full bg-red-400" />
                                Live updates every hour
                            </div>
                            <h2 className="text-4xl font-black leading-tight tracking-tight text-white xl:text-5xl">
                                Stay Informed.<br />
                                <span className="bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                                    Stay Ahead.
                                </span>
                            </h2>
                            <p className="mt-4 max-w-sm text-base leading-relaxed text-gray-400">
                                Your trusted source for breaking news, in-depth analysis, and stories that matter — delivered instantly.
                            </p>
                        </div>

                        {/* features */}
                        <div className="space-y-4">
                            {FEATURES.map(({ icon: Icon, text }) => (
                                <div key={text} className="flex items-start gap-3">
                                    <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-red-500/15">
                                        <Icon className="size-3.5 text-red-400" />
                                    </div>
                                    <p className="text-sm leading-snug text-gray-400">{text}</p>
                                </div>
                            ))}
                        </div>

                        {/* stats bar */}
                        <div className="flex items-center gap-px overflow-hidden rounded-2xl border border-white/10">
                            {STATS.map(({ value, label }, i) => (
                                <div key={label} className={`flex flex-1 flex-col items-center gap-0.5 py-4 ${i < STATS.length - 1 ? 'border-r border-white/10' : ''} bg-white/5`}>
                                    <span className="text-2xl font-black text-white">{value}</span>
                                    <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">{label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* footer */}
                    <p className="text-[11px] text-gray-600">© 2026 NewsPortal. All rights reserved.</p>
                </div>
            </div>

            {/* ── RIGHT PANEL ────────────────────────────────────── */}
            <div className="flex flex-1 flex-col items-center justify-center bg-gray-50 px-6 py-12 dark:bg-gray-950">
                {/* mobile logo */}
                <Link href="/" className="mb-8 flex items-center gap-2 lg:hidden">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-red-600">
                        <Newspaper className="size-4 text-white" />
                    </div>
                    <span className="text-lg font-black tracking-tight">NEWS<span className="text-red-600">PORTAL</span></span>
                </Link>

                <div className="w-full max-w-md">
                    {/* card */}
                    <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl shadow-gray-200/60 dark:border-gray-800 dark:bg-gray-900 dark:shadow-none">
                        {/* card top accent */}
                        <div className="h-1 w-full bg-gradient-to-r from-red-600 via-orange-500 to-red-600" />

                        <div className="px-8 py-8">
                            <div className="mb-7">
                                <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
                                    Welcome back
                                </h1>
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                    Sign in to your account to continue reading
                                </p>
                            </div>

                            {status && (
                                <div className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400">
                                    <CheckCircle2 className="size-4 shrink-0" />
                                    {status}
                                </div>
                            )}

                            <Form
                                {...store.form()}
                                resetOnSuccess={['password']}
                                className="space-y-5"
                            >
                                {({ processing, errors }) => (
                                    <>
                                        {/* email */}
                                        <div className="space-y-1.5">
                                            <label htmlFor="email" className="text-[12px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                                Email address
                                            </label>
                                            <div className="relative">
                                                <Mail className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                                                <input
                                                    id="email"
                                                    type="email"
                                                    name="email"
                                                    required
                                                    autoFocus
                                                    tabIndex={1}
                                                    autoComplete="email"
                                                    placeholder="you@example.com"
                                                    className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 transition focus:border-red-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-400/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 dark:focus:border-red-500 dark:focus:bg-gray-800"
                                                />
                                            </div>
                                            <InputError message={errors.email} />
                                        </div>

                                        {/* password */}
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <label htmlFor="password" className="text-[12px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                                    Password
                                                </label>
                                                {canResetPassword && (
                                                    <Link href={request()} tabIndex={5}
                                                        className="text-[12px] font-semibold text-red-600 transition hover:text-red-700 dark:text-red-400">
                                                        Forgot password?
                                                    </Link>
                                                )}
                                            </div>
                                            <div className="relative">
                                                <Lock className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                                                <input
                                                    id="password"
                                                    type={showPass ? 'text' : 'password'}
                                                    name="password"
                                                    required
                                                    tabIndex={2}
                                                    autoComplete="current-password"
                                                    placeholder="••••••••"
                                                    className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-10 text-sm text-gray-900 placeholder-gray-400 transition focus:border-red-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-400/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 dark:focus:border-red-500 dark:focus:bg-gray-800"
                                                />
                                                <button type="button" onClick={() => setShowPass(v => !v)} tabIndex={-1}
                                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-600">
                                                    {showPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                                </button>
                                            </div>
                                            <InputError message={errors.password} />
                                        </div>

                                        {/* remember me */}
                                        <label className="flex cursor-pointer items-center gap-2.5">
                                            <input type="checkbox" name="remember" tabIndex={3}
                                                className="size-4 rounded border-gray-300 accent-red-600" />
                                            <span className="text-sm text-gray-600 dark:text-gray-400">Keep me signed in</span>
                                        </label>

                                        {/* submit */}
                                        <button type="submit" tabIndex={4} disabled={processing}
                                            className="group flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-6 text-sm font-bold text-white shadow-md shadow-red-600/25 transition hover:bg-red-700 hover:shadow-red-600/40 disabled:opacity-60 disabled:cursor-not-allowed">
                                            {processing
                                                ? <><Spinner className="size-4" /> Signing in…</>
                                                : <><span>Sign in</span><ArrowRight className="size-4 transition group-hover:translate-x-0.5" /></>
                                            }
                                        </button>

                                        {/* divider */}
                                        {canRegister && (
                                            <div className="relative flex items-center gap-3 py-1">
                                                <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
                                                <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">or</span>
                                                <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
                                            </div>
                                        )}

                                        {/* register cta */}
                                        {canRegister && (
                                            <Link href={register()} tabIndex={6}
                                                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border-2 border-gray-200 bg-white text-sm font-bold text-gray-700 transition hover:border-red-300 hover:text-red-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-red-600 dark:hover:text-red-400">
                                                <Users className="size-4" />
                                                Create a new account
                                            </Link>
                                        )}
                                    </>
                                )}
                            </Form>
                        </div>
                    </div>

                    <p className="mt-6 text-center text-[11px] text-gray-400">
                        By continuing, you agree to our{' '}
                        <Link href="/" className="underline hover:text-red-600">Terms of Service</Link>
                        {' '}and{' '}
                        <Link href="/" className="underline hover:text-red-600">Privacy Policy</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
