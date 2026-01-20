// @ts-nocheck
"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Lightbulb, Code, FileText, MessageCircle, Zap, Brain } from "@tabler/icons-react"

interface Template {
  id: string
  name: string
  description: string
  prompt: string
  icon: React.ComponentType<{ className?: string }>
  category: string
}

const CONVERSATION_TEMPLATES: Template[] = [
  {
    id: "code-review",
    name: "🔥 Code Review Vibes",
    description: "Level up your code with AI feedback",
    prompt: "Yo, check this code out and drop those fire improvements for performance, readability, and best practices. Make it lit! 💻✨",
    icon: Code,
    category: "Dev Squad"
  },
  {
    id: "documentation",
    name: "📝 Doc Drop",
    description: "Generate that comprehensive docs",
    prompt: "Help me create straight fire documentation for this project/feature. Include setup vibes, API deets, and usage examples that actually make sense. 📚🚀",
    icon: FileText,
    category: "Creator Mode"
  },
  {
    id: "debug-help",
    name: "🐛 Bug Buster",
    description: "Debug like a boss with AI",
    prompt: "I'm stuck with this issue: [describe your problem]. I've tried [what you've tried]. The error says [error message]. Help me debug this mess, bestie! 🛠️💪",
    icon: Zap,
    category: "Dev Squad"
  },
  {
    id: "explain-concept",
    name: "🧠 Concept Crusher",
    description: "Break down complex topics easily",
    prompt: "Explain [topic/concept] in simple, relatable terms? Break it down step by step with real examples that actually click. Make it make sense! 🤯💡",
    icon: Brain,
    category: "Learn & Grow"
  },
  {
    id: "brainstorm",
    name: "💡 Idea Storm",
    description: "Brainstorm creative vibes for your project",
    prompt: "Working on [project/idea] and need some creative inspo. Help me brainstorm wild solutions and fresh approaches. Think outside the box, get innovative! 🌈🎨",
    icon: Lightbulb,
    category: "Creator Mode"
  },
  {
    id: "chat-general",
    name: "💬 GenZ Chat",
    description: "Real talk with AI",
    prompt: "Hey! Down for a chill convo. What's popping in your world today? Let's keep it 100! 😎✨",
    icon: MessageCircle,
    category: "Social Squad"
  },
  {
    id: "meme-generator",
    name: "😂 Meme Master",
    description: "Create viral memes with AI",
    prompt: "Create a hilarious meme about [topic]. Make it relatable, funny, and shareable. Include the text and describe the image format! 📸😂",
    icon: Lightbulb,
    category: "Fun Zone"
  },
  {
    id: "trend-spotter",
    name: "📈 Trend Hunter",
    description: "Stay ahead of the curve",
    prompt: "What's the latest in [industry/topic]? Give me the tea on emerging trends, what's hot right now, and what's coming next. Keep me woke! 🔥📊",
    icon: Zap,
    category: "Trend Alert"
  }
]

interface ConversationTemplatesProps {
  onSelectTemplate: (prompt: string) => void
  children?: React.ReactNode
}

export function ConversationTemplates({ onSelectTemplate, children }: ConversationTemplatesProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm" className="gap-2">
            <Lightbulb className="h-4 w-4" />
            Templates
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Conversation Templates</DialogTitle>
          <DialogDescription>
            Choose from pre-built conversation starters to get started quickly
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {CONVERSATION_TEMPLATES.map((template) => {
            const IconComponent = template.icon
            return (
              <div
                key={template.id}
                className="flex items-start space-x-4 p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                onClick={() => {
                  onSelectTemplate(template.prompt)
                }}
              >
                <div className="flex-shrink-0">
                  <IconComponent className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-foreground">
                    {template.name}
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {template.description}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2 italic">
                    "{template.prompt.substring(0, 100)}{template.prompt.length > 100 ? '...' : ''}"
                  </p>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary mt-2">
                    {template.category}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}