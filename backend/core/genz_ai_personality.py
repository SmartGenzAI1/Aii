# backend/core/genz_ai_personality.py
"""
GENZ AI PERSONALITY ENGINE - v1.1.3
AI-powered personality system that adapts to GenZ communication styles
"""

import random
import re
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime, timedelta
import json
import asyncio
from dataclasses import dataclass, field
import logging

logger = logging.getLogger(__name__)

@dataclass
class GenZPersonality:
    """Dynamic personality traits that evolve based on user interaction."""
    energy_level: float = 0.8  # 0.0 = chill, 1.0 = hype
    sarcasm_level: float = 0.6  # 0.0 = straight, 1.0 = savage
    meme_level: float = 0.7     # 0.0 = formal, 1.0 = meme lord
    emoji_usage: float = 0.9    # 0.0 = none, 1.0 = emoji overload
    slang_frequency: float = 0.8  # How often to use GenZ slang
    conversation_style: str = "casual"  # casual, hype, chill, savage
    learned_phrases: List[str] = field(default_factory=list)
    user_preferences: Dict[str, Any] = field(default_factory=dict)

@dataclass
class ConversationContext:
    """Real-time conversation context for personality adaptation."""
    message_count: int = 0
    last_interaction: Optional[datetime] = None
    topic_trends: Dict[str, int] = field(default_factory=dict)
    user_mood: str = "neutral"
    conversation_flow: List[str] = field(default_factory=list)
    shared_interests: List[str] = field(default_factory=list)

