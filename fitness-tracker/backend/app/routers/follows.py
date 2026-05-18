from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..deps import get_user_id
from ..models import Follow, User
from ..schemas import FollowIn

router = APIRouter(tags=["follows"])


@router.post("/follows", status_code=201)
async def follow_user(
    body: FollowIn,
    user_id: str = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
):
    if body.followee_id == user_id:
        raise HTTPException(400, "Cannot follow yourself")
    followee = await db.get(User, body.followee_id)
    if not followee:
        raise HTTPException(404, "User not found")
    existing = await db.execute(
        select(Follow).where(
            Follow.follower_id == user_id,
            Follow.followee_id == body.followee_id,
        )
    )
    if existing.scalar_one_or_none():
        return {"status": "already_following"}
    db.add(Follow(follower_id=user_id, followee_id=body.followee_id))
    await db.commit()
    return {"status": "following"}


@router.delete("/follows/{followee_id}", status_code=200)
async def unfollow_user(
    followee_id: str,
    user_id: str = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
):
    row = await db.execute(
        select(Follow).where(
            Follow.follower_id == user_id,
            Follow.followee_id == followee_id,
        )
    )
    follow = row.scalar_one_or_none()
    if not follow:
        raise HTTPException(404, "Not following")
    await db.delete(follow)
    await db.commit()
    return {"status": "unfollowed"}
