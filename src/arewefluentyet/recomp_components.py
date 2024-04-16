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
            print("Searching for:", query)
  
            command = ['rg', query, mozilla_central_dir, "--count", "--pcre2"]
            output = subprocess.run(command, capture_output=True, encoding="ascii")
            print(output.stdout, output.stderr)

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
                path, count = line.split(":")
                if component not in progress:
                    progress[component] = 0
                    entries[component] = {}
                progress[component] += int(count)
                entries[component][path] = int(count)

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
