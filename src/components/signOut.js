import React from "react";

const SignOut = () => {
  const handleSignOut = () => {
    // disable auto-login
    if (window.google && window.google.accounts && window.google.accounts.id) {
      window.google.accounts.id.disableAutoSelect();
    }
    // clear any local tokens/session if stored
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    // redirect to login page
    window.location.href = "/deadline_tracker";
  };

  return (
    <div 
      onClick={handleSignOut} 
      className="cursor-pointer flex justify-center items-center font-semibold text-sm bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg shadow-md transition"
    >
      Sign Out
    </div>
  );
};

export default SignOut;
