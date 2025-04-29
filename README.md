# Recomp Metrics

The following instructions are for unix-based systems.

## Code Organization

The code to generate the data is in the `main` branch, located in `src/recomp-metrics`.

The data is in the `gh-pages` branch, located in `data/RC/snapshot.json` and `data/RC/progress.json`.

## Directory Structure

To update the data,
both the `main` and `gh-pages` branches of this repository need to be available as separate directories.
The easiest way to achieve that is to add the `gh-pages` branch as a separate [worktree](https://git-scm.com/docs/git-worktree)
under your clone of this repo:

```
git worktree add gh-pages origin/gh-pages
```

You will also need a `git` checkout of the `mozilla-firefox/firefox` repository:

```
git clone git@github.com:mozilla-firefox/firefox.git mozilla-unified
```

Following these steps results in the following directory tree,
but this is not required as the directory names and paths are arbitrary.

```
.
├── recomp-metrics   // a checkout of the main branch
|   └── gh-pages     // a checkout of the gh-pages branch
└── mozilla-unified  // a mercurial checkout of mozilla-unified
```

## Generating Data

Aggregating data for `RC` can be done by statically analyzing the repository.

```
python3 src/recomp-metrics/aggregate.py -m RC --mc ../mozilla-unified --gh-pages-data gh-pages/data --use-current-revision --git
```

## Committing the Data

Once you've generated new data for `RC`, you may want to serve the static site locally to view the update yourself. For example, you can run `python3 -m http.server 8000` from the folder with the `gh-pages` clone.

Ultimately, you will need to add the changes as a commit on the `gh-pages` branch and push them to the repository.

```
modified:   data/RC/progress.json
modified:   data/RC/snapshot.json
```

## Running Everything Locally

We often make changes to the `main` and `gh-pages` branches simultaneously. To get all the pieces working together locally, follow these steps:

1. From the `main` branch checkout whatever feature branch you are working on or reviewing
2. Run the command to generate data
3. `cd` into `gh-pages`
4. Switch to the `gh-pages` branch you are working on or reviewing
5. Run `python3 -m http.server 8000` to start a local server
