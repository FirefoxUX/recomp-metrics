const isDashboard = new URL(document.location).searchParams.has("dashboard");
const activeMilestone = new URL(document.location).searchParams.get(
  "milestone"
);

// Takes a color hex value and returns a grey tone.
function generateGreyTone(color) {
  // Remove '#' if present
  let hex = color.replace("#", "");

  // Parse hex into RGB
  var r = parseInt(hex.substring(0, 2), 16);
  var g = parseInt(hex.substring(2, 4), 16);
  var b = parseInt(hex.substring(4, 6), 16);

  // Calculate average
  var avg = Math.round((r + g + b) / 3);

  // Convert average to hex
  var greyHex = avg.toString(16).padStart(2, "0");

  // Return grey hex value
  return "#" + greyHex + greyHex + greyHex;
}

let colors = [
  "#F9CDAC",
  "#F6BEA7",
  "#F3ACA2",
  "#F0939B",
  "#EE8B97",
  "#EB7A92",
  "#E96A8D",
  "#DF5F8C",
  "#DB5087",
  "#C4468D",
  "#B8428C",
  "#A1368F",
  "#973490",
  "#812A92",
  "#742796",
];

let greyTones = colors.map(generateGreyTone);

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
        "moz-checkbox",
        "moz-fieldset",
        "moz-five-star",
        "moz-label",
        "moz-message-bar",
        "moz-page-nav",
        "moz-radio",
        "moz-radio-group",
        "moz-support-link",
        "moz-toggle",
        "named-deck",
        "panel-list",
      ],
      skipInDashboard: [],
      categoriesBar: [0, 10],
      monthIntervals: 6,
    },
  ],
  currentMilestone: "RC",
  activeMilestone: activeMilestone || "RC",
  milestonesStatus: [null],
  aspectMode: null,
  sizeMode: "large",
  dashboard: isDashboard,
  theme: {
    main: {
      font: {
        family: "Atkinson Hyperlegible",
        color: "#343434",
        weight: 400,
      },
      background: "white",
    },
    categories: {
      colors,
      greyTones,
      labels: {
        "moz-button": "moz-button",
        "moz-button-group": "moz-button-group",
        "moz-card": "moz-card",
        "moz-checkbox": "moz-checkbox",
        "moz-fieldset": "moz-fieldset",
        "moz-five-star": "moz-five-star",
        "moz-label": "moz-label",
        "moz-message-bar": "moz-message-bar",
        "moz-page-nav": "moz-page-nav",
        "moz-radio": "moz-radio",
        "moz-radio-group": "moz-radio-group",
        "moz-support-link": "moz-support-link",
        "moz-toggle": "moz-toggle",
        "named-deck": "named-deck",
        "panel-list": "panel-list",
      },
    },
    axes: {
      font: {
        size: {
          small: 12,
          large: 16,
        },
        color: "#909090",
      },
      padding: {
        y: {
          large: 7,
          small: 5,
        },
        x: 0,
      },
    },
    title: {
      font: {
        size: {
          large: 17,
          weight: 500,
          color: "#737373",
        },
      },
    },
    datalabels: {
      title: {
        font: {
          size: {
            large: 15,
            small: 11,
          },
          style: 500,
        },
      },
      labels: {
        font: {
          size: {
            large: 14,
            small: 10,
          },
          style: 400,
        },
      },
      background: "white",
      border: {
        radius: 5,
      },
    },
    points: {
      color: "#ffffff",
      shadow: {
        color: "rgba(0, 0, 0, 0.22)",
        blur: 7,
        offsetX: 1,
        offsetY: 1,
      },
      border: {
        width: 2,
      },
      radius: 4,
    },
    bar: {
      color: "rgba(255, 255, 255, 0.7)",
      width: 1,
    },
  },
  charts: [],
};

