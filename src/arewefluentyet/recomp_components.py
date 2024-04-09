import os
import subprocess
from collections import defaultdict
from datetime import date

from data import Aggregator
from source import Source
from milestone import Milestone


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

        for component in component_names:
            print(component)
            query = f"rg 'document\.createElement\(\"{component}\"\)|<{component}|<html:{component}|is=\"{component}\"|is: \"{component}\"' ../gecko-dev --count"
            print(query)
            output = subprocess.run([query], capture_output=True, encoding="ascii", shell=True)
            print(output.stdout, output.stderr)

            for line in output.stdout.split("\n"):
                if not line:
                    continue
                path, count = line.split(":")
                if component not in progress:
                    progress[component] = 0
                    entries[component] = {}
                progress[component] += int(count)
                entries[component][path] = int(count)

        return (entries, progress)

    def old_get_data(self, source: Source, date, revision):
        component_names = ["moz-toggle", "moz-message-bar"]
        entries = {}
        progress = {}

        for component_name in component_names:
            output = subprocess.run([f"rg \<{component_name} ../gecko-dev/browser ../gecko-dev/toolkit --count"], capture_output=True, encoding="ascii", shell=True)

            for line in output.stdout.split("\n"):
                if not line:
                    continue
                path, count = line.split(":")
                if component_name not in progress:
                    progress[component_name] = 0
                    entries[component_name] = []
                progress[component_name] += int(count)
                entries[component_name].append({path: int(count)})
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
