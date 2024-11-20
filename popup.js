// Event Listener für die Buttons
document.getElementById("zu-schnell").addEventListener("click", () => bewertungSpeichern("Zu schnell"));
document.getElementById("passend").addEventListener("click", () => bewertungSpeichern("Passend"));
document.getElementById("zu-langsam").addEventListener("click", () => bewertungSpeichern("Zu langsam"));
document.getElementById("exportieren").addEventListener("click", exportiereCSV);

// Funktion zum Speichern der Bewertung
async function bewertungSpeichern(bewertung) {
    const zeit = new Date().toLocaleString();

    try {
        const response = await fetch("https://example.com/api/save-rating", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}` // Token nach Verifizierung speichern
            },
            body: JSON.stringify({ zeit, bewertung })
        });
        const result = await response.json();

        if (result.success) {
            alert(`Bewertung "${bewertung}" gespeichert.`);
        } else {
            alert("Fehler beim Speichern der Bewertung.");
        }
    } catch (error) {
        console.error(error);
        alert("Fehler beim Speichern der Bewertung.");
    }
}

// Funktion zum Exportieren der CSV
async function exportiereCSV() {
    try {
        const response = await fetch("https://example.com/api/get-ratings", {
            method: "GET",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
            }
        });

        const ratings = await response.json();

        if (!ratings.length) {
            alert("Keine Bewertungen vorhanden.");
            return;
        }

        let csvContent = "Zeit,Bewertung\n";
        ratings.forEach(r => {
            csvContent += `${r.zeit},${r.bewertung}\n`;
        });

        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        chrome.downloads.download({
            url: url,
            filename: `bewertungen_${new Date().toISOString().split('T')[0]}.csv`,
            saveAs: true
        });

    } catch (error) {
        console.error(error);
        alert("Fehler beim Exportieren der CSV-Datei.");
    }
}
