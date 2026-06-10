"""Direct messaging between users."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.schemas import Message, MessageRequest
from app.store import MessageRecord, get_store

router = APIRouter(tags=["messages"])


def _msg_out(record: MessageRecord) -> Message:
    return Message(
        id=record.id,
        from_user=record.from_user,
        to_user=record.to_user,
        body=record.body,
        created_at=record.created_at,
    )


@router.post("/messages", response_model=Message, status_code=201)
def send_message(request: MessageRequest) -> Message:
    if request.from_user == request.to_user:
        raise HTTPException(422, "Cannot message yourself")
    record = get_store().add_message(request.from_user, request.to_user, request.body)
    return _msg_out(record)


@router.get("/messages/{user_a}/{user_b}", response_model=list[Message])
def get_thread(user_a: str, user_b: str) -> list[Message]:
    return [_msg_out(m) for m in get_store().get_thread(user_a, user_b)]


@router.get("/conversations/{username}", response_model=list[str])
def list_conversations(username: str) -> list[str]:
    """List the other party in each distinct conversation for *username*."""
    return get_store().list_conversations(username)
