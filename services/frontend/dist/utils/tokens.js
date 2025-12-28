async function refresh_token() {
    const response = await fetch('/auth/refresh', {
        method: 'POST',
        credentials: 'include' // ⬅️ IMPORTANT : envoie les cookies !
    });
    const result = await response.json().catch(() => null);
    if (!response.ok) {
        console.log("Refresh token invalid:", result);
        return false;
    }
    console.log("Token refreshed:", result);
    // ⚠️ Ton backend renvoie "accessToken" (camelCase), pas "access_token"
    sessionStorage.setItem("access_token", result.accessToken);
    return true;
}
export async function checktoken() {
    let token = sessionStorage.getItem("access_token");
    // --- 1) PAS DE TOKEN → essayer un refresh
    if (!token) {
        console.log("No access token → trying refresh");
        if (await refresh_token()) {
            return true;
        }
        return false;
    }
    // --- 2) Vérifier le token actuel
    const response = await fetch('/auth/jwt_check', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
        }
    });
    const result = await response.json().catch(() => null);
    // --- 3) Token invalide → essayer de refresh
    if (!response.ok) {
        console.log("Token invalid:", result);
        if (await refresh_token()) {
            console.log("Token refreshed successfully");
            return true;
        }
        console.log("Refresh failed");
        return false;
    }
    // --- 4) Token valide ✔️
    console.log("Token valid:", result);
    return true;
}
