import os
import subprocess
import re
from collections import defaultdict
from datetime import date

from data import Aggregator
from source import Source
from milestone import Milestone

from pathlib import Path


class RecompComponents(Milestone):
    name = "RC"
    start_date = date(2024, 1, 1)

    def get_data(self, source: Source, date, revision):
        component_names=[
            "moz-button",
            "moz-button-group",
            "moz-card",
            "moz-five-star",
            "moz-label",
            "moz-message-bar",
            "moz-page-nav",
            "moz-support-link",
            "moz-toggle",
            "named-deck",
            "panel-list",
        ]
        entries = {}
        progress = {}
        # Ensure the mozilla-central arg has the trailing directory separator
        # so that the line splitting later works as expected on Windows
        # and Unix
        if self.mozilla_source[-1] != "/":
            self.mozilla_source = self.mozilla_source + "/"
        for component in component_names:
            mozilla_central_dir = os.path.abspath(self.mozilla_source)
            query = f'document\\.createElement\\(\"{component}\"\\)|<{component}(?!-)|<html:{component}(?!-)|is=\"{component}\"|is: \"{component}\"'
            comment_query = '(?:\*|\/\/)([^*]|[\r\n]|(\*+([^*/]|[\r\n])))*'
            print("Searching for:", query)

            browser = os.path.join(mozilla_central_dir, "browser")
            toolkit = os.path.join(mozilla_central_dir, "toolkit")
            ignore_file = os.path.abspath(os.path.join(__file__, "../../../", "recomp-ignore"))
  
            # First, find all instances of the component, then get rid of
            # matches that have a comment in them
            command = ['rg', query, browser, toolkit, '--pcre2', "--ignore-file", ignore_file, "--iglob", f"!{component}.*"]
            comment_command = ['rg', comment_query, '-v', '--pcre2']
            initial_rg = subprocess.Popen((command), stdout=subprocess.PIPE)
            output = subprocess.run((comment_command), capture_output=True, encoding="ascii", stdin=initial_rg.stdout)
            initial_rg.wait()
            print(output.stdout)
            for line in output.stdout.split("\n"):
                if not line:
                    continue
                # Ensure that Windows path results from ripgrep
                # are in UNIX style
                unix_line = Path(line)
                has_root = True if unix_line.root == "/" else False
                unix_line = unix_line.as_posix()
                if has_root:
                    sorted_files = list(unix_line)
                    sorted_files[0] = ""
                    unix_line = "".join(sorted_files)
                line = unix_line
                line = re.split(self.mozilla_source, line)[-1]
                path, _ = line.split(":", 1)
                if component not in progress:
                    progress[component] = 0
                    entries[component] = {}
                # Now that ripgrep is outputting a single match per line
                # we can just += 1 to the counts
                progress[component] += 1
                if path not in entries[component]:
                    entries[component][path] = 0
                entries[component][path] += 1

        return (entries, progress)

    def extract_progress(self, dataset: list[dict[str, int]]):

        entries: list[dict[str, str | int]] = []
        progress: defaultdict[str, int] = defaultdict(int)

        for subset in dataset:
            for path, count in subset.items():
                ext = os.path.splitext(path)[1]
                if not ext:
                    continue
                if ext.startswith("."):
                    ext = ext[1:]
                if ext:
                    progress[ext] += count
                entries.append({"file": path, "count": count})

        return (entries, progress)
