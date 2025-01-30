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
    await client.db("admin").command({ ping: 1 }); // Test the connection
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
  // Validate email configuration
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
    secure: process.env.EMAIL_SERVER_PORT === "465", // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD,
    },
    debug: true, // Enable debug logs
    logger: true, // Enable logger
  });

  // Verify connection configuration
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

    // Connect to MongoDB
    const client = await connectToDatabase();
    const database = client.db("wishlist");
    const collection = database.collection("emails");

    // Check if email already exists
    const existingEmail = await collection.findOne({ email });
    if (existingEmail) {
      return NextResponse.json(
        { message: "This email is already registered" },
        { status: 400 }
      );
    }

    // Insert new email
    await collection.insertOne({
      email,
      submissionDate: new Date(),
    });

    // Email sending
    try {
      const transporter = await createTransporter();

      // Simplified email template for testing
      const emailTemplate = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1>Welcome to Nawab & Co.!</h1>
          <p>Thank you for joining our waitlist, ${email}!</p>
          <p>We'll keep you updated on our launch.</p>
        </div>
      `;

      // Send user confirmation
      await transporter.sendMail({
        from: process.env.FROM_EMAIL || process.env.EMAIL_SERVER_USER,
        to: email,
        subject: "Welcome to Our Waitlist!",
        html: emailTemplate,
      });

      // Send admin notification if configured
      if (process.env.ADMIN_EMAIL) {
        await transporter.sendMail({
          from: process.env.FROM_EMAIL || process.env.EMAIL_SERVER_USER,
          to: process.env.ADMIN_EMAIL,
          subject: "New Waitlist Entry",
          html: `<p>New signup: ${email}</p>`,
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

      // Still return success since we saved to database
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
