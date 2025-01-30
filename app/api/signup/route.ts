import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import nodemailer from "nodemailer";

// Create a cached connection variable
let cachedClient: MongoClient | null = null;

// Function to connect to MongoDB
async function connectToDatabase() {
  if (cachedClient) {
    return cachedClient;
  }

  if (!process.env.MONGODB_URI) {
    throw new Error("Please define the MONGODB_URI environment variable");
  }

  try {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("MongoDB connection established");
    cachedClient = client;
    return client;
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw new Error("Failed to connect to database");
  }
}

// Create transporter with more detailed configuration
const createTransporter = async () => {
  if (
    !process.env.EMAIL_SERVER_HOST ||
    !process.env.EMAIL_SERVER_PORT ||
    !process.env.EMAIL_SERVER_USER ||
    !process.env.EMAIL_SERVER_PASSWORD
  ) {
    throw new Error("Email configuration is incomplete");
  }

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST,
    port: Number.parseInt(process.env.EMAIL_SERVER_PORT),
    secure: process.env.EMAIL_SERVER_PORT === "465",
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD,
    },
  });

  try {
    await transporter.verify();
    console.log("SMTP connection verified successfully");
    return transporter;
  } catch (error) {
    console.error("SMTP connection verification failed:", error);
    throw error;
  }
};

export async function POST(req: Request) {
  try {
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

    // Connect to MongoDB and save email (allowing duplicates)
    const client = await connectToDatabase();
    const database = client.db("wishlist");
    const collection = database.collection("emails");

    await collection.insertOne({
      email,
      submissionDate: new Date(),
    });

    // Email sending
    try {
      const transporter = await createTransporter();

      // Enhanced email template with background image
      const emailTemplate = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Arial', sans-serif; background-color: #f5f5dc;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <tr>
              <td style="padding: 0;">
                <!-- Hero Image Section -->
                <div style="background-image: url('https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?q=80&w=2940&auto=format&fit=crop'); background-size: cover; background-position: center; height: 200px; position: relative;">
                  <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold; text-align: center; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">Welcome to Nawab & Co.</h1>
                  </div>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding: 40px 30px;">
                <p style="color: #333333; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">Dear Fashion Enthusiast,</p>
                <p style="color: #333333; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">Thank you for joining our exclusive waitlist! We're thrilled to have you as part of our growing community of fashion-forward individuals.</p>
                <p style="color: #333333; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">As a valued member of our waitlist, you'll enjoy:</p>
                <ul style="color: #333333; font-size: 16px; line-height: 1.6; margin-bottom: 20px; padding-left: 20px;">
                  <li style="margin-bottom: 10px;">Early access to our exclusive collection launches</li>
                  <li style="margin-bottom: 10px;">Special pre-launch discounts</li>
                  <li style="margin-bottom: 10px;">Behind-the-scenes updates</li>
                  <li style="margin-bottom: 10px;">First pick of limited edition pieces</li>
                </ul>
                <p style="color: #333333; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">Stay tuned for exciting updates and exclusive offers coming your way!</p>
                <div style="text-align: center; margin-top: 40px;">
                  <p style="color: #666666; font-size: 14px; margin: 0;">With style,</p>
                  <p style="color: #333333; font-size: 18px; font-weight: bold; margin: 5px 0;">The Nawab & Co. Team</p>
                </div>
              </td>
            </tr>
            <tr>
              <td style="background-color: #1a1a1a; padding: 20px; text-align: center;">
                <p style="color: #ffffff; font-size: 12px; margin: 0;">© 2024 Nawab & Co. All rights reserved.</p>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;

      // Send user confirmation with "Nawab & Co." as sender name
      await transporter.sendMail({
        from: '"Nawab & Co." <' + process.env.EMAIL_SERVER_USER + ">",
        to: email,
        subject: "Welcome to Nawab & Co.'s Exclusive Waitlist",
        html: emailTemplate,
      });

      // Send admin notification if configured
      if (process.env.ADMIN_EMAIL) {
        await transporter.sendMail({
          from: '"Nawab & Co. System" <' + process.env.EMAIL_SERVER_USER + ">",
          to: process.env.ADMIN_EMAIL,
          subject: "New Waitlist Entry",
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
              <h2>New Waitlist Signup</h2>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            </div>
          `,
        });
      }

      return NextResponse.json(
        { message: "Successfully joined! Check your email for confirmation." },
        { status: 200 }
      );
    } catch (emailError: any) {
      console.error("Email error details:", {
        error: emailError,
        stack: emailError.stack,
        response: emailError.response,
      });

      return NextResponse.json(
        {
          message: "Successfully joined! Email confirmation may be delayed.",
          debug:
            process.env.NODE_ENV === "development"
              ? emailError.message
              : undefined,
        },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json(
      {
        message: "An error occurred while processing your request",
        error:
          process.env.NODE_ENV === "development"
            ? (error as Error).message
            : undefined,
      },
      { status: 500 }
    );
  }
}
