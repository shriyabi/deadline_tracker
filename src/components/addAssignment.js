import { useState } from "react";

export default function AddEvent({ token, calendars, onEventAdded, onClose }) {
  const [eventName, setEventName] = useState("");
  const [calendarId, setCalendarId] = useState(calendars[0]?.id || "");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");

  const handleAddEvent = async () => {
    if (!eventName || !calendarId || !startDate) return alert("Please fill all required fields");

    try {
      window.gapi.client.setToken({ access_token: token });

      // Optional time appended to event name, but event is all-day
      const timeText = startTime ? ` (${startTime})` : "";
      const startDateTime = new Date(`${startDate}`).toISOString();

      const response = await window.gapi.client.calendar.events.insert({
        calendarId,
        resource: {
          summary: eventName + timeText,
          start: { date: startDate }, // all-day
          end: { date: startDate },   // all-day
        },
      });

      alert(`Event "${response.result.summary}" added!`);
      if (onEventAdded) onEventAdded(response.result);
      onClose();
    } catch (err) {
      console.error("Error adding event:", err);
      alert("Failed to add event");
    }
  };

  return (
    <div style={{
      position: "fixed",
      top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0,0,0,0.5)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1100,
    }}>
      <div style={{ background: "white", padding: "20px", borderRadius: "8px", minWidth: "300px" }}>
        <h3>Add Event</h3>

        <input
          placeholder="Event Name"
          value={eventName}
          onChange={(e) => setEventName(e.target.value)}
          className="border px-2 py-1 w-full mb-2"
        />

        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="border px-2 py-1 w-full mb-2"
        />

        <input
          type="time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          className="border px-2 py-1 w-full mb-2"
        />

        <select
          value={calendarId}
          onChange={(e) => setCalendarId(e.target.value)}
          className="border px-2 py-1 w-full mb-2"
        >
          {calendars.map((cal) => (
            <option key={cal.id} value={cal.id}>{cal.summary}</option>
          ))}
        </select>

        <div className="flex justify-between mt-2">
          <button onClick={handleAddEvent} className="bg-blue-500 text-white px-4 py-2 rounded">
            Add Event
          </button>
          <button onClick={onClose} className="bg-gray-400 text-white px-4 py-2 rounded">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
