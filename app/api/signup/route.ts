import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import nodemailer from "nodemailer";

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error("MONGODB_URI is not set");
}

// Create a MongoClient with connection pooling
const client = new MongoClient(uri, {
  maxPoolSize: 10, // Maintain up to 10 socket connections
  minPoolSize: 1, // Keep at least one connection alive
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
});

// Initialize connection once for better connection pooling
let clientPromise: Promise<MongoClient>;
try {
  clientPromise = client.connect();
} catch (e) {
  console.error("Failed to initialize database connection:", e);
  throw e;
}

// Create reusable transporter object using Gmail SMTP
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: Number(process.env.EMAIL_SERVER_PORT),
  secure: true, // use TLS
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
  tls: {
    // Do not fail on invalid certificates
    rejectUnauthorized: false,
  },
});

// Verify transporter configuration
transporter.verify((error, success) => {
  if (error) {
    console.error("Email transporter verification failed:", error);
  } else {
    console.log("Email server is ready to send messages");
  }
});

export async function POST(req: Request) {
  try {
    // Parse request body first
    const body = await req.json();
    const { email } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: "Invalid email format" },
        { status: 400 }
      );
    }

    // Get connected client
    const connectedClient = await clientPromise;
    const database = connectedClient.db("wishlist");
    const collection = database.collection("emails");

    // Insert email into database
    await collection.insertOne({
      email,
      submissionDate: new Date(),
    });

    // Send emails with better error handling
    try {
      // Verify email configuration
      if (
        !process.env.EMAIL_SERVER_USER ||
        !process.env.EMAIL_SERVER_PASSWORD ||
        !process.env.EMAIL_SERVER_HOST ||
        !process.env.EMAIL_SERVER_PORT
      ) {
        console.error("Email configuration incomplete");
        throw new Error("Email server configuration is incomplete");
      }

      // User confirmation email
      await transporter.sendMail({
        from:
          process.env.FROM_EMAIL ||
          `"Nawab & Co." <${process.env.EMAIL_SERVER_USER}>`,
        to: email,
        subject: "Welcome to Our Exclusive Waitlist!",
        html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Nawab & Co. Waitlist</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5dc;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <tr>
            <td align="center" style="padding: 40px 0; background-image: url('https://images.unsplash.com/photo-1558769132-cb1aea458c5e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1374&q=80'); background-size: cover; background-position: center;">
              <h1 style="color: #ffffff; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">Welcome to Nawab & Co.!</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px;">
              <p>Dear ${email},</p>
              <p>Thank you for joining our exclusive waitlist. We're thrilled to have you on board!</p>
              <p>As a valued member of our waitlist, you'll be among the first to:</p>
              <ul>
                <li>Experience our revolutionary clothing designs</li>
                <li>Receive exclusive early access to our collections</li>
                <li>Enjoy special offers and discounts</li>
              </ul>
              <p>We'll keep you updated on our launch and share exciting news with you soon.</p>
              <p>Best regards,<br>The Nawab & Co. Team</p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding: 20px; background-color: #f5f5dc;">
              <p style="font-size: 12px; color: #666;">© 2023 Nawab & Co. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
      });

      // Admin notification
      if (process.env.ADMIN_EMAIL) {
        await transporter.sendMail({
          from: `"Nawab & Co. System" <${process.env.EMAIL_SERVER_USER}>`,
          to: process.env.ADMIN_EMAIL,
          subject: "New Waitlist Entry",
          html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Waitlist Entry</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5dc;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <tr>
              <td align="center" style="padding: 20px; background-color: #333333; color: #ffffff;">
                <h2>New Waitlist Entry</h2>
              </td>
            </tr>
            <tr>
              <td style="padding: 20px;">
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
        });
      }

      return NextResponse.json(
        { message: "Successfully joined! Check your email for confirmation." },
        { status: 200 }
      );
    } catch (emailError: any) {
      console.error("Email sending error:", emailError);
      // Log detailed error information
      if (emailError.response) {
        console.error("SMTP Response:", emailError.response);
      }
      throw new Error("Failed to send confirmation email");
    }
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json(
      { message: "An error occurred while processing your request" },
      { status: 500 }
    );
  }
  // Note: We don't close the client connection anymore as we're using connection pooling
}
