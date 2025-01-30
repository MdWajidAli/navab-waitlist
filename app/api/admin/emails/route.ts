import { NextResponse } from "next/server"
import { MongoClient } from "mongodb"

const uri = process.env.MONGODB_URI
if (!uri) {
  throw new Error("MONGODB_URI is not set in the environment variables")
}
const client = new MongoClient(uri)

export async function GET() {
  try {
    await client.connect()
    const database = client.db("wishlist")
    const collection = database.collection("emails")

    const emails = await collection.find().sort({ submissionDate: -1 }).toArray()
    return NextResponse.json(emails)
  } catch (error) {
    console.error("Error:", error)
    if (error instanceof Error) {
      return NextResponse.json({ message: error.message }, { status: 500 })
    }
    return NextResponse.json({ message: "An unknown error occurred" }, { status: 500 })
  } finally {
    await client.close()
  }
}

