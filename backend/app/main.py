from fastapi import FastAPI

from app.routers.homes import router as homes_router
from app.routers.projects import router as projects_router


app = FastAPI(title="ДомПлан API")

app.include_router(homes_router)
app.include_router(projects_router)


@app.get("/")
def root():
    return {"message": "ДомПлан API работает"}