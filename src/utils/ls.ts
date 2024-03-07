export const setLSItem = <T>(name: string, value: T) => {
  localStorage.setItem(name, JSON.stringify(value));
};

export const getLSItem = <T>(name: string): T => {
  const value = localStorage.getItem(name);
  let json = null;
  if (value) {
    try {
      json = JSON.parse(value);
    } catch (e) {}
  }
  return json;
};

export const deleteLSItem = (name: string) => {
  localStorage.removeItem(name);
};
