
import { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabase";
import { api } from "./api";
import "./App.css";



const initialDocuments = [];

function App() {
  if (!supabase) {
    return (
      <main style={{ maxWidth: "40rem", margin: "4rem auto", padding: "0 1.5rem", fontFamily: "sans-serif" }}>
        <h1>Configuration requise</h1>
        <p>Les variables Supabase du déploiement ne sont pas configurées.</p>
      </main>
    );
  }

  const [categories, setCategories] = useState([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [page, setPage] = useState("dashboard");
  const [documents, setDocuments] = useState([]);
const [recentViews, setRecentViews] = useState([]);
const [isLoadingRecentViews, setIsLoadingRecentViews] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("Tous");
  const [categoryFilter, setCategoryFilter] = useState("Tous");
  const [showForm, setShowForm] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [loginError, setLoginError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
const [isPreviewExpanded, setIsPreviewExpanded] = useState(false);
const [users, setUsers] = useState([]);
const [isLoadingUsers, setIsLoadingUsers] = useState(false);
const [usersError, setUsersError] = useState("");
const [showUserForm, setShowUserForm] = useState(false);
const [selectedUser, setSelectedUser] = useState(null);
const [newUserName, setNewUserName] = useState("");
const [newUserEmail, setNewUserEmail] = useState("");
const [newUserPassword, setNewUserPassword] = useState("");
const [showNewUserPassword, setShowNewUserPassword] = useState(false);
const [newUserRole, setNewUserRole] = useState("service");
const [selectedCategories, setSelectedCategories] = useState([]);
const [isCreatingUser, setIsCreatingUser] = useState(false);
const [userFormError, setUserFormError] = useState("");
const [isEditingUser, setIsEditingUser] = useState(false);
const [editUserName, setEditUserName] = useState("");
const [editUserEmail, setEditUserEmail] = useState("");
const [editUserRole, setEditUserRole] = useState("service");
const [editUserActive, setEditUserActive] = useState(true);
const [editUserCategories, setEditUserCategories] = useState([]);
const [isUpdatingUser, setIsUpdatingUser] = useState(false);
const [editUserError, setEditUserError] = useState("");
const [successMessage, setSuccessMessage] = useState(false);
const [deleteMessage, setDeleteMessage] = useState(false);

useEffect(() => {
  if (!successMessage) return;

  const timer = setTimeout(() => {
    setSuccessMessage(false);
  }, 2000);

  return () => clearTimeout(timer);
}, [successMessage]);

useEffect(() => {
  if (!deleteMessage) return;

  const timer = setTimeout(() => {
    setDeleteMessage(false);
  }, 2000);

  return () => clearTimeout(timer);
}, [deleteMessage]);
  
const [recentlyViewed, setRecentlyViewed] = useState(() => {
  try {
    return JSON.parse(
      localStorage.getItem("coala_recently_viewed") || "[]"
    );
  } catch {
    return [];
  }
});


 const [form, setForm] = useState({
    type: "IT",
    category: "Informatique",
    categoryId: "fe43edeb-f351-4eef-82fc-456ec5ca4713",
    date: new Date().toISOString().slice(0, 10),

    fileName: "",
    fileData: "",
    file: null,
    fileType: "",
});

const [previewDoc, setPreviewDoc] = useState(null);
const [editingDocument, setEditingDocument] = useState(null);
const [documentToDelete, setDocumentToDelete] = useState(null);
const [editDocumentForm, setEditDocumentForm] = useState({
  reference: "",
  title: "",
  type: "",
  categoryId: "",
  date: "",
});

  
useEffect(() => {
  const loadDocuments = async () => {
    if (!isLoggedIn) {
  setDocuments([]);
  return;
}

if (isLoadingCategories) return;

if (categories.length === 0) {
  setDocuments([]);
  return;
}

    const { data, error } = await supabase
      .from("documents")
      .select(
        "id, reference, title, document_type, category_id, document_date, file_path, description, created_at"
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erreur chargement documents :", error);
      return;
    }

    const formattedDocuments = (data || []).map((doc) => ({
      id: doc.id,
      reference: doc.reference,
      title: doc.title,
      type: doc.document_type,
      category:
        categories.find((category) => category.id === doc.category_id)?.name || "",
      categoryId: doc.category_id,
      date: doc.document_date,
      fileName: doc.title,
      fileData: "",
      fileType: "",
      file_path: doc.file_path,
      createdAt: doc.created_at,
    }));

    setDocuments(formattedDocuments);
  };

  loadDocuments();
}, [isLoggedIn, categories, isLoadingCategories]);

const loadRecentViews = async () => {
  setIsLoadingRecentViews(true);

  let query = supabase
    .from("document_views")
    .select(`
      id,
      user_id,
      viewed_at,
      documents (
        id,
        title,
        category_id,
        categories (
          name
        )
      ),
      profiles (
        full_name
      )
    `);

  // Pour les comptes Service : uniquement leurs consultations
  if (currentUser.role === "service") {
    query = query.eq("user_id", currentUser.id);
  }

  const { data, error } = await query
    .order("viewed_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("Erreur chargement historique :", error);
    setRecentViews([]);
  } else {
    setRecentViews(data || []);
  }

  setIsLoadingRecentViews(false);
};

useEffect(() => {
  if (isLoggedIn && page === "recent") {
    loadRecentViews();
  }
}, [isLoggedIn, page]);
useEffect(() => {
  let cancelled = false;

  const loadCategories = async () => {
  setIsLoadingCategories(true);
  setCategories([]);

  if (!currentUser) {
    setIsLoadingCategories(false);
    return;
  }

  try {
    let loadedCategories = [];

    // Administrateur et Direction
    if (
      currentUser.role === "admin" ||
      currentUser.role === "direction"
    ) {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name")
        .order("name");

      if (error) throw error;

      loadedCategories = data || [];
    } 
    // Utilisateur Service
    else {
      const { data, error } = await supabase
        .from("profile_categories")
        .select("category_id, categories(id, name)")
        .eq("profile_id", currentUser.id);

      if (error) throw error;

      loadedCategories = (data || [])
        .map((item) => item.categories)
        .filter(Boolean);
    }

    if (!cancelled) {
      setCategories(loadedCategories);
    }

  } catch (error) {
    console.error("Erreur chargement catégories :", error);

  } finally {
    if (!cancelled) {
      setIsLoadingCategories(false);
    }
  }
};

  loadCategories();

  return () => {
    cancelled = true;
  };
}, [currentUser]);
useEffect(() => {
  const checkSession = async () => {
    const { data, error } = await supabase.auth.getSession();

    if (error || !data.session) {
      setEmail("");
setPassword("");
      setIsLoggedIn(false);
      setIsCheckingSession(false);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, role, is_active")
      .eq("id", data.session.user.id)
      .single();

    if (profileError || !profile || !profile.is_active) {
  await supabase.auth.signOut();
  setCurrentUser(null);
  setIsLoggedIn(false);
} else {
  setCurrentUser(profile);
  setIsLoggedIn(true);
}

    setIsCheckingSession(false);
  };

  checkSession();
}, []);

useEffect(() => {
  const loadUsers = async () => {
    if (page !== "users" || !isLoggedIn) return;

    setIsLoadingUsers(true);
    setUsersError("");

    try {
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError || !sessionData.session) {
        throw new Error("Votre session a expiré. Veuillez vous reconnecter.");
      }

      const usersData = await api.getUsers(sessionData.session.access_token);
      setUsers(usersData || []);
    } catch (error) {
      setUsersError(error.message || "Impossible de charger les utilisateurs.");
      setUsers([]);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  loadUsers();
}, [page, isLoggedIn]);

useEffect(() => {
  localStorage.setItem(
    "coala_recently_viewed",
    JSON.stringify(recentlyViewed)
  );
}, [recentlyViewed]);


  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const text = `${doc.reference} ${doc.title} ${doc.category}`.toLowerCase();
      const matchesSearch = text.includes(search.toLowerCase());
      const matchesType = typeFilter === "Tous" || doc.type === typeFilter;
      const matchesCategory =
        categoryFilter === "Tous" || doc.category === categoryFilter;

      return matchesSearch && matchesType && matchesCategory;
    });
  }, [documents, search, typeFilter, categoryFilter]);

 
const handleLogin = async (event) => {
  event.preventDefault();
  setLoginError("");
  

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

 if (error) {
    console.error("Erreur de connexion Supabase :", error);
    setLoginError(error.message);

    return;
}

  if (!data.user) {
    setLoginError("Impossible de vérifier votre compte.");
    return;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, role, is_active")
    .eq("id", data.user.id)
    .single();

  if (profileError || !profile || !profile.is_active) {
    await supabase.auth.signOut();
    setLoginError("Compte inactif ou profil introuvable. Contactez l'administrateur.");
    return;
  }
setCurrentUser(profile);
  setIsLoggedIn(true);
};

const handleCreateUser = async () => {
  setUserFormError("");

  if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword) {
    setUserFormError("Veuillez remplir tous les champs obligatoires.");
    return;
  }

  if (newUserPassword.length < 8) {
    setUserFormError("Le mot de passe doit contenir au moins 8 caractères.");
    return;
  }

  if (newUserRole === "service" && selectedCategories.length === 0) {
    setUserFormError("Veuillez sélectionner au moins un service.");
    return;
  }

  setIsCreatingUser(true);

  try {
    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();

    if (sessionError || !sessionData.session) {
      throw new Error("Votre session a expiré. Veuillez vous reconnecter.");
    }

    await api.createUser(
      {
        full_name: newUserName.trim(),
        email: newUserEmail.trim(),
        password: newUserPassword,
        role: newUserRole,
        categories: newUserRole === "service" ? selectedCategories : [],
      },
      sessionData.session.access_token
    );

    const usersData = await api.getUsers(sessionData.session.access_token);
setUsers(usersData || []);
    setShowUserForm(false);
    setNewUserName("");
    setNewUserEmail("");
    setNewUserPassword("");
    setNewUserRole("service");
    setSelectedCategories([]);

  } catch (error) {
    setUserFormError(error.message || "Erreur lors de la création du compte.");
  } finally {
    setIsCreatingUser(false);
  }
};
const handleUpdateUser = async () => {
  setEditUserError("");

  if (!editUserName.trim() || !editUserEmail.trim()) {
    setEditUserError("Veuillez remplir le nom et l'adresse e-mail.");
    return;
  }

  if (editUserRole === "service" && editUserCategories.length === 0) {
    setEditUserError("Veuillez sélectionner au moins un service.");
    return;
  }

  setIsUpdatingUser(true);

  try {
    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();

    if (sessionError || !sessionData.session) {
      throw new Error("Votre session a expiré. Veuillez vous reconnecter.");
    }

    await api.updateUser(
      selectedUser.id,
      {
        full_name: editUserName.trim(),
        email: editUserEmail.trim(),
        role: editUserRole,
        is_active: editUserActive,
        categories: editUserRole === "service" ? editUserCategories : [],
      },
      sessionData.session.access_token
    );

    const usersData = await api.getUsers(sessionData.session.access_token);
    setUsers(usersData || []);

    const updatedUser = usersData.find((user) => user.id === selectedUser.id);
    if (updatedUser) {
      setSelectedUser(updatedUser);
    }

    setIsEditingUser(false);

  } catch (error) {
    setEditUserError(error.message || "Erreur lors de la modification du compte.");
  } finally {
    setIsUpdatingUser(false);
  }
};
 

const addDocument = async (event) => {
  event.preventDefault();

  if (!form.file) {
    alert("Veuillez sélectionner un fichier.");
    return;
  }

  if (currentUser?.role !== "admin") {
    alert("Seul l'administrateur peut ajouter un document.");
    return;
  }

  if (!form.categoryId) {
    alert("Veuillez sélectionner un service.");
    return;
  }

  // 1. Récupérer les références existantes depuis Supabase
  const { data: existingDocuments, error: referencesError } =
    await supabase
      .from("documents")
      .select("reference")
      .like("reference", `${form.type}-%`);

  if (referencesError) {
  alert(
    "Impossible de récupérer les références : " +
    referencesError.message
  );
  return;
}


  // 2. Calculer le prochain numéro disponible
  const existingNumbers = (existingDocuments || []).map((doc) => {
    const match = (doc.reference || "").match(/\d+$/);
    return match ? Number(match[0]) : 0;
  });

  const nextNumber = Math.max(0, ...existingNumbers) + 1;

const reference =
  `${form.type}-${String(nextNumber).padStart(3, "0")}`;



// 3. Préparer le nom et le chemin du fichier
const safeFileName = form.file.name.replace(
  /[^a-zA-Z0-9._-]/g,
  "_"
);

  const filePath =
    `${form.categoryId}/${reference}_${safeFileName}`;

  // 4. Télécharger le fichier dans Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from("coala-documents")
    .upload(filePath, form.file, {
      contentType: form.fileType || undefined,
      upsert: false,
    });

  if (uploadError) {
    alert(
      "Erreur lors du téléchargement : " +
      uploadError.message
    );
    return;
  }

  // 5. Enregistrer les informations dans la table documents
  
  const { data: savedDocument, error: insertError } =
  
    await supabase
      .from("documents")
      .insert({
        reference: reference,
        title: form.fileName,
        document_type: form.type,
        category_id: form.categoryId,
        document_date: form.date,
        file_path: filePath,
      })
      .select()
      .single();

  // 6. Supprimer le fichier si l'enregistrement échoue
  if (insertError) {
    await supabase.storage
      .from("coala-documents")
      .remove([filePath]);

    alert(
  "Erreur lors de l'enregistrement : " +
  insertError.message +
  "\nRéférence générée : " +
  reference
  
);
return;
  }

  // 7. Ajouter le document à la bibliothèque
  const newDocument = {
    id: savedDocument.id,
    reference: savedDocument.reference,
    title: savedDocument.title,
    type: savedDocument.document_type,
    category: form.category,
    categoryId: savedDocument.category_id,
    date: savedDocument.document_date,
    fileName: savedDocument.title,
    fileData: "",
    fileType: form.fileType,
    file_path: savedDocument.file_path,
    createdAt: savedDocument.created_at,
  };

  setDocuments((previous) => [
    newDocument,
    ...previous,
  ]);

  // 8. Réinitialiser le formulaire
  setForm({
    type: "IT",
    category: "Informatique",
    categoryId: "fe43edeb-f351-4eef-82fc-456ec5ca4713",
    date: new Date().toISOString().slice(0, 10),
    fileName: "",
    fileData: "",
    file: null,
    fileType: "",
  });

  setShowForm(false);
setSuccessMessage(true);
};


const openEditDocument = (doc) => {
  setEditingDocument(doc);

  setEditDocumentForm({
    reference: doc.reference || "",
    title: doc.title || "",
    type: doc.type || "IT",
    categoryId: doc.categoryId || "",
    date: doc.date || "",
  });
};
const saveDocumentChanges = async (event) => {
  event.preventDefault();

  if (!editingDocument) return;

  const selectedCategory = categories.find(
    (category) => category.id === editDocumentForm.categoryId
  );

  if (!selectedCategory) {
    alert("Veuillez sélectionner un service.");
    return;
  }

  const { data, error } = await supabase
    .from("documents")
    .update({
      reference: editDocumentForm.reference,
      title: editDocumentForm.title,
      document_type: editDocumentForm.type,
      category_id: editDocumentForm.categoryId,
      document_date: editDocumentForm.date,
    })
    .eq("id", editingDocument.id)
    .select()
    .single();

  if (error) {
    alert("Erreur lors de la modification : " + error.message);
    return;
  }

  setDocuments((previous) =>
    previous.map((doc) =>
      doc.id === editingDocument.id
        ? {
            ...doc,
            reference: data.reference,
            title: data.title,
            fileName: data.title,
            type: data.document_type,
            category: selectedCategory.name,
            categoryId: data.category_id,
            date: data.document_date,
          }
        : doc
    )
  );

  setEditingDocument(null);
  alert("Document modifié avec succès.");
};
 // Ouvrir la fenêtre de confirmation
const deleteDocument = (id) => {
  if (currentUser?.role !== "admin") {
    alert("Seul l'administrateur peut supprimer un document.");
    return;
  }

  setDocumentToDelete(id);
};


// Confirmer et effectuer la suppression

const confirmDeleteDocument = async () => {
  if (!documentToDelete) return;

  const docToDelete = documents.find(
    (doc) => doc.id === documentToDelete
  );

  if (!docToDelete) return;

  // Supprimer le fichier de Storage
  const { error: storageError } = await supabase.storage
    .from("coala-documents")
    .remove([docToDelete.file_path]);

  if (storageError) {
    alert("Erreur lors de la suppression du fichier : " + storageError.message);
    return;
  }

  // Supprimer l'enregistrement de la base
  const { error: databaseError } = await supabase
    .from("documents")
    .delete()
    .eq("id", documentToDelete);

  if (databaseError) {
    alert("Le fichier a été supprimé, mais pas son enregistrement : " + databaseError.message);
    return;
  }

  // Actualiser la liste des documents
  setDocuments((previous) =>
    previous.filter((doc) => doc.id !== documentToDelete)
  );

  setDocumentToDelete(null);

  // Afficher le message de confirmation
 setDeleteMessage(true);
};


  const totalIT = documents.filter((doc) => doc.type === "IT").length;
  const totalNS = documents.filter((doc) => doc.type === "NS").length;

  const latestDocuments = [...documents].slice(0, 5);

  const menu = [
  { id: "dashboard", icon: "⌂", label: "Tableau de bord" },
  { id: "library", icon: "▤", label: "Bibliothèque documentaire" },
  { id: "recent", icon: "◷", label: "Récemment consultés" },
  ...(currentUser?.role === "admin"
    ? [{ id: "users", icon: "♙", label: "Utilisateurs et permissions" }]
    : []),
  { id: "settings", icon: "⚙", label: "Paramètres" },
];

  const currentPage = menu.find((item) => item.id === page)?.label || "COALA DOCS";
  
if (!isLoggedIn) {
  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
  <img
  src={`${import.meta.env.BASE_URL}logo-coala2.png`}
  alt="Logo COALA"
/>
</div>

        <h1>Bienvenue</h1>
        <p>Connectez-vous à votre espace documentaire.</p>

        <form onSubmit={handleLogin}>
          <label>Identifiant ou adresse e-mail</label>
          <input
  type="email"
  placeholder="Saisir votre adresse e-mail"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  required
/>

          <label>Mot de passe</label>
          <div className="password-field">
  <input
  type={showPassword ? "text" : "password"}
  placeholder="Saisir votre mot de passe"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  required
/>

 <button
  type="button"
  className="toggle-password"
  onClick={() => setShowPassword(!showPassword)}
  title={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
>
  {showPassword ? (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none"
      stroke="currentColor" strokeWidth="1.7"
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3l18 18" />
      <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
      <path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c5 0 8.5 4.5 9.5 7-.4 1.1-1.2 2.3-2.3 3.4" />
      <path d="M6.2 6.2C3.9 7.6 2.7 9.6 2.5 12c.5 1.3 2.1 3.8 5.2 5.3A10 10 0 0 0 12 19c1 0 2-.2 2.9-.5" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none"
      stroke="currentColor" strokeWidth="1.7"
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )}
</button>
</div>

          <button type="submit">Se connecter</button>
          {loginError && (
  <p className="login-error">{loginError}</p>
)}
        </form>

        <small>Accès réservé aux utilisateurs autorisés</small>
      </div>
    </div>
  );
}
  return (
    
    <div className="app-layout">
     {/* Notification après ajout */}
{successMessage && (
  <div className="success-toast" role="status">
    <div className="success-toast-icon">✓</div>
    <strong>Document ajouté avec succès</strong>
  </div>
)}

{/* Notification après suppression */}
{deleteMessage && (
  <div className="delete-toast" role="status">
    <div className="delete-toast-icon">
      <svg
        viewBox="0 0 24 24"
        width="22"
        height="22"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 6h18" />
        <path d="M8 6V4h8v2" />
        <path d="m19 6-1 14H6L5 6" />
        <path d="M10 11v5M14 11v5" />
      </svg>
    </div>
    <strong>Document supprimé avec succès</strong>
  </div>
)}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">
  <img
  src={`${import.meta.env.BASE_URL}logo-coala.png`}
  alt="Logo COALA"
/>
</div>
          <div>
            <h2>COALA DOCS</h2>
            <span>Gestion documentaire</span>
          </div>
        </div>

        <div className="menu-label">MENU PRINCIPAL</div>

        <nav className="sidebar-menu">
          {menu.map((item) => (
            <button
              key={item.id}
              className={`menu-item ${page === item.id ? "active" : ""}`}
              onClick={() => setPage(item.id)}
            >
              <span className="menu-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-status">
            <span className="status-dot"></span>
            Espace documentaire
            <small>Version de démonstration</small>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
  <div className="breadcrumb">
    {page !== "dashboard" && (
      <button
        className="breadcrumb-back"
        onClick={() => setPage("dashboard")}
        title="Retour au tableau de bord"
      >
        ←
      </button>
    )}

    <span>COALA DOCS</span>
    <span className="breadcrumb-separator">/</span>
    <strong>{currentPage}</strong>
  </div>

 <div className="profile">
  <div className="profile-avatar">
    {currentUser?.full_name?.charAt(0).toUpperCase() || "U"}
  </div>
  <div>
    <strong>{currentUser?.full_name || "Utilisateur"}</strong>
    <span>
      {currentUser?.role === "admin"
        ? "Administrateur"
        : currentUser?.role === "direction"
        ? "Direction"
        : "Service"}
    </span>
  </div>
</div>
<button
  className="logout-button"
  onClick={async () => {
    await supabase.auth.signOut();
    setPage("dashboard");
    setPreviewDoc(null);
    setIsLoggedIn(false);
  }}
>
  ↪ Déconnexion
</button>

</header>

        <div className="page-content">
          {page === "dashboard" && (
            <>
              <div className="welcome-section">
                <div>
                  <span className="eyebrow">ESPACE DOCUMENTAIRE</span>
                  <h1>Bienvenue sur COALA DOCS</h1>
                  <p>
                    Retrouvez et consultez facilement les instructions de
                    travail et les notes de service.
                  </p>
                </div>
                <div className="welcome-decoration">▤</div>
              </div>

              

              <div className="section-heading">
                <div>
            
                  <p>Les indicateurs de votre bibliothèque documentaire</p>
                </div>
              </div>

              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon total-icon">▤</div>
                  <div>
                    <span>Total des documents</span>
                    <strong>{documents.length}</strong>
                    <small>Documents enregistrés</small>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon it-icon">IT</div>
                  <div>
                    <span>Instructions de travail</span>
                    <strong>{totalIT}</strong>
                    <small>Documents IT</small>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon ns-icon">NS</div>
                  <div>
                    <span>Notes de service</span>
                    <strong>{totalNS}</strong>
                    <small>Documents NS</small>
                  </div>
                </div>
              </div>

              
{/* Accès rapide par service */}
<div className="section-heading">
  <div>
    
    <p>Consultez les documents classés par service</p>
  </div>
</div>

<div className="services-grid">
 {categories.map((category) => {
    const count = documents.filter(
      (doc) => doc.category === category.name
    ).length;
    return (
      <button
  className="service-card"
  key={category.id}
  onClick={() => {
    setCategoryFilter(category.name);
    setSearch("");
    setPage("library");
  }}
>
 <span className="service-icon">
  {category.name === "Production" ? "📦" :
   category.name === "Informatique" ? "💻" :
   category.name === "Technoplast" ? "🫧" :
   category.name === "Motors" ? "⚙️" :
   category.name.includes("Achat") ? "🛒" :
   category.name === "SAV" ? "🛠️" :
   category.name === "Commercial" ? "💼" :
   category.name === "Finance et Comptabilité" ? "💰" :
   category.name === "Ressources humaines" ? "👥" :
   category.name === "Qualité" ? "✓" :
   category.name === "Maintenance" ? "🔧" : "📁"}
</span>
  <div className="service-details">
    <span className="service-name">{category.name}</span>

    <span className="service-count">
      {count} document{count > 1 ? "s" : ""}
    </span>
  </div>

  <span className="service-arrow">→</span>
</button>
    );
  })}
</div>

{/* Derniers documents ajoutés */}
<div className="section-heading latest-heading">
  <div>
    <p>Derniers documents ajoutés</p>
  </div>
</div>

<div className="latest-documents">
  {latestDocuments.length === 0 ? (
    <div className="latest-empty">
      Aucun document enregistré pour le moment.
    </div>
  ) : (
    latestDocuments.map((doc) => (
      <div className="latest-document-item" key={doc.id}>
        <div className="latest-document-icon">
          {doc.type === "IT" ? "📘" : "📄"}
        </div>

        <div className="latest-document-info">
          <strong>{doc.title}</strong>
          <span>
            {doc.reference} · {doc.category}
          </span>
        </div>

        <div className="latest-document-date">
          {doc.createdAt
            ? new Date(doc.createdAt).toLocaleDateString("fr-FR")
            : ""}
        </div>

        <button
          className="latest-view-button"
          title="Consulter le document"
          onClick={async () => {
            const { data, error } = await supabase.storage
              .from("coala-documents")
              .createSignedUrl(doc.file_path, 3600);

            if (error) {
              alert("Impossible d'ouvrir le document : " + error.message);
              return;
            }

            const extension = doc.title.split(".").pop().toLowerCase();

            const fileType =
              extension === "pdf"
                ? "application/pdf"
                : ["jpg", "jpeg", "png"].includes(extension)
                ? extension === "jpg"
                  ? "image/jpeg"
                  : `image/${extension}`
                : "";

            setPreviewDoc({
              ...doc,
              fileData: data.signedUrl,
              fileType,
            });

            const { error: viewError } = await supabase
  .from("document_views")
  .upsert(
    {
      document_id: doc.id,
      user_id: currentUser.id,
      viewed_at: new Date().toISOString(),
    },
    {
      onConflict: "document_id,user_id",
    }
  );

            if (viewError) {
              console.error("Erreur consultation :", viewError.message);
            }
          }}
        >
          👁
        </button>
      </div>
    ))
  )}
</div>
            </>
          )}

          {page === "library" && (
            <>
              <div className="page-heading">
                
                <div>
                  <span className="eyebrow">DOCUMENTATION</span>
                  
                  <p>Consultez et gérez les IT et les NS par service.</p>
                </div>
                <button className="primary-button" onClick={() => setShowForm(!showForm)}>
                  + Ajouter un document
                </button>
              </div>

              
{showForm && (
  <div
    className="modal-overlay"
    onClick={() => setShowForm(false)}
  >
    <form
      className="document-form modal-form"
      onSubmit={addDocument}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="modal-title">
        <div>
          <span className="eyebrow">COALA DOCS</span>
          <h2>Ajouter un document</h2>
          <p>Complétez les informations du document.</p>
        </div>

        <button
          type="button"
          className="modal-close"
          onClick={() => setShowForm(false)}
        >
          ×
        </button>
      </div>

      <div className="form-grid">
        <label className="full-width">
          Fichier du document
          <input
            type="file"
            required
            accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.webp"
           onChange={(e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  setForm((previous) => ({
    ...previous,
    file: file,
    fileName: file.name,
    fileData: "",
    fileType: file.type,
  }));
}}
          />
          <small className="form-note">
            Formats acceptés : PDF, Word, Excel et images (PNG, JPG, WEBP).
          </small>
        </label>

        <label>
          Type de document
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          >
            <option value="IT">Instruction de travail (IT)</option>
            <option value="NS">Note de service (NS)</option>
          </select>
        </label>

       <label>
  Service
  <select
    value={form.categoryId}
    onChange={(e) => {
      const selectedCategory = categories.find(
        (category) => category.id === e.target.value
      );

      setForm((previous) => ({
        ...previous,
        categoryId: selectedCategory?.id || "",
        category: selectedCategory?.name || "",
      }));
    }}
  >
    {categories.map((category) => (
      <option key={category.id} value={category.id}>
        {category.name}
      </option>
    ))}
  </select>
</label>

        <label>
          Date
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
        </label>
      </div>

      <div className="form-actions">
        <button
          type="button"
          className="cancel-button"
          onClick={() => setShowForm(false)}
        >
          Annuler
        </button>

        <button type="submit" className="primary-button">
          Enregistrer le document
        </button>
      </div>
    </form>
  </div>
)}
{documentToDelete && (
  <div className="modal-overlay">
    <div className="delete-modal">
      <div className="delete-modal-icon">⚠️</div>

      <h3>Confirmation de suppression</h3>

      <p>
        Voulez-vous vraiment supprimer ce document ?
      </p>

      <span>
        Cette action est définitive.
      </span>

      <div className="delete-modal-actions">
        <button
          className="cancel-delete-button"
          onClick={() => setDocumentToDelete(null)}
        >
          Annuler
        </button>

        <button
          className="confirm-delete-button"
          onClick={confirmDeleteDocument}
        >
          Supprimer
        </button>
      </div>
    </div>
  </div>
)}
{editingDocument && (
  <div
    className="modal-overlay"
    onClick={() => setEditingDocument(null)}
  >
    <form
      className="document-form modal-form"
      onSubmit={saveDocumentChanges}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="modal-title">
        <div>
          <span className="eyebrow">COALA DOCS</span>
          <h2>Modifier un document</h2>
          <p>Modifiez les informations du document.</p>
        </div>

        <button
          type="button"
          className="modal-close"
          onClick={() => setEditingDocument(null)}
        >
          ×
        </button>
      </div>

      <div className="form-grid">
        <label>
          Référence
          <input
            type="text"
            required
            value={editDocumentForm.reference}
            onChange={(e) =>
              setEditDocumentForm({
                ...editDocumentForm,
                reference: e.target.value,
              })
            }
          />
        </label>

        <label>
          Titre du document
          <input
            type="text"
            required
            value={editDocumentForm.title}
            onChange={(e) =>
              setEditDocumentForm({
                ...editDocumentForm,
                title: e.target.value,
              })
            }
          />
        </label>

        <label>
          Type de document
          <select
            value={editDocumentForm.type}
            onChange={(e) =>
              setEditDocumentForm({
                ...editDocumentForm,
                type: e.target.value,
              })
            }
          >
            <option value="IT">Instruction de travail (IT)</option>
            <option value="NS">Note de service (NS)</option>
          </select>
        </label>

        <label>
          Service
          <select
            value={editDocumentForm.categoryId}
            onChange={(e) =>
              setEditDocumentForm({
                ...editDocumentForm,
                categoryId: e.target.value,
              })
            }
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Date
          <input
            type="date"
            required
            value={editDocumentForm.date}
            onChange={(e) =>
              setEditDocumentForm({
                ...editDocumentForm,
                date: e.target.value,
              })
            }
          />
        </label>
      </div>

      <div className="form-actions">
        <button
          type="button"
          className="cancel-button"
          onClick={() => setEditingDocument(null)}
        >
          Annuler
        </button>

        <button type="submit" className="primary-button">
          Enregistrer les modifications
        </button>
      </div>
    </form>
  </div>
)}


              <div className="library-filters">
                <div className="filter-search">
                  <span>⌕</span>
                  <input
                    placeholder="Rechercher par titre, référence ou service..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                  <option>Tous</option>
                  <option>IT</option>
                  <option>NS</option>
                </select>
              <select
  value={categoryFilter}
  onChange={(e) => setCategoryFilter(e.target.value)}
>
  <option value="Tous">Tous</option>
  {categories.map((category) => (
    <option key={category.id} value={category.name}>
      {category.name}
    </option>
  ))}
</select>
              </div>

              <div className="document-panel library-panel">
                <div className="table-header">
                  <h2>Documents</h2>
                  <span>{filteredDocuments.length} résultat(s)</span>
                </div>

                {filteredDocuments.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">⌕</div>
                    <h3>Aucun document trouvé</h3>
                    <p>Ajoutez un document ou modifiez vos critères de recherche.</p>
                  </div>
                ) : (
                  <div className="table-wrapper">
                    <table>
                      <thead>
                        <tr>
                          <th>Référence</th>
                          <th>Titre</th>
                          <th>Type</th>
                          <th>Service</th>
                          <th>Date</th>
                          
                          <th style={{ width: "160px", textAlign: "center" }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredDocuments.map((doc) => (
                          <tr key={doc.id}>
                            <td>{doc.reference}</td>
                            <td>
                              <strong
  style={{
    color: previewDoc && String(previewDoc.id) === String(doc.id)
      ? "#103f49"
      : "#176477",
    opacity: 1
  }}
>
  {doc.title}
</strong>
                              
                            </td>
                            <td>
                              <span className={`type-badge ${doc.type.toLowerCase()}`}>
                                {doc.type}
                              </span>
                            </td>
                            <td>{doc.category}</td>
                            <td>{doc.date}</td>
                            
                            <td>
                              <div className="action-buttons">
                                <button
  className="edit-button"
  title="Modifier les informations du document"
  onClick={() => openEditDocument(doc)}
>
  ✏️
</button>
    <button
      className="eye-button"
      title="Visualiser le document"
      onClick={async () => {
  const { data, error } = await supabase.storage
    .from("coala-documents")
    .createSignedUrl(doc.file_path, 3600);

  if (error) {
    alert("Impossible d'ouvrir le document : " + error.message);
    return;
  }

  const extension = (doc.fileName || doc.title)
    .split(".")
    .pop()
    .toLowerCase();

  const fileType =
    extension === "pdf"
      ? "application/pdf"
      : ["jpg", "jpeg", "png"].includes(extension)
      ? extension === "jpg" ? "image/jpeg" : `image/${extension}`
      : "";

  setPreviewDoc({
    ...doc,
    fileData: data.signedUrl,
    fileType: fileType,
  });

    // Enregistrer la consultation dans Supabase
  
const { error: viewError } = await supabase
  .from("document_views")
  .upsert(
    {
      document_id: doc.id,
      user_id: currentUser.id,
      viewed_at: new Date().toISOString(),
    },
    {
      onConflict: "document_id,user_id",
    }
  );
console.log("Document consulté :", doc.id);
console.log("Erreur consultation :", viewError);

  if (viewError) {
    console.error(
      "Erreur lors de l'enregistrement de la consultation :",
      viewError.message
    );
  }
}}
    >
      👁
    </button>

    <button
  className="delete-button"
  title="Supprimer le document"
  onClick={() => deleteDocument(doc.id)}
>
   Supprimer
</button>
  </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

         {page === "recent" && (
  <div className="placeholder-page recent-page">
   <div className="recent-page-title">
  <div className="recent-title-icon">◷</div>

  <div className="recent-title-text">
    <h1>Récemment consultés</h1>
    <p>Historique des 20 dernières consultations de COALA DOCS</p>
  </div>
</div>

    
<div className="recent-views-table">

  {/* En-têtes des colonnes */}
  <div className="recent-views-header">
    <span>Document</span>
    <span>Catégorie</span>
    <span>Consulté par</span>
    <span>Date</span>
    <span></span>
  </div>

  {/* Lignes des consultations */}
  {recentViews.map((view) => (
    <div
      className="recent-view-item"
      key={view.id}
      onClick={async () => {
        const document = documents.find(
          (doc) => doc.id === view.documents?.id
        );

        if (!document) {
          alert("Document introuvable ou inaccessible.");
          return;
        }

        const { data, error } = await supabase.storage
          .from("coala-documents")
          .createSignedUrl(document.file_path, 3600);

        if (error) {
          alert("Impossible d'ouvrir le document : " + error.message);
          return;
        }

        const extension = document.title.split(".").pop().toLowerCase();

        const fileType =
          extension === "pdf"
            ? "application/pdf"
            : ["jpg", "jpeg", "png"].includes(extension)
            ? extension === "jpg" ? "image/jpeg" : `image/${extension}`
            : "";

        setPreviewDoc({
          ...document,
          fileData: data.signedUrl,
          fileType,
        });
      }}
    >
      <span className="recent-document-name">
        {view.documents?.title || "Document indisponible"}
      </span>

      <span>
        {view.documents?.categories?.name || "Non renseignée"}
      </span>

      <span>
        {view.profiles?.full_name || "Utilisateur"}
      </span>

      <span>
        {new Date(view.viewed_at).toLocaleString("fr-FR")}
      </span>

      <span className="recent-view-arrow">→</span>
    </div>
  ))}

    </div>
  </div>
)}

         
{page === "users" && currentUser?.role === "admin" && (
  <div className="users-page">
    <div className="page-heading">
      <div>
        <span className="eyebrow">ADMINISTRATION</span>
        <h1>Utilisateurs et permissions</h1>
        <p>Gérez les comptes et les droits d'accès aux documents COALA.</p>
      </div>

      <button
  className="primary-button"
  onClick={() => setShowUserForm(true)}
>
  + Ajouter un utilisateur
</button>
    </div>

    
<div className="users-stats">
  <div className="stat-card">
    <span>Total utilisateurs</span>
    <strong>{users.length}</strong>
  </div>

  <div className="stat-card">
    <span>Administrateurs</span>
    <strong>
      {users.filter((user) => user.role === "admin").length}
    </strong>
  </div>

  <div className="stat-card">
    <span>Comptes actifs</span>
    <strong>
      {users.filter((user) => user.is_active).length}
    </strong>
  </div>
</div>

{showUserForm && (
  <div className="user-form-container">
    <div className="user-form-content">
    
    <div className="user-form-header">
      <div>
        <h2>Ajouter un utilisateur</h2>
        <p>Créer un nouveau compte COALA DOCS</p>
      </div>
    
      <button
        className="close-form-button"
        onClick={() => setShowUserForm(false)}
      >
        ✕
      </button>
    
  </div>
  
<div className="user-form-fields">
  <label>
    Nom complet
    <input
      type="text"
      placeholder="Saisir le nom complet"
      value={newUserName}
      onChange={(e) => setNewUserName(e.target.value)}
    />
  </label>

  <label>
    Adresse e-mail
    <input
      type="email"
      placeholder="exemple@coala-tunisie.com"
      value={newUserEmail}
      onChange={(e) => setNewUserEmail(e.target.value)}
    />
  </label>

  <label>
  Mot de passe initial
  <div className="password-input-container">
    <input
      type={showNewUserPassword ? "text" : "password"}
      placeholder="Saisir un mot de passe"
      value={newUserPassword}
      onChange={(e) => setNewUserPassword(e.target.value)}
    />
    <button
      type="button"
      className="toggle-password"
      onClick={() => setShowNewUserPassword(!showNewUserPassword)}
    >
      {showNewUserPassword ? "🙈" : "👁"}
    </button>
  </div>
</label>

  <label>
    Rôle
    <select
      value={newUserRole}
      onChange={(e) => {
        setNewUserRole(e.target.value);
        setSelectedCategories([]);
      }}
    >
      <option value="admin">Administrateur</option>
      <option value="direction">Direction</option>
      <option value="service">Service</option>
    </select>
  </label>

  {newUserRole === "service" && (
  <div className="category-selection">
    <h3>Services autorisés</h3>
    <p>Sélectionnez un ou plusieurs services.</p>

    {categories.map((category) => (
  <label key={category.id} className="category-option">
    <input
      type="checkbox"
      checked={selectedCategories.includes(category.name)}
      onChange={(e) => {
        if (e.target.checked) {
          setSelectedCategories([
            ...selectedCategories,
            category.name
          ]);
        } else {
          setSelectedCategories(
            selectedCategories.filter(
              (item) => item !== category.name
            )
          );
        }
      }}
    />
    {category.name}
  </label>
))}

  </div>
)}
</div>

<div className="user-form-actions">
  <button
    type="button"
    className="cancel-button"
    onClick={() => setShowUserForm(false)}
  >
    Annuler
  </button>

 
<button
  type="button"
  className="create-user-button"
  onClick={handleCreateUser}
  disabled={isCreatingUser}
>
  {isCreatingUser ? "Création en cours..." : "Créer le compte"}
</button>

</div>

</div>
  </div>
)}

    <div className="users-list">
      <div className="users-list-heading">
        <h2>Liste des utilisateurs</h2>
        <span>Gestion des accès</span>
      </div>

      
{isLoadingUsers ? (
  <div className="empty-users">
    <p>Chargement des utilisateurs...</p>
  </div>
) : usersError ? (
  <div className="empty-users">
    <p>{usersError}</p>
  </div>
) : users.length === 0 ? (
  <div className="empty-users">
    <div className="placeholder-icon">♙</div>
    <h3>Aucun utilisateur à afficher</h3>
    <p>Les comptes utilisateurs apparaîtront ici.</p>
  </div>
) : (
  <div className="users-table">
    <table>
      <thead>
        <tr>
          <th>Nom</th>
          <th>Rôle</th>
          <th>Statut</th>
        </tr>
      </thead>
      <tbody>
        {users.map((user) => (
          <tr
  key={user.id}
  onClick={() => setSelectedUser(user)}
  className="user-row-clickable"
>
            <td>{user.full_name}</td>
            <td>
              {user.role === "admin"
                ? "Administrateur"
                : user.role === "direction"
                ? "Direction"
                : "Service"}
            </td>
            <td>
              <span className={user.is_active ? "user-active" : "user-inactive"}>
                {user.is_active ? "Actif" : "Inactif"}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)}

   
    </div>

    
{selectedUser && (
  <div className="user-form-container">
    <div className="user-form-content">
      <div className="user-form-header">
        <div>
          <h2>Fiche utilisateur</h2>
          <p>
            {isEditingUser
              ? "Modification du compte COALA DOCS"
              : "Détails du compte COALA DOCS"}
          </p>
        </div>

        <button
          className="close-form-button"
          onClick={() => {
            setSelectedUser(null);
            setIsEditingUser(false);
          }}
        >
          ✕
        </button>
      </div>

      <div className="user-form-fields">
        <label>
          Nom complet
          <input
            type="text"
            value={isEditingUser ? editUserName : selectedUser.full_name || ""}
            readOnly={!isEditingUser}
            onChange={(e) => setEditUserName(e.target.value)}
          />
        </label>

        <label>
          Adresse e-mail
          <input
            type="email"
            value={isEditingUser ? editUserEmail : selectedUser.email || ""}
            readOnly={!isEditingUser}
            onChange={(e) => setEditUserEmail(e.target.value)}
          />
        </label>

        <label>
          Rôle
          {isEditingUser ? (
            <select
              value={editUserRole}
              onChange={(e) => {
                setEditUserRole(e.target.value);
                if (e.target.value !== "service") {
                  setEditUserCategories([]);
                }
              }}
            >
              <option value="admin">Administrateur</option>
              <option value="direction">Direction</option>
              <option value="service">Service</option>
            </select>
          ) : (
            <input
              type="text"
              value={
                selectedUser.role === "admin"
                  ? "Administrateur"
                  : selectedUser.role === "direction"
                  ? "Direction"
                  : "Service"
              }
              readOnly
            />
          )}
        </label>

        <label>
          Statut
          {isEditingUser ? (
            <select
              value={editUserActive ? "true" : "false"}
              onChange={(e) => setEditUserActive(e.target.value === "true")}
            >
              <option value="true">Actif</option>
              <option value="false">Inactif</option>
            </select>
          ) : (
            <input
              type="text"
              value={selectedUser.is_active ? "Actif" : "Inactif"}
              readOnly
            />
          )}
        </label>

        <label>
          Catégories autorisées
          {isEditingUser && editUserRole === "service" ? (
            <div className="edit-user-categories">
              {[
                "Production",
                "Informatique",
                "Technoplast",
                "Motors",
                "Achat Local",
                "Achat Import",
                "SAV",
                "Commercial",
                "Finance et Comptabilité",
                "Ressources humaines",
                "Qualité",
                "Maintenance",
                "Autres",
              ].map((category) => (
                <label key={category}>
                  <input
                    type="checkbox"
                    checked={editUserCategories.includes(category)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setEditUserCategories([
                          ...editUserCategories,
                          category,
                        ]);
                      } else {
                        setEditUserCategories(
                          editUserCategories.filter(
                            (item) => item !== category
                          )
                        );
                      }
                    }}
                  />
                  {category}
                </label>
              ))}
            </div>
          ) : (
            <input
              type="text"
              value={
                isEditingUser
                  ? "Aucune catégorie nécessaire"
                  : selectedUser.categories?.length
                  ? selectedUser.categories
  .map((category) =>
    typeof category === "string" ? category : category.name
  )
  .join(", ")
                  : "Aucune catégorie attribuée"
              }
              readOnly
            />
          )}
        </label>
      </div>

      {editUserError && isEditingUser && (
        <p className="user-form-error">{editUserError}</p>
      )}

      <div className="user-form-actions">
        {isEditingUser ? (
          <>
            <button
              type="button"
              className="cancel-button"
              onClick={() => {
                setIsEditingUser(false);
                setEditUserError("");
              }}
            >
              Annuler
            </button>

            <button
              type="button"
              className="primary-button"
              onClick={handleUpdateUser}
              disabled={isUpdatingUser}
            >
              {isUpdatingUser ? "Enregistrement..." : "Enregistrer"}
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => {
              setEditUserName(selectedUser.full_name || "");
              setEditUserEmail(selectedUser.email || "");
              setEditUserRole(selectedUser.role || "service");
              setEditUserActive(selectedUser.is_active);
              setEditUserCategories(
  (selectedUser.categories || []).map((category) =>
    typeof category === "string" ? category : category.name
  )
);
              setEditUserError("");
              setIsEditingUser(true);
            }}
          >
            Modifier
          </button>
        )}
      </div>
    </div>
  </div>
)}

  </div>

)}


          {page === "settings" && (
            <div className="placeholder-page">
              <div className="placeholder-icon">⚙</div>
              <span className="eyebrow">CONFIGURATION</span>
              <h1>Paramètres</h1>
              <p>
                Les paramètres généraux de COALA DOCS seront disponibles ici.
              </p>
              <span className="coming-soon">Fonctionnalité à développer</span>
            </div>
          )}
        </div>
        
{previewDoc && (
  <div className="preview-overlay" onClick={() => setPreviewDoc(null)}>
    <div
  className={isPreviewExpanded ? "preview-modal preview-modal-expanded" : "preview-modal"}
  onClick={(e) => e.stopPropagation()}
>
      <div className="preview-header">
        <div>
          <h2
  style={{
    color: "#103f49",
    WebkitTextFillColor: "#103f49",
    opacity: 1
  }}
>
  {previewDoc.fileName}
</h2>
          <small>
            {previewDoc.reference} · {previewDoc.category}
          </small>
        </div>
        
<div className="preview-actions">
  <button
    className="preview-expand"
    type="button"
    onClick={() => setIsPreviewExpanded(!isPreviewExpanded)}
    title={isPreviewExpanded ? "Réduire" : "Agrandir"}
  >
    ⛶
  </button>

  <button
    className="preview-close"
    type="button"
    onClick={() => setPreviewDoc(null)}
    title="Fermer"
  >
    ✕
  </button>
</div>

      </div>

      <div className="preview-content">
        {previewDoc.fileType?.startsWith("image/") ? (
          <img
            src={previewDoc.fileData}
            alt={previewDoc.fileName}
          />
        ) : previewDoc.fileType === "application/pdf" ? (
          <iframe
            src={previewDoc.fileData}
            title={previewDoc.fileName}
          />
        ) : (
          <div className="preview-unavailable">
            <p>L'aperçu de ce format n'est pas encore disponible.</p>
            <a
              href={previewDoc.fileData}
              download={previewDoc.fileName}
            >
              Télécharger le document
            </a>
          </div>
        )}
            </div>

      

    </div>
  </div>
)}

      </main>
    </div>
  );
}

export default App;
