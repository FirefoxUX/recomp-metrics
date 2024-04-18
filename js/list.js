const activeMilestone = new URL(document.location).searchParams.get(
  "milestone"
);

const State = {
  milestones: [
    {
      code: "RC",
      name: "mozilla-central",
      title: "Reusable Components usage",
      categories: [
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
      ],
      columns: ["file", "count"],
      skipInDashboard: [],
      categoriesBar: [0, 10],
      monthIntervals: 6,
    },
  ],
  currentMilestone: "RC",
  activeMilestone: activeMilestone || "RC",
};

const Page = {
  getActiveMilestone() {
    for (let milestone of State.milestones) {
      if (milestone.code == State.activeMilestone) {
        return milestone;
      }
    }
    for (let milestone of State.milestones) {
      if (milestone.code == State.currentMilestone) {
        return milestone;
      }
    }
    return null;
  },
};

async function loadFile() {
  let response = await fetch(`./data/${State.activeMilestone}/snapshot.json`);
  let snapshot = await response.json();

  document.getElementById("meta-milestone").textContent = State.activeMilestone;
  document.getElementById("meta-date").textContent = snapshot.date;
  document.getElementById("meta-rev").textContent = snapshot.revision;

  return prepareData(snapshot.data);
}

function formatStack(stack) {
  if (!stack) {
    return "";
  }
  if (typeof stack === "string") {
    return stack;
  }
  let title = "";
  for (let line of stack) {
    title += `[${line.index}] ${line.call} ${line.path}:${line.line}\n`;
  }
  let span = document.createElement("span");
  let path = stack[0].path.length > 70 ? "" : stack[0].path;
  span.textContent = `${stack[0].call} ${path}:${stack[0].line}`;
  span.setAttribute("title", title);
  return span.outerHTML;
}

function normalizePath(path) {
  let idx = path.indexOf("en-US/");
  if (idx === -1) {
    return path;
  }
  return path.substring(idx + 6);
}

function getEntryFile(entry) {
  if (entry.file) {
    return getLinkForPath(normalizePath(entry.file));
  }
  return "";
}

function getIdPath(entry) {
  if (entry.id) {
    return getLinkForId(entry.id);
  }
  return "";
}

const twoPartModules = ["devtools", "security"];

function getLinkForPath(path) {
  let [mod] = path.split("/", 1);
  let moduleChunks = twoPartModules.includes(mod) ? 2 : 1;
  let module = path.split("/", moduleChunks).join("/");
  let rest = path.substr(module.length + 1);
  let sfPath = `https://searchfox.org/mozilla-central/source/${module}/locales/en-US/${rest}`;
  return `<a href="${sfPath}">${path}</a>`;
}

function getLinkForId(id) {
  let sfPath = `https://searchfox.org/mozilla-central/source/${id}`;
  return `<a href="${sfPath}">${id}</a>`;
}

function prepareData(data) {
  let result = {
    data: [],
    columns: [],
    order: null,
  };

  for (let [component, references] of Object.entries(data)) {
    let componentData = Object.entries(references).map(
      ([file, occurrences], i) => ({
        order: i,
        type: component,
        file: getLinkForId(file.replace("../gecko-dev/", "")),
        count: occurrences || 1,
        id: getIdPath(file),
      })
    );
    result.data.push({ component, data: componentData });
  }

  let activeMilestone = Page.getActiveMilestone();
  result.columns = [
    {
      title: "Order",
      data: "order",
      visible: activeMilestone.columns.includes("order"),
    },
    {
      title: "Type",
      data: "type",
      visible: activeMilestone.columns.includes("type"),
    },
    {
      title: "ID",
      data: "id",
      visible: activeMilestone.columns.includes("id"),
    },
    {
      title: "File",
      data: "file",
      visible: activeMilestone.columns.includes("file"),
    },
    {
      title: "Count",
      data: "count",
      visible: activeMilestone.columns.includes("count"),
    },
  ];
  result.order = activeMilestone.columnSort;
  return result;
}

$(document).ready(async function () {
  let { data, columns, order } = await loadFile();
  let tableTemplate = document.getElementById("table-template");
  let tableContainer = document.getElementById("table-container");

  data.forEach(({ component, data }, i) => {
    let table = tableTemplate.cloneNode(true);
    table.id = `data-table-${i}`;
    tableContainer.appendChild(table);

    let tableHeading = document.createElement("h2");
    tableHeading.innerText = `${component}`;
    table.before(tableHeading);
    $(table).DataTable({
      data,
      columns,
      order,
      destroy: true,
      searching: false, 
      paging: false
    });
  });
});
