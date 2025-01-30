import { NextResponse } from "next/server"
import { MongoClient, ObjectId } from "mongodb"

const uri = process.env.MONGODB_URI
if (!uri) {
  throw new Error("MONGODB_URI is not set in the environment variables")
}
const client = new MongoClient(uri)

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    await client.connect()
    const database = client.db("wishlist")
    const collection = database.collection("emails")

    const result = await collection.deleteOne({ _id: new ObjectId(params.id) })

    if (result.deletedCount === 1) {
      return NextResponse.json({ message: "Email deleted successfully" })
    } else {
      return NextResponse.json({ message: "Email not found" }, { status: 404 })
    }
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

