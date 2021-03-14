const path = require("path");
const vscode = require("vscode");
const fg = require("fast-glob");
const {
  removePrefixSlash,
  getChildSubDir,
  getPrefixNameFromSpecialChars,
  getPipedRegexString,
  generateQuickPickItem,
  getConfig
} = require("./utils/helper");
const { workspace, window } = vscode;
const {
  appRootFolders,
  appSubRootFolders,
  appSubFolders,
  testSubFolders,
  testSubRootFolders,
  testRootFolders,
  testFilePattern,
  customGlobPatterns,
  ignorePatterns
} = getConfig();

const isWindows = process.platform === 'win32';

const appSubFolderRegexString = getPipedRegexString(appSubFolders);
const testSubFolderRegexString = getPipedRegexString(testSubFolders);

function open(item) {
  workspace
    .openTextDocument(item.url)
    .then(doc => window.showTextDocument(doc.uri));
}

function stripExtension(currentFilename, separator) {
  const filenameParts = currentFilename.split(separator);

  let basename = filenameParts[filenameParts.length - 1];
  let extension;
  while ((extension = path.extname(basename))) {
    basename = path.basename(basename, extension);
  }

  filenameParts[filenameParts.length - 1] = basename;
  return filenameParts.join(separator);
}

function stripGenericPattern(currentFilename, pattern) {
  if (pattern.startsWith("/") && pattern.endsWith("/")) {
    pattern = new RegExp(pattern.slice(1, pattern.length - 1), "g");
    currentFilename = currentFilename.replace(pattern, "");
  } else {
    while (currentFilename.includes(pattern)) {
      currentFilename = currentFilename.replace(pattern, "");
    }
  }

  return currentFilename;
}

function stripPatterns(currentFilename, separator, patterns) {
  if (patterns) {
    patterns.forEach(function(pattern) {
      if (pattern === "{EXTENSION}") {
        currentFilename = stripExtension(currentFilename, separator);
      } else {
        currentFilename = stripGenericPattern(currentFilename, pattern);
      }
    });
  }

  return currentFilename;
}

function buildPrefix(currentFilename, workspaceFolder, separator, config) {
  currentFilename = path.basename(currentFilename);
  currentFilename = stripPatterns(
    currentFilename,
    separator,
    config.patternsToStrip
  );
  return currentFilename;
}

function getCurrentWorkspaceFolder(uriPath) {
  return isWindows ? removePrefixSlash(uriPath) : uriPath; 
} 

