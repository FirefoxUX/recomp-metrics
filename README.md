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

You will also need a mercurial (`hg`) checkout of the `mozilla-unified` repository.
You can follow instructions to set up `mozilla-unified` with mercurial
for your operating system [here](https://firefox-source-docs.mozilla.org/setup/).

Following these steps results in the following directory tree,
but this is not required as the directory names and paths are arbitrary.

```
.
├── recomp-metrics   // a checkout of the main branch
|   └── gh-pages     // a checkout of the gh-pages branch
└── mozilla-unified  // a mercurial checkout of mozilla-unified
```

## Mercurial Setup

Now that you have your directory structure set up, generating the data requires the [`version-control-tools/hgext/pushlog`](https://hg.mozilla.org/hgcustom/version-control-tools/) Mercurial extension to be enabled in your `mozilla-unified` clone, for `pushhead` and `pushdate` to work.

Open your `hgrc` (`$HOME/.hgrc`) file in your preferred text editor and add the following to your `[extensions]` section:

```
[extensions]
pushlog = $HOME/.mozbuild/version-control-tools/hgext/pushlog
```

Now you need to verify that everything is working. To do this, you'll need to find the date for which the `gh-pages` branch was last updated with data. Navigate to that directory, and run a `git log` to check the most recent commit message.

For example, if the most recent date is `2021-08-13`, you'll want to collect data for the date that is 7 days after this: `2021-08-20`.

Next, navigate to your `mozilla-unified` directory and run this command with your target date:

```
hg log -l 1 -T "{node}" -r "reverse(pushhead() and pushdate('< 2021-08-20') and ::central)"
```

If everything is working, you should see a commit hash, such as `7af78405aade4dbd64f4c713dc3feeed5d8ffa5b`.

If the command doesn't return any value, and you have just enabled the `pushlog` extension, make sure to pull content again with `hg pull -u` in the `mozilla-unified` clone. Note that this might take several minutes.

## Generating Data

Aggregating data for `RC` can be done by statically analyzing the repository.

The aggregator for `RC` can be called like this:

```
python3 src/recomp-metrics/aggregate.py -m RC --mc ../mozilla-unified --gh-pages-data gh-pages/data --use-current-revision
```

## Committing the Data

Once you've generated new data for `RC`, you may want to serve the static site locally to view the update yourself. For example, you can run `python3 -m http.server 8000` from the folder with the `gh-pages` clone.

Ultimately, you will need to add the changes as a commit on the `gh-pages` branch and push them to the repository.

```
modified:   data/RC/progress.json
modified:   data/RC/snapshot.json
```
