import logo from './logo.svg';
import './App.css';
import { useSession, useSupabaseClient, useSessionContext } from '@supabase/auth-helpers-react';
import DateTimePicker from 'react-datetime-picker';
import { useState } from 'react';

function App() {
  const [ start, setStart ] = useState(new Date());
  const [ end, setEnd ] = useState(new Date());
  const [ eventName, setEventName ] = useState("");
  const [ eventDescription, setEventDescription ] = useState("");

  const session = useSession(); // tokens, when session exists we have a user
  const supabase = useSupabaseClient(); // talk to supabase!
  const { isLoading } = useSessionContext();
  
  if(isLoading) {
    return <></>
  }

  async function googleSignIn() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        scopes: 'https://www.googleapis.com/auth/calendar'
      }
    });
    if(error) {
      alert("Error logging in to Google provider with Supabase");
      console.log(error);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  async function createCalendarEvent() {
    console.log("Creating calendar event");
    const event = {
      'summary': eventName,
      'description': eventDescription,
      'start': {
        'dateTime': start.toISOString(), // Date.toISOString() ->
        'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone // America/Los_Angeles
      },
      'end': {
        'dateTime': end.toISOString(), // Date.toISOString() ->
        'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone // America/Los_Angeles
      }
    }
    await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
      method: "POST",
      headers: {
        'Authorization':'Bearer ' + session.provider_token // Access token for google
      },
      body: JSON.stringify(event)
    }).then((data) => {
      return data.json();
    }).then((data) => {
      console.log(data);
      alert("Event created, check your Google Calendar!");
    });
  }

  console.log(session);
  console.log(start);
  console.log(eventName);
  console.log(eventDescription);
  return (
    <div className="App">
      <div style={{ width: "800px", margin: "20px auto", padding: "10px", borderRadius: "8px", boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)", backgroundColor: "#f9f9f9" }}>
        {session ?
          <>
            <h2 style={{ color: "#333", textAlign: "center" }}>Hey there {session.user.email}</h2>
            <p style={{ fontWeight: "bold" }}>Start of your event</p>
            <input type="datetime-local" onChange={(e) => setStart(new Date(e.target.value))} value={start.toISOString().slice(0, 16)} style={{ width: "100%", height: "50px" }} />
            <p style={{ fontWeight: "bold" }}>End of your event</p>
            <input type="datetime-local" onChange={(e) => setEnd(new Date(e.target.value))} value={end.toISOString().slice(0, 16)} style={{ width: "100%", height: "50px" }} />
            <p style={{ fontWeight: "bold" }}>Event name</p>
            <input type="text" onChange={(e) => setEventName(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "4px", border: "1px solid #ccc" }} />
            <p style={{ fontWeight: "bold" }}>Event description</p>
            <input type="text" onChange={(e) => setEventDescription(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "4px", border: "1px solid #ccc" }} />
            <hr />
            <button onClick={() => createCalendarEvent()} style={{ width: "100%", padding: "10px", borderRadius: "4px", backgroundColor: "#4CAF50", color: "white", border: "none", cursor: "pointer" }}>Create Calendar Event</button>
            <p></p>
            <button onClick={() => signOut()} style={{ width: "100%", padding: "10px", borderRadius: "4px", backgroundColor: "#f44336", color: "white", border: "none", cursor: "pointer" }}>Sign Out</button>
          </>
          :
          <>
            <button onClick={() => googleSignIn()} style={{ width: "100%", padding: "10px", borderRadius: "4px", backgroundColor: "#4285F4", color: "white", border: "none", cursor: "pointer" }}>Sign In With Google</button>
          </>
        }
      </div>
    </div>
  );
}

export default App;
