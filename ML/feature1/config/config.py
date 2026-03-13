from functools import lru_cache

from pydantic import Field, validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    gemini_api_key: str = Field(..., env="GEMINI_API_KEY")
    # Force a known-good model name and IGNORE any GEMINI_MODEL env override
    # to avoid conflicts from global environment settings.
    gemini_model: str = Field("gemini-2.5-flash")

    ocr_engine: str = Field("pytesseract", env="OCR_ENGINE")
    easyocr_langs: str = Field("en", env="EASYOCR_LANGS")

    max_chars_per_chunk: int = Field(8000, env="MAX_CHARS_PER_CHUNK")
    gemini_max_retries: int = Field(1, env="GEMINI_MAX_RETRIES")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

    @validator("ocr_engine")
    def validate_ocr_engine(cls, v: str) -> str:
        v_lower = v.lower()
        if v_lower not in {"pytesseract", "easyocr"}:
            raise ValueError("OCR_ENGINE must be either 'pytesseract' or 'easyocr'.")
        return v_lower

    @property
    def easyocr_lang_list(self) -> list[str]:
        return [lang.strip() for lang in self.easyocr_langs.split(",") if lang.strip()]


@lru_cache()
def get_settings() -> Settings:
    return Settings()

