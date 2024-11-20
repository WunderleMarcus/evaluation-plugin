document.getElementById("verifizieren").addEventListener("click", async () => {
    const email = document.getElementById("email").value;

    if (!email || !email.includes("@")) {
        alert("Bitte eine gültige E-Mail eingeben.");
        return;
    }

    try {
        // API-Aufruf zur Verifizierung
        const response = await fetch("https://example.com/api/verify-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email })
        });
        const result = await response.json();

        if (result.success) {
            alert("Verifizierungslink wurde an Ihre E-Mail gesendet.");
        } else {
            alert("Fehler bei der Verifizierung.");
        }
    } catch (error) {
        console.error(error);
        alert("Fehler bei der Verifizierung.");
    }
});
// Test 