const express = require("express");
const ExcelJS = require("exceljs");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

const FILE_PATH = path.join(__dirname, "submissions.xlsx");

/* ------------------ Generate Order ID ------------------ */
function generateOrderId(rowCount) {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    return `ORD-${today}-${String(rowCount).padStart(3, "0")}`;
}

/* ------------------ Create or Load Excel ------------------ */
async function getWorkbookAndSheet() {
    const workbook = new ExcelJS.Workbook();
    let worksheet;

    if (fs.existsSync(FILE_PATH)) {
        await workbook.xlsx.readFile(FILE_PATH);
        worksheet = workbook.getWorksheet("Sheet1");

        if (!worksheet) {
            worksheet = workbook.addWorksheet("Sheet1");
        }
    } else {
        worksheet = workbook.addWorksheet("Sheet1");
    }

    // ALWAYS define columns (important fix)
    worksheet.columns = [
        { header: "Order ID", key: "orderId", width: 20 },
        { header: "Date", key: "date", width: 15 },
        { header: "Time", key: "time", width: 15 },
        { header: "Name", key: "name", width: 20 },
        { header: "Email", key: "email", width: 25 },
        { header: "Phone", key: "phone", width: 15 },
        { header: "Address", key: "address", width: 30 },
        { header: "Postcode", key: "postcode", width: 12 },
        { header: "Country", key: "country", width: 15 },
        { header: "Card Type", key: "cardType", width: 15 },
        { header: "Last 4 Digits", key: "last4", width: 15 }
    ];

    if (worksheet.rowCount === 0) {
        worksheet.getRow(1).font = { bold: true };
    }

    return { workbook, worksheet };
}
/* ------------------ Submit Route ------------------ */
app.post("/submit", async (req, res) => {
    try {
        const data = req.body;

        const { workbook, worksheet } = await getWorkbookAndSheet();

        const rowCount = worksheet.rowCount || 1;
        const orderId = generateOrderId(rowCount);

        worksheet.addRow({
            orderId,
            date: new Date().toLocaleDateString(),
            time: new Date().toLocaleTimeString(),
            name: data.name,
            email: data.email,
            phone: data.phone,
            address: data.address,
            postcode: data.postcode,
            country: data.country,
            cardType: data.cardType,
            last4: data.last4
        });

        await workbook.xlsx.writeFile(FILE_PATH);

        res.json({ success: true, orderId });

    } catch (error) {
        console.error("Submit Error:", error);
        res.status(500).json({ success: false, message: "Error saving data" });
    }
});

/* ------------------ Get Data ------------------ */
app.get("/data", async (req, res) => {
    try {
        if (!fs.existsSync(FILE_PATH)) {
            return res.json([]);
        }

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(FILE_PATH);
        const worksheet = workbook.getWorksheet("Sheet1");

        const data = [];

        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber > 1) {
                data.push({
                    orderId: row.getCell(1).value,
                    date: row.getCell(2).value,
                    time: row.getCell(3).value,
                    name: row.getCell(4).value,
                    email: row.getCell(5).value,
                    phone: row.getCell(6).value,
                    address: row.getCell(7).value,
                    postcode: row.getCell(8).value,
                    country: row.getCell(9).value,
                    cardType: row.getCell(10).value,
                    last4: row.getCell(11).value
                });
            }
        });

        res.json(data);

    } catch (error) {
        console.error("Data Fetch Error:", error);
        res.status(500).json([]);
    }
});

/* ------------------ Delete Order ------------------ */
app.delete("/delete/:orderId", async (req, res) => {
    try {
        const orderId = req.params.orderId;

        if (!fs.existsSync(FILE_PATH)) {
            return res.status(404).json({ message: "File not found" });
        }

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(FILE_PATH);
        const worksheet = workbook.getWorksheet("Sheet1");

        worksheet.eachRow((row, rowNumber) => {
            if (row.getCell(1).value === orderId) {
                worksheet.spliceRows(rowNumber, 1);
            }
        });

        await workbook.xlsx.writeFile(FILE_PATH);

        res.json({ success: true });

    } catch (error) {
        console.error("Delete Error:", error);
        res.status(500).json({ success: false });
    }
});

/* ------------------ Download Excel ------------------ */
app.get("/download", (req, res) => {
    if (fs.existsSync(FILE_PATH)) {
        res.download(FILE_PATH);
    } else {
        res.status(404).send("No file found.");
    }
});

/* ------------------ Start Server ------------------ */
app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});