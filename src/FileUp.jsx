import { useState } from "react";
import axios from "axios";

function FileUp() {
  const [file, setFile] = useState(null);
  const [progress, setprogress] = useState(0);
  const chunk_size = 1024 * 1024;
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const uploadChunk = async (chunk, chunkIndex, totalChunks) => {
    const fd = new FormData();
    fd.append("file", chunk);
    fd.append("chunkIndex", chunkIndex);
    //fd.append("totalChunks", totalChunks);
    //fd.append("filename", file.name);

    try {
      await axios.post(
        `http://192.168.58.41:5000/upload?chunkIndex=${chunkIndex}`,fd,{
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      
      console.log(`Chunk ${chunkIndex + 1}/${totalChunks} uploaded successfully.`);
      const percent = ((chunkIndex+1)/totalChunks)*100;
      setprogress(percent);
    } catch (error) {
      console.error(`Error uploading chunk ${chunkIndex}:`, error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      console.error("No file selected.");
      return;
    }

    const totalChunks = Math.ceil(file.size / chunk_size);

    try {
      for (let i = 0; i < totalChunks; i++) {
        const start = i * chunk_size;
        const end = Math.min(start + chunk_size, file.size);
        const chunk = file.slice(start, end);
        await uploadChunk(chunk, i, totalChunks);
      }

      await axios.post("http://192.168.58.41:5000/complete-upload", {
        fileName: file.name,
      });

      console.log("File uploaded and assembled successfully!");
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };

  return (
    <div>
      <h1>Chunked File Upload</h1>
      <form onSubmit={handleSubmit}>
        <input type="file" onChange={handleFileChange} required />
        <button type="submit">Upload</button>
      </form>
      <p>progress is {progress.toFixed(1)}%</p>
    </div>
  );
}

export default FileUp;
