from pydantic import BaseModel, Field
from typing import Optional
from datetime import date

class create_expense(BaseModel):

    amount: int = Field(gt=0)
    price: float = Field(ge=0)
    category: str = Field(min_length=1, max_length=50)
    description: str = Field(min_length=1, max_length=500)
    purchase_date: date

class update_expense(BaseModel):

    amount: Optional[int] = Field(default=None, gt=0)
    price: Optional[float] = Field(default=None, ge=0)
    category: Optional[str] = None
    description: Optional[str] = None
    purchase_date: Optional[date] = None

class expense_response(BaseModel):

    id: int
    amount: int
    price: float
    category: str
    description: str
    purchase_date: date


# USER

class create_user(BaseModel):

    username: str = Field(min_length=1, max_length=50)
    password: str = Field(min_length=8)

class user_response(BaseModel):

    id: int
    username: str

