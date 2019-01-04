# Tiny Improvements for Netflix (TIN)

Improve your Netflix experience by:
- viewing expiring titles at the top of your list.
- knowing how much time it takes to finish the season of any show by going to the `Episodes` tab.
- knowing how many titles you have in your list (and how many of them are shows or movies).
- having indicator icons in every title card to know if a title...
  - is in your list.
  - has an expiration date.
  - has been watched before (for movies this means it was finished; for TV shows it means it was started, but not necessarily completed).
  - has been rated with thumbs up or down.
- having a `Watched` indicator on previously viewed movies.
- exporting your list to a JSON file.
- having search links to [IMDb](https://www.imdb.com/), [Wikipedia](https://www.wikipedia.org/) and many others in every title.
- having a link to the overview page of a title in the `More Like This` tab.
- knowing how many new titles were added in the last week with a helpful icon.
- filtering your list by title type and watch status.
- downloading your complete viewing activity and rating history in JSON format.

## Installation

By opening [tin.user.js](https://github.com/ignaeche/tin/raw/master/tin.user.js), your userscript manager will prompt you to install the script from the master branch.

You can also open the [script](tin.user.js), inspect the code and select **Raw**. This will also make your userscript manager prompt you for installation.

## Language

TIN will set the language according to your Netflix profile locale. If it is not available, it will default to English. So far, the only other language available is Spanish.

If you want to add your language to the script, feel free to send a pull request to add it.

### Available languages

- English (default)
- Spanish

## Logo

![Sn](images/tin.png "The chemical symbol for tin")

[**Sn**](https://en.wikipedia.org/wiki/Tin) is the chemical symbol for tin. I guess it's a pun? A bad one at that.

## Contributing

Feel free to fork it, send pull requests or create issues.

### Contributors

- [irgendwie](https://github.com/irgendwie)

## License

[MIT License](LICENSE)
