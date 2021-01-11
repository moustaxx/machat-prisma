const regexp = /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;

const isValidEmail = (email: string): boolean => {
    if (!email || email.length > 64) return false;
    return regexp.test(email);
};

export default isValidEmail;
