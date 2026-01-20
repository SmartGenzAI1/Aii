// @ts-nocheck - Suppress module resolution errors in this environment
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
    name: "Code Review",
    description: "Get help reviewing and improving code",
    prompt: "Can you review this code and suggest improvements for performance, readability, and best practices?",
    icon: Code,
    category: "Development"
  },
  {
    id: "documentation",
    name: "Write Documentation",
    description: "Generate comprehensive documentation",
    prompt: "Please help me write clear, comprehensive documentation for this project/feature. Include setup instructions, API documentation, and usage examples.",
    icon: FileText,
    category: "Writing"
  },
  {
    id: "debug-help",
    name: "Debug Issue",
    description: "Get help debugging a problem",
    prompt: "I'm encountering this issue: [describe your problem]. I've tried [what you've tried]. The error is [error message]. Can you help me debug this?",
    icon: Zap,
    category: "Development"
  },
  {
    id: "explain-concept",
    name: "Explain Concept",
    description: "Get a clear explanation of a complex topic",
    prompt: "Can you explain [topic/concept] in simple terms? Please break it down step by step and provide examples.",
    icon: Brain,
    category: "Learning"
  },
  {
    id: "brainstorm",
    name: "Brainstorm Ideas",
    description: "Generate creative ideas for a project",
    prompt: "I'm working on [project/idea]. Can you help me brainstorm creative solutions and approaches? Consider different perspectives and innovative ideas.",
    icon: Lightbulb,
    category: "Creative"
  },
  {
    id: "chat-general",
    name: "General Chat",
    description: "Have a natural conversation",
    prompt: "Hello! I'm here for a general conversation. What's on your mind today?",
    icon: MessageCircle,
    category: "Social"
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