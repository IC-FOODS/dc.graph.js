var selectionDiagram = dc_graph.diagram("#canvas"),
  pie,
  row;

var options = {
  layout: {
    default: "d3v4force",
    values: dc_graph.engines.available(),
    selector: "#layout",
    needs_relayout: true,
    exert: function (val, diagram) {
      var engine = dc_graph.spawn_engine(val);
      apply_engine_parameters(engine);
      diagram.layoutEngine(engine);
    },
  },
  worker: {
    default: false,
  },
  file: null,
  n: {
    default: 100,
    values: [1, 5, 10, 20, 50, 100, 200],
    selector: "#number",
    needs_redraw: true,
    exert: function (val, diagram) {
      alert("banned");
      //   populate(val);
      //   diagram.autoZoom("once");
    },
  },
  tips: true,
  transition_duration: {
    query: "tdur",
    default: 1000,
  },
  arrows: {
    default: "head",
  },
  validate: false,
  minWidth: {
      default: 200,
      query: 'minw'
  },
  minHeight: {
      default: 200,
      query: 'minh'
  },
  fit: {
      default: 'default',
      selector: '#fit',
      values: [
          'default',
          'vertical',
          'horizontal',
          'align_tl',
          'align_tr',
          'align_bl',
          'align_br',
          'zoom'
      ],
      needs_redraw: true,
      exert: function(val, diagram) {
          diagram.fitStrategy(val);
      }
  }
};
var sync_url = sync_url_options(
  options,
  dcgraph_domain(selectionDiagram),
  selectionDiagram
);

console.log("---", sync_url);

function display_error(heading, message) {
  d3.select("#message")
    .style("display", null)
    .html(
      "<div><h1>" +
        heading +
        "</h1>" +
        (message ? "<code>" + message + "</code></div>" : "")
    );
  throw new Error(message);
}

function hide_error() {
  d3.select("#message").style("display", "none");
}

function apply_engine_parameters(engine) {
  switch (engine.layoutAlgorithm()) {
    case "d3v4-force":
      engine.collisionRadius(25).gravityStrength(0.05).initialCharge(-500);
      break;
    case "d3-force":
      engine.gravityStrength(0.1).initialCharge(-1000);
      break;
  }
  // selectionDiagram.initLayoutOnRedraw(engine.layoutAlgorithm() === "cola");
  return engine;
}
function build_data(nodes, edges) {
  // build crossfilters from scratch
  return {
    edgef: dc_graph.flat_group.make(edges, function (d) {
      return d.key;
    }),
    nodef: dc_graph.flat_group.make(nodes, function (d) {
      return d.key;
    }),
  };
}

var load_graph = function (nodes, edges) {
  var data = build_data(nodes, edges),
    colorDimension = data.nodef.crossfilter.dimension(function (n) {
      return n.color;
    }),
    colorGroup = colorDimension.group(),
    dashDimension = data.edgef.crossfilter.dimension(function (e) {
      return e.dash;
    }),
    dashGroup = dashDimension.group();
  selectionDiagram
    .nodeDimension(data.nodef.dimension)
    .nodeGroup(data.nodef.group)
    .edgeDimension(data.edgef.dimension)
    .edgeGroup(data.edgef.group);
  pie.dimension(colorDimension).group(colorGroup);
  row.dimension(dashDimension).group(dashGroup);
};

var populate = function (n) {
  load_graph(
    [
      { key: "Father", color: 0 },
      { key: "son1", color: 0 },
      { key: "daughter1", color: 1 },
      { key: "son2", color: 0 },
      { key: "son3", color: 0 },
      { key: "grandkid1", color: 0 },
      { key: "grandkid2", color: 1 },
      { key: "grandkid3", color: 0 },
      { key: "grandkid4", color: 0 },
      { key: "grandkid5", color: 1 },
      { key: "pet1", color: 2 },
      { key: "pet2", color: 2 },
      { key: "pet3", color: 2 },
      { key: "pet4", color: 2 },
      { key: "pet5", color: 2 },
    ],
    [
      { key: "son1", sourcename: "Father", targetname: "son1", dash: 0 },
      { key: "daughter1", sourcename: "Father", targetname: "daughter1", dash: 0 },
      { key: "son2", sourcename: "Father", targetname: "son2", dash: 0 },
      { key: "son3", sourcename: "Father", targetname: "son3", dash: 0 },
      { key: "grandkid1", sourcename: "son1", targetname: "grandkid1", dash: 1 },
      { key: "grandkid2", sourcename: "daughter1", targetname: "grandkid2", dash: 1 },
      { key: "grandkid3", sourcename: "daughter1", targetname: "grandkid3", dash: 1 },
      { key: "grandkid1", sourcename: "son1", targetname: "grandkid1", dash: 1 },
      { key: "grandkid4", sourcename: "son2", targetname: "grandkid4", dash: 1 },
      { key: "grandkid5", sourcename: "son3", targetname: "grandkid5", dash: 1 },
      { key: "pet1", sourcename: "grandkid1", targetname: "pet1", dash: 2 },
      { key: "pet2", sourcename: "grandkid1", targetname: "pet2", dash: 2 },
      { key: "pet3", sourcename: "grandkid5", targetname: "pet3", dash: 2 },
      { key: "pet4", sourcename: "grandkid5", targetname: "pet4", dash: 2 },
      { key: "pet5", sourcename: "grandkid5", targetname: "pet5", dash: 2 },
    ]
  );
};

var on_load = function (filename, error, data) {
  if (error) {
    var heading = "";
    if (error.status) heading = "Error " + error.status + ": ";
    heading += "Could not load file " + filename;
    display_error(heading, error.message);
  }
  var graph_data = dc_graph.munge_graph(data);
  console.log(graph_data);
  load_graph(graph_data.nodes, graph_data.edges);
  selectionDiagram.autoZoom("always");
  dc.redrawAll();
};

