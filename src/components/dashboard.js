import { useEffect, useState } from "react";
import AddEvent from "./addAssignment";
import CalendarDropdown from "./calendarDropdown";
import CalendarSettings from "./calendarSettings";
import SignOut from "./signOut";
import SignIn from "./signIn";

export default function Dashboard() {
    const location = window.history.state?.usr || {};
    const token = location?.token;

    const [calendars, setCalendars] = useState([]);
    const [selectedCalendars, setSelectedCalendars] = useState([]);
    const [eventsByCalendar, setEventsByCalendar] = useState({});
    const [showAddEvent, setShowAddEvent] = useState(false);
    const [showTopDropdown, setShowTopDropdown] = useState(false);

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

    // Fetch events for selected calendars
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

    // Fetch events whenever selectedCalendars changes
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

    // Format event date correctly
    const formatEventDate = (ev) => {
        if (ev.start.dateTime) {
            return new Date(ev.start.dateTime).toLocaleString(); // timed event
        } else if (ev.start.date) {
            const d = new Date(ev.start.date + "T00:00"); // all-day event
            return d.toLocaleDateString(); // only show date
        }
        return "";
    };

    return (
        <div className="flex flex-col bg-white min-h-screen w-screen">
            {/* Top bar */}
            <div className="flex flex-wrap justify-between items-center px-6 py-4 bg-gray-100 mb-6">
                <h1 className="text-xl overline md:text-2xl font-bold">deadline_manager.</h1>

                {/* Tools dropdown */}
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
                            <div className="absolute right-0 mt-2 w-72 bg-white border rounded shadow-lg p-2 flex flex-col z-[1000]">
                                {/* Calendar Settings */}
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

                                {/* Select Calendars */}
                                <CalendarDropdown
                                    calendars={calendars}
                                    selectedCalendars={selectedCalendars}
                                    setSelectedCalendars={setSelectedCalendars}
                                    fetchEvents={fetchEvents}
                                />

                                {/* Add Event */}
                                <button
                                    onClick={() => setShowAddEvent(true)}
                                    className="hover:bg-gray-300 font-semibold text-base hover:text-lg text-black px-3 py-2 flex flex-row justify-start items-center rounded w-full"
                                >
                                    <div className="bg-gray-200 flex justify-center items-center border shadow-sm shadow-black w-[2em] h-[2em] rounded-full mr-2 text-xl"> 🗓️ </div>

                                    Add Event
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Add Event modal */}
            {showAddEvent && (
                <AddEvent
                    token={token}
                    calendars={calendars}
                    onEventAdded={() => fetchEvents(selectedCalendars)}
                    onClose={() => setShowAddEvent(false)}
                />
            )}

            {/* Calendars and events */}
            <div className="flex flex-col px-6 sm:flex-row sm:flex-wrap w-full items-start justify-start">
                {selectedCalendars.map((calId) => {
                    const cal = calendars.find((c) => c.id === calId);
                    if (!cal) return null;
                    const events = eventsByCalendar[calId] || [];
                    const borderColor = cal?.backgroundColor || "#000";
                    const bgColor = hexToRgba(borderColor, 0.2);

                    return (
                        <div key={calId} className="w-full md:w-1/3 px-2 py-2">
                            <div
                                className="w-full p-4 relative rounded"
                                style={{
                                    border: `4px solid ${borderColor}`,
                                    backgroundColor: bgColor,
                                }}
                            >
                                {/* Remove from view button */}
                                <button
                                    onClick={() => handleRemoveCalendarFromView(calId)}
                                    className="absolute top-2 right-2 text-red-600 font-bold"
                                    style={{ fontSize: "0.75rem" }}
                                    title="Remove calendar from view"
                                >
                                    ✖
                                </button>

                                <div className="font-bold mb-2">{cal?.summary}</div>

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
