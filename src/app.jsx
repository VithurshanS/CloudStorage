import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from "react-router-dom";
import SignIn from "./auth/signin";
import SignUp from "./auth/signup";
import UserFiles from "./components/files";
import FileUp from "./components/FileUp";

// Navbar component
const Navbar = ({ isAuthenticated, onLogout }) => {
  return (
    <nav>
      <ul>
        {!isAuthenticated ? (
          <>
            <li><Link to="/signin">Sign In</Link></li>
            <li><Link to="/signup">Sign Up</Link></li>
          </>
        ) : (
          <li><button onClick={onLogout}>Log Out</button></li>
        )}
      </ul>
    </nav>
  );
};

// PrivateRoute Component to handle protected routes
const PrivateRoute = ({ isAuthenticated, children }) => {
  return isAuthenticated ? children : <Navigate to="/signin" replace />;
};

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem("userId")
  );

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    localStorage.setItem("userId", "someUniqueUserId"); // You can store a token or user ID
    {<FileUp/>}
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("userId");
  };

  return (
    <Router>
      <Navbar isAuthenticated={isAuthenticated} onLogout={handleLogout} />
      <Routes>
        {/* Public Routes */}
        <Route path="/signin" element={<SignIn onLoginSuccess={handleLoginSuccess} />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/show" element={<UserFiles/>} />

        {/* Private Route */}
        <Route
          path="/fileup"
          element={
              <FileUp />
          }
        />

        {/* Default Route */}
        <Route path="*" element={ <SignIn/>} />
      </Routes>
    </Router>
  );
};

export default App;
