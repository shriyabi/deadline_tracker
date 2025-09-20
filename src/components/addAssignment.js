import { useState, useEffect } from "react";

export default function AddEvent({ token, calendars = [], onEventAdded, onClose }) {
  const [eventName, setEventName] = useState("");
  const [calendarId, setCalendarId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");

  // Pick the first calendar once calendars are available
  useEffect(() => {
    if (calendars && calendars.length > 0) {
      setCalendarId(calendars[0].id);
    }
  }, [calendars]);

  const handleAddEvent = async () => {
    if (!eventName || !calendarId || !startDate) {
      return alert("Please fill all required fields");
    }

    try {
      window.gapi.client.setToken({ access_token: token });

      const timeText = startTime ? ` (${startTime})` : "";

      let eventResource;

      if (startTime) {
        // Timed event
        const startDateTime = new Date(`${startDate}T${startTime}`);
        const endDateTime = new Date(startDateTime);
        endDateTime.setHours(endDateTime.getHours() + 1); // default 1 hour

        eventResource = {
          summary: eventName + timeText,
          start: { dateTime: startDateTime.toISOString() },
          end: { dateTime: endDateTime.toISOString() },
        };
      } else {
        // All-day event
        const startDateObj = new Date(startDate);
        const endDateObj = new Date(startDateObj);
        endDateObj.setDate(endDateObj.getDate() + 1); // Google Calendar expects exclusive end

        eventResource = {
          summary: eventName,
          start: { date: startDate },
          end: { date: endDateObj.toISOString().slice(0, 10) }, // YYYY-MM-DD
        };
      }

      const response = await window.gapi.client.calendar.events.insert({
        calendarId,
        resource: eventResource,
      });

      alert(`Event "${response.result.summary}" added!`);
      if (onEventAdded) onEventAdded(response.result);
      onClose();
    } catch (err) {
      console.error("Error adding event:", err);
      alert("Failed to add event");
    }
  };

  // If calendars aren’t loaded yet, show a loader
  if (!calendars || calendars.length === 0) {
    return (
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        background: "rgba(0,0,0,0.5)", display: "flex",
        justifyContent: "center", alignItems: "center", zIndex: 1100,
      }}>
        <div style={{ background: "white", padding: "20px", borderRadius: "8px" }}>
          <p>Loading calendars...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: "fixed",
      top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0,0,0,0.5)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1100,
    }}> {/* modal */}
      <div class="p-9" style={{ background: "white",  borderRadius: "8px", minWidth: "300px" }}>
        <h3 class="text-xl font-bold mb-2">Add Event</h3>

        <input
          placeholder="Event Name"
          value={eventName}
          onChange={(e) => setEventName(e.target.value)}
          className="border px-2 py-1 w-full mb-4"
        />

<div className="flex flex-col md:flex-row justify-center items-center w-full">

        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="border px-2 py-1 w-full mb-4"
        />
        <input
          type="time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          className="border px-2 py-1 w-full mb-4"
        />
        </div>


        <select
          value={calendarId}
          onChange={(e) => setCalendarId(e.target.value)}
          className="border px-2 py-2 w-full mb-5"
        >
          {calendars.map((cal) => (
            <option key={cal.id} value={cal.id}>{cal.summary}</option>
          ))}
        </select>

        <div className="flex justify-between mt-2">
          <button onClick={handleAddEvent} className="bg-blue-500 hover:bg-blue-200 text-white px-4 py-2 rounded">
            Add Event
          </button>
          <button onClick={onClose} className="bg-red-800 hover:bg-red-500 text-white px-4 py-2 rounded">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
