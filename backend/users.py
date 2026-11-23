
from fastapi import APIRouter, Depends, HTTPException
from schemas import CreateUserRequest, UpdateUserRequest
from security import get_current_admin
from supabase_client import supabase

router = APIRouter(
    prefix="/users",
    tags=["Gestion des utilisateurs"]
)

@router.post("/")
def create_user(
    request: CreateUserRequest,
    admin=Depends(get_current_admin)
):
    # Vérifier les catégories demandées
    if request.role == "service" and not request.categories:
        raise HTTPException(
            status_code=400,
            detail="Un utilisateur Service doit avoir au moins une catégorie."
        )

    if request.role != "service" and request.categories:
        raise HTTPException(
            status_code=400,
            detail="Seuls les utilisateurs Service peuvent avoir des catégories."
        )

    # Récupérer les catégories existantes
    categories_response = (
        supabase.table("categories")
        .select("id, name")
        .execute()
    )

    categories_by_name = {
        category["name"]: category["id"]
        for category in categories_response.data
    }

    # Vérifier que toutes les catégories existent
    category_ids = []

    for category_name in request.categories:
        if category_name not in categories_by_name:
            raise HTTPException(
                status_code=400,
                detail=f"Catégorie inconnue : {category_name}"
            )
        category_ids.append(categories_by_name[category_name])

    # Créer le compte dans Supabase Auth
    try:
        auth_response = supabase.auth.admin.create_user({
            "email": request.email,
            "password": request.password,
            "email_confirm": True
        })

        new_user = auth_response.user

        if not new_user:
            raise Exception("La création du compte n'a pas retourné d'utilisateur.")

        # Créer le profil
        supabase.table("profiles").insert({
            "id": new_user.id,
            "full_name": request.full_name,
            "role": request.role,
            "is_active": True
        }).execute()

        # Affecter les catégories
        if category_ids:
            supabase.table("profile_categories").insert([
                {
                    "profile_id": new_user.id,
                    "category_id": category_id
                }
                for category_id in category_ids
            ]).execute()

        return {
            "message": "Utilisateur créé avec succès.",
            "user_id": new_user.id
        }
    except Exception as e:
        print("ERREUR CRÉATION UTILISATEUR :", str(e))

        if "new_user" in locals() and new_user:
            try:
                supabase.auth.admin.delete_user(new_user.id)
            except Exception:
                pass

        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

@router.get("/")
def get_users(admin=Depends(get_current_admin)):
    try:
        # Récupérer les utilisateurs depuis Supabase Auth
        auth_users = supabase.auth.admin.list_users()

        # Récupérer les profils
        profiles_response = (
            supabase.table("profiles")
            .select("id, full_name, role, is_active")
            .execute()
        )

        # Récupérer les catégories attribuées
        assignments_response = (
            supabase.table("profile_categories")
            .select("profile_id, category_id")
            .execute()
        )

        # Récupérer les noms des catégories
        categories_response = (
            supabase.table("categories")
            .select("id, name")
            .execute()
        )

        categories_by_id = {
            category["id"]: category["name"]
            for category in categories_response.data
        }

        emails_by_id = {
            user.id: user.email
            for user in auth_users
        }

        users = []

        for profile in profiles_response.data:
            user_categories = [
                categories_by_id[assignment["category_id"]]
                for assignment in assignments_response.data
                if assignment["profile_id"] == profile["id"]
                and assignment["category_id"] in categories_by_id
            ]

            users.append({
                "id": profile["id"],
                "full_name": profile["full_name"],
                "email": emails_by_id.get(profile["id"], ""),
                "role": profile["role"],
                "is_active": profile["is_active"],
                "categories": user_categories
            })

        return users

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de la récupération des utilisateurs : {str(e)}"
        )


        
@router.put("/{user_id}")
def update_user(
    user_id: str,
    request: UpdateUserRequest,
    admin=Depends(get_current_admin)
):
    # Vérifier les catégories selon le rôle
    if request.role == "service" and not request.categories:
        raise HTTPException(
            status_code=400,
            detail="Un utilisateur Service doit avoir au moins une catégorie."
        )

    if request.role != "service" and request.categories:
        raise HTTPException(
            status_code=400,
            detail="Seuls les utilisateurs Service peuvent avoir des catégories."
        )

    try:
        # Récupérer les catégories existantes
        categories_response = (
            supabase.table("categories")
            .select("id, name")
            .execute()
        )

        categories_by_name = {
            category["name"]: category["id"]
            for category in categories_response.data
        }

        # Vérifier les catégories demandées
        category_ids = []

        for category_name in request.categories:
            if category_name not in categories_by_name:
                raise HTTPException(
                    status_code=400,
                    detail=f"Catégorie inconnue : {category_name}"
                )

            category_ids.append(categories_by_name[category_name])

        # Modifier l'adresse e-mail dans Supabase Auth
        supabase.auth.admin.update_user_by_id(
            user_id,
            {"email": request.email}
        )

        # Modifier le profil
        supabase.table("profiles").update({
            "full_name": request.full_name,
            "role": request.role,
            "is_active": request.is_active
        }).eq("id", user_id).execute()

        # Supprimer les anciennes catégories
        supabase.table("profile_categories").delete().eq(
            "profile_id", user_id
        ).execute()

        # Ajouter les nouvelles catégories
        if category_ids:
            supabase.table("profile_categories").insert([
                {
                    "profile_id": user_id,
                    "category_id": category_id
                }
                for category_id in category_ids
            ]).execute()

        return {
            "message": "Utilisateur modifié avec succès."
        }

    except HTTPException:
        raise

    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Impossible de modifier l'utilisateur. Vérifiez les informations et réessayez."
        )