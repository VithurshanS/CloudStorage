import { useState } from "react";
import axios from "axios";
import SignIn from '../auth/signin.jsx'
import SignUp from '../auth/signup.jsx'
import { Navigate, useNavigate } from "react-router-dom";


function FileUp() {
  const [file, setFile] = useState(null);
  const [progress, setprogress] = useState(0);
  const chunk_size = 1024 * 1024;
  const navigate = useNavigate();
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
        `http://192.168.206.41:5000/upload?chunkIndex=${chunkIndex}`,fd,{
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      
      console.log(`Chunk ${chunkIndex + 1}/${totalChunks} uploaded successfully.`);
      const percent = Math.round(((chunkIndex+1)/totalChunks)*100);
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
      await axios.post("http://192.168.206.41:5000/complete-upload", {
        fileName: file.name,
        userid:localStorage.getItem("userId")
      });
      

      console.log("File uploaded and assembled successfully!");
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };

  return (
    <div>
      <h1>V-Cloud</h1>
      <div>
      <h1>Upload section</h1>
      </div>
      <form onSubmit={handleSubmit}>
        <input type="file" onChange={handleFileChange} required />
        <button type="submit">Upload</button>
      </form>
      {progress > 0 && (
        <div>
          <p>Uploading: {progress}%</p>
          <progress value={progress} max="100"></progress>
        </div>
      )}
      <button onClick={()=>{navigate('/show')}}>to files</button>
    </div>
  );
}

export default FileUp;
