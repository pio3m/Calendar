import { useState, useEffect, useCallback } from 'react';
import { useSession, useSupabaseClient, useSessionContext } from '@supabase/auth-helpers-react';
import DateTimePicker from 'react-datetime-picker';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';

const localizer = momentLocalizer(moment);

function App() {
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [patientName, setPatientName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [currentRange, setCurrentRange] = useState({ start: new Date(), end: new Date() });

  const session = useSession();
  const supabase = useSupabaseClient();
  const { isLoading } = useSessionContext();

  const fetchCalendarEvents = useCallback(async (startDate, endDate) => {
    const start = startDate.toISOString();
    const end = endDate.toISOString();

    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${start}&timeMax=${end}`, {
      headers: {
        'Authorization': 'Bearer ' + session.provider_token
      }
    });

    const data = await response.json();
    if (data.items) {
      const formattedEvents = data.items.map(event => ({
        id: event.id,
        title: event.summary,
        start: new Date(event.start.dateTime),
        end: new Date(event.end.dateTime),
      }));
      setEvents(formattedEvents);
    } else {
      setEvents([]);
    }
  }, [session]);

  useEffect(() => {
    if (session) {
      fetchCalendarEvents(currentRange.start, currentRange.end);
    }
  }, [session, currentRange]);

  if (isLoading) {
    return <></>;
  }

  async function googleSignIn() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        scopes: 'https://www.googleapis.com/auth/calendar'
      }
    });
    if (error) {
      alert("Błąd logowania do Google przez Supabase");
      console.error(error);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  function handleRangeChange(range) {
    if (range.start && range.end) {
      setCurrentRange({ start: range.start, end: range.end });
    }
  }

  async function createCalendarEvent() {
    if (!patientName || !phoneNumber || !selectedService || !selectedDate || !selectedTime) {
      alert("Proszę wypełnić wszystkie pola.");
      return;
    }

    const startDateTime = new Date(selectedDate);
    startDateTime.setHours(parseInt(selectedTime.split(":")[0], 10));
    startDateTime.setMinutes(parseInt(selectedTime.split(":")[1], 10));

    const event = {
      'summary': selectedService,
      'description': `Pacjent: ${patientName}, Telefon: ${phoneNumber}`,
      'start': {
        'dateTime': startDateTime.toISOString(),
        'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      'end': {
        'dateTime': new Date(startDateTime.getTime() + 60 * 60 * 1000).toISOString(),
        'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    };

    await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
      method: "POST",
      headers: {
        'Authorization': 'Bearer ' + session.provider_token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(event)
    }).then((response) => response.json())
      .then((data) => {
        alert("Wydarzenie utworzone, sprawdź swój Kalendarz Google!");
        fetchCalendarEvents(currentRange.start, currentRange.end);
      })
      .catch((error) => {
        alert("Błąd przy tworzeniu wydarzenia");
        console.error(error);
      });
  }

  const availableTimes = [
    "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"
  ];

  const services = [
    { name: "Konsultacja indywidualna", price: "200 zł", duration: "50 min" },
    { name: "Terapia par", price: "250 zł", duration: "80 min" },
    { name: "Coaching", price: "300 zł", duration: "60 min" },
  ];

  return (
    <div style={{ maxWidth: '800px', margin: '20px auto', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', backgroundColor: '#f9f9f9' }}>
      {session ? (
        <>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>Witaj, {session.user.email}</h2>
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', textAlign: 'center' }}>Cennik usług</h3>
            <div style={{ display: 'grid', gap: '10px' }}>
              {services.map((service, index) => (
                <div key={index} style={{ border: selectedService === service.name ? '2px solid #007BFF' : '1px solid #ddd', borderRadius: '8px', padding: '10px' }}>
                  <h4 style={{ fontSize: '18px', fontWeight: 'bold' }}>{service.name}</h4>
                  <p style={{ fontSize: '16px' }}>{service.price}</p>
                  <p style={{ fontSize: '14px', color: '#555' }}>Czas trwania: {service.duration}</p>
                  <button 
                    onClick={() => setSelectedService(service.name)}
                    style={{ width: '100%', padding: '10px', marginTop: '10px', backgroundColor: selectedService === service.name ? '#007BFF' : '#f0f0f0', color: selectedService === service.name ? '#fff' : '#333', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    {selectedService === service.name ? "Wybrano" : "Wybierz"}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <h3 style={{ fontSize: '20px', fontWeight: 'bold', textAlign: 'center', marginBottom: '20px' }}>Zarezerwuj wizytę</h3>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '5px', display: 'block' }}>Imię pacjenta:</label>
            <input
              type="text"
              onChange={(e) => setPatientName(e.target.value)}
              value={patientName}
              style={{ width: '100%', borderRadius: '4px', padding: '10px' }}
              placeholder="Wpisz imię pacjenta"
            />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '5px', display: 'block' }}>Numer telefonu:</label>
            <input
              type="tel"
              onChange={(e) => setPhoneNumber(e.target.value)}
              value={phoneNumber}
              style={{ width: '100%', borderRadius: '4px', padding: '10px' }}
              placeholder="Wpisz numer telefonu"
            />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '5px', display: 'block' }}>Wybierz datę i godzinę:</label>
            <input
              type="datetime-local"
              onChange={(e) => setSelectedDate(new Date(e.target.value))}
              value={selectedDate.toISOString().slice(0, 16)} // Formatowanie daty do 'YYYY-MM-DDTHH:MM'
              style={{ width: '100%', borderRadius: '4px', padding: '10px' }}
            />
          </div>
         
          <button 
            onClick={createCalendarEvent} 
            style={{ width: '100%', padding: '15px', fontSize: '18px', fontWeight: 'bold', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', marginBottom: '10px' }}
            disabled={!selectedService || !selectedDate || !selectedTime}
          >
            Zarezerwuj wizytę
          </button>
          <button 
            onClick={signOut}
            style={{ width: '100%', padding: '15px', fontSize: '18px', fontWeight: 'bold', backgroundColor: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Wyloguj się
          </button>
        </>
      ) : (
        <button 
          onClick={googleSignIn} 
          style={{ width: '100%', padding: '15px', fontSize: '18px', fontWeight: 'bold', backgroundColor: '#007BFF', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Zaloguj się przez Google
        </button>
      )}
    </div>
  );
}

export default App;
