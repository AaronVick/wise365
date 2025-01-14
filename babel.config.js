module.exports = {
  plugins: [
    ["@babel/plugin-transform-runtime", { regenerator: true }],
    ["@babel/plugin-proposal-class-properties", { loose: true }],
  ],
  presets: ["next/babel"],
};
