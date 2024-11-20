const express = require("express");
const bodyParser = require("body-parser");
const AWS = require("aws-sdk");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

const app = express();
app.use(bodyParser.json());

// AWS S3 Konfiguration
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: "eu-central-1"
});
const s3 = new AWS.S3();
const BUCKET_NAME = "mein-s3-bucket";

// JWT-Secret für Token-Erstellung
const JWT_SECRET = process.env.JWT_SECRET || "mein-geheimes-passwort";

// Temporärer Speicher für Benutzerverifizierung (statt einer Datenbank)
const pendingVerifications = new Map();
const verifiedUsers = new Set();

// Mailer Konfiguration (z. B. für Gmail)
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Verifizierungslink senden
app.post("/api/verify-email", async (req, res) => {
    const { email } = req.body;

    if (!email || !email.includes("@")) {
        return res.status(400).json({ success: false, message: "Ungültige E-Mail-Adresse." });
    }

    // Einmaligen Verifizierungscode erstellen
    const verificationCode = crypto.randomBytes(16).toString("hex");
    pendingVerifications.set(verificationCode, email);

    // Verifizierungslink senden
    const verifyUrl = `http://localhost:3000/api/confirm-email/${verificationCode}`;
    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: "E-Mail-Verifizierung",
            text: `Bitte verifiziere deine E-Mail-Adresse: ${verifyUrl}`
        });
        res.json({ success: true, message: "Verifizierungslink wurde gesendet." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Fehler beim Versenden der E-Mail." });
    }
});

// Verifizierungslink bestätigen
app.get("/api/confirm-email/:code", (req, res) => {
    const { code } = req.params;
    const email = pendingVerifications.get(code);

    if (!email) {
        return res.status(400).send("Ungültiger oder abgelaufener Code.");
    }

    // Benutzer als verifiziert markieren
    pendingVerifications.delete(code);
    verifiedUsers.add(email);

    // JWT erstellen und an den Benutzer zurückgeben
    const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: "7d" });
    res.send(`Deine E-Mail wurde verifiziert. Token: ${token}`);
});

// Bewertungen speichern
app.post("/api/save-rating", async (req, res) => {
    const { authorization } = req.headers;
    const { zeit, bewertung } = req.body;

    if (!authorization || !authorization.startsWith("Bearer ")) {
        return res.status(401).json({ success: false, message: "Nicht autorisiert." });
    }

    try {
        // JWT validieren
        const token = authorization.split(" ")[1];
        const { email } = jwt.verify(token, JWT_SECRET);

        if (!verifiedUsers.has(email)) {
            return res.status(401).json({ success: false, message: "Benutzer nicht verifiziert." });
        }

        // Bewertung in S3 speichern
        const params = {
            Bucket: BUCKET_NAME,
            Key: `bewertungen/${email}/${new Date().toISOString()}.json`,
            Body: JSON.stringify({ zeit, bewertung }),
            ContentType: "application/json"
        };

        await s3.upload(params).promise();
        res.json({ success: true, message: "Bewertung gespeichert." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Fehler beim Speichern." });
    }
});

// Bewertungen abrufen
app.get("/api/get-ratings", async (req, res) => {
    const { authorization } = req.headers;

    if (!authorization || !authorization.startsWith("Bearer ")) {
        return res.status(401).json({ success: false, message: "Nicht autorisiert." });
    }

    try {
        // JWT validieren
        const token = authorization.split(" ")[1];
        const { email } = jwt.verify(token, JWT_SECRET);

        if (!verifiedUsers.has(email)) {
            return res.status(401).json({ success: false, message: "Benutzer nicht verifiziert." });
        }

        // Bewertungen aus S3 abrufen
        const params = {
            Bucket: BUCKET_NAME,
            Prefix: `bewertungen/${email}/`
        };

        const data = await s3.listObjectsV2(params).promise();
        const files = data.Contents || [];

        const ratings = await Promise.all(
            files.map(async (file) => {
                const obj = await s3.getObject({ Bucket: BUCKET_NAME, Key: file.Key }).promise();
                return JSON.parse(obj.Body.toString());
            })
        );

        res.json(ratings);
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Fehler beim Abrufen." });
    }
});

// Server starten
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server läuft auf Port ${PORT}`));
