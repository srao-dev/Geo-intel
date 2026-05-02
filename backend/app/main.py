from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

load_dotenv()

app = FastAPI(
    title="GEO Intel API",
    description="GEO Intelligence API for enterprise automation companies",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL", "http://localhost:5173")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok", "version": "0.1.0"}


@app.websocket("/ws/audit")
async def audit_websocket(websocket: WebSocket):
    """
    Main audit endpoint. Receives a URL, streams progress and results.
    
    Message flow:
      client → { "url": "appian.com" }
      server → { "status": "fetching", "message": "Fetching appian.com..." }
      server → { "status": "agents_launched", "message": "Launching 5 agents..." }
      server → { "status": "agent_complete", "agent": "geo-crawl", "score": 72 }
      server → { "status": "agent_complete", "agent": "geo-content", "score": 45 }
      ... (x5)
      server → { "status": "complete", "report": { ...full GEO report... } }
    """
    await websocket.accept()
    try:
        data = await websocket.receive_json()
        url = data.get("url", "").strip()

        if not url:
            await websocket.send_json({"status": "error", "message": "No URL provided"})
            return

        # Normalise URL
        if not url.startswith("http"):
            url = f"https://{url}"

        await websocket.send_json({
            "status": "received",
            "message": f"Starting GEO audit for {url}"
        })

        # TODO: wire up orchestrator (Day 3)
        # from app.agents.orchestrator import run_audit
        # async for update in run_audit(url):
        #     await websocket.send_json(update)

        # Placeholder response until orchestrator is built
        await websocket.send_json({
            "status": "error",
            "message": "Orchestrator not yet implemented — coming in next build"
        })

    except WebSocketDisconnect:
        pass


@app.post("/fix")
async def generate_fix(body: dict):
    """
    Standalone fix generator. Takes a finding and URL, returns specific fixes.
    
    Request: { "url": "appian.com", "finding_id": "content_001", "finding_description": "..." }
    Response: { "fixes": [...] }
    """
    # TODO: wire up geo-fix agent (Day 4)
    return {"status": "not_implemented", "message": "Fix generator coming in next build"}
