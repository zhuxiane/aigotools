import Link from "next/link";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

// CHATGPT PROMPT TO GENERATE YOUR TERMS & SERVICES — replace with your own data 👇

// 1. Go to https://chat.openai.com/
// 2. Copy paste bellow
// 3. Replace the data with your own (if needed)
// 4. Paste the answer from ChatGPT directly in the <pre> tag below

// You are an excellent lawyer.

// I need your help to write a simple Terms & Services for my website. Here is some context:
// - Website: https://stable-diffusion.video
// - Name: Stable Diffusion Video
// - Contact information: support@stable-diffusion.video
// - Description: A JavaScript code boilerplate to help entrepreneurs launch their startups faster
// - Ownership: when buying a package, users can download code to create apps. They own the code but they do not have the right to resell it. They can ask for a full refund within 7 day after the purchase.
// - User data collected: name, email and payment information
// - Non-personal data collection: web cookies
// - Link to privacy-policy: https://stable-diffusion.video/privacy-policy
// - Governing Law: France
// - Updates to the Terms: users will be updated by email

// Please write a simple Terms & Services for my site. Add the current date. Do not add or explain your reasoning. Answer:
export async function generateMetadata({
  params,
}: {
  params: { site: string; locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({
    locale: params.locale,
    namespace: "privacyPolicy",
  });

  return {
    title: t("metadata.title"),
  };
}

export default async function PrivacyPolicy() {
  const t = await getTranslations("privacyPolicy");
  const title = t("title");
  const date = t("date");
  const introduction = t("introduction");
  const description = t("description");
  const dataCollectionTitle = t("dataCollectionTitle");
  const dataCollectionText = t("dataCollectionText");
  const purposeTitle = t("purposeTitle");
  const purposeText = t("purposeText");
  const dataSharingTitle = t("dataSharingTitle");
  const dataSharingText = t("dataSharingText");
  const childrenPrivacyTitle = t("childrenPrivacyTitle");
  const childrenPrivacyText = t("childrenPrivacyText");
  const updatesTitle = t("updatesTitle");
  const updatesText = t("updatesText");
  const contactTitle = t("contactTitle");
  const contactText = t("contactText");
  const thankYou = t("thankYou");

  return (
    <main className="max-w-xl mx-auto">
      <div className="p-5">
        <Link href="/" className="btn btn-ghost">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-5 h-5"
          >
            <path
              fillRule="evenodd"
              d="M15 10a.75.75 0 01-.75.75H7.612l2.158 1.96a.75.75 0 11-1.04 1.08l-3.5-3.25a.75.75 0 010-1.08l3.5-3.25a.75.75 0 111.04 1.08L7.612 9.25h6.638A.75.75 0 0115 10z"
              clipRule="evenodd"
            />
          </svg>
          Back
        </Link>
        <h1>{title}</h1>
        <p>{date}</p>
        <h2>{introduction}</h2>
        <p>{description}</p>
        <h2>{dataCollectionTitle}</h2>
        <p>{dataCollectionText}</p>
        <h2>{purposeTitle}</h2>
        <p>{purposeText}</p>
        <h2>{dataSharingTitle}</h2>
        <p>{dataSharingText}</p>
        <h2>{childrenPrivacyTitle}</h2>
        <p>{childrenPrivacyText}</p>
        <h2>{updatesTitle}</h2>
        <p>{updatesText}</p>
        <h2>{contactTitle}</h2>
        <p>{contactText}</p>
        <p>{thankYou}</p>
      </div>
    </main>
  );
}
