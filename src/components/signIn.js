import { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";

const CLIENT_ID = process.env.REACT_APP_CLIENT_ID;
const DISCOVERY_DOC = "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest";
const SCOPES = "https://www.googleapis.com/auth/calendar";
console.log("Client ID:", CLIENT_ID);
export default function App() {
    const navigate = useNavigate();
    const [gapiLoaded, setGapiLoaded] = useState(false);
    const [tokenClient, setTokenClient] = useState(null);
  
    useEffect(() => {
      const interval = setInterval(() => {
        if (window.gapi && window.google) {
          clearInterval(interval);
          window.gapi.load("client", async () => {
            await window.gapi.client.init({ discoveryDocs: [DISCOVERY_DOC] });
            setGapiLoaded(true);
          });
  
          const client = window.google.accounts.oauth2.initTokenClient({
            client_id: CLIENT_ID,
            scope: SCOPES,
            callback: (resp) => {
              if (resp.access_token) {
                navigate("/dashboard", { state: { token: resp.access_token } });
              }
            },
          });
  
          setTokenClient(client);
        }
      }, 100);
    }, [navigate]);
  
    const handleSignIn = () => {
      if (!gapiLoaded || !tokenClient) return alert("Google API not loaded yet");
      tokenClient.requestAccessToken({ prompt: "consent" });
    };
  
    return (
      <div style={{ textAlign: "center", marginTop: "50px" }}>
        <h1>Sign in to Google Calendar</h1>
        <button onClick={handleSignIn}>Sign In with Google</button>
      </div>
    );
  }