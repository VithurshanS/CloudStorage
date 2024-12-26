const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const cors = require('cors');


const app = express();

app.use(cors({
  origin: 'http://localhost:5173',
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


app.post('/complete-upload', express.json(), (req, res) => {
    try {
      const { fileName } = req.body;
  
      if (!fileName) {
        console.error("FileName is missing in the request body");
        return res.status(400).send("FileName is required");
      }
  
      console.log(`Assembling file: ${fileName}`);
      const writeStream = fs.createWriteStream(`./uploads/${fileName}`);
  
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