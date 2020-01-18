[![Build Status](https://travis-ci.com/suchitadoshi1987/related-files-hopper.svg?branch=master)](https://travis-ci.com/suchitadoshi1987/related-files-hopper)
[![](https://vsmarketplacebadge.apphb.com/version-short/suchitadoshi1987.file-hopper.svg)](https://marketplace.visualstudio.com/items?itemName=suchitadoshi1987.file-hopper)
[![dependencies Status](https://david-dm.org/suchitadoshi1987/related-files-hopper/status.svg)](https://david-dm.org/suchitadoshi1987/related-files-hopper)
[![devDependencies Status](https://david-dm.org/suchitadoshi1987/related-files-hopper/dev-status.svg)](https://david-dm.org/suchitadoshi1987/related-files-hopper?type=dev)

# Related Files Hopper

![Demo](https://raw.githubusercontent.com/suchitadoshi1987/ember-jump-between-related-files/master/assets/demo.gif)

On a typical day, a developer touches multiple files while working on a feature/project. It is very common to switch between files whilst working on the feature. For a given file, there would be cases where the developer needs to find its related files, for instance - for a given component - `components/foo.js`, he/she would like to see its related template - `templates/foo.hbs` and may be its related tests `unit/foo-test.js`, `acceptance/foo-test.js` etc. in such cases,
the developer might use the Hot Keys shortcut to open the required file by typing in the file name and choose one of the options from the dropdown of recommendations OR
locate the related file from the File Explorer itself.
In both the cases, considering a simple case of unique file name, it would consume at least some of the developer’s time to select the file that he/she is searching for (this is the case for first time search, after that, we can assume that the developer would use (CTRL + Tab) to switch between files).

For example with Ember JS, developers work with a collection of related files. Due to Ember’s enforcement of strict project structure, it is a big pain point for the devs to navigate between related files to the extent where large (and potentially disruptive) changes have been proposed to ember's project layout (pods, module unification).

This extension allows movement within a collection of related files with a single keystroke making development faster and efficient resulting in improving developer’s productivity and happiness.

## Features

- This extension would provide suggestions based on a given path for a given file. For example, if `components/foo.js` is the current file I have open in my editor, then my extension should show the suggestions related to that path like: `tests/unit/foo-test.js`, `templates/foo.hbs` etc.

- It also provides with an intuitive UI where the results are categorized with their respective labels.

- Allows users to define their **custom glob patterns**, the extension will then provide the results based on the user provided patterns. <sub><sup><i>(Check out the [**Customizations**](#customizations) section for more details)</i></sup></sub>

- Users can also define their own custom label set for a given result. <sub><sup><i>(Check out the [**Customizations**](#customizations) section for more details)</i></sup></sub>

- With EmberJS apps, this extension doesn't just support a standard Ember app, but also supports complexly structured app where you might have multiple Ember apps within your project and/or have engines/libs/addons etc nested within your app.

## Usage

Use `Cmd+Shift+.` to get the list of all the related files in regards to your current file.

### Example of custom settings:

For apps that doesn't really have files distributed across various folders, you can simply add your own `customGlobPatterns` + `labelRuleSets`:

An Example of a very simple Angular app with a folder structure:
- `src/app/foo.component.ts`
- `src/app/foo.component.html`
- `src/app/foo.component.css`
- `src/app/foo.spec.ts`

The `settings.json` would look something like:
``` json
"fileHopper.labelRuleSets": [
    {
      "folderName": "",
      "title": "Test",
      "regexPatterns": ["(.+).spec(.js|.ts)"]
    },
    {
      "folderName": "",
      "title": "Component",
      "regexPatterns": ["(.+).component(.js|.ts)"]
    },
    {
      "folderName": "",
      "title": "Component Template",
      "regexPatterns": ["(.+).component.html"]
    },
    {
      "folderName": "",
      "title": "Component Style",
      "regexPatterns": ["(.+).component.css"]
    },
  ],
  "fileHopper.customGlobPatterns": [
    "**/%FILE_NAME%.?({component|spec}).%FILE_EXT%",
  ],
  ```

<h3 id="customizations">Customizations</h3>

| Name                | Description                                                                                                                                                                      | Structure                                                                                                                          |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| labelRuleSets       | Custom rule set to generate labels based on folder name and regex strings                                                                                                        | [{<br/> "folderName": "styles",<br/> "title": "Style",<br/> "regexPatterns": ["(/.*)?/(.+).(css\|scss)"]<br>}] |
| customGlobPatterns  | Custom glob patterns for your app `%FILE_NAME%` wild card will be replaced with the current file name and `%FILE_EXT%` will be replaced with the supportedExtensions from config | array of globPatterns. eg: <br/>`[`<br/> `"**/%FILE_NAME%.%FILE_EXT%",`<br/> `"**/tests/%FILE_NAME%-test.{js,ts}"`<br/>`]`                                    |
| appRootFolders      | Array of the root folders of the app                                                                                                                                             | array of strings                                                                                                                   |
| appSubRootFolders   | Array of any sub root folders of the app (app within app support)                                                                                                                | array of strings                                                                                                                   |
| appSubFolders       | Array of directories in the app eg: ['components', 'templates', 'styles']                                                                                                        | array of strings                                                                                                                   |
| testRootFolders     | Array of the root folders of the tests in the app                                                                                                                                | array of strings                                                                                                                   |
| testSubRootFolders  | Array of any sub root folders of tests in the app (app within app support)                                                                                                       | array of strings                                                                                                                   |
| testSubFolders      | Array of directories of tests in the app eg: ['unit', 'acceptance', 'integration']                                                                                               | array of strings                                                                                                                   |
| testFilePattern     | Customize the test file convention.                                                                                                                                              | string. eg: `"test-"` OR `".test"` etc                                                                                             |  |
| supportedExtensions | Array of extensions in the app                                                                                                                                                   | array of strings. eg: `[js, ts, css, html]`                                                                                        |
| patternsToStrip     | Regular expressions or strings to remove from the path                                                                                                                           | array of strings                                                                                                                   |
