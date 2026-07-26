from schemas import expense_response, create_expense, update_expense, create_user, user_response
import db_models
from fastapi import FastAPI, Depends, HTTPException
from database import session, engine
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date
from fastapi.middleware.cors import CORSMiddleware
from pwdlib import PasswordHash
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from dotenv import load_dotenv
import os
import jwt
from jwt.exceptions import InvalidTokenError
from datetime import datetime, timedelta, timezone

app = FastAPI()
password_hash = PasswordHash.recommended()
load_dotenv()

origins = ["http://localhost:5500",
           "http://127.0.0.1:5500"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

db_models.Base.metadata.create_all(bind=engine)

def get_db():
    db = session()

    try:
        yield db
    finally:
        db.close()
        

#USER-RELATED METHODS
SECRET_KEY = os.getenv("JWT_SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def decode_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if username is None:
            raise HTTPException(401, "Invalid token")
        return username
    except InvalidTokenError:
        raise HTTPException(401, "Invalid or expired token")

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_hashed_password(password):
    return password_hash.hash(password)

def verify_password(plain_password, hashed_password):
    return password_hash.verify(plain_password, hashed_password)

@app.post('/users', response_model=user_response)
def add_user(user : create_user, db : Session = Depends(get_db)):
    db_user = db.query(db_models.db_user).filter(db_models.db_user.username == user.username).first()
    if db_user:
        raise HTTPException(400, "Username already taken")
    
    hashed_password = get_hashed_password(user.password)
    newUser = db_models.db_user(username=user.username, hashed_password=hashed_password)

    db.add(newUser)
    db.commit()
    db.refresh(newUser)
        
    return newUser

@app.post('/login')
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    db_user = db.query(db_models.db_user).filter(db_models.db_user.username == form_data.username).first()

    if not db_user or not verify_password(form_data.password, db_user.hashed_password):
        raise HTTPException(401, "Username or Password is incorrect")

    access_token = create_access_token(data={"sub": db_user.username})
    return {"access_token": access_token, "token_type": "bearer"}

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    username = decode_token(token)

    user = db.query(db_models.db_user).filter(db_models.db_user.username == username).first()
    if user is None:
        raise HTTPException(401, "User not found")

    return user


#READ
@app.get('/expenses', response_model=list[expense_response])
def get_all_expenses(category : str | None = None,
                    min_price : float | None = None,
                    max_price : float | None = None,
                    start_date : date | None = None,
                    end_date : date | None = None,
                    sort_by : str | None = None,
                    order: str = "asc",
                    db : Session = Depends(get_db),
                    current_user: db_models.db_user = Depends(get_current_user)):
    
    db_expenses = db.query(db_models.db_expense).filter(db_models.db_expense.user_id == current_user.id)

    if category:
        db_expenses = db_expenses.filter(db_models.db_expense.category == category)

    if min_price:
        db_expenses = db_expenses.filter(db_models.db_expense.price >= min_price)
    
    if max_price:
        db_expenses = db_expenses.filter(db_models.db_expense.price <= max_price)

    if start_date:
        db_expenses = db_expenses.filter(db_models.db_expense.purchase_date >= start_date)

    if end_date:
        db_expenses = db_expenses.filter(db_models.db_expense.purchase_date <= end_date)

    if sort_by:
        if sort_by == "price":
            if order == "desc":
                db_expenses = db_expenses.order_by(db_models.db_expense.price.desc())
            else:
                db_expenses = db_expenses.order_by(db_models.db_expense.price)

        elif sort_by == "category":
            if order == "desc":
                db_expenses = db_expenses.order_by(db_models.db_expense.category.desc())
            else:
                db_expenses = db_expenses.order_by(db_models.db_expense.category)

        elif sort_by == "date":
            if order == "desc":
                db_expenses = db_expenses.order_by(db_models.db_expense.purchase_date.desc())
            else:
                db_expenses = db_expenses.order_by(db_models.db_expense.purchase_date)
        
        elif sort_by == "amount":
            if order == "desc":
                db_expenses = db_expenses.order_by(db_models.db_expense.amount.desc())
            else:
                db_expenses = db_expenses.order_by(db_models.db_expense.amount)

    return db_expenses.all()

@app.get('/expenses/{expense_id}', response_model=expense_response)
def get_expense(expense_id : int, db : Session = Depends(get_db), current_user: db_models.db_user = Depends(get_current_user)):
    db_expense = db.query(db_models.db_expense).filter(db_models.db_expense.user_id == current_user.id, db_models.db_expense.id == expense_id).first()

    if db_expense:
        return db_expense
    raise HTTPException(
    status_code=404,
    detail="Expense not found"
)


# STATS
@app.get('/expenses/stats/total')
def get_total(db : Session = Depends(get_db), current_user: db_models.db_user = Depends(get_current_user)):
    total_spending = db.query(func.sum(db_models.db_expense.price)).filter(db_models.db_expense.user_id == current_user.id).scalar()
    return {"Total Spending" : total_spending}

@app.get('/expenses/stats/category')
def category_total(category : str | None = None,
                    db : Session = Depends(get_db),
                    current_user: db_models.db_user = Depends(get_current_user)):
    query = db.query(db_models.db_expense.category, func.sum(db_models.db_expense.price)).filter(db_models.db_expense.user_id == current_user.id)
    
    if category:
        query = query.filter(db_models.db_expense.category == category)

    category_spending = query.group_by(db_models.db_expense.category).all()

    return [
        {
            "Category": Category,
            "Total": Total
        }
        for Category, Total in category_spending
    ]

@app.get('/expenses/stats/date')
def date_total(start_date : date | None = None,
                    end_date : date | None = None,
                    db : Session = Depends(get_db),
                    current_user: db_models.db_user = Depends(get_current_user)):
    query = db.query(func.sum(db_models.db_expense.price)).filter(db_models.db_expense.user_id == current_user.id)
    
    if start_date:
        query = query.filter(db_models.db_expense.purchase_date >= start_date)

    if end_date:
        query = query.filter(db_models.db_expense.purchase_date <= end_date)

    total = query.scalar()

    return {"Total Spending": total}

@app.get('/expenses/stats/count')
def expenses_count(db : Session = Depends(get_db), current_user: db_models.db_user = Depends(get_current_user)):
    count = db.query(db_models.db_expense).filter(db_models.db_expense.user_id == current_user.id).count()

    return {"Count": count}


#CREATE
@app.post('/expenses')
def add_expense(expense : create_expense, db : Session = Depends(get_db), current_user: db_models.db_user = Depends(get_current_user)):

    new_expense = db_models.db_expense(**expense.model_dump(), user_id=current_user.id)
    db.add(new_expense)
    db.commit()
    db.refresh(new_expense)

    return new_expense


#UPDATE
@app.put('/expenses/{expense_id}')
def upd_expense(expense_id : int, expense : update_expense,
                db : Session = Depends(get_db),
                current_user: db_models.db_user = Depends(get_current_user)):
    db_expense = db.query(db_models.db_expense).filter(db_models.db_expense.user_id == current_user.id, db_models.db_expense.id == expense_id).first()

    if db_expense:
        if expense.amount is not None:
            db_expense.amount = expense.amount

        if expense.price is not None:
            db_expense.price = expense.price

        if expense.category is not None:
            db_expense.category = expense.category

        if expense.description is not None:
            db_expense.description = expense.description

        if expense.purchase_date is not None:
            db_expense.purchase_date = expense.purchase_date

        db.commit()
    else:
        raise HTTPException(
        status_code=404,
        detail="Expense not found"
)


#DELETE
@app.delete('/expenses/{expense_id}')
def del_expense(expense_id: int,
                db : Session = Depends(get_db),
                current_user: db_models.db_user = Depends(get_current_user)):
    db_expense = db.query(db_models.db_expense).filter(db_models.db_expense.user_id == current_user.id, db_models.db_expense.id == expense_id).first()
    
    if db_expense:
        db.delete(db_expense)
        db.commit()
        return {"Message": "Expense deleted successfully"}
    else:
        raise HTTPException(
        status_code=404,
        detail="Expense not found"
)
