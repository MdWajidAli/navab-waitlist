import { NextResponse } from "next/server"

// Rate limiting object to prevent abuse
const cooldowns = new Map<string, number>()

export async function POST(req: Request) {
  try {
    // Get the client's IP address from the request headers
    const forwardedFor = req.headers.get("x-forwarded-for")
    const clientIp = forwardedFor ? forwardedFor.split(",")[0] : "unknown"

    // Check if the client is in cooldown
    const lastRequest = cooldowns.get(clientIp)
    const now = Date.now()
    if (lastRequest && now - lastRequest < 2000) {
      // 2 seconds cooldown
      return NextResponse.json({ message: "Please wait a few seconds before trying again" }, { status: 429 })
    }

    // Update cooldown
    cooldowns.set(clientIp, now)

    // Parse request body
    const { email } = await req.json()

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ message: "Please enter a valid email address" }, { status: 400 })
    }

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Return success response
    return NextResponse.json(
      { message: "Thank you for joining our waitlist! We'll be in touch soon." },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error processing signup:", error)
    return NextResponse.json({ message: "Something went wrong. Please try again later." }, { status: 500 })
  }
}

