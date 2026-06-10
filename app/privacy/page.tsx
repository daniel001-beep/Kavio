import React from "react";
import Link from "next/link";
import { Zap, ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Kavio Finance",
  description: "Kavio Finance Privacy Policy — how we collect, use, and protect your personal data.",
};

export default function PrivacyPolicyPage() {
  return (
    <div
      data-page="landing"
      className="min-h-screen flex flex-col font-sans"
      style={{ background: "#f8fafc", color: "#0f172a" }}
    >
      {/* Header */}
      <header className="w-full max-w-7xl mx-auto px-6 py-5 flex items-center justify-between border-b border-slate-200/80 sticky top-0 bg-[#f8fafc]/90 backdrop-blur-md z-50">
        <Link href="/" className="flex items-center gap-2 group no-underline">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform duration-200">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-xl font-black tracking-tight" style={{ color: "#0f172a" }}>
            Kavio <span className="font-semibold" style={{ color: "#64748b" }}>Finance</span>
          </span>
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-white hover:bg-slate-50 transition-all no-underline"
          style={{ color: "#475569" }}
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
        </Link>
      </header>

      {/* Content */}
      <main className="flex-1 w-full max-w-3xl mx-auto px-6 py-16 pb-24">

        {/* Page Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 bg-white text-xs font-bold uppercase tracking-wider mb-6" style={{ color: "#64748b" }}>
          Legal Document
        </div>

        <h1 className="text-4xl font-black tracking-tight mb-2" style={{ color: "#0f172a" }}>
          Privacy Policy
        </h1>
        <p className="text-sm font-semibold mb-12" style={{ color: "#94a3b8" }}>
          Last updated: June 04, 2026
        </p>

        <div className="prose-container space-y-10">

          <p className="text-sm leading-relaxed" style={{ color: "#475569" }}>
            This Privacy Policy describes Our policies and procedures on the collection, use and disclosure of Your information when You use the Service and tells You about Your privacy rights and how the law protects You. We use Your Personal Data to provide and improve the Service. By using the Service, You agree to the collection and use of information in accordance with this Privacy Policy.
          </p>

          {/* Section */}
          <Section title="Interpretation and Definitions">
            <SubSection title="Interpretation">
              <p>The words whose initial letters are capitalized have meanings defined under the following conditions. The following definitions shall have the same meaning regardless of whether they appear in singular or in plural.</p>
            </SubSection>

            <SubSection title="Definitions">
              <p className="mb-4">For the purposes of this Privacy Policy:</p>
              <ul className="space-y-3">
                {[
                  { term: "Account", def: "means a unique account created for You to access our Service or parts of our Service." },
                  { term: "Affiliate", def: 'means an entity that controls, is controlled by, or is under common control with a party, where "control" means ownership of 50% or more of the shares, equity interest or other securities entitled to vote for election of directors or other managing authority.' },
                  { term: "Company", def: '(referred to as either "the Company", "We", "Us" or "Our" in this Privacy Policy) refers to Kavio.' },
                  { term: "Cookies", def: "are small files that are placed on Your computer, mobile device or any other device by a website, containing the details of Your browsing history on that website among its many uses." },
                  { term: "Country", def: "refers to: Nigeria." },
                  { term: "Device", def: "means any device that can access the Service such as a computer, a cell phone or a digital tablet." },
                  { term: "Personal Data", def: 'is any information that relates to an identified or identifiable individual. We use "Personal Data" and "Personal Information" interchangeably unless a law uses a specific term.' },
                  { term: "Service", def: "refers to the Website." },
                  { term: "Service Provider", def: "means any natural or legal person who processes the data on behalf of the Company. It refers to third-party companies or individuals employed by the Company to facilitate the Service, to provide the Service on behalf of the Company, to perform services related to the Service or to assist the Company in analyzing how the Service is used." },
                  { term: "Usage Data", def: "refers to data collected automatically, either generated by the use of the Service or from the Service infrastructure itself (for example, the duration of a page visit)." },
                  { term: "Website", def: "refers to Kavio, accessible from https://kavio-fintech.vercel.app/" },
                  { term: "You", def: "means the individual accessing or using the Service, or the company, or other legal entity on behalf of which such individual is accessing or using the Service, as applicable." },
                ].map(({ term, def }) => (
                  <li key={term} className="flex gap-2 text-sm leading-relaxed" style={{ color: "#475569" }}>
                    <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2" />
                    <span><strong style={{ color: "#0f172a" }}>{term}</strong> — {def}</span>
                  </li>
                ))}
              </ul>
            </SubSection>
          </Section>

          <Section title="Collecting and Using Your Personal Data">
            <SubSection title="Types of Data Collected">
              <p className="font-bold text-sm mb-2" style={{ color: "#0f172a" }}>Personal Data</p>
              <p className="mb-3">While using Our Service, We may ask You to provide Us with certain personally identifiable information that can be used to contact or identify You. This may include:</p>
              <BulletList items={["Email address", "First name and last name", "Phone number"]} />

              <p className="font-bold text-sm mt-6 mb-2" style={{ color: "#0f172a" }}>Usage Data</p>
              <p className="mb-3">Usage Data is collected automatically when using the Service and may include information such as Your Device's IP address, browser type, browser version, the pages of our Service that You visit, the time and date of Your visit, the time spent on those pages, and unique device identifiers.</p>
              <p>When You access the Service by or through a mobile device, We may collect certain information automatically, including the type of mobile device You use, Your mobile device's unique ID, the IP address of Your mobile device, and Your mobile operating system.</p>

              <p className="font-bold text-sm mt-6 mb-2" style={{ color: "#0f172a" }}>Tracking Technologies and Cookies</p>
              <p className="mb-3">We use Cookies and similar tracking technologies to track the activity on Our Service and store certain information. The technologies We use may include:</p>
              <ul className="space-y-3 mb-4">
                <li className="flex gap-2 text-sm leading-relaxed" style={{ color: "#475569" }}>
                  <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2" />
                  <span><strong style={{ color: "#0f172a" }}>Cookies or Browser Cookies.</strong> A cookie is a small file placed on Your Device. You can instruct Your browser to refuse all Cookies or to indicate when a Cookie is being sent.</span>
                </li>
                <li className="flex gap-2 text-sm leading-relaxed" style={{ color: "#475569" }}>
                  <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2" />
                  <span><strong style={{ color: "#0f172a" }}>Web Beacons.</strong> Certain sections of our Service and emails may contain small electronic files known as web beacons that permit the Company to count users who have visited pages or opened an email.</span>
                </li>
              </ul>
              <p className="mb-3">We use both Session and Persistent Cookies for the following purposes:</p>
              <div className="space-y-3">
                {[
                  { name: "Necessary / Essential Cookies", type: "Session Cookies", purpose: "Essential to provide You with services available through the Website and to authenticate users and prevent fraudulent use." },
                  { name: "Cookies Policy / Notice Acceptance Cookies", type: "Persistent Cookies", purpose: "Identify if users have accepted the use of cookies on the Website." },
                  { name: "Functionality Cookies", type: "Persistent Cookies", purpose: "Allow Us to remember choices You make when You use the Website, such as login details or language preference." },
                ].map(({ name, type, purpose }) => (
                  <div key={name} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <p className="font-bold text-xs mb-1" style={{ color: "#0f172a" }}>{name}</p>
                    <p className="text-[11px] font-semibold mb-1" style={{ color: "#94a3b8" }}>Type: {type}</p>
                    <p className="text-xs leading-relaxed" style={{ color: "#64748b" }}>{purpose}</p>
                  </div>
                ))}
              </div>
            </SubSection>

            <SubSection title="Use of Your Personal Data">
              <p className="mb-3">The Company may use Personal Data for the following purposes:</p>
              <ul className="space-y-2">
                {[
                  ["To provide and maintain our Service", "including to monitor the usage of our Service."],
                  ["To manage Your Account", "to manage Your registration as a user of the Service."],
                  ["For the performance of a contract", "the development, compliance and undertaking of the purchase contract for the products or services You have purchased."],
                  ["To contact You", "by email, telephone calls, SMS, or other forms of electronic communication regarding updates or informative communications."],
                  ["To provide You", "with news, special offers, and general information about other goods and services We offer."],
                  ["To manage Your requests", "to attend and manage Your requests to Us."],
                  ["For business transfers", "We may use Your Personal Data to evaluate or conduct a merger, divestiture, restructuring, or other sale or transfer of Our assets."],
                  ["For other purposes", "such as data analysis, identifying usage trends, and evaluating and improving our Service."],
                ].map(([term, def]) => (
                  <li key={term} className="flex gap-2 text-sm leading-relaxed" style={{ color: "#475569" }}>
                    <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2" />
                    <span><strong style={{ color: "#0f172a" }}>{term}:</strong> {def}</span>
                  </li>
                ))}
              </ul>
            </SubSection>

            <SubSection title="Retention of Your Personal Data">
              <p className="mb-3">The Company will retain Your Personal Data only for as long as is necessary for the purposes set out in this Privacy Policy. Retention periods include:</p>
              <div className="space-y-2">
                {[
                  ["User Accounts", "Retained for the duration of your account plus up to 24 months after account closure."],
                  ["Support tickets and correspondence", "Up to 24 months from ticket closure."],
                  ["Website analytics data", "Up to 24 months from the date of collection."],
                  ["Server logs", "Up to 24 months for security monitoring and troubleshooting."],
                ].map(([label, detail]) => (
                  <div key={label} className="flex gap-2 text-sm leading-relaxed" style={{ color: "#475569" }}>
                    <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2" />
                    <span><strong style={{ color: "#0f172a" }}>{label}:</strong> {detail}</span>
                  </div>
                ))}
              </div>
            </SubSection>

            <SubSection title="Transfer of Your Personal Data">
              <p>Your information, including Personal Data, is processed at the Company's operating offices and in any other places where the parties involved in the processing are located. The Company will take all steps reasonably necessary to ensure that Your data is treated securely and in accordance with this Privacy Policy.</p>
            </SubSection>

            <SubSection title="Delete Your Personal Data">
              <p>You have the right to delete or request that We assist in deleting the Personal Data that We have collected about You. You may update, amend, or delete Your information at any time by signing in to Your Account and visiting the account settings section. You may also contact Us to request access to, correct, or delete any Personal Data that You have provided to Us.</p>
            </SubSection>

            <SubSection title="Disclosure of Your Personal Data">
              <p className="mb-3">The Company may disclose Your Personal Data in certain situations including:</p>
              <BulletList items={[
                "Business Transactions: If the Company is involved in a merger, acquisition or asset sale, Your Personal Data may be transferred.",
                "Law enforcement: Under certain circumstances, the Company may be required to disclose Your Personal Data if required to do so by law or in response to valid requests by public authorities.",
                "To comply with a legal obligation or protect the rights or property of the Company.",
                "To prevent or investigate possible wrongdoing in connection with the Service.",
                "To protect the personal safety of Users of the Service or the public.",
              ]} />
            </SubSection>

            <SubSection title="Security of Your Personal Data">
              <p>The security of Your Personal Data is important to Us, but remember that no method of transmission over the Internet, or method of electronic storage is 100% secure. While We strive to use commercially reasonable means to protect Your Personal Data, We cannot guarantee its absolute security.</p>
            </SubSection>
          </Section>

          <Section title="Children's Privacy">
            <p>Our Service does not address anyone under the age of 16. We do not knowingly collect personally identifiable information from anyone under the age of 16. If You are a parent or guardian and You are aware that Your child has provided Us with Personal Data, please contact Us.</p>
          </Section>

          <Section title="Links to Other Websites">
            <p>Our Service may contain links to other websites that are not operated by Us. If You click on a third party link, You will be directed to that third party's site. We strongly advise You to review the Privacy Policy of every site You visit. We have no control over and assume no responsibility for the content, privacy policies or practices of any third party sites or services.</p>
          </Section>

          <Section title="Changes to this Privacy Policy">
            <p>We may update Our Privacy Policy from time to time. We will notify You of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date at the top of this Privacy Policy. You are advised to review this Privacy Policy periodically for any changes.</p>
          </Section>

          <Section title="Contact Us">
            <p className="mb-3">If you have any questions about this Privacy Policy, You can contact us:</p>
            <div className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-100">
              <span className="text-sm font-bold" style={{ color: "#059669" }}>📧</span>
              <a
                href="mailto:Idowuisdaniel1@gmail.com"
                className="text-sm font-bold no-underline"
                style={{ color: "#059669" }}
              >
                Idowuisdaniel1@gmail.com
              </a>
            </div>
          </Section>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 px-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-black text-sm tracking-tight" style={{ color: "#0f172a" }}>Kavio Finance</span>
        </div>
        <p className="text-xs font-medium" style={{ color: "#94a3b8" }}>
          © {new Date().getFullYear()} Kavio Finance. All rights reserved.
        </p>
      </footer>
    </div>
  );
}

// ─── Reusable layout components ───────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-5">
      <div className="pb-3 border-b border-slate-100">
        <h2 className="text-xl font-black tracking-tight" style={{ color: "#0f172a" }}>{title}</h2>
      </div>
      <div className="space-y-5 text-sm leading-relaxed" style={{ color: "#475569" }}>
        {children}
      </div>
    </section>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-base font-bold" style={{ color: "#0f172a" }}>{title}</h3>
      <div className="text-sm leading-relaxed space-y-2" style={{ color: "#475569" }}>
        {children}
      </div>
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="flex gap-2 text-sm leading-relaxed" style={{ color: "#475569" }}>
          <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