const Page = {
  reloadIntoMilestone(ms) {
    State.activeMilestone = ms;
    let url = new URL(document.location);
    url.searchParams.set("milestone", State.activeMilestone);
    document.location.href = url;
  },
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
  getCategories() {
    let activeMilestone = Page.getActiveMilestone();
    let categories = activeMilestone.categories;
    if (State.dashboard) {
      categories = categories.filter(
        (cat) => !activeMilestone.skipInDashboard.includes(cat)
      );
    }
    return categories;
  },
  getCategoriesBar() {
    let activeMilestone = Page.getActiveMilestone();
    let categoriesBar = activeMilestone.categoriesBar.slice();
    if (State.dashboard) {
      for (let idx in activeMilestone.categories) {
        let category = activeMilestone.categories[idx];
        if (activeMilestone.skipInDashboard.includes(category)) {
          if (categoriesBar[0] >= idx) {
            categoriesBar[0]--;
            categoriesBar[1]--;
          }
        }
      }
    }
    return categoriesBar;
  },
  getTitlePosition(aspectMode = State.aspectMode, sizeMode = State.sizeMode) {
    return State.dashboard &&
      (sizeMode == "large" || aspectMode == "heightLimited")
      ? "left"
      : "top";
  },
  getTitleFontSize(aspectMode = State.aspectMode, sizeMode = State.sizeMode) {
    return State.theme.title.font.size.large;
  },
  getYAxisPadding(aspectMode = State.aspectMode, sizeMode = State.sizeMode) {
    return sizeMode == "large"
      ? State.theme.axes.padding.y.large
      : State.theme.axes.padding.y.small;
  },
  getChartFontSize(aspectMode = State.aspectMode, sizeMode = State.sizeMode) {
    return sizeMode == "large"
      ? State.theme.axes.font.size.large
      : State.theme.axes.font.size.small;
  },
  getDatalabelsTitleFontSize(
    aspectMode = State.aspectMode,
    sizeMode = State.sizeMode
  ) {
    return sizeMode == "large"
      ? State.theme.datalabels.title.font.size.large
      : State.theme.datalabels.title.font.size.small;
  },
  getDatalabelsLabelFontSize(
    aspectMode = State.aspectMode,
    sizeMode = State.sizeMode
  ) {
    return sizeMode == "large"
      ? State.theme.datalabels.labels.font.size.large
      : State.theme.datalabels.labels.font.size.small;
  },
};

function layout() {
  let side = document.getElementById("side");
  let footer = document.getElementById("footer");

  let desc = document.getElementById("desc");

  if (State.dashboard) {
    side.prepend(desc);
    document.body.classList.add("dashboard");
  } else {
    footer.prepend(desc);
    document.body.classList.remove("dashboard");
  }
}

function updateAspectMode() {
  let vwRatio = window.innerWidth / window.innerHeight;
  let vmin = Math.min(window.innerWidth, window.innerHeight);

  let newSizeMode = vmin < 500 ? "small" : "large";
  let newAspectMode = vwRatio >= 2 ? "heightLimited" : "widthLimited";

  if (State.sizeMode !== newSizeMode) {
    updateFontSize(newSizeMode);
    document.body.classList.remove(State.sizeMode);
    document.body.classList.add(newSizeMode);
    State.sizeMode = newSizeMode;
  }

  if (State.sizeMode !== newSizeMode || State.aspectMode !== newAspectMode) {
    updateChart(newAspectMode, newSizeMode);
  }

  if (State.aspectMode !== newAspectMode) {
    document.body.classList.remove(State.aspectMode);
    document.body.classList.add(newAspectMode);
    State.aspectMode = newAspectMode;
  }
}

function updateChart(aspectMode, sizeMode) {
  for (var x in State.charts) {
    State.charts[x].options.title.position = Page.getTitlePosition(
      aspectMode,
      sizeMode
    );
    State.charts[x].options.scales.yAxes[0].ticks.padding =
      Page.getYAxisPadding(aspectMode, sizeMode);
    State.charts[x].update();
  }
}

function updateFontSize(sizeMode) {
  let fontSize = Page.getChartFontSize(undefined, sizeMode);
  for (var x in State.charts) {
    // set/change the font-size
    State.charts[x].options.scales.xAxes[0].ticks.minor.fontSize = fontSize;
    State.charts[x].options.scales.yAxes[0].ticks.minor.fontSize = fontSize;

    // set proper spacing for resized font
    State.charts[x].options.scales.xAxes[0].ticks.fontSize = fontSize;
    State.charts[x].options.scales.yAxes[0].ticks.fontSize = fontSize;
  }
}