function showRelated() {
  const document =
    vscode.window.activeTextEditor && vscode.window.activeTextEditor.document;

  let prefix;
  let maybeWorkspaceFolder;
  let currentFilename;
  let actualFileName;
  if (document) {
    currentFilename = document.fileName;
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
    maybeWorkspaceFolder = workspaceFolder ?  getCurrentWorkspaceFolder(workspaceFolder.uri.path) : "";
    const separator = path.sep;
    const config = vscode.workspace.getConfiguration("fileHopper");

    prefix = buildPrefix(
      currentFilename,
      maybeWorkspaceFolder,
      separator,
      config
    );
    actualFileName = prefix;
  } else {
    prefix = "";
  }

  let pathPrefix = vscode.workspace.asRelativePath(
    path.dirname(currentFilename)
  );

  let entries = [currentFilename];

  const toMs = ([sec, nano]) => sec * 1000 + nano / 1000000;
  const start = process.hrtime(); // start

  let potentialParentFolderName = "";
  let parentSubDir;
  let pipedSupportedExtensions = getPipedRegexString(
    getConfig().supportedExtensions
  );

  const appRegexString = appSubFolderRegexString
    ? `\/${appSubFolderRegexString}`
    : "(/.*)?";

  const testRegexString = testSubFolderRegexString
    ? `\/${testSubFolderRegexString}`
    : "(/.*)?";

  // Construct the regex for app sub directories
  const appSubDirRegex = `${maybeWorkspaceFolder}(\/.*)?/${getPipedRegexString(
    appSubRootFolders
  )}(\/.*)?${appRegexString}(\/.*)?\/(_)?${prefix}(${testFilePattern})?.${pipedSupportedExtensions}`;

  // Construct the regex for test sub directories
  const appTestSubDirRegex = `${maybeWorkspaceFolder}(\/.*)?/${getPipedRegexString(
    testSubRootFolders
  )}(\/.*)?${testRegexString}(\/${appSubFolderRegexString})?(\/.*)?\/(_)?${prefix}(${testFilePattern})?.${pipedSupportedExtensions}`;

  let appSubDirMatch = currentFilename.match(appSubDirRegex);
  let testSubDirMatch = currentFilename.match(appTestSubDirRegex);

  let childSubDir =
    getChildSubDir(appSubDirMatch, testSubDirMatch) ||
    `(${appSubFolderRegexString}|${testSubFolderRegexString})`;

  let folderRegexMatch = appSubDirMatch || testSubDirMatch;
  if (folderRegexMatch) {
    parentSubDir = removePrefixSlash(folderRegexMatch[1]);
    pathPrefix = folderRegexMatch[2];
  }

  // This is for the sub directories in the app like app within addons etc.
  if (parentSubDir && parentSubDir.split("/").length > 1) {
    pathPrefix = parentSubDir;
  } else {
    let potentialPrefix;

    // There might be cases where there are multiple projects within a single app.
    // We need to make sure that the pathPrefix is only the top level project and not an
    // engine/addon inside of the app.
    if (folderRegexMatch) {
      const rootLevelFolders = [
        ...new Set([].concat(appRootFolders, testRootFolders))
      ];
      const rootLevelPrefixRegexString = rootLevelFolders.includes(
        folderRegexMatch[2]
      )
        ? getPipedRegexString(rootLevelFolders)
        : null;
      potentialPrefix = rootLevelPrefixRegexString;
      if (parentSubDir && parentSubDir.split("/").length === 1) {
        potentialPrefix = path.join(parentSubDir, rootLevelPrefixRegexString);
      }
    }
    pathPrefix = potentialPrefix
      ? potentialPrefix
      : vscode.workspace.asRelativePath(path.dirname(currentFilename));
  }

  // this is to match .scss files for patterns where css file names
  // are prefixed with either `_` or `_<folder-name>`
  const potentialParentFolderNameSplit = pathPrefix.split("/");
  potentialParentFolderName =
    potentialParentFolderNameSplit[potentialParentFolderNameSplit.length - 1];

  prefix = getPrefixNameFromSpecialChars(
    "_",
    potentialParentFolderName,
    prefix
  );

  let globPrefix = childSubDir
    ? `${maybeWorkspaceFolder}/${pathPrefix}/**/${childSubDir}/`
    : `${maybeWorkspaceFolder}/${pathPrefix}/**/`;

  let supportedExtensions = getConfig().supportedExtensions.join(",");

  // This is the stricter version which is very contextual and will give you fine grained
  // results based nested level directories (default)
  let defaultGlobPattern = [
    `${globPrefix}?(_)?(${potentialParentFolderName}-)${prefix}?(${testFilePattern}).{${supportedExtensions}}`,
    `${maybeWorkspaceFolder}/${pathPrefix}/${prefix}?(${testFilePattern}).{${supportedExtensions}}`
  ];

  // User can choose to provide their own set of glob patterns which will supercede the default
  // option. The wild cards "%FILE_NAME%" and "%FILE_EXT%" will be replaced with the name of the
  // current file and the supported extensions from the config.
  const customGlobs = customGlobPatterns.map(item => {
    item = item.replace("%FILE_NAME%", actualFileName);
    item = item.replace("%FILE_EXT%", `{${supportedExtensions}}`);
    return `${maybeWorkspaceFolder}/${item}`;
  });

  const globPatterns = customGlobs.length ? customGlobs : defaultGlobPattern;
  // run the glob query
  try {
    entries = fg.sync(globPatterns, { dot: true, ignore: ignorePatterns });
  } catch (e) {
    entries = [currentFilename];
  }

  const currentFileNameEntry = isWindows ? removePrefixSlash(currentFilename) : currentFilename;
  // move the current file to the top
  entries = [...entries.filter(item => item !== currentFileNameEntry)];

  const items = entries.map(generateQuickPickItem);

  if (items.length) {
    const placeholderText = `Related files to ${vscode.workspace.asRelativePath(
          currentFilename
    )} starting with most relevant`;

  window
    .showQuickPick(items, {
      placeHolder: placeholderText,
      matchOnDescription: true
    })
    .then(item => {
      if (item) {
        open(item);
      }
    });
  } else {
    const input = window.createQuickPick();
    input.placeholder = "No related files found. Type to search all files.";
    input.show();
    input.onDidChangeValue(v => {
      input.hide();
      vscode.commands.executeCommand("workbench.action.quickOpen", v);
    });
  }

  console.log(toMs(process.hrtime(start)).toFixed(2) + " ms");
}

function activate(context) {
  context.subscriptions.push(
    vscode.commands.registerCommand("fileHopper.show", showRelated)
  );
}

module.exports.buildPrefix = buildPrefix;
module.exports.activate = activate;
