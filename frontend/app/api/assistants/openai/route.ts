// @ts-nocheck - Suppress module resolution errors in this environment
import { checkApiKey, getServerProfile } from "@/lib/server/server-chat-helpers"
import { createErrorResponse } from "@/lib/utils"
import { ServerRuntime } from "next"
import OpenAI from "openai"

export const runtime: ServerRuntime = "edge"

export async function GET() {
  try {
    const profile = await getServerProfile()

    checkApiKey(profile.openai_api_key || null, "OpenAI")

    const openai = new OpenAI({
      apiKey: profile.openai_api_key || "",
      organization: profile.openai_organization_id
    })

    const myAssistants = await openai.beta.assistants.list({
      limit: 100
    })

    return new Response(JSON.stringify({ assistants: myAssistants.data }), {
      status: 200
    })
  } catch (error: any) {
    return createErrorResponse(error)
  }
}
