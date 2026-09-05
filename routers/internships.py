import os
import json
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/internships", tags=["Internships"])

# Points directly to data/internships.json relative to your project root
DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "internships.json")

@router.get("/")
def get_all_internships(limit: int = 8):
    """
    Returns the first 'limit' internships directly from data/internships.json
    """
    if not os.path.exists(DATA_PATH):
        raise HTTPException(status_code=404, detail="data/internships.json not found")
    
    try:
        with open(DATA_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
            
        # Return the top entries from your dataset
        return data[:limit]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading internships file: {str(e)}")