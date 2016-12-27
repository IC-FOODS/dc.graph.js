dc_graph.select_nodes = function(props) {
    var select_nodes_group = dc_graph.select_nodes_group('select-nodes-group');
    var _selected = [], _oldSelected;
    var _brush;

    // http://stackoverflow.com/questions/7044944/jquery-javascript-to-detect-os-without-a-plugin
    var is_a_mac = navigator.platform.toUpperCase().indexOf('MAC')!==-1;

    function isUnion(event) {
        return event.shiftKey;
    }
    function isToggle(event) {
        return is_a_mac ? event.metaKey : event.ctrlKey;
    }
    function add_array(a, v) {
        return a.indexOf(v) >= 0 ? a : a.concat([v]);
    }
    function toggle_array(a, v) {
        return a.indexOf(v) >= 0 ? a.filter(function(x) { return x != v; }) : a.concat([v]);
    }

    function add_behavior(chart, node, edge) {
        var condition = _behavior.noneIsAll() ? function(n) {
            return !_selected.length || _selected.indexOf(n.orig.key) >= 0;
        } : function(n) {
            return _selected.indexOf(n.orig.key) >= 0;
        };
        chart.cascade(50, true, conditional_properties(condition, null, props));

        node.on('click.select-nodes', function(d) {
            var key = chart.nodeKey.eval(d);
            if(isUnion(d3.event))
                _selected = add_array(_selected, key);
            else if(isToggle(d3.event))
                _selected = toggle_array(_selected, key);
            else
                _selected = [key];
            chart.refresh(node, edge);
            select_nodes_group.node_set_changed(_selected);
            d3.event.stopPropagation();
        });
        function brushstart() {
            if(isUnion(d3.event.sourceEvent) || isToggle(d3.event.sourceEvent))
                _oldSelected = _selected.slice();
            else
                _oldSelected = _selected = [];
            chart.refresh();
            select_nodes_group.node_set_changed(_selected);
        }
        function brushmove() {
            var ext = _brush.extent();
            var rectSelect = node.data().filter(function(n) {
                return ext[0][0] < n.cola.x && n.cola.x < ext[1][0] &&
                    ext[0][1] < n.cola.y && n.cola.y < ext[1][1];
            }).map(function(n) {
                return n.orig.key;
            });
            if(isUnion(d3.event.sourceEvent))
                _selected = rectSelect.reduce(add_array, _oldSelected);
            else if(isToggle(d3.event.sourceEvent))
                _selected = rectSelect.reduce(toggle_array, _oldSelected);
            else
                _selected = rectSelect;
            chart.refresh();
            select_nodes_group.node_set_changed(_selected);
        }
        function brushend() {
            gBrush.call(_brush.clear());
        }
        _brush = d3.svg.brush()
            .x(chart.x()).y(chart.y())
            .on('brushstart', brushstart)
            .on('brush', brushmove)
            .on('brushend', brushend);

        var gBrush = chart.g().insert('g', ':first-child')
                .attr('class', 'brush')
                .call(_brush);

        // drop any selected which no longer exist in the diagram
        var present = node.data().map(function(d) { return d.orig.key; });
        var nselect = _selected.length;
        _selected = _selected.filter(function(k) { return present.indexOf(k) >= 0; });
        if(_selected.length !== nselect)
            select_nodes_group.node_set_changed(_selected);
    }

    function remove_behavior(chart, node, edge) {
        node.on('click.select-nodes', null);
        chart.svg().on('click.select-nodes', null);
        chart.cascade(50, false, props);
    }

    var _behavior = dc_graph.behavior('select-nodes', {
        add_behavior: add_behavior,
        remove_behavior: function(chart, node, edge) {
            remove_behavior(chart, node, edge);
        }
    });
    _behavior.noneIsAll = property(false);
    return _behavior;
};

dc_graph.select_nodes_group = function(brushgroup) {
    window.chart_registry.create_type('select-nodes', function() {
        return d3.dispatch('node_set_changed');
    });

    return window.chart_registry.create_group('select-nodes', brushgroup);
};