d3.select("#user-file").on("change", function () {
  var filename = this.value;
  if (filename) {
    var reader = new FileReader();
    reader.onload = function (e) {
      hide_error();
      dc_graph.load_graph_text(
        e.target.result,
        filename,
        on_load.bind(null, filename)
      );
    };
    reader.readAsText(this.files[0]);
  }
});

var engine = dc_graph.spawn_engine(
  sync_url.vals.layout,
  querystring.parse(),
  sync_url.vals.worker
);
apply_engine_parameters(engine);
if(engine.layoutAlgorithm()==='cola')
    if(typeof sync_url.vals.newcomp !== 'string')
        sync_url.vals.newcomp = 0;
var colors = ['#1b9e77', '#d95f02', '#7570b3'];
var dasheses = [
  { name: "level_1", ray: [15, 10, 5, 10] },
  { name: "level_2", ray: [5, 5] },
  { name: "level_3", ray: [1, 5] },
];
selectionDiagram
  .layoutEngine(engine)
  .timeLimit(sync_url.vals.interval - 100)
  .transitionDuration(sync_url.vals.transition_duration)
  .fitStrategy(sync_url.vals.fit || 'default')
  .restrictPan(true)
  // .margins({ top: 5, left: 5, right: 5, bottom: 5 })
  .autoZoom('always')
  .zoomDuration(sync_url.vals.transition_duration)
  .zoomExtent([0.1, 1.5])
  .altKeyZoom(true)
  .width('auto')
  .height('auto')
  .nodeFixed(function (n) {
    return n.value.fixed;
  })
  .nodeStrokeWidth(0) // turn off outlines
  .nodeLabel(dc.pluck("key"))
  .nodeLabelFill(function (n) {
    var rgb = d3.rgb(
        selectionDiagram.nodeFillScale()(selectionDiagram.nodeFill()(n))
      ),
      // https://www.w3.org/TR/AERT#color-contrast
      brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
    return brightness > 127 ? "black" : "ghostwhite";
  })
  .nodeFill(function (kv) {
    return kv.value.color;
  })
  .nodeOpacity(0.25)
  .edgeOpacity(0.25)
  .timeLimit(1000)
  .nodeFillScale(d3.scale.ordinal().domain([0, 1, 2]).range(colors))
  .nodeTitle(dc.pluck("key"))
  .edgeStrokeDashArray(function (e) {
    return dasheses[e.value.dash].ray;
  })
  .edgeArrowhead(
    sync_url.vals.arrows === "head" || sync_url.vals.arrows === "both"
      ? "vee"
      : null
  )
  .edgeArrowtail(
    sync_url.vals.arrows === "tail" || sync_url.vals.arrows === "both"
      ? "crow"
      : null
  );

selectionDiagram.child(
  "select-nodes",
  dc_graph
    .select_nodes({
      nodeOpacity: 1,
    })
    .noneIsAll(true)
    .autoCropSelection(false)
);
selectionDiagram.child(
  "filter-selection-nodes",
  dc_graph.filter_selection("select-nodes-group", "select-nodes")
);

selectionDiagram.child("move-nodes", dc_graph.move_nodes());

selectionDiagram.child(
  "fix-nodes",
  dc_graph.fix_nodes({
    fixedPosTag: "fixed",
  })
);

if(sync_url.vals.tips) {
        var tip = dc_graph.tip();
        var json_table = dc_graph.tip.html_or_json_table()
            .json(function(d) {
                return (d.orig.value.value || d.orig.value).jsontip || JSON.stringify(d.orig.value);
            });
        tip
            .showDelay(250)
            .content(json_table);
        selectionDiagram.child('tip', tip);
    }

selectionDiagram.child(
  "select-edges",
  dc_graph
    .select_edges({
      edgeStrokeWidth: 2,
      edgeOpacity: 1,
    })
    .noneIsAll(true)
    .autoCropSelection(false)
);
selectionDiagram.child(
  "filter-selection-edges",
  dc_graph
    .filter_selection("select-edges-group", "select-edges")
    .dimensionAccessor(function (c) {
      return c.edgeDimension();
    })
);

if(sync_url.vals.ports) {
    selectionDiagram
        .portStyle('symbols', dc_graph.symbol_port_style())
        .portStyleName('symbols');
}
// var fix_nodes = dc_graph.fix_nodes()
//     .strategy(dc_graph.fix_nodes.strategy.last_N_per_component(1));
// selectionDiagram.child('fix-nodes', fix_nodes);

if(sync_url.vals.validate)
    selectionDiagram.child('troubleshoot', dc_graph.validate());

// selectionDiagram
//     .autoZoom('always-skipanimonce')
//     .render();

$('#resize').resizable({
    resize: function(event, ui) {
        selectionDiagram.redraw();
    },
    minWidth: sync_url.vals.minWidth,
    minHeight: sync_url.vals.minHeight
});

pie = dc
  .pieChart("#pie")
  .width(150)
  .height(150)
  .radius(75)
  .colors(d3.scale.ordinal().domain([0, 1, 2]).range(colors))
  .label(function () {
    return "";
  })
  .title(function (kv) {
    return colors[kv.key] + " nodes (" + kv.value + ")";
  });

row = dc
  .rowChart("#row")
  .width(300)
  .height(150)
  .label(function (kv) {
    return dasheses[kv.key].name;
  });

if (sync_url.vals.file)
  dc_graph.load_graph(
    sync_url.vals.file,
    on_load.bind(null, sync_url.vals.file)
  );
else {
  populate(sync_url.vals.n);
  dc.renderAll();
}
