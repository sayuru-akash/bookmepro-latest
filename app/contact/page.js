import ContactPageClient from "./ContactPageClient";

export const metadata = {
  title: "Contact BookMePro | Support and Sales Inquiries",
  description:
    "Contact BookMePro for product support, booking platform questions, and service setup guidance.",
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    title: "Contact BookMePro",
    description:
      "Reach BookMePro via phone, WhatsApp, email, or contact form.",
    url: "/contact",
    type: "website",
    images: [
      {
        url: "/images/contact/bg.png",
        width: 1200,
        height: 630,
        alt: "Contact BookMePro",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact BookMePro",
    description:
      "Get support and answers for your BookMePro booking setup.",
    images: ["/images/contact/bg.png"],
  },
};

export default function ContactPage() {
  return <ContactPageClient />;
}
