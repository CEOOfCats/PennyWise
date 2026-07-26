from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from pydantic import EmailStr

Base = declarative_base()

# EXPENSE
class db_expense(Base):
    
    __tablename__ = 'Expenses'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('Users.id'), nullable=False)
    amount = Column(Integer)
    price = Column(Float)
    category = Column(String)
    description = Column(String)
    purchase_date =  Column(Date)


# USER
class db_user(Base):

    __tablename__ = 'Users'

    id = Column(Integer, primary_key=True, index=True)
    username =Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
