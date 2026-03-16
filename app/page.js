import HomePageClient from "./HomePageClient";

export const metadata = {
  title: "BookMePro | Coaching and Service Booking Platform",
  description:
    "BookMePro helps coaches, personal trainers, sports instructors, and consultants manage bookings, availability, and professional client journeys.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "BookMePro | Coaching and Service Booking Platform",
    description:
      "Run a cleaner booking experience with one platform for availability, locations, and client-facing profile pages.",
    url: "/",
    type: "website",
    images: [
      {
        url: "/images/about/SliderMain.png",
        width: 1200,
        height: 630,
        alt: "BookMePro platform preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BookMePro | Coaching and Service Booking Platform",
    description:
      "Professional booking infrastructure for coaches, trainers, instructors, and consultants.",
    images: ["/images/about/SliderMain.png"],
  },
};

export default function HomePage() {
  return <HomePageClient />;
}
