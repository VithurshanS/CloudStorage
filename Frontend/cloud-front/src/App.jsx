import { useState } from "react";
import axios from "axios";
import { v4 as uuidv4 } from "uuid"; // Import the v4 method from uuid

function App() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);

  const CHUNK_SIZE = 1024 * 1024; // 1MB chunks

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const uploadChunk = async (chunk, chunkIndex, totalChunks, fileId) => {
    const formData = new FormData();
    formData.append("file", chunk);
    formData.append("chunkIndex", chunkIndex);
    formData.append("totalChunks", totalChunks);
    formData.append("fileId", fileId); // Use the generated fileId
    formData.append("fileName", file.name);

    try {
      await axios.post("http://localhost:3000/upload-chunk", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round(
            ((chunkIndex + progressEvent.loaded / chunk.size) / totalChunks) * 100
          );
          setUploadProgress(progress);
        },
      });
    } catch (error) {
      console.error(`Error uploading chunk ${chunkIndex}`, error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      setMessage("Please select a file to upload.");
      return;
    }

    const fileId = uuidv4(); // Generate a unique ID for the file
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    setUploadProgress(0);
    setMessage("Uploading...");

    try {
      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const start = chunkIndex * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);

        await uploadChunk(chunk, chunkIndex, totalChunks, fileId);
      }

      // Notify server that all chunks have been uploaded
      await axios.post("http://localhost:3000/complete-upload", {
        fileId,
        fileName: file.name,
      });

      setMessage("File uploaded successfully.");
    } catch (error) {
      console.error("Error uploading file", error);
      setMessage("File upload failed.");
    }
  };

  return (
    <div>
      <h1>Chunked File Upload</h1>
      <form onSubmit={handleSubmit}>
        <input type="file" onChange={handleFileChange} required />
        <button type="submit">Upload</button>
      </form>
      {uploadProgress > 0 && <p>Upload Progress: {uploadProgress}%</p>}
      {message && <p>{message}</p>}
    </div>
  );
}

export default App;


/*import { useState } from "react";
import axios from "axios";
import { v4 as uuidv4 } from "uuid"; // Import the v4 method from uuid

function App() {
  const [file, setFile] = useState(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [permit, setPermit] = useState(""); // For signup
  const [message, setMessage] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);

  const CHUNK_SIZE = 1024 * 1024; // 1MB chunks

  // Handle file selection
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  // Signup function
  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:3002/signup", {
        username,
        password,
        permit,
      });
      setMessage("Signup successful! Please sign in.");
    } catch (error) {
      console.error("Error during signup:", error);
      setMessage("Signup failed.");
    }
  };

  // Signin function
  const handleSignin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:3002/signin", {
        username,
        password,
      });
      const { userid } = res.data;
      localStorage.setItem("userId", userid); // Store userId in local storage
      setMessage("Signin successful!");
    } catch (error) {
      console.error("Error during signin:", error);
      setMessage("Signin failed. Check your credentials.");
    }
  };

  // Upload a chunk
  const uploadChunk = async (chunk, chunkIndex, totalChunks, fileId, userId) => {
    const formData = new FormData();
    formData.append("file", chunk);
    formData.append("chunkIndex", chunkIndex);
    formData.append("totalChunks", totalChunks);
    formData.append("fileId", fileId);
    formData.append("fileName", file.name);
    formData.append("currentuserid", userId); // Include userId

    try {
      await axios.post("http://localhost:3000/upload-chunk", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round(
            ((chunkIndex + progressEvent.loaded / chunk.size) / totalChunks) * 100
          );
          setUploadProgress(progress);
        },
      });
    } catch (error) {
      console.error(`Error uploading chunk ${chunkIndex}`, error);
      throw error;
    }
  };

  // Handle file upload
  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setMessage("Please select a file to upload.");
      return;
    }

    const userId = localStorage.getItem("userId"); // Retrieve userId
    if (!userId) {
      setMessage("Please sign in before uploading files.");
      return;
    }

    const fileId = uuidv4();
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    setUploadProgress(0);
    setMessage("Uploading...");

    try {
      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const start = chunkIndex * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);

        await uploadChunk(chunk, chunkIndex, totalChunks, fileId, userId);
      }

      await axios.post("http://localhost:3000/complete-upload", {
        fileId,
        fileName: file.name,
        currentuserid: userId, // Include userId
      });

      setMessage("File uploaded successfully.");
    } catch (error) {
      console.error("Error uploading file:", error);
      setMessage("File upload failed.");
    }
  };

  return (
    <div>
      <h1>Chunked File Upload with Authentication</h1>

      <h2>Signup</h2>
      <form onSubmit={handleSignup}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Permit"
          value={permit}
          onChange={(e) => setPermit(e.target.value)}
          required
        />
        <button type="submit">Signup</button>
      </form>

      <h2>Signin</h2>
      <form onSubmit={handleSignin}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Signin</button>
      </form>

      <h2>Upload File</h2>
      <form onSubmit={handleFileUpload}>
        <input type="file" onChange={handleFileChange} required />
        <button type="submit">Upload</button>
      </form>

      {uploadProgress > 0 && <p>Upload Progress: {uploadProgress}%</p>}
      {message && <p>{message}</p>}
    </div>
  );
}

export default App;
*/