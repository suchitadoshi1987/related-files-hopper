# Jump to Related Files
![Demo](assets/demo.gif)
In the EmberJS world, developers work with a collection of related files. Due to Ember’s enforcement of strict project structure, it is a big pain point for the devs to navigate between related files to the extent where large (and potentially disruptive) changes have been proposed to ember's project layout (pods, module unification).

This extension allows movement within a collection of related files with a single keystroke making development faster and efficient resulting in improving developer’s productivity and happiness.


## Features

- This extension would provide suggestions based on a given path for a given file. For example, if `components/foo.js` is the current file I have open in  my editor, then my extension should show the suggestions related to that path like: `tests/unit/foo-test.js`, `templates/foo.hbs` etc.

- It also provides with an intuitive UI where the results are categorized with their respective labels.

- This extension doesn't just support a standard Ember app, but also supports complexly structured app where you might have multiple Ember apps within your project and/or have engines/libs/addons etc nested within your app.


## Usage

Use `Cmd+Shift+.` to get the list of all the related files in regards to your current file.

