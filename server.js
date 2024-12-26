const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const cors = require('cors');
const mysql = require('mysql2');


const app = express();
app.use(express.json());

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "vithu",
  database: "filemanagement",
});
db.connect((err) => {
  if (err) {
    console.error("Database connection failed: " + err.stack);
    return;
  }
  console.log("Connected to database.");
});

app.use(cors({
  origin: ['http://localhost:5173','http://192.168.58.41:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
const storage = multer.diskStorage({
    destination: './chunks',
    filename: (req, file, cb) => {
      const chunkIndex = req.query.chunkIndex;
      //console.log("fine");
      /*if (!chunkIndex) {
        return cb(new Error("Missing chunkIndex"), null);
      }*/
      cb(null, `${chunkIndex}`);
    },
  });
  

const upload = multer({storage});
app.post('/upload',upload.single('file'),(req,res)=>{
    console.log(`Received chunk ${req.body.chunkIndex}`);
    res.send('Chunk uploaded successfully');
})



app.post("/signup", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required." });
  }

  try {
    const [rows] = await db.promise().query("SELECT * FROM user WHERE username = ?;", [username]);

    if (rows.length > 0) {
      return res.status(409).json({ message: "Username already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await db.promise().query(
      "INSERT INTO user (ID, username, password) VALUES (UUID(), ?, ?)",
      [username, hashedPassword]
    );
    const [result] = await db.promise().query("SELECT ID from user where username = ?;",[username]);

    const userId = result[0].ID;
    const userFolder = path.join(__dirname, "uploads", String(userId));
    fs.mkdir(userFolder, { recursive: true }, (err) => {
      if (err) {
        console.error("Error creating folder:", err);
        return res.status(500).json({ message: "Failed to create user folder." });
      }

      console.log(`Folder created: ${userFolder}`);
      res.status(201).json({ message: "User registered successfully.", userId });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error." });
  }
});



app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  console.log("coonnne");

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required." });
  }

  try {
    const [rows] = await db.promise().query("SELECT * FROM user WHERE username = ?", [username]);
    if (rows.length === 0) {
      return res.status(401).json({ message: "Invalid username or password." });
    }
    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({ message: "Invalid username or password." });
    }

    res.status(200).json({ message: "Login successful.", id:user.ID });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error." });
  }
});

app.post('/complete-upload', express.json(), (req, res) => {
    try {
      const { fileName,userid } = req.body;
  
      if (!fileName) {
        console.error("FileName is missing in the request body");
        return res.status(400).send("FileName is required");
      }
  
      console.log(`Assembling file: ${fileName}`);
      const writeStream = fs.createWriteStream(`./uploads/${userid}/${fileName}`);
  
      const chunkFiles = fs
        .readdirSync('./chunks')
        //.filter((name) => !isNaN(parseInt(name)))
        .sort((a, b) => parseInt(a) - parseInt(b));
  
      chunkFiles.forEach((chunk) => {
        const chunkPath = path.join('./chunks', chunk);
        const data = fs.readFileSync(chunkPath);
        writeStream.write(data);
        fs.unlinkSync(chunkPath);
      });
  
      writeStream.end();
      res.send('File uploaded and assembled successfully');
    } catch (error) {
      console.error('Error assembling file:', error);
      res.status(500).send('Failed to assemble file');
    }
  });
  

/*app.post('/complete-upload', express.json(),(req,res)=>{
    const fileName = req.body.fileName;
    console.log(fileName);
    const writeStream = fs.createWriteStream(`./uploads/${fileName}`);
    const chunkFiles = fs.readFileSync(`./chunks`).sort((a,b)=>{
        const ai = parseInt(a);
        const bi = parseInt(b);
        return ai - bi ;
    });
    chunkFiles.forEach((chunk)=>{
        const data  = fs.readFileSync(`./chunks/${chunk}`);
        writeStream.write(data);
        fs.unlinkSync(`./chunks/${chunk}`);
    })
    writeStream.end();
});*/

app.listen(5000,()=>{
    console.log('server started')
})