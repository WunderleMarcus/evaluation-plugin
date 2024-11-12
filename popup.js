// Bewertungen initialisieren
if (!localStorage.getItem("bewertungen")) {
    localStorage.setItem("bewertungen", JSON.stringify([]));
}

// Event Listener für die Buttons
document.getElementById("zu-schnell").addEventListener("click", () => bewertungSpeichern("Zu schnell"));
document.getElementById("passend").addEventListener("click", () => bewertungSpeichern("Passend"));
document.getElementById("zu-langsam").addEventListener("click", () => bewertungSpeichern("Zu langsam"));
document.getElementById("exportieren").addEventListener("click", exportiereCSV);

// Funktion zum Speichern der Bewertung
function bewertungSpeichern(bewertung) {
    const zeit = new Date().toLocaleString();
    const bewertungen = JSON.parse(localStorage.getItem("bewertungen"));
    bewertungen.push({ zeit, bewertung });
    localStorage.setItem("bewertungen", JSON.stringify(bewertungen));
    alert(`Bewertung "${bewertung}" gespeichert.`);
}

// Funktion zum Exportieren der CSV
function exportiereCSV() {
    const bewertungen = JSON.parse(localStorage.getItem("bewertungen"));
    if (bewertungen.length === 0) {
        alert("Keine Bewertungen vorhanden.");
        return;
    }

    // CSV-Header und Zeilen
    let csvContent = "Zeit,Bewertung\n";
    bewertungen.forEach(b => {
        csvContent += `${b.zeit},${b.bewertung}\n`;
    });

    // CSV an Background-Service schicken
    chrome.runtime.sendMessage({ csv: csvContent }, (response) => {
        if (response && response.success) {
            alert("CSV-Datei wurde heruntergeladen.");
        } else {
            alert("Fehler beim Exportieren der CSV-Datei.");
        }
    });
}
