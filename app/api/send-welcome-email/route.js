import { NextResponse } from "next/server";
import { sendCoachEmail } from "../../../utils/emailUtils";

export async function POST(req) {
  try {
    const { email, name, plan } = await req.json();

    // Basic validation for incoming data
    if (!email || !name || !plan) {
      return NextResponse.json(
        { message: "Missing required fields: email, name, or plan." },
        { status: 400 }
      );
    }

    const subject = "Welcome to BookMePro - Your Subscription is Active!";
    // The HTML content of the welcome email
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Welcome to BookMePro</title>
        </head>
        <body
          style="
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            color: #333333;
          "
        >
          <table
            width="100%"
            cellpadding="0"
            cellspacing="0"
            border="0"
            style="
              max-width: 600px;
              margin: 40px auto;
              background-color: #ffffff;
              border-radius: 8px;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            "
          >
            <tr>
              <td style="padding: 30px 40px 20px 40px; text-align: center">
                <img
                  src="https://bookmepro.com.au/_next/image?url=%2Fimages%2Fhome%2Flogo%201.png&w=3840&q=75"
                  alt="BookMePro Logo"
                  style="width: 160px; margin-bottom: 20px"
                />
                <h1 style="font-size: 24px; color: #1c1c1c">Welcome to BookMePro, ${name}!</h1>
                <p style="font-size: 16px; color: #555555">
                  Your ${plan} plan subscription is now active. You're just a few clicks away from getting your coaching business
                  online and fully booked.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding: 0 40px 30px 40px">
                <h2 style="font-size: 18px; color: #1c1c1c; margin-bottom: 10px">
                  Get Started in 3 Easy Steps
                </h2>
                <ol
                  style="
                    padding-left: 18px;
                    font-size: 15px;
                    color: #444444;
                    line-height: 1.7;
                  "
                >
                  <li>
                    <strong>Complete Your Profile:</strong> Log in with your email and
                    password, head to your <em>Coach Dashboard</em>, and click "Edit
                    Profile" to add your bio, services, and details.
                  </li>
                  <li>
                    <strong>Set Availability:</strong> Go to <em>Settings</em> in your
                    dashboard and add your available time slots so students can start
                    booking you.
                  </li>
                  <li>
                    <strong>Share Your Profile Link:</strong> Once your profile is
                    published, share your unique link with your clients to receive
                    bookings directly.
                  </li>
                </ol>
                <p style="margin-top: 20px; font-size: 15px; color: #333333">
                  All new coaches enjoy a <strong>100% Free 30-Day Trial</strong> – no
                  charges today, no risk, cancel anytime.
                </p>
                <div style="text-align: center; margin: 30px 0">
                  <a
                    href="https://bookmepro.com.au/dashboard"
                    style="
                      background-color: #0066ff;
                      color: #ffffff;
                      text-decoration: none;
                      padding: 14px 28px;
                      border-radius: 6px;
                      font-size: 16px;
                      display: inline-block;
                    "
                  >
                    Go to Your Dashboard
                  </a>
                </div>
                <p style="text-align: center; font-size: 13px; color: #888888">
                  Need help? Our team is here for you – reach out anytime at
                  <a href="mailto:info@bookmepro.com.au" style="color: #0066ff"
                    >info@bookmepro.com.au</a
                  >
                </p>
              </td>
            </tr>
            <tr>
              <td
                style="
                  background-color: #f0f0f0;
                  padding: 20px 40px;
                  text-align: center;
                  border-radius: 0 0 8px 8px;
                "
              >
                <p style="font-size: 12px; color: #999999">
                  © 2025 BookMePro. All rights reserved.<br />
                  <a
                    href="https://bookmepro.com.au"
                    style="color: #0066ff; text-decoration: none"
                    >Visit Our Website</a
                  >
                </p>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    const emailSent = await sendCoachEmail({
      email,
      name,
      subject,
      htmlContent,
    });

    if (emailSent) {
      return NextResponse.json(
        { message: "Welcome email sent successfully" },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { message: "Failed to send welcome email" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in send-welcome-email API:", error);
    return NextResponse.json(
      { message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}



// import { NextResponse } from "next/server";
// import { sendCoachEmail } from "../../../utils/emailUtils";
// import { connectToDatabase } from "../../../Lib/mongodb"; 

// /**
//  * Sanitizes a string by escaping HTML characters to prevent injection.
//  * @param {string} str The string to sanitize.
//  * @returns {string} The sanitized string.
//  */
// const sanitize = (str) => {
//   if (!str) return "";
//   return str.replace(/</g, "<").replace(/>/g, ">");
// };

// /**
// * Generates the HTML content for the welcome email.
// * @param {string} name The user's name.
// * @param {string} plan The user's subscription plan.
// * @returns {string} The full HTML string for the email.
// */
// function getWelcomeEmailHtml(name, plan) {
//   const sanitizedName = sanitize(name);
//   const sanitizedPlan = sanitize(plan);

//   return `
//     <!DOCTYPE html>
//     <html lang="en">
//       <head>
//         <meta charset="UTF-8" />
//         <meta name="viewport" content="width=device-width, initial-scale=1.0" />
//         <title>Welcome to BookMePro</title>
//       </head>
//       <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4; color: #333333;">
//         <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
//           <tr>
//             <td style="padding: 30px 40px 20px 40px; text-align: center;">
//               <img src="https://bookmepro.com.au/_next/image?url=%2Fimages%2Fhome%2Flogo%201.png&w=3840&q=75" alt="BookMePro Logo" style="width: 160px; margin-bottom: 20px;" />
//               <h1 style="font-size: 24px; color: #1c1c1c;">Welcome to BookMePro, ${sanitizedName}!</h1>
//               <p style="font-size: 16px; color: #555555;">
//                 Your ${sanitizedPlan} plan subscription is now active. You're just a few clicks away from getting your coaching business online and fully booked.
//               </p>
//             </td>
//           </tr>
//           <tr>
//             <td style="padding: 0 40px 30px 40px;">
//               <h2 style="font-size: 18px; color: #1c1c1c; margin-bottom: 10px;">Get Started in 3 Easy Steps</h2>
//               <ol style="padding-left: 18px; font-size: 15px; color: #444444; line-height: 1.7;">
//                 <li><strong>Complete Your Profile:</strong> Log in with your email and password, head to your <em>Coach Dashboard</em>, and click "Edit Profile" to add your bio, services, and details.</li>
//                 <li><strong>Set Availability:</strong> Go to <em>Settings</em> in your dashboard and add your available time slots so students can start booking you.</li>
//                 <li><strong>Share Your Profile Link:</strong> Once your profile is published, share your unique link with your clients to receive bookings directly.</li>
//               </ol>
//               <p style="margin-top: 20px; font-size: 15px; color: #333333;">All new coaches enjoy a <strong>100% Free 30-Day Trial</strong> – no charges today, no risk, cancel anytime.</p>
//               <div style="text-align: center; margin: 30px 0;">
//                 <a href="https://bookmepro.com.au/dashboard" style="background-color: #0066ff; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-size: 16px; display: inline-block;">
//                   Go to Your Dashboard
//                 </a>
//               </div>
//               <p style="text-align: center; font-size: 13px; color: #888888;">
//                 Need help? Our team is here for you – reach out anytime at <a href="mailto:info@bookmepro.com.au" style="color: #0066ff;">info@bookmepro.com.au</a>
//               </p>
//             </td>
//           </tr>
//           <tr>
//             <td style="background-color: #f0f0f0; padding: 20px 40px; text-align: center; border-radius: 0 0 8px 8px;">
//               <p style="font-size: 12px; color: #999999;">
//                 © 2025 BookMePro. All rights reserved.<br />
//                 <a href="https://bookmepro.com.au" style="color: #0066ff; text-decoration: none;">Visit Our Website</a>
//               </p>
//             </td>
//           </tr>
//         </table>
//       </body>
//     </html>
//   `;
// }

// export async function POST(req) {
//   try {
//     const { sessionId } = await req.json();

//     // 1. Basic validation for the session ID
//     if (!sessionId) {
//       return NextResponse.json({ message: "Session ID is required." }, { status: 400 });
//     }

//     // 2. Connect to the database and find the user by the Stripe session ID
//     const { db } = await connectToDatabase();
//     const user = await db.collection("users").findOne({ stripeSessionId: sessionId });

//     // 3. Verify that the user exists and their subscription is active
//     if (!user) {
//       return NextResponse.json({ message: "No user found for this session ID." }, { status: 404 });
//     }

//     if (user.subscriptionStatus !== "active" && user.subscriptionStatus !== "trialing") {
//         return NextResponse.json({ message: "Subscription is not active. Welcome email cannot be sent." }, { status: 403 });
//     }
    
//     // 4. Use the VERIFIED data from your database, not from the client
//     const { email, name, plan } = user;
    
//     // Check if we already sent a welcome email for this user to prevent duplicates
//     if (user.welcomeEmailSent) {
//       // console.log(`Welcome email already sent for user: ${email}`);
//       return NextResponse.json({ message: "Welcome email has already been sent." }, { status: 200 });
//     }
    
//     // 5. Prepare and send the email
//     const subject = "Welcome to BookMePro - Your Subscription is Active!";
//     const htmlContent = getWelcomeEmailHtml(name, plan);

//     const emailSent = await sendCoachEmail({
//       email,
//       name,
//       subject,
//       htmlContent,
//     });

//     if (emailSent) {
//       // 6. Mark the user's record so we don't send the email again
//       await db.collection("users").updateOne(
//         { _id: user._id },
//         { $set: { welcomeEmailSent: true } }
//       );
      
//       return NextResponse.json({ message: "Welcome email sent successfully." }, { status: 200 });
//     } else {
//       return NextResponse.json({ message: "Failed to send welcome email." }, { status: 500 });
//     }
    
//   } catch (error) {
//     console.error("Error in send-welcome-email API:", error);
//     // Return a generic error to the client for security
//     return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
//   }
// }