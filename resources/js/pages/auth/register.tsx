import { Form, Head, Link } from '@inertiajs/react';
import { User, Mail, Lock, ArrowRight, Newspaper, ShieldCheck, Eye, EyeOff, CheckCircle2, Star } from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { Spinner } from '@/components/ui/spinner';
import { login } from '@/routes';
import { store } from '@/routes/register';

const PERKS = [
    { icon: Star,         text: 'Personalized news feed based on your interests' },
    { icon: ShieldCheck,  text: 'Ad-free reading experience for members' },
    { icon: Newspaper,    text: 'Save articles and read them offline anytime' },
];

/* ─── Password strength indicator ───────────────────── */
function PasswordStrength({ password }: { password: string }) {
    const score = [
        password.length >= 8,
        /[A-Z]/.test(password),
        /[0-9]/.test(password),
        /[^A-Za-z0-9]/.test(password),
    ].filter(Boolean).length;

    const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
    const colors = ['', 'bg-red-500', 'bg-orange-400', 'bg-yellow-400', 'bg-emerald-500'];
    const textColors = ['', 'text-red-500', 'text-orange-400', 'text-yellow-500', 'text-emerald-500'];

    if (!password) return null;
    return (
        <div className="mt-1.5 space-y-1">
            <div className="flex gap-1">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= score ? colors[score] : 'bg-gray-200 dark:bg-gray-700'}`} />
                ))}
            </div>
            <p className={`text-[11px] font-semibold ${textColors[score]}`}>{labels[score]}</p>
        </div>
    );
}

export default function Register() {
    const [showPass, setShowPass] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [password, setPassword] = useState('');

    return (
        <div className="flex min-h-screen">
            <Head title="Create Account — NewsPortal" />

            {/* ── LEFT PANEL ─────────────────────────────────────── */}
            <div className="relative hidden w-[42%] overflow-hidden lg:flex lg:flex-col">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-red-950 to-gray-900" />
                <div className="absolute inset-0 opacity-[0.04]"
                    style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '48px 48px' }} />
                <div className="absolute -top-32 -left-32 size-96 rounded-full bg-red-600/20 blur-3xl" />
                <div className="absolute bottom-0 right-0 size-80 rounded-full bg-red-800/20 blur-3xl" />

                <div className="relative flex flex-1 flex-col px-10 py-10">
                    {/* logo */}
                    <Link href="/" className="flex items-center gap-2.5 w-fit">
                        <div className="flex size-10 items-center justify-center rounded-xl bg-red-600 shadow-lg">
                            <Newspaper className="size-5 text-white" />
                        </div>
                        <span className="text-xl font-black tracking-tight text-white">
                            NEWS<span className="text-red-400">PORTAL</span>
                        </span>
                    </Link>

                    <div className="mt-auto mb-auto flex flex-col gap-8 py-12">
                        <div>
                            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-red-400">
                                <span className="size-1.5 animate-pulse rounded-full bg-red-400" />
                                Free forever
                            </div>
                            <h2 className="text-4xl font-black leading-tight tracking-tight text-white">
                                Join the<br />
                                <span className="bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                                    Community
                                </span>
                            </h2>
                            <p className="mt-4 max-w-xs text-sm leading-relaxed text-gray-400">
                                Create your free account and unlock a fully personalized news experience tailored to you.
                            </p>
                        </div>

                        {/* perks */}
                        <div className="space-y-4">
                            {PERKS.map(({ icon: Icon, text }) => (
                                <div key={text} className="flex items-start gap-3">
                                    <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-red-500/15">
                                        <Icon className="size-3.5 text-red-400" />
                                    </div>
                                    <p className="text-sm leading-snug text-gray-400">{text}</p>
                                </div>
                            ))}
                        </div>

                        {/* social proof */}
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                            <div className="flex items-center gap-1 mb-2">
                                {[1,2,3,4,5].map(i => <Star key={i} className="size-3.5 fill-amber-400 text-amber-400" />)}
                            </div>
                            <p className="text-sm italic leading-relaxed text-gray-400">
                                "NewsPortal is my go-to source every morning. The coverage is comprehensive and always up-to-date."
                            </p>
                            <p className="mt-3 text-[11px] font-semibold text-gray-500">— A trusted reader</p>
                        </div>
                    </div>

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
                    <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl shadow-gray-200/60 dark:border-gray-800 dark:bg-gray-900 dark:shadow-none">
                        <div className="h-1 w-full bg-gradient-to-r from-red-600 via-orange-500 to-red-600" />

                        <div className="px-8 py-8">
                            <div className="mb-7">
                                <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
                                    Create your account
                                </h1>
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                    Free to join. No credit card required.
                                </p>
                            </div>

                            <Form
                                {...store.form()}
                                resetOnSuccess={['password', 'password_confirmation']}
                                disableWhileProcessing
                                className="space-y-4"
                            >
                                {({ processing, errors }) => (
                                    <>
                                        {/* name */}
                                        <div className="space-y-1.5">
                                            <label htmlFor="name" className="text-[12px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                                Full name
                                            </label>
                                            <div className="relative">
                                                <User className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                                                <input
                                                    id="name"
                                                    type="text"
                                                    name="name"
                                                    required
                                                    autoFocus
                                                    tabIndex={1}
                                                    autoComplete="name"
                                                    placeholder="John Doe"
                                                    className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 transition focus:border-red-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-400/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 dark:focus:border-red-500 dark:focus:bg-gray-800"
                                                />
                                            </div>
                                            <InputError message={errors.name} className="mt-1" />
                                        </div>

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
                                                    tabIndex={2}
                                                    autoComplete="email"
                                                    placeholder="you@example.com"
                                                    className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 transition focus:border-red-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-400/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 dark:focus:border-red-500 dark:focus:bg-gray-800"
                                                />
                                            </div>
                                            <InputError message={errors.email} />
                                        </div>

                                        {/* password */}
                                        <div className="space-y-1.5">
                                            <label htmlFor="password" className="text-[12px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                                Password
                                            </label>
                                            <div className="relative">
                                                <Lock className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                                                <input
                                                    id="password"
                                                    type={showPass ? 'text' : 'password'}
                                                    name="password"
                                                    required
                                                    tabIndex={3}
                                                    autoComplete="new-password"
                                                    placeholder="Min. 8 characters"
                                                    value={password}
                                                    onChange={e => setPassword(e.target.value)}
                                                    className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-10 text-sm text-gray-900 placeholder-gray-400 transition focus:border-red-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-400/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 dark:focus:border-red-500 dark:focus:bg-gray-800"
                                                />
                                                <button type="button" onClick={() => setShowPass(v => !v)} tabIndex={-1}
                                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-600">
                                                    {showPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                                </button>
                                            </div>
                                            <PasswordStrength password={password} />
                                            <InputError message={errors.password} />
                                        </div>

                                        {/* confirm password */}
                                        <div className="space-y-1.5">
                                            <label htmlFor="password_confirmation" className="text-[12px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                                Confirm password
                                            </label>
                                            <div className="relative">
                                                <CheckCircle2 className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                                                <input
                                                    id="password_confirmation"
                                                    type={showConfirm ? 'text' : 'password'}
                                                    name="password_confirmation"
                                                    required
                                                    tabIndex={4}
                                                    autoComplete="new-password"
                                                    placeholder="Repeat your password"
                                                    className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-10 text-sm text-gray-900 placeholder-gray-400 transition focus:border-red-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-400/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 dark:focus:border-red-500 dark:focus:bg-gray-800"
                                                />
                                                <button type="button" onClick={() => setShowConfirm(v => !v)} tabIndex={-1}
                                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-600">
                                                    {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                                </button>
                                            </div>
                                            <InputError message={errors.password_confirmation} />
                                        </div>

                                        {/* submit */}
                                        <button type="submit" tabIndex={5} disabled={processing}
                                            className="group flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-6 text-sm font-bold text-white shadow-md shadow-red-600/25 transition hover:bg-red-700 hover:shadow-red-600/40 disabled:cursor-not-allowed disabled:opacity-60 mt-2">
                                            {processing
                                                ? <><Spinner className="size-4" /> Creating account…</>
                                                : <><span>Create account</span><ArrowRight className="size-4 transition group-hover:translate-x-0.5" /></>
                                            }
                                        </button>

                                        {/* divider */}
                                        <div className="relative flex items-center gap-3 py-1">
                                            <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
                                            <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">or</span>
                                            <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
                                        </div>

                                        {/* login cta */}
                                        <Link href={login()} tabIndex={6}
                                            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border-2 border-gray-200 bg-white text-sm font-bold text-gray-700 transition hover:border-red-300 hover:text-red-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-red-600 dark:hover:text-red-400">
                                            Already have an account? Sign in
                                        </Link>
                                    </>
                                )}
                            </Form>
                        </div>
                    </div>

                    <p className="mt-6 text-center text-[11px] text-gray-400">
                        By registering, you agree to our{' '}
                        <Link href="/" className="underline hover:text-red-600">Terms of Service</Link>
                        {' '}and{' '}
                        <Link href="/" className="underline hover:text-red-600">Privacy Policy</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
