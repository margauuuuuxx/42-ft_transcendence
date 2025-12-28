export async function logout() {
    console.log("logout");
    await fetch('/auth/logout', {
        method: 'POST',
        credentials: 'include' // IMPORTANT pour envoyer les cookies
    });
    // Supprimer access token local
    sessionStorage.removeItem("access_token");
}
