import next from "eslint-config-next";

const config = [
  ...next,
  {
    rules: {
      "no-console": "off",
    },
  },
];

export default config;
