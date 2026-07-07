import "../src/App.css";

export const parameters = {
  layout: "centered",
  backgrounds: {
    default: "light",
    values: [
      { name: "light", value: "#f8f9fb" },
      { name: "white", value: "#ffffff" },
    ],
  },
  a11y: {
    config: {},
    options: {
      runUntilFailure: true,
    },
  },
};
