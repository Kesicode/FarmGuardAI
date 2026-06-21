"""Import all models to ensure SQLAlchemy registers them."""
from app.models.user import User
from app.models.animal import Animal
from app.models.device import Device
from app.models.health_reading import HealthReading
from app.models.alert import Alert
from app.models.alert_threshold import AlertThreshold
from app.models.prediction import Prediction
from app.models.recommendation import Recommendation
from app.models.location import Location
from app.models.agent_log import AgentLog
from app.models.chat_session import ChatSession
from app.models.chat_message import ChatMessage
from app.models.knowledge_embedding import KnowledgeEmbedding

__all__ = [
    "User", "Animal", "Device", "HealthReading", "Alert",
    "AlertThreshold", "Prediction", "Recommendation", "Location",
    "AgentLog", "ChatSession", "ChatMessage", "KnowledgeEmbedding",
]
