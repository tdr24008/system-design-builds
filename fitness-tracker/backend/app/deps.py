from fastapi import Header, HTTPException

# Demo auth — real auth would validate a JWT here.
# X-User-Id is a UUID string supplied by the frontend.
async def get_user_id(x_user_id: str = Header(...)) -> str:
    if not x_user_id:
        raise HTTPException(status_code=401, detail="X-User-Id header required")
    return x_user_id
