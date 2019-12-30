const folderNames = ["components", "models", "routes"];

module.exports = [
  {
    folderName: "components",
    title: "Components",
    regexPatterns: ["(/.*)?/components/(.+).(js|ts)"]
  },
  {
    folderName: "models",
    title: "Models",
    regexPatterns: ["(/.*)?/models/(.+).(js|ts)"]
  }
];
