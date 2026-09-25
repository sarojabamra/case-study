from typing import List, Optional

import re

from pydantic import BaseModel, field_validator, model_validator

LETTERS_ONLY_NAME_PATTERN = re.compile(r"^[A-Za-z]+(?:[ '-][A-Za-z]+)*$")
LETTERS_ONLY_NAME_MESSAGE = (
    "Must contain only letters, spaces, hyphens, or apostrophes (no numbers)"
)


def _validate_letters_only_name(value: str, field_label: str) -> str:
    text = value.strip()
    if not LETTERS_ONLY_NAME_PATTERN.fullmatch(text):
        raise ValueError(f"{field_label} {LETTERS_ONLY_NAME_MESSAGE}")
    return text


class UserCreate(BaseModel):
    username: str
    password: str

    @field_validator("username")
    @classmethod
    def validate_username(cls, value: str) -> str:
        username = value.strip()
        if not username:
            raise ValueError("Username cannot be empty")
        return username


class SignupCreate(UserCreate):
    full_name: str

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, value: str) -> str:
        name = value.strip()
        if len(name) < 2:
            raise ValueError("Full name must be at least 2 characters")
        if len(name) > 80:
            raise ValueError("Full name is too long")
        return _validate_letters_only_name(name, "Full name")


class ProfileUpdate(BaseModel):
    full_name: str

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, value: str) -> str:
        name = value.strip()
        if len(name) < 2:
            raise ValueError("Full name must be at least 2 characters")
        if len(name) > 80:
            raise ValueError("Full name is too long")
        return _validate_letters_only_name(name, "Full name")


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

    @field_validator("current_password", "new_password")
    @classmethod
    def validate_password_present(cls, value: str) -> str:
        if not value or len(value) > 64:
            raise ValueError("Password is invalid")
        return value

    @field_validator("new_password")
    @classmethod
    def validate_new_password_strength(cls, value: str) -> str:
        if len(value) < 8:
            raise ValueError("Use 8 or more characters, with a letter and a number")
        if not re.search(r"[A-Za-z]", value) or not re.search(r"\d", value):
            raise ValueError("Use 8 or more characters, with a letter and a number")
        return value


class RefreshRequest(BaseModel):
    refresh_token: str

    @field_validator("refresh_token")
    @classmethod
    def validate_refresh_token(cls, value: str) -> str:
        token = value.strip()
        if not token or len(token) > 8192:
            raise ValueError("Refresh token is invalid")
        return token


class TenantCreate(BaseModel):
    name: str

    @field_validator("name")
    @classmethod
    def validate_tenant_name(cls, value: str) -> str:
        name = value.strip()
        if not name:
            raise ValueError("Tenant name cannot be empty")
        return name


class CategoryCreate(BaseModel):
    name: str


class ProductCreate(BaseModel):
    name: str
    price: float
    quantity: int
    category_id: int


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[float] = None
    quantity: Optional[int] = None
    category_id: Optional[int] = None


class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int


class AddressCreate(BaseModel):
    label: Optional[str] = None
    recipient_name: str
    line1: str
    line2: Optional[str] = None
    city: str
    state: str
    postal_code: str
    country: str = "IN"
    phone: Optional[str] = None
    is_default: bool = False

    @field_validator("line1", "postal_code", "country")
    @classmethod
    def validate_required_text(cls, value: str) -> str:
        text = value.strip()
        if not text:
            raise ValueError("Field cannot be empty")
        return text

    @field_validator("recipient_name")
    @classmethod
    def validate_recipient_name(cls, value: str) -> str:
        text = value.strip()
        if not text:
            raise ValueError("Field cannot be empty")
        return _validate_letters_only_name(text, "Recipient name")

    @field_validator("city")
    @classmethod
    def validate_city(cls, value: str) -> str:
        text = value.strip()
        if not text:
            raise ValueError("Field cannot be empty")
        return _validate_letters_only_name(text, "City")

    @field_validator("state")
    @classmethod
    def validate_state(cls, value: str) -> str:
        text = value.strip()
        if not text:
            raise ValueError("Field cannot be empty")
        return _validate_letters_only_name(text, "State")

    @field_validator("label", "line2", "phone")
    @classmethod
    def validate_optional_text(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        text = value.strip()
        return text or None

    @model_validator(mode="after")
    def validate_postal_code_for_country(self):
        country = self.country.strip().upper()
        postal_code = self.postal_code.strip()
        if country == "IN" and not re.fullmatch(r"\d{6}", postal_code):
            raise ValueError("Enter a valid 6-digit PIN code")
        if country == "US" and not re.fullmatch(r"\d{5}(-\d{4})?", postal_code):
            raise ValueError("Enter a valid US ZIP code")
        return self


class AddressUpdate(BaseModel):
    label: Optional[str] = None
    recipient_name: Optional[str] = None
    line1: Optional[str] = None
    line2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None
    phone: Optional[str] = None
    is_default: Optional[bool] = None


class OrderCreate(BaseModel):
    items: List[OrderItemCreate]
    address_id: int


class OrderStatusUpdate(BaseModel):
    status: str


class OrderReturnDecision(BaseModel):
    return_status: str


class CartLineInput(BaseModel):
    product_id: int
    quantity: int


class CartSync(BaseModel):
    items: List[CartLineInput]
