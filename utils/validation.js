export const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Simple email regex
    return regex.test(email);
  };
  
export const validateRequiredFields = (fields) => {
  return Object.values(fields).every((field) => {
    if (field === null || field === undefined) {
      return false;
    }

    if (typeof field === "string") {
      return field.trim().length > 0;
    }

    if (Array.isArray(field)) {
      return field.length > 0;
    }

    return true;
  });
};