class GenZAIPersonalityEngine:
    """
    Advanced AI personality system that learns and adapts to GenZ communication patterns.
    """

    def __init__(self):
        self.personality = GenZPersonality()
        self.conversation_contexts: Dict[str, ConversationContext] = {}
        self.slang_database = self._load_slang_database()
        self.meme_templates = self._load_meme_templates()
        self.emoji_mappings = self._load_emoji_mappings()

    def _load_slang_database(self) -> Dict[str, List[str]]:
        """Load GenZ slang database."""
        return {
            "greeting": ["yo", "hey", "sup", "what's good", "vibes", "skibidi"],
            "agreement": ["bet", "facts", "no cap", "real", "true", "vibes"],
            "surprise": ["no way", "deadass", "fr", "bet", "wild"],
            "question": ["wait", "huh", "say what", "real talk"],
            "emphasis": ["literally", "actually", "deadass", "fr fr", "no cap"],
            "cool": ["fire", "lit", "slay", "vibes", "clean"],
            "bad": ["mid", "sus", "cap", "wild", "chaos"],
            "understanding": ["got it", "bet", "makes sense", "vibes"],
            "positivity": ["slay", "queen", "boss", "legend", "icon"]
        }

    def _load_meme_templates(self) -> List[str]:
        """Load meme templates for humorous responses."""
        return [
            "This is fine. 🔥🐕",
            "Distracted boyfriend meme but it's me choosing this option 💀",
            "Woman yelling at cat meme: Me explaining this to boomers 📣🐱",
            "Expanding brain meme levels of understanding 🧠",
            "Change my mind 💭🤔",
            "It's giving... ✨",
            "The way I see it... 👀"
        ]

    def _load_emoji_mappings(self) -> Dict[str, List[str]]:
        """Load context-aware emoji mappings."""
        return {
            "happy": ["😊", "✨", "💫", "🌟", "🎉"],
            "excited": ["🤩", "🚀", "💥", "🔥", "⚡"],
            "confused": ["😅", "🤔", "🧐", "💭", "❓"],
            "surprised": ["😮", "🤯", "💀", "🙀", "😱"],
            "cool": ["😎", "🕶️", "🌊", "🍦", "❄️"],
            "sad": ["🥺", "😢", "💔", "😭", "🙁"],
            "angry": ["😤", "💢", "😠", "🤬", "🔥"],
            "love": ["💖", "💕", "💗", "💓", "🦋"]
        }

    async def adapt_response(
        self,
        user_message: str,
        conversation_id: str,
        base_response: str
    ) -> str:
        """
        Adapt AI response to match GenZ personality and conversation context.
        """

        # Get or create conversation context
        context = self.conversation_contexts.get(conversation_id, ConversationContext())
        context.message_count += 1
        context.last_interaction = datetime.utcnow()

        # Analyze user message for context
        user_analysis = self._analyze_user_message(user_message)
        context.user_mood = user_analysis.get('mood', 'neutral')
        context.conversation_flow.append(user_analysis.get('intent', 'general'))

        # Update topic trends
        self._update_topic_trends(context, user_message)

        # Adapt personality based on context
        adapted_personality = self._adapt_personality_to_context(context)

        # Generate GenZ-enhanced response
        genz_response = await self._generate_genz_response(
            base_response,
            adapted_personality,
            context,
            user_analysis
        )

        # Store updated context
        self.conversation_contexts[conversation_id] = context

        return genz_response

    def _analyze_user_message(self, message: str) -> Dict[str, Any]:
        """Analyze user message for mood, intent, and style."""
        message_lower = message.lower()

        # Detect mood
        mood_indicators = {
            'excited': ['!', 'omg', 'wow', 'awesome', 'lit', 'fire', 'slay'],
            'confused': ['?', 'huh', 'what', 'how', 'why', 'confused'],
            'frustrated': ['ugh', 'annoying', 'stupid', 'hate', 'angry'],
            'happy': ['lol', 'haha', 'great', 'good', 'nice', 'love'],
            'chill': ['whatever', 'idk', 'meh', 'chill', 'relax']
        }

        detected_mood = 'neutral'
        for mood, indicators in mood_indicators.items():
            if any(indicator in message_lower for indicator in indicators):
                detected_mood = mood
                break

        # Detect intent
        intent_indicators = {
            'question': ['?', 'what', 'how', 'why', 'when', 'where', 'who'],
            'statement': ['i think', 'i feel', 'i want', 'i need'],
            'request': ['can you', 'please', 'help me', 'show me'],
            'opinion': ['i like', 'i love', 'i hate', 'best', 'worst']
        }

        detected_intent = 'general'
        for intent, indicators in intent_indicators.items():
            if any(indicator in message_lower for indicator in indicators):
                detected_intent = intent
                break

        # Detect style preferences
        style_hints = {
            'casual': ['lol', 'idk', 'brb', 'ttyl', 'whatever'],
            'formal': ['please', 'thank you', 'excuse me', 'could you'],
            'sarcastic': ['obviously', 'sure', 'right', 'yeah right'],
            'enthusiastic': ['!', 'awesome', 'amazing', 'incredible']
        }

        detected_style = 'casual'
        for style, hints in style_hints.items():
            if any(hint in message_lower for hint in hints):
                detected_style = style
                break

        return {
            'mood': detected_mood,
            'intent': detected_intent,
            'style': detected_style,
            'has_emoji': bool(re.search(r'[\U0001F600-\U0001F64F]', message)),
            'length': len(message)
        }

    def _update_topic_trends(self, context: ConversationContext, message: str):
        """Update topic trends based on message content."""
        # Simple topic detection (could be enhanced with NLP)
        topics = {
            'tech': ['computer', 'code', 'programming', 'ai', 'software', 'app'],
            'gaming': ['game', 'gaming', 'play', 'player', 'level', 'quest'],
            'music': ['music', 'song', 'artist', 'album', 'listen', 'sound'],
            'food': ['food', 'eat', 'drink', 'restaurant', 'recipe', 'cook'],
            'sports': ['game', 'team', 'player', 'score', 'win', 'lose'],
            'social': ['friend', 'party', 'social', 'hangout', 'chat']
        }

        message_lower = message.lower()
        for topic, keywords in topics.items():
            if any(keyword in message_lower for keyword in keywords):
                context.topic_trends[topic] = context.topic_trends.get(topic, 0) + 1

    def _adapt_personality_to_context(self, context: ConversationContext) -> GenZPersonality:
        """Adapt personality based on conversation context."""
        adapted = GenZPersonality()

        # Adjust based on user mood
        if context.user_mood == 'excited':
            adapted.energy_level = min(1.0, self.personality.energy_level + 0.2)
            adapted.emoji_usage = min(1.0, self.personality.emoji_usage + 0.1)
        elif context.user_mood == 'chill':
            adapted.energy_level = max(0.3, self.personality.energy_level - 0.2)
            adapted.sarcasm_level = max(0.2, self.personality.sarcasm_level - 0.1)

        # Adjust based on conversation length
        if context.message_count > 10:
            # Get more casual and use more slang
            adapted.slang_frequency = min(1.0, self.personality.slang_frequency + 0.1)
            adapted.meme_level = min(1.0, self.personality.meme_level + 0.1)

        # Adjust based on topics
        gaming_interest = context.topic_trends.get('gaming', 0)
        tech_interest = context.topic_trends.get('tech', 0)

        if gaming_interest > tech_interest:
            adapted.meme_level += 0.1
            adapted.energy_level += 0.1
        elif tech_interest > gaming_interest:
            adapted.sarcasm_level += 0.1
            adapted.conversation_style = "tech-savvy"

        return adapted

    async def _generate_genz_response(
        self,
        base_response: str,
        personality: GenZPersonality,
        context: ConversationContext,
        user_analysis: Dict[str, Any]
    ) -> str:
        """Generate GenZ-enhanced response."""

        enhanced_response = base_response

        # Add slang based on personality settings
        if random.random() < personality.slang_frequency:
            enhanced_response = self._inject_slang(enhanced_response, personality)

        # Add emojis based on context and personality
        if random.random() < personality.emoji_usage:
            enhanced_response = self._add_emojis(enhanced_response, personality, user_analysis)

        # Add memes occasionally
        if random.random() < personality.meme_level and context.message_count > 3:
            if random.random() < 0.3:  # 30% chance when meme level is high
                enhanced_response = self._add_meme_element(enhanced_response)

        # Adjust energy level through punctuation and caps
        enhanced_response = self._adjust_energy_level(enhanced_response, personality)

        # Add conversational elements based on context
        enhanced_response = self._add_conversational_elements(
            enhanced_response, personality, context, user_analysis
        )

        return enhanced_response

    def _inject_slang(self, response: str, personality: GenZPersonality) -> str:
        """Inject GenZ slang into the response."""
        slang_options = []

        # Get slang based on response content analysis
        response_lower = response.lower()

        if any(word in response_lower for word in ['yes', 'agree', 'correct', 'right']):
            slang_options.extend(self.slang_database['agreement'])
        if any(word in response_lower for word in ['no', 'disagree', 'wrong']):
            slang_options.extend(['nah', 'cap', 'sus'])
        if any(word in response_lower for word in ['good', 'great', 'awesome']):
            slang_options.extend(self.slang_database['positivity'])
        if any(word in response_lower for word in ['understand', 'got it']):
            slang_options.extend(self.slang_database['understanding'])

        # Add general slang
        slang_options.extend(['fr', 'no cap', 'bet', 'vibes'])

        if slang_options and random.random() < personality.slang_frequency:
            selected_slang = random.choice(slang_options)

            # Insert slang at appropriate places
            sentences = re.split(r'([.!?]+)', response)
            if len(sentences) > 1:
                insert_pos = random.randint(0, len(sentences) - 2)
                sentences[insert_pos] += f" {selected_slang}"

            return ''.join(sentences)

        return response

    def _add_emojis(self, response: str, personality: GenZPersonality, user_analysis: Dict) -> str:
        """Add context-aware emojis to response."""
        emoji_options = []

        # Context-based emoji selection
        response_lower = response.lower()

        if any(word in response_lower for word in ['good', 'great', 'awesome', 'love']):
            emoji_options.extend(self.emoji_mappings['happy'])
        if any(word in response_lower for word in ['wow', 'amazing', 'incredible']):
            emoji_options.extend(self.emoji_mappings['excited'])
        if any(word in response_lower for word in ['think', 'consider', 'maybe']):
            emoji_options.extend(self.emoji_mappings['confused'])
        if any(word in response_lower for word in ['cool', 'nice', 'vibes']):
            emoji_options.extend(self.emoji_mappings['cool'])

        # Mood-based emojis
        if user_analysis['mood'] == 'excited':
            emoji_options.extend(self.emoji_mappings['excited'])

        # Add some general fun emojis
        emoji_options.extend(['✨', '💫', '🌟', '🎯', '🚀'])

        if emoji_options:
            # Add 1-3 emojis randomly
            num_emojis = min(3, max(1, int(personality.emoji_usage * 3)))
            selected_emojis = random.sample(emoji_options, min(num_emojis, len(emoji_options)))

            # Distribute emojis throughout response
            words = response.split()
            if len(words) > 5:
                # Insert emojis at random positions
                positions = sorted(random.sample(range(len(words)), min(num_emojis, len(words))))
                for i, pos in enumerate(positions):
                    words[pos] += f" {selected_emojis[i]}"
                return ' '.join(words)
            else:
                # Add at the end
                return response + ' ' + ' '.join(selected_emojis)

        return response

    def _add_meme_element(self, response: str) -> str:
        """Add meme elements to response."""
        if random.random() < 0.5:
            # Add meme template
            meme = random.choice(self.meme_templates)
            return f"{response} {meme}"
        else:
            # Add meme-style phrase
            meme_phrases = [
                "*chef's kiss*",
                "*mic drop*",
                "*plot twist*",
                "*mind blown*",
                "*tea spilled*",
                "*vibes checked*"
            ]
            return f"{response} {random.choice(meme_phrases)}"

    def _adjust_energy_level(self, response: str, personality: GenZPersonality) -> str:
        """Adjust response energy through punctuation and formatting."""
        if personality.energy_level > 0.8:
            # High energy - add exclamation points and caps
            if random.random() < 0.3:
                response = response.upper()
            elif random.random() < 0.5:
                response = re.sub(r'([.!?])$', '!!!', response)
        elif personality.energy_level < 0.4:
            # Low energy - add ellipses and lowercase
            if random.random() < 0.4:
                response = response + "..."
                if random.random() < 0.3:
                    response = response.lower()

        return response

    def _add_conversational_elements(
        self,
        response: str,
        personality: GenZPersonality,
        context: ConversationContext,
        user_analysis: Dict
    ) -> str:
        """Add conversational elements based on context."""

        elements = []

        # Add follow-up based on intent
        if user_analysis['intent'] == 'question' and random.random() < 0.6:
            follow_ups = [
                "What do you think?",
                "Makes sense, right?",
                "You feel me?",
                "Not gonna lie...",
                "Real talk though..."
            ]
            elements.append(random.choice(follow_ups))

        # Add topic continuation
        if context.topic_trends and random.random() < 0.4:
            top_topic = max(context.topic_trends.items(), key=lambda x: x[1])[0]
            topic_follows = {
                'gaming': ["Speaking of gaming...", "As a gamer myself..."],
                'tech': ["Tech-wise...", "In the tech world..."],
                'music': ["Music vibes...", "On that musical note..."],
                'food': ["Food related...", "Cuisine-wise..."]
            }
            if top_topic in topic_follows:
                elements.append(random.choice(topic_follows[top_topic]))

        # Combine elements
        if elements:
            connector = " " + random.choice(["Also,", "Plus,", "And", "Oh, and"]) + " "
            return response + connector + " ".join(elements)

        return response

    async def generate_conversation_title(self, conversation_history: List[str]) -> str:
        """Generate a GenZ-style conversation title."""
        if not conversation_history:
            return "New Chat ✨"

        # Analyze conversation for themes
        all_text = " ".join(conversation_history[-5:])  # Last 5 messages
        all_text_lower = all_text.lower()

        # Theme detection
        themes = {
            'tech': ['code', 'programming', 'ai', 'software', 'computer'],
            'gaming': ['game', 'gaming', 'play', 'player', 'level'],
            'music': ['music', 'song', 'artist', 'album', 'sound'],
            'food': ['food', 'eat', 'drink', 'restaurant', 'recipe'],
            'advice': ['help', 'how to', 'advice', 'tips', 'guide'],
            'creative': ['design', 'art', 'create', 'build', 'make']
        }

        detected_themes = []
        for theme, keywords in themes.items():
            if any(keyword in all_text_lower for keyword in keywords):
                detected_themes.append(theme)

        # Generate GenZ title
        if detected_themes:
            theme = random.choice(detected_themes)
            title_templates = {
                'tech': ["Tech Talk Session 💻", "Code & Chill 🖥️", "AI Vibes Check 🤖"],
                'gaming': ["Gaming Session 🎮", "Level Up Chat 🚀", "Game On! 🎯"],
                'music': ["Music Vibes 🎵", "Sound Journey 🌊", "Beat Drop Zone 🎧"],
                'food': ["Foodie Chat 🍕", "Recipe Realm 🥘", "Taste Test Talk 👅"],
                'advice': ["Wisdom Drop 📚", "Help Session 💡", "Guide Quest 🗺️"],
                'creative': ["Creative Flow 🎨", "Build Mode 🛠️", "Idea Factory 💭"]
            }
            return random.choice(title_templates.get(theme, ["GenZ Chat ✨"]))
        else:
            # Generic GenZ titles
            generic_titles = [
                "Random Vibes ✨", "Deep Talk Session 💭", "Fun Chat Time 🎉",
                "Real Talk 💬", "Chill Conversation ❄️", "Mind Dump Zone 🧠",
                "Story Time 📖", "Opinion Hour 🕐", "Thoughts & Vibes 🌟"
            ]
            return random.choice(generic_titles)

# Global personality engine instance
genz_personality_engine = GenZAIPersonalityEngine()

__all__ = ['GenZAIPersonalityEngine', 'genz_personality_engine']