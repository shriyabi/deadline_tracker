import { useState, useRef, useEffect } from "react";
import CalendarDropdown from "./calendarDropdown";

export default function CalendarSettings({
  calendars,
  token,
  onCalendarAdded,
  onCalendarUpdated,
  onCalendarRemovedFromView,
  onCalendarDeletedFromGCal,
  selectedCalendars,
  setSelectedCalendars,
  fetchEvents,
}) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [newCalendarName, setNewCalendarName] = useState("");
  const [editCalendarId, setEditCalendarId] = useState("");
  const [editCalendarName, setEditCalendarName] = useState("");
  const [deleteCalendarId, setDeleteCalendarId] = useState("");

  const dropdownRef = useRef(null);

  // Close dropdown if click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAddCalendar = async () => {
    if (!newCalendarName) return alert("Enter a name");
    try {
      window.gapi.client.setToken({ access_token: token });
      const response = await window.gapi.client.calendar.calendars.insert({
        resource: { summary: newCalendarName },
      });
      setNewCalendarName("");
      onCalendarAdded?.(response.result);
    } catch (err) {
      console.error("Failed to add calendar:", err);
      alert("Failed to add calendar");
    }
  };

  const handleEditCalendar = async () => {
    if (!editCalendarId || !editCalendarName) return;
    try {
      window.gapi.client.setToken({ access_token: token });
      const response = await window.gapi.client.calendar.calendars.update({
        calendarId: editCalendarId,
        resource: { summary: editCalendarName },
      });
      setEditCalendarId("");
      setEditCalendarName("");
      onCalendarUpdated?.(response.result);
    } catch (err) {
      console.error("Failed to edit calendar:", err);
      alert("Failed to edit calendar");
    }
  };

  const handleDeleteCalendar = async () => {
    if (!deleteCalendarId) return;
    if (!window.confirm("Are you sure you want to permanently delete this calendar from Google Calendar?")) return;
    try {
      window.gapi.client.setToken({ access_token: token });
      await window.gapi.client.calendar.calendars.delete({ calendarId: deleteCalendarId });
      onCalendarDeletedFromGCal?.(deleteCalendarId);
      setDeleteCalendarId("");
    } catch (err) {
      console.error("Failed to delete calendar:", err);
      alert("Failed to delete calendar");
    }
  };

  return (
    <div className="w-full relative flex flex-col" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="hover:bg-gray-300 w-full flex flex-row justify-start items-center px-3 py-2 rounded text-base font-semibold hover:text-lg"
      >
        <div className="bg-gray-200 flex justify-center items-center border shadow-sm shadow-black w-[2em] h-[2em] rounded-full mr-2 text-xl"> ⚙️ </div>
        Calendar Settings
      </button>

      {showDropdown && (
        <div className="absolute left-0 top-full mt-1 w-full bg-white border rounded shadow-lg p-4 z-50">
          {/* Add Calendar */}
          <div className="mb-4">
            <h4 className="font-bold mb-1">Add Calendar</h4>
            <input
              type="text"
              placeholder="Calendar Name"
              value={newCalendarName}
              onChange={(e) => setNewCalendarName(e.target.value)}
              className="border px-2 py-1 w-full mb-1"
            />
            <button
              onClick={handleAddCalendar}
              className="bg-blue-500 text-white px-2 py-1 rounded w-full"
            >
              Add
            </button>
          </div>

          {/* Edit Calendar */}
          <div className="mb-4">
            <h4 className="font-bold mb-1">Edit Calendar Name</h4>
            <select
              value={editCalendarId}
              onChange={(e) => setEditCalendarId(e.target.value)}
              className="border px-2 py-1 w-full mb-1"
            >
              <option value="">Select Calendar</option>
              {calendars.map((cal) => (
                <option key={cal.id} value={cal.id}>{cal.summary}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="New Name"
              value={editCalendarName}
              onChange={(e) => setEditCalendarName(e.target.value)}
              className="border px-2 py-1 w-full mb-1"
            />
            <button
              onClick={handleEditCalendar}
              className="bg-green-500 text-white px-2 py-1 rounded w-full"
            >
              Save
            </button>
          </div>

          {/* Delete Calendar */}
          <div>
            <h4 className="font-bold mb-1">Delete Calendar from Google</h4>
            <select
              value={deleteCalendarId}
              onChange={(e) => setDeleteCalendarId(e.target.value)}
              className="border px-2 py-1 w-full mb-1"
            >
              <option value="">Select Calendar</option>
              {calendars.map((cal) => (
                <option key={cal.id} value={cal.id}>{cal.summary}</option>
              ))}
            </select>
            <button
              onClick={handleDeleteCalendar}
              className="bg-red-500 text-white px-2 py-1 rounded w-full"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
