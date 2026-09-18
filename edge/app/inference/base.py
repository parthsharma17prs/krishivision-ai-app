import time
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
import numpy as np

class BaseInferenceEngine(ABC):
    """
    Abstract base class for all Edge AI inference engines.
    Guarantees consistent output schema, lifecycle management, and latency measurement.
    """

    def __init__(self, name: str):
        self.name = name
        self.is_loaded = False
        self.execution_provider = "UNKNOWN"
        self.load_error: Optional[str] = None
        self._total_inferences = 0
        self._total_latency_ms = 0.0

    @abstractmethod
    def load(self) -> bool:
        """Loads model weights and prepares inference sessions."""
        pass

    @abstractmethod
    def infer(self, frame: np.ndarray) -> Dict[str, Any]:
        """
        Executes inference on an input frame.
        Must record exact latency via time.perf_counter().
        """
        pass

    @abstractmethod
    def health(self) -> Dict[str, Any]:
        """Returns health status, loaded state, and backend device."""
        pass

    def warmup(self, sample_input: Optional[np.ndarray] = None) -> None:
        """Executes a dry-run inference to pre-allocate execution engine caches."""
        if not self.is_loaded:
            self.load()
        if self.is_loaded and sample_input is not None:
            try:
                self.infer(sample_input)
            except Exception:
                pass

    def get_average_latency_ms(self) -> float:
        if self._total_inferences == 0:
            return 0.0
        return self._total_latency_ms / self._total_inferences
