const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const cors = require('cors');
const mysql = require('mysql2');
const os = require("os");
const app = express();
app.use(express.json());

app.get("/get-private-ip", (req, res) => {
  const networkInterfaces = os.networkInterfaces();
  for (const interfaceName in networkInterfaces) {
    for (const iface of networkInterfaces[interfaceName]) {
      if (iface.family === "IPv4" && !iface.internal) {
        return res.json({ ip: iface.address });
      }
    }
  }
  res.status(404).json({ message: "Private IP not found" });
});





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
  origin: ['http://localhost:5173','http://192.168.206.41:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Content-Length'],
}));
const storage = multer.diskStorage({
    destination: (req,file,cb) =>{
      const dd = `./chunks/${req.query.uuid}`;
      cb(null,dd);
    },
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
app.post('/init-upload', express.json(), async (req, res) => {
  const { uuider } = await req.body;
 // console.log(uuider);
  const userFolder = path.join(__dirname, "chunks", uuider);

  fs.mkdir(userFolder, { recursive: true }, (err) => {
    if (err) {
      console.error("Error creating folder:", err);
      return res.status(500).json({ message: "Failed to create temp folder." });
    }

    console.log(`Folder created: ${userFolder}`);
    return res.status(201).json({ message: "Temp folder successfully created." });
  });
});


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



app.get('/files/:pathi', async (req, res) => {
  const userId = req.params.pathi;
  try {
    const [files] = await db.promise().query("SELECT * FROM metadata WHERE owner = ?", [userId]);
    if (files.length === 0) {
      return res.json(files);
    }
    res.json(files);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error retrieving files" });
  }
});


app.post('/download', (req, res) => {
  const { filename, pathi } = req.body;

  if (!filename || !pathi) {
    return res.status(400).send('Missing filename or path');
  }

  const filePath = path.resolve(pathi);

  fs.exists(filePath, (exists) => {
    if (!exists) {
      return res.status(404).send('File not found');
    }

    res.setHeader('Content-Length', fs.statSync(filePath).size);
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.setHeader('Content-Type', 'application/octet-stream');

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    fileStream.on('error', (err) => {
      console.error('Error reading the file:', err);
      res.status(500).send('Error reading the file');
    });
  });
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

app.post('/complete-upload', express.json(),async (req, res) => {
    try {
      const { fileName,userid,uuid,size } = req.body;
  
      if (!fileName) {
        console.error("FileName is missing in the request body");
        return res.status(400).send("FileName is required");
      }
  
      console.log(`Assembling file: ${fileName}`);
      const writeStream = fs.createWriteStream(`./uploads/${uuid}-${fileName}`);
  
      const chunkFiles = fs
        .readdirSync(`./chunks/${uuid}`)
        //.filter((name) => !isNaN(parseInt(name)))
        .sort((a, b) => parseInt(a) - parseInt(b));
  
      chunkFiles.forEach((chunk) => {
        const chunkPath = path.join(`./chunks/${uuid}`, chunk);
        const data = fs.readFileSync(chunkPath);
        writeStream.write(data);
        fs.unlinkSync(chunkPath);
      });
  
      writeStream.end();
      res.send('File uploaded and assembled successfully');
      const acfilepath = path.join(__dirname,`./uploads`,`${uuid}-${fileName}`);
      const filesize = size;
      await db.promise().query(
        "INSERT INTO metadata (ID, name, path,size,owner) VALUES (?, ?, ?,?,?)",
        [uuid,fileName,acfilepath,filesize,userid]
      );
      const chunkDir = path.join(__dirname, `./chunks/${uuid}`);
      if (fs.existsSync(chunkDir)) {
        fs.rmSync(chunkDir, { recursive: true, force: true }); // Delete the uuid folder and its contents
        console.log(`Deleted folder: ${chunkDir}`);
      }

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