import re
from typing import Dict, Any, List

class FarmerAssistantService:
    """
    AI Farming Assistant Service.
    Supports English, Hindi, and Hinglish prompts.
    Uses a structured Agri Knowledge Base to provide reliable advice without hallucinating chemical dosages.
    """

    KNOWLEDGE_BASE = {
        "brown_spots": {
            "keywords": ["brown spots", "black spots", "spots", "dhabbe", "daag", "early blight", "leaf spots"],
            "title": "Possible Cause: Tomato Early Blight or Leaf Spot",
            "explanation": "Leaves displaying brown spots with concentric ring patterns (target spots) usually indicate Early Blight (Alternaria solani) or Septoria leaf spot, triggered by leaf wetness and warm weather.",
            "actions": [
                "Inspect lower leaves and prune badly infected leaves near the soil line.",
                "Avoid overhead irrigation — use drip lines to keep foliage dry.",
                "If severe, consult local KVK officer for approved copper oxychloride application.",
                "Ensure proper crop rotation with non-solanaceous crops next season."
            ],
            "followups": [
                "How do I upload an image to AI Plant Doctor?",
                "What fertilizer should I apply for Early Blight recovery?",
                "What is my current irrigation schedule?"
            ]
        },
        "irrigation": {
            "keywords": ["irrigation", "water", "paani", "scinchai", "moisture", "dry", "sukh"],
            "title": "Smart Irrigation Guidance",
            "explanation": "Your tomato field currently maintains 28% soil moisture. Optimal range during flowering is 30%-45%.",
            "actions": [
                "Check the Irrigation Intelligence tab for real-time recommendations based on weather forecast.",
                "Irrigate early in the morning (6 AM - 8 AM) or evening to minimize evaporation."
            ],
            "followups": [
                "Is rain expected in Indore today?",
                "How much water does my tomato crop need per acre?"
            ]
        },
        "yellow_leaves": {
            "keywords": ["yellow", "peela", "yellowing", "peeli", "leaves turning yellow"],
            "title": "Possible Cause: Nitrogen Deficiency or Overwatering",
            "explanation": "Yellowing of older bottom leaves is typically caused by Nitrogen (N) deficiency or waterlogged soil impairing root respiration.",
            "actions": [
                "Check soil moisture levels to ensure the field is not over-saturated.",
                "Consider a foliar application of 1% urea solution early in the day.",
                "Request a soil test in the Nutrient Health tab."
            ],
            "followups": [
                "What is the recommended NPK ratio for tomatoes?",
                "How do I use the IoT Sensor Simulator?"
            ]
        }
    }

    def chat(self, user_query: str, language: str = "English") -> Dict[str, Any]:
        query_lower = user_query.lower()

        # Detect Hinglish / Hindi indicators
        is_hinglish = any(w in query_lower for w in ["meri", "kaise", "hoga", "paani", "peela", "dhabbe", "aa rahe", "hain", "karo", "batao"])
        detected_lang = "Hinglish" if is_hinglish else language

        # Match query against Knowledge Base
        matched_topic = None
        for key, topic in self.KNOWLEDGE_BASE.items():
            if any(kw in query_lower for kw in topic["keywords"]):
                matched_topic = topic
                break

        if matched_topic:
            response_text = f"**{matched_topic['title']}**\n\n{matched_topic['explanation']}\n\n**Recommended Actions:**\n"
            for act in matched_topic["actions"]:
                response_text += f"• {act}\n"
            
            followups = matched_topic["followups"]
        else:
            response_text = (
                "**KrishiVision AI Assistant**\n\n"
                f"Thank you for reaching out! Regarding your inquiry: *\"{user_query}\"*\n\n"
                "I can analyze your plant photos for disease detection, check real-time soil moisture and weather forecast, "
                "or suggest balanced nutrient fertilization for your crop.\n\n"
                "**Suggested Next Steps:**\n"
                "• Upload a leaf photo in the **AI Plant Doctor** tab for precise diagnosis.\n"
                "• Adjust field parameters in the **IoT Telemetry Panel** to test irrigation recommendations.\n"
                "• Review the **Risk Alerts** tab for current heat wave or outbreak warnings."
            )
            followups = [
                "Meri tomato ki leaves pe brown spots aa rahe hain",
                "When should I irrigate my tomato crop?",
                "Show my farm health score breakdown"
            ]

        return {
            "farm_id": "farm-indore-001",
            "user_query": user_query,
            "response_text": response_text,
            "detected_language": detected_lang,
            "suggested_followups": followups,
            "mode": "KNOWLEDGE_BASE"
        }

assistant_service = FarmerAssistantService()
