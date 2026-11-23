
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase_client import supabase

bearer_scheme = HTTPBearer()


def get_current_admin(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)
):
    token = credentials.credentials

    # Vérifier le token auprès de Supabase Auth
    try:
        response = supabase.auth.get_user(token)
        user = response.user
    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Session invalide ou expirée."
        )

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Utilisateur non authentifié."
        )

    # Vérifier le profil et le rôle dans la base de données
    try:
        profile_response = (
            supabase.table("profiles")
            .select("role, is_active")
            .eq("id", user.id)
            .single()
            .execute()
        )
        profile = profile_response.data
    except Exception:
        raise HTTPException(
            status_code=403,
            detail="Profil introuvable ou accès refusé."
        )

    if not profile or not profile.get("is_active"):
        raise HTTPException(
            status_code=403,
            detail="Compte désactivé."
        )

    if profile.get("role") != "admin":
        raise HTTPException(
            status_code=403,
            detail="Accès réservé à l'administrateur."
        )

    return user
