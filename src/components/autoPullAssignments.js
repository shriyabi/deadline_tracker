// frontend/src/api/assignmentApi.js
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
  
    // Convert to the format your React component expects
    return (data.__root__ || []).map((item) => ({
      title: item.assignment + (item.time ? ` (${item.time})` : ""),
      dueDate: item.due_date,
      type: item.type || "assignment",
    }));
  }
  