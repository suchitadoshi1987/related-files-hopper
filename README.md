# File Hopper
![Demo](https://raw.githubusercontent.com/suchitadoshi1987/ember-jump-between-related-files/master/assets/demo.gif)

On a typical day, a developer touches multiple files while working on a feature/project. It is very common to switch between files whilst working on the feature. For a given file, there would be cases where the developer needs to find its related files,  for instance - for a given component - `components/foo.js`, he/she would like to see its related template - `templates/foo.hbs` and may be its related tests `unit/foo-test.js`, `acceptance/foo-test.js` etc. in such cases, 
the developer might use the Hot Keys shortcut to open the required file by typing in the file name and choose one of the options from the dropdown of recommendations OR 
locate the related file from the File Explorer itself. 
In both the cases, considering a simple case of unique file name, it would consume at least some of the developer’s time to select the file that he/she is searching for (this is the case for first time search, after that, we can assume that the developer would use (CTRL + Tab) to switch between files).

For example with Ember JS, developers work with a collection of related files. Due to Ember’s enforcement of strict project structure, it is a big pain point for the devs to navigate between related files to the extent where large (and potentially disruptive) changes have been proposed to ember's project layout (pods, module unification).

This extension allows movement within a collection of related files with a single keystroke making development faster and efficient resulting in improving developer’s productivity and happiness.


## Features

- This extension would provide suggestions based on a given path for a given file. For example, if `components/foo.js` is the current file I have open in  my editor, then my extension should show the suggestions related to that path like: `tests/unit/foo-test.js`, `templates/foo.hbs` etc.

- It also provides with an intuitive UI where the results are categorized with their respective labels.

- With EmberJS apps, this extension doesn't just support a standard Ember app, but also supports complexly structured app where you might have multiple Ember apps within your project and/or have engines/libs/addons etc nested within your app.


## Usage

Use `Cmd+Shift+.` to get the list of all the related files in regards to your current file.

