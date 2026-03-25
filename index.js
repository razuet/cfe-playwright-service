const express = require("express");
const { chromium } = require("playwright");

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
res.send("CFE Playwright service running");
});

app.post("/cfe", async (req, res) => {
let browser;

try {
browser = await chromium.launch({
headless: true,
args: [
"--no-sandbox",
"--disable-setuid-sandbox",
"--disable-blink-features=AutomationControlled"
]
});

```
const context = await browser.newContext({
  userAgent:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
});

// 🔥 Evitar detección básica
await context.addInitScript(() => {
  Object.defineProperty(navigator, "webdriver", {
    get: () => false
  });
});

const page = await context.newPage();

// 🔥 IR A LOGIN
await page.goto("https://app.cfe.mx/Aplicaciones/CFE/MiEspacio/Login.aspx", {
  waitUntil: "networkidle"
});

await page.waitForTimeout(3000);

// 🔴 INGRESA TUS CREDENCIALES AQUÍ
const usuario = "5demayo62";
const password = "MgeJ5q0ly";

// 🔥 LLENAR FORMULARIO (SELECTORES REALES)
await page.fill('input[name="ctl00$MainContent$txtUsuario"]', usuario);
await page.fill('input[name="ctl00$MainContent$txtPassword"]', password);

// 🔥 CLICK LOGIN
await page.click('input[name="ctl00$MainContent$btnLogin"]');

// 🔥 ESPERAR A ENTRAR
await page.waitForTimeout(8000);

// 🔥 VALIDAR LOGIN
const url = page.url();

if (url.includes("Login")) {
  throw new Error("LOGIN FAILED - revisa credenciales o captcha");
}

// 🔥 YA DENTRO → IR A MI ESPACIO
await page.goto("https://app.cfe.mx/Aplicaciones/CFE/MiEspacio/", {
  waitUntil: "networkidle"
});

await page.waitForTimeout(5000);

// DEBUG
const content = await page.content();
console.log("DEBUG_HTML:", content.slice(0, 1000));

// 🔥 EXTRAER DATOS
const data = await page.evaluate(() => {
  const text = document.body.innerText;

  const amountMatch = text.match(/\$\s?[\d,]+\.\d{2}/);
  const dateMatch = text.match(/\d{2}\/\d{2}\/\d{4}/);

  return {
    amount: amountMatch ? amountMatch[0] : null,
    due_date: dateMatch ? dateMatch[0] : null,
    preview: text.slice(0, 300)
  };
});

if (!data.amount) {
  throw new Error("SCRAPING FAILED - no se encontraron datos");
}

await browser.close();

res.json({
  success: true,
  ...data
});
```

} catch (error) {
if (browser) await browser.close();

```
res.status(500).json({
  success: false,
  error: error.message
});
```

}
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
console.log("Server running on port " + PORT);
});
