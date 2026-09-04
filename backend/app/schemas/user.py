from pydantic import BaseModel, EmailStr, ConfigDict


class LoginInput(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    # What we are allowed to send back about a user (never the password hash)
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: EmailStr
    employee_code: str | None
    role: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
