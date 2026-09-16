from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import Farm, Field, User
from app.schemas.schemas import FarmCreate, FarmOut
from app.api.auth import get_current_user

router = APIRouter(prefix="/farms", tags=["Farms"])

@router.get("", response_model=List[FarmOut])
def get_user_farms(db: Session = Depends(get_db)):
    farms = db.query(Farm).all()
    return farms

@router.post("", response_model=FarmOut)
def create_farm(farm_in: FarmCreate, db: Session = Depends(get_db)):
    user = db.query(User).first()
    user_id = user.id if user else "demo-user-id"
    
    farm = Farm(
        user_id=user_id,
        name=farm_in.name,
        location=farm_in.location,
        state=farm_in.state,
        district=farm_in.district,
        total_area_acres=farm_in.total_area_acres,
        main_crop=farm_in.main_crop
    )
    db.add(farm)
    db.commit()
    db.refresh(farm)
    return farm

@router.get("/{farm_id}", response_model=FarmOut)
def get_farm_by_id(farm_id: str, db: Session = Depends(get_db)):
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        # Fallback for demo
        farm = db.query(Farm).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found.")
    return farm
