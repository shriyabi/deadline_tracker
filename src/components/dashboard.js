import { useEffect, useState } from "react";
import CalendarDropdown from "./calendarDropdown";
import CalendarSettings from "./calendarSettings";
import SignOut from "./signOut";
import SignIn from "./signIn";

export async function extractAssignments(text) {
  const response = await fetch("http://localhost:8000/extract-assignments", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });
  if (!response.ok) {
    throw new Error("Failed to extract assignments");
  }
  const data = await response.json();
  return (data.assignments || []).map((item) => ({
    title: item.assignment + (item.time ? ` (${item.time})` : ""),
    dueDate: item.due_date,
    type: item.type || "assignment",
  }));
}

export default function Dashboard() {
  const location = window.history.state?.usr || {};
  const token = location?.token;

  const [calendars, setCalendars] = useState([]);
  const [selectedCalendars, setSelectedCalendars] = useState([]);
  const [eventsByCalendar, setEventsByCalendar] = useState({});
  const [showTopDropdown, setShowTopDropdown] = useState(false);

  // Add Event popup state
  const [showAddPopup, setShowAddPopup] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: "", date: "", calendarId: "" });

  // AI tool state
  const [inputText, setInputText] = useState("");
  const [aiEvents, setAiEvents] = useState([]);

  // Fetch calendars
  const fetchCalendars = async () => {
    try {
      window.gapi.client.setToken({ access_token: token });
      const res = await window.gapi.client.calendar.calendarList.list();
      setCalendars(res.result.items || []);
    } catch (err) {
      console.error("Error fetching calendars:", err);
    }
  };

  useEffect(() => {
    if (token) fetchCalendars();
  }, [token]);

  // Fetch events
  const fetchEvents = async (calendarIds) => {
    if (!calendarIds.length) return setEventsByCalendar({});
    const allEvents = {};
    for (let id of calendarIds) {
      try {
        const res = await window.gapi.client.calendar.events.list({
          calendarId: id,
          timeMin: new Date().toISOString(),
          showDeleted: false,
          singleEvents: true,
          orderBy: "startTime",
          maxResults: 50,
        });
        allEvents[id] = res.result.items || [];
      } catch (err) {
        console.error(`Error fetching events for calendar ${id}:`, err);
        allEvents[id] = [];
      }
    }
    setEventsByCalendar(allEvents);
  };

  useEffect(() => {
    if (token) fetchEvents(selectedCalendars);
  }, [selectedCalendars, token]);

  const handleDeleteEvent = async (eventId, calendarId) => {
    try {
      await window.gapi.client.calendar.events.delete({ calendarId, eventId });
      fetchEvents(selectedCalendars);
    } catch (err) {
      console.error("Failed to delete event:", err);
    }
  };

  const handleRemoveCalendarFromView = (calendarId) => {
    setSelectedCalendars(selectedCalendars.filter((id) => id !== calendarId));
  };

  const hexToRgba = (hex, alpha = 0.2) => {
    if (!hex) return `rgba(0,0,0,${alpha})`;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  };

  const darkenColor = (hex, factor = 0.7) => {
    const cleanHex = hex.replace("#", "");
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    const newR = Math.floor(r * factor);
    const newG = Math.floor(g * factor);
    const newB = Math.floor(b * factor);
    return `rgb(${newR}, ${newG}, ${newB})`;
  };

  const formatEventDate = (ev) => {
    if (ev.start.dateTime) return new Date(ev.start.dateTime).toLocaleString();
    if (ev.start.date) return new Date(ev.start.date + "T00:00").toLocaleDateString();
    return "";
  };

  const handleExtractAssignments = async () => {
    if (!inputText.trim()) return;
    const results = await extractAssignments(inputText);
    setAiEvents(results);
  };

  // Add AI assignment
  const handleAddAssignment = async (ev, calendarId) => {
    if (!calendarId) return alert("Please choose a calendar!");
    try {
      await window.gapi.client.calendar.events.insert({
        calendarId,
        resource: {
          summary: ev.title,
          start: { date: ev.dueDate },
          end: { date: ev.dueDate },
        },
      });
      fetchEvents(selectedCalendars);
      setAiEvents((prev) => prev.filter((e) => e !== ev));
    } catch (err) {
      console.error("Failed to add AI assignment:", err);
    }
  };

  // Add manual event
  const handleAddEvent = async () => {
    if (!newEvent.title || !newEvent.date || !newEvent.calendarId) {
      return alert("Please fill out all fields!");
    }
    try {
      await window.gapi.client.calendar.events.insert({
        calendarId: newEvent.calendarId,
        resource: {
          summary: newEvent.title,
          start: { date: newEvent.date },
          end: { date: newEvent.date },
        },
      });
      setShowAddPopup(false);
      setNewEvent({ title: "", date: "", calendarId: "" });
      fetchEvents(selectedCalendars);
    } catch (err) {
      console.error("Failed to add manual event:", err);
    }
  };

  return (
    <div className="flex flex-col min-h-screen w-screen">
      {/* Top bar */}
      <div className="flex flex-wrap justify-between items-center px-6 py-4 bg-gray-100">
        <h1 className="text-xl overline md:text-2xl font-black">deadline_manager.</h1>

        <div className="relative flex flex-row gap-2">
          {token ? <SignOut /> : <SignIn />}
          <div className="relative">
            <button
              onClick={() => setShowTopDropdown(!showTopDropdown)}
              className="bg-yellow-300 text-lg font-bold hover:text-xl px-3 py-1 rounded flex items-center"
              title="Tools"
            >
              ⚙️ Tools
            </button>

            {showTopDropdown && (
              <div className="absolute right-0 mt-2 w-80 bg-white border rounded shadow-lg p-2 flex flex-col z-[1000] space-y-2">
                <CalendarSettings
                  calendars={calendars}
                  token={token}
                  onCalendarAdded={(cal) => setCalendars([...calendars, cal])}
                  onCalendarUpdated={(updatedCal) =>
                    setCalendars(calendars.map((c) => (c.id === updatedCal.id ? updatedCal : c)))
                  }
                  onCalendarRemovedFromView={(id) =>
                    setSelectedCalendars(selectedCalendars.filter((calId) => calId !== id))
                  }
                />

                <CalendarDropdown
                  calendars={calendars}
                  selectedCalendars={selectedCalendars}
                  setSelectedCalendars={setSelectedCalendars}
                  fetchEvents={fetchEvents}
                />

                {/* Manual Add Event Button */}
                {/* Add Event */}
                <button
                                    onClick={() => setShowAddPopup(true)}
                                    className="hover:bg-gray-300 font-semibold text-base hover:text-lg text-black px-3 py-2 flex flex-row justify-start items-center rounded w-full"
                                >
                                    <div className="bg-gray-200 flex justify-center items-center border shadow-sm shadow-black w-[2em] h-[2em] rounded-full mr-2 text-xl"> 🗓️ </div>

                                    Add Event
                                </button>

                {/* AI Text Tool */}
                <div className="border-t pt-2">
                  <textarea
                    className="w-full h-28 p-2 border rounded mb-2"
                    placeholder="Paste syllabus or assignments here..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                  />
                  <button
                    onClick={handleExtractAssignments}
                    className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded w-full"
                  >
                    Extract Assignments
                  </button>

                  {aiEvents.length > 0 && (
                    <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                      {aiEvents.map((ev, i) => (
                        <div key={i} className="flex flex-col bg-gray-50 border p-2 rounded space-y-2">
                          <div>
                            <p className="font-semibold">{ev.title}</p>
                            <p className="text-xs text-gray-600">Due: {ev.dueDate}</p>
                          </div>

                          <div className="flex items-center space-x-2">
                            <select
                              className="border rounded px-2 py-1 text-sm"
                              defaultValue=""
                              onChange={(e) => (ev._chosenCalendar = e.target.value)}
                            >
                              <option value="" disabled>
                                Select calendar...
                              </option>
                              {calendars.map((cal) => (
                                <option key={cal.id} value={cal.id}>
                                  {cal.summary}
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={() => handleAddAssignment(ev, ev._chosenCalendar)}
                              className="text-blue-600 hover:underline text-sm"
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Manual Add Event Popup */}
      {showAddPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[2000]">
          <div className="bg-white p-6 rounded shadow-lg w-96 space-y-4">
            <h2 className="text-lg font-bold">Add Event</h2>
            <input
              type="text"
              placeholder="Event Title"
              className="w-full border p-2 rounded"
              value={newEvent.title}
              onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
            />
            <input
              type="date"
              className="w-full border p-2 rounded"
              value={newEvent.date}
              onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
            />
            <select
              className="w-full border p-2 rounded"
              value={newEvent.calendarId}
              onChange={(e) => setNewEvent({ ...newEvent, calendarId: e.target.value })}
            >
              <option value="">Select calendar...</option>
              {calendars.map((cal) => (
                <option key={cal.id} value={cal.id}>
                  {cal.summary}
                </option>
              ))}
            </select>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowAddPopup(false)}
                className="bg-gray-300 hover:bg-gray-400 px-3 py-1 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleAddEvent}
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Calendars and events */}
      <div className="flex flex-col px-6 sm:flex-row sm:flex-wrap w-full h-full items-start py-6 justify-start overflow-y-scroll">
        {selectedCalendars.map((calId) => {
          const cal = calendars.find((c) => c.id === calId);
          if (!cal) return null;
          const events = eventsByCalendar[calId] || [];
          const borderColor = cal?.backgroundColor || "#000";
          const bgColor = hexToRgba(borderColor, 0.2);

          return (
            <div key={calId} className="w-full h-[50vh] md:w-1/3 max-h-1/2 px-2 py-2">
              <div
                className="w-full p-4 relative rounded h-full overflow-y-scroll"
                style={{ border: `4px solid ${borderColor}`, backgroundColor: bgColor }}
              >
                <button
                  onClick={() => handleRemoveCalendarFromView(calId)}
                  className="absolute top-2 right-2 text-red-600 font-bold"
                  style={{ fontSize: "0.75rem" }}
                  title="Remove calendar from view"
                >
                  ✖
                </button>

                <div className="font-bold text-lg underline mb-2" style={{ color: darkenColor(borderColor) }}>
                  {cal?.summary}
                </div>

                {events.length === 0 ? (
                  <p>No upcoming events.</p>
                ) : (
                  events.map((ev) => (
                    <div key={ev.id} className="mb-1 flex justify-between items-center">
                      <span>
                        <strong>{ev.summary}</strong> - {formatEventDate(ev)}
                      </span>
                      <button
                        onClick={() => handleDeleteEvent(ev.id, calId)}
                        className="ml-2 text-red-500 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
