import React from 'react';

function TimeSelector({ occupiedHours, selectedTime, setSelectedTime }) {
  console.log(occupiedHours, selectedTime);
  return (
    <div style={{ marginBottom: '20px' }}>
      <label style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '5px', display: 'block' }}>Wybierz godzinę:</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
        {Array.from({ length: 15 }, (_, i) => {
          const hour = i + 8; // Generujemy godziny od 8 do 22
          const isOccupied = occupiedHours.includes(hour);
          const timeLabel = `${hour}:00`;

          return (
            <button
              key={hour}
              onClick={() => setSelectedTime(timeLabel)}
              style={{
                flex: '1 1 calc(33.333% - 10px)',
                margin: '5px',
                padding: '10px',
                borderRadius: '4px',
                backgroundColor: isOccupied ? '#ccc' : (selectedTime === timeLabel ? '#007BFF' : '#f0f0f0'), // Zmiana koloru na szary, gdy godzina jest zajęta
                color: selectedTime === timeLabel ? '#fff' : '#333',
                border: 'none',
                cursor: isOccupied ? 'not-allowed' : 'pointer',
                opacity: isOccupied ? '0.6' : '1'
              }}
              disabled={isOccupied}
            >
              {timeLabel}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default TimeSelector;
