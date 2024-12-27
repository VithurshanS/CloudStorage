import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from "react-router-dom";

const UserFiles = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0); // State to track download progress
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch the files for the user's folder
    axios
      .get(`http://192.168.206.41:5000/files/${localStorage.getItem('userId')}`) // Backend API to fetch user's files
      .then((response) => {
        setFiles(response.data);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load files');
        setLoading(false);
      });
  }, []);

  const handleDownload = (filename) => {
    const userUUID = localStorage.getItem('userId');
    if (!userUUID) {
      alert('User not logged in');
      return;
    }
    axios({
      url: `http://192.168.206.41:5000/download`,
      method: 'POST',
      responseType: 'blob',
      data: {
        filename: filename,
        pathi: localStorage.getItem('userId'),
      },
      onDownloadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setProgress(percentCompleted);
      },
    })
      .then((response) => {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
        setProgress(0);
      })
      .catch((e) => {
        console.log(e);
        alert('Error downloading file');
        setProgress(0);
      });
  };

  if (loading) return <p>Loading files...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div>
      <h2>User Files</h2>
      {progress > 0 && (
        <div>
          <p>Downloading: {progress}%</p>
          <progress value={progress} max="100"></progress>
        </div>
      )}
      {files.length === 0 ? (
        <p>No files found in your folder.</p>
      ) : (
        <ul>
          {files.map((file, index) => (
            <li key={index}>
              {file}{' '}
              <button onClick={() => handleDownload(file)}>Download</button>
            </li>
          ))}
        </ul>
      )}
      <button onClick={() => navigate('/fileup')}>To Upload</button>
    </div>
  );
};

export default UserFiles;
