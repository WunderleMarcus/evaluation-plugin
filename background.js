chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.csv) {
        const blob = new Blob([message.csv], { type: "text/csv" });
        const date = new Date().toISOString().split('T')[0]; // Aktuelles Datum für den Dateinamen

        // Den Blob in eine Datei herunterladen
        const reader = new FileReader();
        reader.onload = function() {
            chrome.downloads.download({
                url: reader.result,  // Der Blob-URL wird aus dem Ergebnis des FileReaders erzeugt
                filename: `bewertungen_${date}.csv`,
                saveAs: true
            }, (downloadId) => {
                if (chrome.runtime.lastError || downloadId === undefined) {
                    sendResponse({ success: false, error: chrome.runtime.lastError });
                } else {
                    sendResponse({ success: true });
                }
            });
        };
        reader.readAsDataURL(blob); // Konvertiert Blob in eine Data URL für den Download

        return true; // Asynchrone Antwort zulassen
    }
});
