import { createChatTitle } from "@/lib/create-chat-title"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json()

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    const title = await createChatTitle(message)

    return NextResponse.json({ title })
  } catch (error) {
    console.error("Error generating chat title:", error)
    return NextResponse.json({ error: "Failed to generate title" }, { status: 500 })
  }
}
