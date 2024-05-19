const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL;

export const uploadFile = async (hash: string, logs: string) => {
  try {
    const response = await fetch(`${backendURL}/upload`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ hash, logs }),
    });

    if (!response.ok) {
      throw new Error("Failed to upload data to server");
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error sending data to server:", error);
  }
};
