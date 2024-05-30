const apikey = process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY;

export const getTransaction = async (contractAddress: string) => {
  try {
    const response = await fetch(
      `https://api-sepolia.etherscan.io/api?module=account&action=txlist&address=${contractAddress}&startblock=0&endblock=99999999&sort=asc&apikey=${apikey}`,
    );

    if (!response.ok) {
      throw new Error("Failed to upload data to server");
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error sending data to server:", error);
  }
};
