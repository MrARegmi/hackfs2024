export const formattedDateAndTime = (timeStamp: number) => {
  const date = new Date(timeStamp * 1000);
  return date.toLocaleString();
};
