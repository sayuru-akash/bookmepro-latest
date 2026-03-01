# BookMePro

BookMePro is a scheduling and booking platform for coaches built with [Next.js](https://nextjs.org/) using the App Router. It offers tools for creating coach profiles, managing student bookings and handling subscription payments.

## Features

- **Coach profiles** with photo galleries, video links and location management
- **Student bookings** with calendar integration and appointment reminders
- **Stripe billing** for plan subscriptions and payment methods
- **Authentication** with NextAuth (Google and credentials)
- **Email notifications** via Brevo
- **Admin dashboard** for managing coaches, students and bookings
- **Regional pricing** based on the visitor's country
- **Responsive UI** built with MUI and Tailwind CSS
- **Cron jobs** to send daily reminder emails
- **Unit tests** using Node's test runner

## Project Structure

- **app/** – Next.js pages and API routes
- **components/** – Reusable React components
- **models/** – Mongoose schemas for users, appointments, plans and more
- **Lib/** – Database, authentication and Stripe helpers
- **utils/** – Utility functions (email, validation, middleware)
- **data/** – JSON data files (pricing packages)
- **scripts/** – Maintenance scripts (create admin, send emails)
- **marketing/** – Example email templates
- **tests/** – Unit tests

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Copy the environment variables template:

```bash
cp .env.example .env.local
```

Then edit `.env.local` with your actual values. The file includes all required variables with descriptions.

3. Run the development server:

```bash
npm run dev
```

Open <http://localhost:3000> in your browser to view the app.

## Tests

Execute the test suite with:

```bash
npm test
```

## Building for Production

Create an optimized build and start the server:

```bash
npm run build
npm start
```

## Deployment

The repository contains a GitHub Actions workflow for deploying to Vercel.

## Regional Pricing

The middleware determines the visitor's country using [ipapi.co](https://ipapi.co). The detected code is stored in a `user-country` cookie so the frontend can display pricing in the correct currency.

## Contributing

Pull requests are welcome. Please run the tests before submitting changes. Thank you!!!
