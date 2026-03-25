<?php

namespace Database\Seeders;

use App\Models\Page;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class PageSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::whereHas('roles', fn ($q) => $q->where('name', 'admin'))->first()
            ?? User::first();

        if (! $admin) {
            $this->command->warn('No user found — skipping PageSeeder.');
            return;
        }

        $pages = [
            [
                'slug'             => 'about-us',
                'title'            => 'About Us',
                'excerpt'          => 'Learn about Tejyug News Portal — our mission, team, and commitment to delivering accurate, timely news.',
                'template'         => 'full-width',
                'show_in_menu'     => true,
                'order'            => 1,
                'meta_title'       => 'About Tejyug News Portal',
                'meta_description' => 'Tejyug News delivers timely, factual, and independent journalism across politics, technology, business, sports, and world affairs.',
                'content'          => <<<HTML
<h2>Who We Are</h2>
<p>Tejyug News Portal is a digital-first news platform committed to delivering <strong>accurate, unbiased, and timely journalism</strong> to readers across India and beyond. Founded with the belief that everyone deserves access to quality information, we cover a wide spectrum of topics — from national politics and regional affairs to technology, business, sports, and culture.</p>

<h2>Our Mission</h2>
<p>Our mission is simple: <em>inform, educate, and empower</em>. We believe in the power of journalism to hold power to account, to tell stories that matter, and to give a voice to the communities we serve.</p>

<h2>Our Team</h2>
<p>Tejyug News is powered by a dedicated team of journalists, editors, photographers, and digital experts who are passionate about storytelling. Our reporters are embedded in communities across India, providing on-the-ground coverage of events as they unfold.</p>

<h2>Editorial Standards</h2>
<p>We hold ourselves to the highest editorial standards. Every story we publish goes through a rigorous fact-checking and editorial review process. We are committed to:</p>
<ul>
    <li>Accuracy in every report</li>
    <li>Fairness and balance in coverage</li>
    <li>Transparency about sources and methods</li>
    <li>Correction of errors promptly and prominently</li>
</ul>

<h2>Contact Us</h2>
<p>Have a story tip, feedback, or inquiry? We'd love to hear from you. Visit our <a href="/page/contact-us">Contact page</a> or reach us at <strong>editorial@tejyug.com</strong>.</p>
HTML,
            ],
            [
                'slug'             => 'contact-us',
                'title'            => 'Contact Us',
                'excerpt'          => 'Get in touch with the Tejyug News team. We welcome story tips, feedback, and general inquiries.',
                'template'         => 'default',
                'show_in_menu'     => true,
                'order'            => 2,
                'meta_title'       => 'Contact Tejyug News Portal',
                'meta_description' => 'Reach out to the Tejyug News team for story tips, advertising enquiries, or general feedback.',
                'content'          => <<<HTML
<h2>Get In Touch</h2>
<p>We value every reader, source, and partner. Whether you have a story tip, want to report an error, or are interested in advertising opportunities, we are here to help.</p>

<h2>Editorial Team</h2>
<p>For news tips, corrections, or press inquiries:<br>
📧 <strong>editorial@tejyug.com</strong><br>
📞 <strong>+91-XXXX-XXXXXX</strong></p>

<h2>Advertising & Partnerships</h2>
<p>Interested in reaching our growing audience? Our advertising team can help you find the right solution.<br>
📧 <strong>ads@tejyug.com</strong></p>

<h2>Technical Support</h2>
<p>Experiencing issues with our website or app?<br>
📧 <strong>support@tejyug.com</strong></p>

<h2>Our Office</h2>
<p>Tejyug Media Pvt. Ltd.<br>
123 Press Colony, Media Hub,<br>
New Delhi – 110001, India</p>

<p><strong>Office hours:</strong> Monday – Friday, 9:00 AM – 6:00 PM IST</p>
HTML,
            ],
            [
                'slug'             => 'privacy-policy',
                'title'            => 'Privacy Policy',
                'excerpt'          => 'Our Privacy Policy explains how we collect, use, and protect your personal information.',
                'template'         => 'default',
                'show_in_menu'     => false,
                'order'            => 3,
                'meta_title'       => 'Privacy Policy — Tejyug News',
                'meta_description' => 'Read Tejyug News Portal\'s privacy policy to understand how we handle your data.',
                'content'          => <<<HTML
<p><em>Last updated: March 25, 2026</em></p>

<h2>1. Information We Collect</h2>
<p>We collect information you provide directly to us, such as when you create an account, subscribe to our newsletter, or contact us. This may include your name, email address, and usage data.</p>

<h2>2. How We Use Your Information</h2>
<p>We use the information we collect to:</p>
<ul>
    <li>Provide, maintain, and improve our services</li>
    <li>Send newsletters and news alerts you've subscribed to</li>
    <li>Respond to your comments and questions</li>
    <li>Analyse usage patterns to improve user experience</li>
    <li>Comply with legal obligations</li>
</ul>

<h2>3. Cookies</h2>
<p>We use cookies and similar tracking technologies to track activity on our website and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.</p>

<h2>4. Data Security</h2>
<p>We implement appropriate technical and organisational measures to protect your personal information against unauthorised access, alteration, disclosure, or destruction.</p>

<h2>5. Third-Party Services</h2>
<p>We may employ third-party companies and individuals to facilitate our service. These third parties have access to your personal information only to perform specific tasks on our behalf and are obligated not to disclose or use it for any other purpose.</p>

<h2>6. Your Rights</h2>
<p>You have the right to access, correct, or delete your personal data. To exercise these rights, contact us at <strong>privacy@tejyug.com</strong>.</p>

<h2>7. Changes to This Policy</h2>
<p>We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page with an updated date.</p>
HTML,
            ],
            [
                'slug'             => 'terms-and-conditions',
                'title'            => 'Terms and Conditions',
                'excerpt'          => 'Read our Terms and Conditions that govern the use of Tejyug News Portal.',
                'template'         => 'default',
                'show_in_menu'     => false,
                'order'            => 4,
                'meta_title'       => 'Terms and Conditions — Tejyug News',
                'meta_description' => 'Read Tejyug News Portal\'s terms and conditions governing the use of our website and services.',
                'content'          => <<<HTML
<p><em>Last updated: March 25, 2026</em></p>

<h2>1. Acceptance of Terms</h2>
<p>By accessing and using Tejyug News Portal, you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to these terms, please do not use our site.</p>

<h2>2. Intellectual Property</h2>
<p>All content published on Tejyug News Portal — including articles, photographs, graphics, and videos — is the intellectual property of Tejyug Media Pvt. Ltd. or its content licensors. Reproduction without written permission is prohibited.</p>

<h2>3. User Conduct</h2>
<p>When using our services, you agree not to:</p>
<ul>
    <li>Post or transmit any content that is defamatory, abusive, or harassing</li>
    <li>Impersonate any person or organisation</li>
    <li>Engage in any activity that disrupts or interferes with our services</li>
    <li>Attempt to gain unauthorised access to our systems</li>
</ul>

<h2>4. Disclaimer of Warranties</h2>
<p>Our services are provided on an "as is" and "as available" basis. We make no warranties, expressed or implied, regarding the accuracy or completeness of any content published on this site.</p>

<h2>5. Limitation of Liability</h2>
<p>Tejyug Media Pvt. Ltd. shall not be liable for any indirect, incidental, special, or consequential damages arising out of or in connection with the use of our services.</p>

<h2>6. Governing Law</h2>
<p>These Terms shall be governed and construed in accordance with the laws of India, without regard to its conflict of law provisions. Any disputes shall be subject to the exclusive jurisdiction of the courts in New Delhi, India.</p>

<h2>7. Contact</h2>
<p>Questions about these Terms? Contact us at <strong>legal@tejyug.com</strong>.</p>
HTML,
            ],
            [
                'slug'             => 'advertise-with-us',
                'title'            => 'Advertise With Us',
                'excerpt'          => 'Reach millions of engaged readers across India. Explore our advertising options and packages.',
                'template'         => 'landing',
                'show_in_menu'     => true,
                'is_featured'      => true,
                'order'            => 5,
                'meta_title'       => 'Advertise on Tejyug News Portal',
                'meta_description' => 'Reach a highly engaged audience of news readers. Explore display, sponsored content, and newsletter advertising options.',
                'content'          => <<<HTML
<h2>Reach Millions of News Readers</h2>
<p>Tejyug News Portal connects your brand with a highly engaged, educated audience passionate about current affairs, business, technology, and culture. With over <strong>5 million monthly readers</strong> and growing, we offer unparalleled reach across India.</p>

<h2>Why Advertise with Us?</h2>
<ul>
    <li>✅ 5M+ monthly unique visitors</li>
    <li>✅ Premium, brand-safe editorial environment</li>
    <li>✅ Detailed audience targeting by category, region, and device</li>
    <li>✅ Transparent performance reporting</li>
    <li>✅ Dedicated account management</li>
</ul>

<h2>Advertising Options</h2>
<h3>Display Advertising</h3>
<p>Banner ads, leaderboards, and rich media placements across our high-traffic news pages. Available in homepage, category, and article-level targeting.</p>

<h3>Sponsored Content</h3>
<p>Partner with our editorial team to create compelling branded content that resonates with our readers. Clearly labelled as sponsored for full transparency.</p>

<h3>Newsletter Sponsorship</h3>
<p>Reach our 200,000+ newsletter subscribers directly in their inbox with dedicated or inclusion placements.</p>

<h2>Get Started</h2>
<p>Ready to grow your brand? Contact our advertising team today:<br>
📧 <strong>ads@tejyug.com</strong><br>
📞 <strong>+91-XXXX-XXXXXX</strong></p>
HTML,
            ],
            [
                'slug'             => 'careers',
                'title'            => 'Careers at Tejyug',
                'excerpt'          => 'Join our passionate team of journalists, editors, and digital professionals shaping the future of news.',
                'template'         => 'default',
                'show_in_menu'     => false,
                'order'            => 6,
                'meta_title'       => 'Careers — Join Tejyug News',
                'meta_description' => 'Explore open positions at Tejyug News Portal. We are hiring journalists, editors, and tech professionals.',
                'content'          => <<<HTML
<h2>Build Your Career in Journalism</h2>
<p>At Tejyug News, we are always looking for talented, curious, and driven individuals who want to make a difference through journalism. Whether you are a seasoned journalist or just starting your career, we want to hear from you.</p>

<h2>Open Positions</h2>
<h3>Senior Reporter — Political Affairs</h3>
<p><strong>Location:</strong> New Delhi | <strong>Type:</strong> Full-time</p>
<p>We are looking for an experienced political reporter with deep knowledge of Indian politics and strong source networks. 5+ years experience required.</p>

<h3>Video Journalist</h3>
<p><strong>Location:</strong> Mumbai | <strong>Type:</strong> Full-time</p>
<p>Skilled in shooting, editing, and producing video reports for web and social media. Experience with Adobe Premiere or Final Cut Pro essential.</p>

<h3>Frontend Developer</h3>
<p><strong>Location:</strong> Remote | <strong>Type:</strong> Full-time</p>
<p>React/TypeScript developer with a passion for building fast, accessible news products. Experience with Inertia.js a plus.</p>

<h3>Social Media Manager</h3>
<p><strong>Location:</strong> Delhi / Remote | <strong>Type:</strong> Full-time</p>
<p>Manage and grow our presence across Twitter, Instagram, YouTube, and WhatsApp channels.</p>

<h2>How to Apply</h2>
<p>Send your CV, a cover letter, and three writing samples (for editorial roles) or portfolio (for tech roles) to:<br>
📧 <strong>careers@tejyug.com</strong></p>
<p>We are an equal opportunity employer and welcome applications from all backgrounds.</p>
HTML,
            ],
        ];

        $now = Carbon::now();

        foreach ($pages as $pageData) {
            $slug = $pageData['slug'];

            if (Page::where('slug', $slug)->exists()) {
                $this->command->line("  Skipping existing page: <comment>{$slug}</comment>");
                continue;
            }

            Page::create(array_merge([
                'user_id'      => $admin->id,
                'status'       => 'published',
                'published_at' => $now,
                'is_featured'  => $pageData['is_featured'] ?? false,
                'noindex'      => false,
                'views'        => rand(120, 4800),
                'og_image'     => null,
                'canonical_url'=> null,
                'meta_keywords'=> null,
            ], $pageData));

            $this->command->info("  Created page: {$pageData['title']}");
        }

        $this->command->info('PageSeeder done — ' . count($pages) . ' pages processed.');
    }
}
