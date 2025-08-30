import React, { useState, useRef, useEffect } from "react";

export default function CalendarDropdown({ calendars, selectedCalendars, setSelectedCalendars }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggleCalendar = (calendarId) => {
    if (selectedCalendars.includes(calendarId)) {
      setSelectedCalendars(selectedCalendars.filter((id) => id !== calendarId));
    } else {
      setSelectedCalendars([...selectedCalendars, calendarId]);
    }
  };

  return (
    <div className="relative w-full max-w-sm" ref={dropdownRef}>
      {/* Dropdown Button */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="w-full hover:bg-gray-300 font-semibold hover:text-lg rounded-lg px-3 py-2 my-2 text-start hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 flex justify-start items-center"
      >
        <div className="bg-gray-200 flex text-lg justify-center items-center border shadow-sm shadow-black w-[2em] h-[2em] rounded-full mr-2 text-xl"> &#128197; </div>
        {selectedCalendars.length > 0
          ? `${selectedCalendars.length} calendars selected`
          : "Select calendars"}
        <span className="ml-2">&#9662;</span>
      </button>

      {/* Dropdown List */}
      {open && (
        <div className="absolute mt-2 w-full bg-gray-100 border border-gray-400 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
          {calendars.length > 0 ? (
            <div className="flex flex-col p-2">
              {calendars.map((calendar) => (
                <label
                  key={calendar.id}
                  className="flex items-center justify-start px-4 py-2 hover:bg-gray-300 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedCalendars.includes(calendar.id)}
                    onChange={() => handleToggleCalendar(calendar.id)}
                    className="mr-2"
                  />
                  <span>{calendar.summary}</span>
                </label>
              ))}
            </div>
          ) : (
            <div className="px-4 py-2 text-gray-500">No calendars found</div>
          )}
        </div>
      )}
    </div>
  );
}
