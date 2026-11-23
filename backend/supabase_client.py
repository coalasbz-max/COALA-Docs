import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Charger les variables du fichier .env
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SECRET_KEY = os.getenv("SUPABASE_SECRET_KEY")

# Vérifier la configuration
if not SUPABASE_URL or not SUPABASE_SECRET_KEY:
    raise RuntimeError("Configuration Supabase manquante dans le fichier .env")

# Créer la connexion Supabase
supabase: Client = create_client(
    SUPABASE_URL,
    SUPABASE_SECRET_KEY
)