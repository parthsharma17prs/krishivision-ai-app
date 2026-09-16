from abc import ABC, abstractmethod
from typing import Dict, Any

class BaseModelAdapter(ABC):
    @abstractmethod
    def load(self) -> bool:
        """Load model weights into memory if available."""
        pass

    @abstractmethod
    def predict(self, input_data: Any) -> Dict[str, Any]:
        """Perform inference and return standardized prediction dictionary."""
        pass

    @abstractmethod
    def health(self) -> Dict[str, Any]:
        """Return operational health and mode status."""
        pass

    @abstractmethod
    def metadata(self) -> Dict[str, Any]:
        """Return model metadata (architecture, dataset, classes)."""
        pass
