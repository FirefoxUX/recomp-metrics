window.addEventListener("load", main);

async function main() {
  {
    // Manually trigger external font loading to prevent canvas from drawing before the fonts are ready.
    let atkinsonRegular = new FontFace(
      "Atkinson Hyperlegible",
      "url(./vendor/atkinson_hyperlegible/woff/Atkinson-Hyperlegible-Regular-102.woff)",
      {
        style: "normal",
        weight: "400",
      }
    );
    let atkinsonBold = new FontFace(
      "Atkinson Hyperlegible",
      "url(./vendor/atkinson_hyperlegible/woff/Atkinson-Hyperlegible-Bold-102.woff)",
      {
        style: "normal",
        weight: "500",
      }
    );
    document.fonts.add(atkinsonRegular);
    document.fonts.add(atkinsonBold);
    atkinsonRegular.load();
    atkinsonBold.load();
    await Promise.all([
      atkinsonRegular.loaded,
      atkinsonBold.loaded,
    ]);
  }

  layout();
  updateAspectMode();

  let ms = Page.getActiveMilestone();
  let chart = create_chart(
    "#main-chart > canvas",
    await prepare_data(`./data/RC/progress.json`)
  );
  State.charts.push(chart);

  //Page.updateMilestones();
  //Page.setListLinkTarget();

  if (State.dashboard) {
    //updateAspectMode();
    //await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  document.body.style.display = "block";
  window.addEventListener("resize", updateAspectMode);
}

function create_chart(selector, { all_labels, month_labels, data }) {
  // This hack allows us to draw shadow for the circles
  let draw = Chart.controllers.line.prototype.draw;
  Chart.controllers.line = Chart.controllers.line.extend({
    draw: function (ease) {
      draw.call(this, ease);
      let ctx = this.chart.chart.ctx;
      if (!ctx.stroke._fixed) {
        let _stroke = ctx.stroke;
        ctx.stroke = function () {
          ctx.save();
          if (this.strokeStyle == State.theme.points.color) {
            ctx.shadowColor = State.theme.points.shadow.color;
            ctx.shadowBlur = State.theme.points.shadow.blur;
            ctx.shadowOffsetX = State.theme.points.shadow.offsetX;
            ctx.shadowOffsetY = State.theme.points.shadow.offsetY;
          }
          _stroke.apply(this, arguments);
          ctx.restore();
        };
        ctx.stroke._fixed = true;
      }
    },
  });

  let ctx = document.querySelector(selector).getContext("2d");
  let chart = get_chart(ctx, data, all_labels, month_labels);
  document.addEventListener("click", (e) => {
    if (e.target.localName !== "canvas" && chart.filtered) {
      chart.data.datasets.forEach((dataset) => {
        let index = Page.getCategories().indexOf(dataset.label);
        dataset.backgroundColor = State.theme.categories.colors[index];
      });
      chart.filtered = false;
      chart.update();
    }
  })
  return chart;
}
