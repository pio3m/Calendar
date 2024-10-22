import { useState, useEffect, useCallback } from 'react';
import { useSession, useSupabaseClient, useSessionContext } from '@supabase/auth-helpers-react';
import DateTimePicker from 'react-datetime-picker';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import TimeSelector from './TimeSelector'; 
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css'; // Import stylów

const localizer = momentLocalizer(moment);

function App() {
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [patientName, setPatientName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [currentRange, setCurrentRange] = useState({ start: new Date(), end: new Date() });
  const [occupiedHours, setOccupiedHours] = useState([]);
  const [loading, setLoading] = useState(false); // Dodaj stan loading
  const [calendars, setCalendars] = useState([]); // Dodaj stan do przechowywania kalendarzy
  const [selectedCalendar, setSelectedCalendar] = useState(""); // Dodaj stan do przechowywania wybranego kalendarza

  const session = useSession();
  const supabase = useSupabaseClient();
  const { isLoading } = useSessionContext();

  const fetchCalendarEvents = useCallback(async (startDate, endDate) => {
    const start = new Date(startDate.setHours(0, 0, 0, 0)).toISOString(); // Ujednolicenie formatu daty startowej
    const end = new Date(endDate.setHours(23, 59, 59, 999)).toISOString(); // Ujednolicenie formatu daty końcowej
    console.log(startDate, end); // Sprawdzenie formatów dat

    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${selectedCalendar}/events?timeMin=${start}&timeMax=${end}`, {
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

      // Oblicz zajęte godziny
      const occupied = formattedEvents.reduce((acc, event) => {
        const startHour = event.start.getHours();
        const endHour = event.end.getHours();
        for (let hour = startHour; hour < endHour; hour++) {
          acc.push(hour);
        }
        return acc;
      }, []);
      setOccupiedHours(occupied); // Ustaw zajęte godziny
      setEvents(formattedEvents);
      setSelectedTime(""); // Resetuj wybraną godzinę
    } else {
      setEvents([]);
    }
    setLoading(false); // Ustaw loading na false po zakończeniu ładowania
  }, [session, selectedCalendar]); // Dodano selectedCalendar jako zależność

  useEffect(() => {
    if (session) {
      fetchCalendars(); // Pobierz kalendarze po zalogowaniu
      fetchCalendarEvents(currentRange.start, currentRange.end);
    }
  }, [session, currentRange]);

  useEffect(() => {
    fetchCalendars(); // Wywołaj fetchCalendars przy starcie
  }, []); // Pusty array, aby wywołać tylko raz przy montowaniu komponentu

  const fetchCalendars = async () => {
    try {
      const response = await fetch("https://www.googleapis.com/calendar/v3/users/me/calendarList", {
        headers: {
          'Authorization': 'Bearer ' + session.provider_token
        }
      });
      const data = await response.json();
      console.log(data); // Dodaj log do sprawdzenia danych
      if (data.items) {
        setCalendars(data.items); // Ustaw kalendarze
        setSelectedCalendar(data.items[0].id); // Ustaw domyślnie pierwszy kalendarz
      } else {
        console.error("Brak kalendarzy w odpowiedzi."); // Log w przypadku braku kalendarzy
      }
    } catch (error) {
      console.error("Błąd podczas pobierania kalendarzy:", error); // Log błędu
    }
  };

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

    await fetch(`https://www.googleapis.com/calendar/v3/calendars/${selectedCalendar}/events`, { // Użyj wybranego kalendarza
      method: "POST",
      headers: {
        'Authorization': 'Bearer ' + session.provider_token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(event)
    })
    .then((response) => response.json())
    .then((data) => {
      alert("Wydarzenie utworzone, sprawdź swój Kalendarz Google!");
      fetchCalendarEvents(currentRange.start, currentRange.end);
    })
    .catch((error) => {
      alert("Błąd przy tworzeniu wydarzenia");
      console.error(error);
    });
  }


  const services = [
    { name: "Konsultacja indywidualna", price: "200 zł", duration: "50 min" },
    { name: "Terapia par", price: "250 zł", duration: "80 min" },
    { name: "Coaching", price: "300 zł", duration: "60 min" },
  ];



  return (
    <div style={{ maxWidth: '800px', margin: '20px auto', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', backgroundColor: '#f9f9f9' }}>
      {loading ? ( // Wyświetl loader, gdy loading jest true
        <div style={{ textAlign: 'center', margin: '20px' }}>
          <p>Ładowanie...</p>
        </div>
      ) : session ? (
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
            <label style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '5px', display: 'block' }}>Wybierz kalendarz:</label>
            <select 
              value={selectedCalendar} 
              onChange={(e) => setSelectedCalendar(e.target.value)} 
              style={{ width: '100%', borderRadius: '4px', padding: '10px' }}
            >
              {calendars.map(calendar => (
                <option key={calendar.id} value={calendar.id}>{calendar.summary}</option>
              ))}
            </select>
          </div>
          
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
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ width: '48%' }}>
              <label style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '5px', display: 'block' }}>Wybierz datę:</label>
              <DatePicker
                selected={selectedDate} // Użyj selectedDate jako wartości
                onChange={(date) => {
                  setSelectedDate(date);
                  fetchCalendarEvents(date, new Date(date.getTime() + 24 * 60 * 60 * 1000)); // Pobierz wolne terminy po zmianie daty
                }}
                dateFormat="yyyy-MM-dd" // Format daty
                className="date-picker" // Dodaj klasę CSS dla stylizacji
                style={{ width: '100%', borderRadius: '4px', padding: '10px' }} // Stylizacja
              />
            </div>
            <div style={{ width: '48%' }}>
              <button 
                onClick={() => fetchCalendarEvents(selectedDate, new Date(selectedDate.getTime() + 24 * 60 * 60 * 1000))} 
                style={{ width: '100%', padding: '15px', fontSize: '18px', fontWeight: 'bold', backgroundColor: '#007BFF', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', marginBottom: '10px' }}
              >
                Odśwież
              </button>
            </div>
          </div>
          <TimeSelector 
            occupiedHours={occupiedHours} 
            selectedTime={selectedTime} 
            setSelectedTime={setSelectedTime} 
            isOccupied={(hour) => occupiedHours.includes(hour)} // Dodaj funkcję sprawdzającą zajętość
          />
         
          <button 
            onClick={createCalendarEvent} 
            style={{ width: '100%', padding: '15px', fontSize: '18px', fontWeight: 'bold', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', marginBottom: '10px' }}
     
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
