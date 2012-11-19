function debugForce(force, selection) {
  var oldalpha = 0.1;
  function neg(f) {
    return function(v) {
      if (!arguments.length) return -f();
      return f(-v);
    }
  }
  // work around bug https://github.com/mbostock/d3/issues/895
  function ap2(f) {
    return function(v) {
      if (!arguments.length) return f()();
      return f(v);
    }
  }
  var sliders =
    [ {name: 'Charge',        min: 0, max: 600, step: 1,       f: neg(force.charge)},
      {name: 'Gravity',       min: 0, max: 0.3, step: 0.01,    f: force.gravity},
      {name: 'Friction',      min: 0, max: 1,   step: 0.01,    f: force.friction},
      {name: 'Link strength', min: 0, max: 1,   step: 0.01,    f: ap2(force.linkStrength), restart: true},
      {name: 'Link distance', min: 0, max: 80,  step: 1,       f: ap2(force.linkDistance), restart: true},
      {name: 'Alpha',         min: 0, max: 0.1, step: 0.00001, f: force.alpha,             skip: true},
    ];
  selection.insert('table').selectAll('tr').data(sliders)
    .enter()
    .insert('tr')
    .call(function (tr) {
      tr.insert('th')
        .text(function (d) { return d.name });
      var readout = tr.insert('td')
        .attr('class', 'readout')
        .text(function (d) { return d.f() });
      var widgets = tr.insert('td', '.readout')
        .attr('width', '400')
        .each(function (d) {
          $(this).slider({min: d.min, max: d.max, step: d.step, value: d.f(), slide: function(e, ui) {
            d.f(ui.value);
            readout.text(function (d) {return d.f()});
            if (d.restart) force.start();
            else if (!d.skip) force();
          }});
        });
      force.on("tick.debug", function(e) {
        readout.text(function (d) {return d.f()});
        widgets.filter(function (d) {return d.f == force.alpha}).each(function () {$(this).slider("value", e.alpha)});
      });
    });
  var div = selection.insert('div');
  var pause = div.insert("input") // special support for pause
    .attr("type", "checkbox")
    .attr("id", "debugpause")
    .property("checked", force.paused())
    .on("change", function() {force.paused(this.checked)});
  div.insert("label").attr("for", "debugpause").text("Pause");
  var buttons =
      [ {name: "Restart",     f: function() { pause.property("checked", false); // XXX annoying
                                              force.paused(false);
                                              pause.jq().button("refresh");
                                              force.resume(); } },
        {name: "Stop",        f: function() { force.stop(); } },
        {name: "Tick",        f: function() { force.tick(); } },
        {name: "Clear fixed", f: function() { force.nodes().forEach(function(n) {n.fixed = 0;}) } },
      ]
  div.selectAll(".btn").data(buttons)
    .enter()
    .insert("button")
    .attr('class', 'btn')
    .on("click", function(d) {return d.f()})
    .text(function(d) {return d.name});
  div.jq().buttonset();
}
