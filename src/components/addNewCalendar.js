import { useState } from "react";

export default function AddCalendar({ token, onCalendarAdded }) {
  const [calendarName, setCalendarName] = useState("");

  const handleAdd = async () => {
    if (!calendarName) return alert("Enter a calendar name");
    try {
      window.gapi.client.setToken({ access_token: token });

      const response = await window.gapi.client.calendar.calendars.insert({
        resource: {
          summary: calendarName,
        },
      });

      alert(`Calendar "${response.result.summary}" created!`);
      setCalendarName("");
      if (onCalendarAdded) onCalendarAdded(response.result);
    } catch (err) {
      console.error("Error creating calendar:", err);
      alert("Failed to create calendar");
    }
  };

  return (
    <div style={{ marginBottom: "20px" }}>
      <input
        type="text"
        placeholder="New calendar name"
        value={calendarName}
        onChange={(e) => setCalendarName(e.target.value)}
      />
      <button onClick={handleAdd}>Add Calendar</button>
    </div>
  );
}
