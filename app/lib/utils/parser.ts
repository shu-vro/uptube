export const parseJSON = (str: any) => {
  try {
    return JSON.parse(str);
  } catch (error) {
    return str;
  }
};
