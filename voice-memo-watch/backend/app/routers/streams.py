"""Livestream concert rooms with WebSocket broadcast."""
from __future__ import annotations

import asyncio
from typing import ClassVar

from fastapi import APIRouter, HTTPException, Response, WebSocket, WebSocketDisconnect

from app.schemas import Stream, StreamRequest
from app.store import StreamRecord, get_store

router = APIRouter(tags=["streams"])


class RoomManager:
    """In-process WebSocket room broker — one set of sockets per stream."""

    _rooms: ClassVar[dict[str, set[WebSocket]]] = {}
    _lock: ClassVar[asyncio.Lock | None] = None

    @classmethod
    def _get_lock(cls) -> asyncio.Lock:
        if cls._lock is None:
            cls._lock = asyncio.Lock()
        return cls._lock

    @classmethod
    async def connect(cls, stream_id: str, ws: WebSocket) -> None:
        await ws.accept()
        async with cls._get_lock():
            cls._rooms.setdefault(stream_id, set()).add(ws)

    @classmethod
    async def disconnect(cls, stream_id: str, ws: WebSocket) -> None:
        async with cls._get_lock():
            room = cls._rooms.get(stream_id, set())
            room.discard(ws)
            if not room:
                cls._rooms.pop(stream_id, None)

    @classmethod
    async def broadcast(cls, stream_id: str, data: bytes, sender: WebSocket) -> None:
        async with cls._get_lock():
            peers = list(cls._rooms.get(stream_id, set()))
        for peer in peers:
            if peer is not sender:
                try:
                    await peer.send_bytes(data)
                except Exception:
                    pass

    @classmethod
    def listener_count(cls, stream_id: str) -> int:
        return len(cls._rooms.get(stream_id, set()))

    @classmethod
    def reset_for_tests(cls) -> None:
        cls._rooms.clear()
        cls._lock = None


def _stream_out(record: StreamRecord) -> Stream:
    return Stream(
        id=record.id,
        host=record.host,
        title=record.title,
        status=record.status,
        listener_count=RoomManager.listener_count(record.id),
        created_at=record.created_at,
    )


@router.post("/streams", response_model=Stream, status_code=201)
def create_stream(request: StreamRequest) -> Stream:
    record = get_store().create_stream(request.host.strip(), request.title.strip())
    return _stream_out(record)


@router.get("/streams", response_model=list[Stream])
def list_streams(status: str | None = None) -> list[Stream]:
    return [_stream_out(s) for s in get_store().list_streams(status)]


@router.get("/streams/{stream_id}", response_model=Stream)
def get_stream(stream_id: str) -> Stream:
    record = get_store().get_stream(stream_id)
    if record is None:
        raise HTTPException(404, "Stream not found")
    return _stream_out(record)


@router.delete("/streams/{stream_id}", status_code=204)
def end_stream(stream_id: str) -> Response:
    if not get_store().end_stream(stream_id):
        raise HTTPException(404, "Stream not found")
    return Response(status_code=204)


@router.websocket("/streams/{stream_id}/ws")
async def stream_ws(stream_id: str, websocket: WebSocket) -> None:
    """WebSocket endpoint for concert livestreams.

    The host sends raw audio bytes (PCM/WAV chunks); all other connected
    clients receive those bytes in real time. The server is a pure relay —
    no audio processing happens here.
    """
    record = get_store().get_stream(stream_id)
    if record is None or record.status != "live":
        await websocket.close(code=4004)
        return
    await RoomManager.connect(stream_id, websocket)
    try:
        while True:
            data = await websocket.receive_bytes()
            await RoomManager.broadcast(stream_id, data, websocket)
    except WebSocketDisconnect:
        pass
    finally:
        await RoomManager.disconnect(stream_id, websocket)
