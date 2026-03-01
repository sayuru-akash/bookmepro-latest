// app/api/contact/route.js
import { NextResponse } from "next/server";
import axios from "axios";

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, phone, message } = body;

    // Brevo API endpoint
    const url = "https://api.brevo.com/v3/smtp/email";

    // Email content
    const emailData = {
      sender: {
        name: "BookMePro System",
        email: "codezelabookmepro@gmail.com"
      },
      to: [{
        email: "hiranthaviraj@gmail.com",
        name: "Admin"
      }],
      subject: "New Contact Form Submission",
      htmlContent: `
        <h1>New Contact Form Submission</h1>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `
    };

    

    // Send email using Brevo API
    const response = await axios.post(url, emailData, {
      headers: {
        'accept': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
        'content-type': 'application/json'
      }
    });

    if (response.status === 201) {
      return NextResponse.json(
        { message: "Email sent successfully" },
        { status: 200 }
      );
    } else {
      throw new Error('Failed to send email');
    }
  } catch (error) {
    console.error("Error sending email:", error.response?.data || error.message);
    return NextResponse.json(
      { error: "Failed to send email: " + (error.response?.data?.message || error.message) },
      { status: 500 }
    );
  }
}