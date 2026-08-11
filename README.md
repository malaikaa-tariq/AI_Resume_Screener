AI Resume Screener & Study Companion

A full-stack AI application built with Next.js and FastAPI. It can analyze resumes against job descriptions and turn uploaded study material into structured study plans.

Main Features

Resume Screener

Upload a resume and job description.

Get a match score, missing keywords, and improvement suggestions.

Build and export a resume.

Save profiles, drafts, and analysis history locally in the browser.

Study Companion

Upload study documents or enter text.

Split content into chunks and generate Gemini embeddings.

Store and retrieve relevant content with Qdrant.

Generate a structured JSON study plan.

Tech Stack

Frontend: Next.js, React, TypeScript, Tailwind CSS

Backend: FastAPI, Python, Pydantic

AI: Google Gemini API

Vector database: Qdrant

Testing: Pytest, HTTPX, ESLint

Quick Setup

1. Clone the project

git clone https://github.com/malaikaa-tariq/AI_Resume_Screener.git
Set-Location AI_Resume_Screener

2. Set up the backend

python -m venv .venv
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env

Open .env and replace the placeholder with your real Gemini API key:

GEMINI_API_KEY=replace_with_your_api_key
GEMINI_MODEL=gemini-3.5-flash
STUDY_PLAN_MODEL=gemini-2.5-flash
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=
QDRANT_COLLECTION_NAME=study_chunks
FRONTEND_URL=http://localhost:3000
FRONTEND_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

Do not commit the .env file or a real API key.

3. Start Qdrant

First, open Docker Desktop. Then run:

docker compose -f docker-compose.qdrant.yml up -d

Check that Qdrant is running:

docker ps

Qdrant dashboard: http://localhost:6333/dashboard

4. Start the backend

python -m uvicorn main:app --reload --port 8000

Backend: http://127.0.0.1:8000

API documentation: http://127.0.0.1:8000/docs

5. Start the frontend

Open another PowerShell terminal:

Set-Location frontend
npm.cmd install
npm.cmd run dev

Application: http://localhost:3000

Study Companion: http://localhost:3000/study-companion

Keep Docker Desktop, the backend terminal, and the frontend terminal running while using the Study Companion.

Study Companion Flow

Upload study material.

The backend creates text chunks.

Gemini creates 768-dimensional embeddings.

Qdrant stores the vectors and metadata.

Relevant chunks are retrieved for the requested topic.

Gemini generates a study plan using the retrieved content.

Qdrant configuration

Collection: study_chunks

Vector size: 768

Distance: Cosine

Embedding model: gemini-embedding-001

Important API Endpoints

Method

Endpoint

Purpose

POST

/analyze

Analyze a resume against a job description

POST

/api/v1/study/documents/upload

Upload a study document

POST

/api/v1/study/process

Chunk, embed, and store study content

POST

/api/v1/study/retrieve

Retrieve relevant study chunks

POST

/api/v1/study/plan

Generate a study plan

Tests

Run the Week 3 backend tests from the project root:

python -m pytest tests/test_study_upload.py tests/test_study_pipeline.py tests/test_study_plan.py -v

Expected result: 10 passed.

Check the Python files:

python -m py_compile study_plan_service.py study_pipeline.py qdrant_service.py embedding_service.py

Check the frontend:

Set-Location frontend
npm.cmd run build

Git Workflow

Create feature branches from dev.

Open pull requests into dev.

Ask another team member to review the PR.

Merge dev into main only after review.

Security Note

The current login, profile, history, and draft storage use browser-local data for demonstration. A production version should use secure server-side authentication and database storage.