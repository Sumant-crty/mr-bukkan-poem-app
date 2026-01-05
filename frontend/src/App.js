const generatePoem = async (topic) => {
  try {
    const response = await fetch(`${API_URL}/api/generate-poem`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ topic }),
    });

    const data = await response.json();
    
    if (response.ok && data.poem) {
      return data.poem;
    } else {
      // Return detailed error message
      let errorMsg = '❌ Error generating poem:\n\n';
      if (data.error) errorMsg += `Error: ${data.error}\n`;
      if (data.details) errorMsg += `Details: ${data.details}\n`;
      if (data.solution) errorMsg += `\nSolution: ${data.solution}\n`;
      errorMsg += `\nBackend URL: ${API_URL}`;
      errorMsg += `\nStatus: ${response.status}`;
      return errorMsg;
    }
  } catch (error) {
    return `❌ Connection Error:\n\n${error.message}\n\nBackend: ${API_URL}\n\nCheck:\n1. Backend is running\n2. REACT_APP_API_URL is set correctly\n3. No CORS issues`;
  }
};
