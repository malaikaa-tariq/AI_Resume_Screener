import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from google import genai

load_dotenv()

client = genai.Client()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class ResumeData(BaseModel):
    resume_text: str
    job_description: str

@app.get("/")
def read_root():
    return {"message": "Backend is running with the NEW Gemini SDK!"}

@app.post("/analyze")
def analyze_resume(data: ResumeData):
    try:
        prompt = f"""
        You are an expert ATS (Applicant Tracking System) and HR manager. 
        Analyze the following resume text against the provided job description.
        
        Provide:
        1. Match Percentage (0% to 100%)
        2. Key Missing Skills
        3. A short feedback summary on strengths and weaknesses.

        Resume Text:
        {data.resume_text}

        Job Description:
        {data.job_description}
        """

        response = client.models.generate_content(
            model='gemini-3.5-flash',
            contents=prompt,
        )
        
        return {"analysis": response.text}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gemini API Error: {str(e)}")
