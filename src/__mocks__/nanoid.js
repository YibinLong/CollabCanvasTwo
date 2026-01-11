// Mock nanoid for Jest
let counter = 0;

module.exports = {
  nanoid: (size = 21) => {
    counter++;
    return `mock-id-${counter}-${'x'.repeat(size)}`.slice(0, size);
  },
};
