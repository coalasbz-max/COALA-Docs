
const API_URL = "https://coala-docs.onrender.com";

export const api = {
    async getUsers(accessToken) {
    const response = await fetch(`${API_URL}/users/`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.detail || "Impossible de récupérer les utilisateurs."
      );
    }

    return result;
  },
  async createUser(userData, accessToken) {
    const response = await fetch(`${API_URL}/users/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(userData),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.detail || "Une erreur est survenue."
      );
    }

       return result;
  },

  async updateUser(userId, userData, accessToken) {
    const response = await fetch(`${API_URL}/users/${userId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(userData),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.detail || "Impossible de modifier l'utilisateur."
      );
    }

    return result;
  },
};