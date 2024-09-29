exports.extractCalorieInfo = (text) => {
  const match = text.match(/ประมาณ\s*\*\*(\d+(?:-\d+)?)\s*แคลอรี่\*\*/);
  if (match) {
    return parseInt(match[1]);
  } else {
    return null;
  }
};
