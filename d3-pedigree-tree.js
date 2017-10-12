function pedigreeTree(){
  var self = this,
      parents = function(d){return d.parents;},
      id = function(d){return d.id;},
      value = function(d){return d;},
      parentsOrdered = true,
      levelWidth = 10,
      nodePadding = 10,
      linkPadding = 10,
      nodeWidth = 5,
      updateDuration = 0;
      sort = 1,
      groupChildless = false,
      minGroupSize = 2,
      groupExpand = 10,
      hoverhide = false,
      excludeFromGrouping = {},
      data = [],
      autofitSelector = null,
      zoomEnabled = false;
  
  function pdgtree(selector,isUpdate,zoom){
    var layout = pdgtree.treeLayout();
    var trans = d3.transition().duration(isUpdate?updateDuration:0).ease(d3.easeLinear);
    var node_data = layout.nodes,
        link_data = layout.links,
        mating_data = layout.matings,
        main_selected = d3.select(selector);
    
    var canv = main_selected;
    //if zoomEnabled, create background and/or create/select inner canvas
    if (zoomEnabled){
      if(main_selected.select('.zoom-controller').empty()){
        main_selected.append('rect')
          .classed('zoom-controller',true)
          .attr("x",-1000000)
          .attr("y",-1000000)
          .attr("width",2000000)
          .attr("height",2000000)
          .attr("fill","white")
          .style("cursor", "move");
      }
      canv = main_selected.select(".pedigreeTree-canv");
      if(canv.empty()){
        canv = main_selected.append('g').classed("pedigreeTree-canv",true);
      }
      if(!zoom){
        zoom = d3.zoom()
          .scaleExtent([0.2,1000])
          .interpolate(d3.interpolate)
          .on("zoom",function(d){
            canv.attr("transform",d3.event.transform);
          });
        main_selected.select('.zoom-controller')
          .call(zoom)
          .on("dblclick.zoom", function(){
            d3.select(this)
              .transition(d3.transition().ease(d3.easeLinear))
              .call(zoom.transform,d3.zoomIdentity);
            return false;
          });
      }
    }
        
    //create layers
    if(canv.select('.link-g').empty()){
      canv.append('g').classed('link-g',true).attr("opacity","0.8");
    }
    if(canv.select('.mating-g').empty()){
      canv.append('g').classed('mating-g',true);
    }
    if(canv.select('.node-g').empty()){
      canv.append('g').classed('node-g',true);
    }
    
    //update nodes
    var nodes = canv.select('.node-g').selectAll('.node')
      .data(node_data,function(d){
        return d.id;
      });
    nodes.exit().remove();
    var newNodes = nodes.enter().append('g')
      .classed('node',true)
      .attr("opacity",0) 
      .attr('transform', function(d){
        var start_pos = [d.x,d.y];
        //for group expansions
        if(d3.event && d3.event.type=="click"){
          var clicked_data = d3.select(d3.event.target).datum();
          if(clicked_data !== undefined){
            start_pos = [clicked_data.x,clicked_data.y];
          }
        }
        return 'translate(' + start_pos[0] + ',' + start_pos[1] + ')';
      });
    // newNodes.append('text').attr("x",10).text(function(d){return d.id});
    newNodes.append('circle')
      .attr('r',6)
      .attr('fill',"black")
      .attr('stroke',"white");
    var allNodes = newNodes.merge(nodes)
      .transition(trans)
      .attr("opacity",1)
      .attr('transform', function(d){
        return 'translate(' + d.x + ',' + d.y + ')';
      })
      .selection();
    if (hoverhide){
      var hightlight_timeout = null;
      allNodes.on("mouseout",function(d){
        var htrans = d3.transition("htrans").ease(d3.easePolyOut).duration(1000);
        canv.select('.link-g').selectAll('.link')
          .transition(htrans)
          .attr("opacity","1");
        canv.select('.node-g').selectAll('.node')
          .transition(htrans)
          .attr("opacity","1");
        });
    }
      
    //update links
    var stepline = d3.line().curve(d3.curveStep);
    var curveline = d3.line().curve(d3.curveBasis);
    var links = canv.select('.link-g').selectAll('.link')
      .data(link_data,function(d){
        return d.id;
      });
    links.exit().remove();
    var newLinks = links.enter().append('g')
      .classed('link',true)
      .attr("opacity","0");
    newLinks.append('path')
      .attr('fill','none')
      .attr('stroke-width',2)
      .attr("shape-rendering","geometricPrecision")
      .attr('stroke','red')
      .attr('d',function(d){
        //for group expansions
        if(d3.event && d3.event.type=="click"){
          var clicked_data = d3.select(d3.event.target).datum();
          if(clicked_data !== undefined){
            var click_d_point = [clicked_data.x,clicked_data.y];
            return d3.line()([click_d_point,click_d_point,click_d_point,click_d_point]);
          }
        }
        //otherwise
        var sink_point = d.path[d.path.length-1];
        return d3.line()([sink_point,sink_point,sink_point,sink_point]);
      });
    var allLinks = newLinks.merge(links);
    allLinks.transition(trans).attr("opacity",1).select('path').attr('d',function(d){
      if (d.type=="parent->mid"){
        return curveline(d.path);
      }
      return stepline(d.path);
    });
    
    //add expansion behaviour to groups.
    allNodes.filter(function(d){return d.type=="node-group"})
      .style("cursor", "pointer")
      .on("click",function(d){
        console.log(this,d);
        pdgtree.excludeFromGrouping(d.value.slice(0,groupExpand));
        var draw_out = pdgtree(selector,true,zoom);
      })
      .select("circle")
      .attr('fill',"white")
      .attr('stroke',"black");
    
    var draw_out = {'tree':layout,'trans':trans}
    if (autofitSelector){
      autofit_svg(draw_out);
    }
    return draw_out;
  }
  
  pdgtree.data = function(arr){
    data = arr;
    return pdgtree;
  }
  pdgtree.zoomable = function(bool){
    zoomEnabled = bool;
    return pdgtree;
  }
  pdgtree.updateDuration = function(dur){
    updateDuration = dur;
    return pdgtree;
  }
  pdgtree.parents = function(func){
    parents=func;
    return pdgtree;
  };
  pdgtree.parentsOrdered = function(bool){
    parentsOrdered = bool;
    return pdgtree;
  };
  pdgtree.id = function(func){
    id=func;
    return pdgtree;
  };
  pdgtree.levelWidth = function(val){
    levelWidth = val;
    return pdgtree;
  };
  pdgtree.nodePadding = function(val){
    nodePadding = val;
    return pdgtree;
  };
  pdgtree.linkPadding = function(val){
    linkPadding = val;
    return pdgtree;
  };
  pdgtree.nodeWidth = function(val){
    nodeWidth = val;
    return pdgtree;
  };
  pdgtree.sort = function(runs){
    sort = runs;
    return pdgtree;
  };
  pdgtree.value = function(func){
    value = func;
    return pdgtree;
  };
  pdgtree.groupChildless = function(bool){
    groupChildless = bool;
    return pdgtree;
  }
  pdgtree.minGroupSize = function(val){
    minGroupSize = val;
    return pdgtree;
  }
  pdgtree.groupExpand = function(val){
    groupExpand = val;
    return pdgtree;
  }
  pdgtree.hideOnHover = function(bool){
    hoverhide = bool;
    return pdgtree;
  }
  pdgtree.resetGroups = function(){
    excludeFromGrouping = {};
    return pdgtree;
  }
  pdgtree.excludeFromGrouping = function(nodes){
    nodes.forEach(function(node_data){excludeFromGrouping[id(node_data)] = true;});
    return pdgtree;
  }
  pdgtree.autofit = function(selector){
    autofitSelector = selector;
    return pdgtree;
  }
  
  pdgtree.treeLayout = function(){
    //create working nodes from input data (we dont want to modify the input) 
    var node_list = wrap_nodes(data);
    node_list.forEach(function(d){setNodeLevels(d);});
    setBestRootNodeLevels(node_list);
    
    //create intermediate nodes for intergenerational links
    var intermediates = {};
    for (var n = node_list.length-1; n > -1; n--) {
      var node = node_list[n];
      for (var i = node.children.length-1; i > -1; i--) {
        var child = node.children[i];
        if (node.level<child.level-1){
          node.children.splice(i,1);
          child.parents.splice(child.parents.indexOf(node),1);
          var current = node;
          while (current.level<child.level-1){
            var next_level = current.level+1;
            var intermediate_id = "LI::"+next_level+"::"+node.id+"->"+child.sib_group_id;
            if (!intermediates[intermediate_id]){
              intermediates[intermediate_id] = {
                'type':'link-intermediate', 
                'id':intermediate_id,
                'sib_group_id':intermediate_id, 
                'level':next_level,
                'children':[], 
                'parents':[current]
              };
              current.children.push(intermediates[intermediate_id]);
              node_list.push(intermediates[intermediate_id]);
            }
            current = intermediates[intermediate_id];
          }
          current.children.push(child);
          child.parents.push(current);
        }
      }
    }
    
    var levels = getLevels(node_list);
    sortTree(levels);
    
    var xrange = [0,levelWidth*(levels.length-1)]
    var x = d3.scaleLinear()
      .domain([0,levels.length-1])
      .range(xrange);
      
    var yrange = [Number.POSITIVE_INFINITY,Number.NEGATIVE_INFINITY];
    levels.forEach(function(level,i){
      var level_x = x(i);
      level.forEach(function(node,j){
        if (node.sort_ypos < yrange[0]) yrange[0] = node.sort_ypos;
        if (node.sort_ypos > yrange[1]) yrange[1] = node.sort_ypos;
      });
    });
    var yoffset = yrange[0];
    yrange = [yrange[0]-yoffset,[yrange[1]-yoffset]];
    
    levels.forEach(function(level,i){
      var level_x = x(i);
      level.forEach(function(node,j){
        node.y = node.sort_ypos-yoffset;
        node.x = level_x;
      });
    });
    
    //remove intergenerational link intermediates and make link paths
    node_list = [].concat.apply([], levels).filter(function(node){return node.type!="link-intermediate"});
    var sibling_points = d3.nest()
      .key(function(node){return node.sib_group_id})
      .entries(node_list).reduce(function(sibling_points,sib_group){
        sibling_points_x = x(sib_group.values[0].level-0.5);
        sibling_points_y = d3.mean(sib_group.values,function(n){return n.y});
        sibling_points[sib_group.key] = [sibling_points_x,sibling_points_y];
        return sibling_points;
      });
      
    var inner_link = inner_link_layer(5,0.25,0.75);
    var links = d3.values(node_list.reduce(function(links,node){
      for (var i = node.children.length-1; i > -1 ; i--) {
        var child = node.children[i];
        if (child.type == "link-intermediate"){
          node.children.splice(i,1);
          var curr = child;
          var last = node;
          var prepath = [];
          while (curr.type == "link-intermediate"){
            prepath = prepath.concat(
              inner_link(
                last.x,last.y,
                x(curr.level-0.5),curr.y,
                curr.level
              )
            );
            last = curr;
            curr = curr.children[0];
          }
          last.children.forEach(function(end_child){
            node.children.push(end_child);
            end_child.parents.splice(end_child.parents.indexOf(last),1);
            end_child.parents.push(node);
            
            var path = prepath.concat(
              inner_link(
                last.x,last.y,
                sibling_points[end_child.sib_group_id][0],sibling_points[end_child.sib_group_id][1],
                end_child.level
              )
            );
            path.push(sibling_points[end_child.sib_group_id]);
            parent_link_id = "LINK::"+node.id+"-->--"+end_child.sib_group_id;
            if (!links[parent_link_id]){
              links[parent_link_id] = {'source':node,'sinks':[end_child],'type':'parent->mid','id':parent_link_id,'path':path};
            } else {
              links[parent_link_id].sinks.push(end_child);
            }
            child_link_id = "LINK::parents-->--"+end_child.id;
            if(!links[child_link_id]){
              links[child_link_id] = {'sources':[node],'sink':end_child,'type':'mid->child','id':child_link_id,'path':[sibling_points[end_child.sib_group_id],[end_child.x,end_child.y]]};
            } else {
              links[child_link_id].sources.push(node);
            }
          });
        }
        else {
          parent_link_id = "LINK::"+node.id+"-->--"+child.sib_group_id;
          if (!links[parent_link_id]){
            var path = inner_link(
              node.x,node.y,
              sibling_points[child.sib_group_id][0],sibling_points[child.sib_group_id][1],
              node.level+1
            )
            links[parent_link_id] = {'source':node,'sinks':[child],'type':'parent->mid','id':parent_link_id,'path':path};
          } else {
            links[parent_link_id].sinks.push(child);
          }
          child_link_id = "LINK::parents-->--"+child.id
          if (!links[child_link_id]){
            links[child_link_id] = {'sources':[node],'sink':child,'type':'mid->child','id':child_link_id,'path':[sibling_points[child.sib_group_id],[child.x,child.y]]};
          } else {
            links[child_link_id].sources.push(node);
          }
        }
      }
      return links;
    },{}));
    
    return {'nodes':node_list, 'links':links, 'x':xrange,'y':yrange, 'self':pdgtree}
  }
  
  
  
  function autofit_svg(draw_out){
    afsel = d3.select(autofitSelector);
    wrap_width = afsel.attr("width");
    wrap_height = afsel.attr("height");
    var padding = 100;
    var x0 = -padding,
        y0 = -padding,
        view_width = draw_out.tree.x[1]-draw_out.tree.x[0]+padding*2,
        view_height = draw_out.tree.y[1]-draw_out.tree.y[0]+padding*2;  
        
    if (wrap_width/view_width<wrap_height/view_height){
      y0 = (draw_out.tree.y[1]-draw_out.tree.y[0])/2;
      view_height = wrap_height/wrap_width*view_width;
      y0 += -view_height/2;
    } else {
      x0 = (draw_out.tree.x[1]-draw_out.tree.x[0])/2;
      view_width = wrap_width/wrap_height*view_height;
      x0 += -view_width/2;
    }
    afsel.transition(draw_out.trans)
      .attr("viewBox",""+x0+" "+y0+" "+view_width+" "+view_height);
  }
  
  function wrap_nodes(data){
    var idmap = {};
    var wrapped_nodes = data.map(function(node_data){
        var node_id = id(node_data);
        idmap[node_id] = {
          'type':'node', 
          'id':id(node_data), 
          'value':value(node_data), 
          'children':[], 
          '_node_data':node_data
        };
        return idmap[node_id];
      });
    wrapped_nodes.forEach(function(wrapped){
        var parent_ids = parents(wrapped._node_data).map(id);
        if (!parentsOrdered) parent_ids.sort();
        wrapped.sib_group_id = parent_ids.length>0 ? "S::"+parent_ids.join("++M++") : "S::_ROOT_";
        wrapped.parents = parent_ids.map(function(p_id){return idmap[p_id];});
        wrapped.parents.forEach(function(parent){
          parent.children.push(wrapped);
        });
      });
    if (groupChildless){
      var sibling_groups = d3.nest().key(function(wrapped){
          return wrapped.sib_group_id;
        })
        .entries(wrapped_nodes);
      var grouped = sibling_groups.reduce(function(grouped, sibling_group){
        var groupable = sibling_group.values.filter(function(wrapped){
          return wrapped.children.length==0 && !excludeFromGrouping[wrapped.id];
        });
        if (groupable.length>=minGroupSize) {
          var group_id = "G::"+sibling_group.key;
          grouped[group_id] = {
            'type':'node-group', 
            'id':group_id, 
            'sib_group_id':sibling_group.key,
            'value':groupable, 
            'children':[]
          };
          grouped[group_id].parents = groupable[0].parents.map(function(p){
            p.children.push(grouped[group_id]);
            return p;
          })
          sibling_group.values.forEach(function(wrapped){
            if (wrapped.children.length>0 || excludeFromGrouping[wrapped.id]){
              grouped[wrapped.id] = wrapped;
            }
          });
        }
        else {
          sibling_group.values.forEach(function(wrapped){
            grouped[wrapped.id] = wrapped;
          });
        }
        return grouped;
      },{});
      var grouped_nodes = d3.values(grouped);
      grouped_nodes.forEach(function(wrapped){
        if (wrapped.type=='node') {
          wrapped.children = wrapped.children.filter(function(c){
            return !!grouped[c.id];
          });
        }
      });
      return grouped_nodes;
    } 
    else {
      return wrapped_nodes;
    }
  }
  
  function setNodeLevels(node,set_level){
    if (!node.level) {
      node.level = (!set_level) ? 0 : set_level;
      node.children.forEach(function(child){
        setNodeLevels(child,node.level+1)
      });
    } else if (set_level){
      if (set_level>node.level) {
        node.level = set_level;
        node.children.forEach(function(child){
          setNodeLevels(child,node.level+1)
        });
      }
    }
  }
  
  function setBestRootNodeLevels(nodes){
    nodes.filter(function(node){
      return node.parents.length==0;
    }).forEach(function(node){
      node.level = d3.min(node.children,function(child){
        return child.level-1;
      });
    });
  }
  
  function getLevels(nodes){
    var levels = [];
    nodes.forEach(function(n){
      if (!levels[n.level]) levels[n.level] = [];
      levels[n.level].push(n);
    });
    return levels;
  }
  
  function sortTree(levels){
    
    //determine the max possible height
    height  = d3.max(levels,function(level){
      return (level.length+1)*nodePadding;
    });
    
    //evenly distribute nodes in each level
    levels.forEach(function(level){
      level.forEach(function(node,i){
        node.sort_ypos = i/(level.length-1||0.5)*height;
      });
    });
    
    //set up change-tracking
    var old_order, 
        final_order,
        history = [];
    
    //sorting & layout loop (even when sorting is off, this runs once but does not sort)
    for (var run = 0; run < (sort||1); run++){
      old_order = [];
      final_order = [];
      
      // only run sorting if sort is not off (0)
      if(sort!=0){ 
        var sortlevel = function(level){
          Array.prototype.push.apply(old_order, level);
          level.forEach(function(node,i){
            // assign each node a sort value which is the average of 
            // all immediate relative's sort values from the last round
            var new_sort_ypos = 0;
            for (var j = 0; j < node.children.length; j++) {
              new_sort_ypos+=node.children[j].sort_ypos;
            }
            for (var j = 0; j < node.parents.length; j++) {
              new_sort_ypos+=node.parents[j].sort_ypos;
            }
            if (new_sort_ypos!=0){
              new_sort_ypos = new_sort_ypos/(node.children.length+node.parents.length);
            }
            node.sort_ypos = new_sort_ypos;
          });
        };
        for (var m = levels.length-1; m > -1 ; m--) {
          sortlevel(levels[m])
        }
      }
      
      //group by sibling group and lay out the tree
      levels.forEach(function(level){
        // sort the nodes in each level by grouping them into their sibling groups
        // sorting them first by average sortval of the sib group
        // then sorting grouped nodes to the bottom
        // then sorting by their individual scores.
        var sib_group_scores = d3.nest().key(function(node){return node.sib_group_id})
          .entries(level).reduce(function(scores,group){
            scores[group.key] = d3.mean(group.values,function(node){return node.sort_ypos});
            return scores;
          },{});
        level.sort(function(a,b){
          return array_sort(
            [sib_group_scores[a.sib_group_id],a.type=="node-group"?1:0,a.sort_ypos,a.id],
            [sib_group_scores[b.sib_group_id],b.type=="node-group"?1:0,b.sort_ypos,b.id]
          );
        });
        
        //now determine the best arrangement side-toside in the level for the nodes
        //based on wether each node is a link or not, determine padding and center for each node
        var padding = function(anode,bnode){
          if ((typeof anode == 'undefined') || (typeof bnode == 'undefined')){
            return 0;
          } else if (anode.type!=bnode.type){
            return nodePadding/2.0;
          } else if (anode.type=="link-intermediate") {
            return linkPadding/2.0;
          } else {
            return nodePadding/2.0;
          }
        }
        var total_pos = 0;
        //build segments by determining padding require between adjacent nodes
        var segments = [];
        for (var i = 0; i < level.length; i++) {
          nextSeg = {
            'lpad':padding(level[i-1],level[i]),
            'rpad':padding(level[i],level[i+1]),
            'ideal':level[i].sort_ypos
          };
          nextSeg.pos = total_pos+nextSeg.lpad;
          total_pos = nextSeg.pos+nextSeg.rpad;
          segments.push(nextSeg);
        }
        //two passes (leftwards and rightwards)
        // push nodes *wards if doing so decreases avgerage distance
        // to the ideal point (if there were no collisions) for each node
        for (var i = 0; i < segments.length; i++) {
          var partial = segments.slice(i);
          var push_ideal = partial[0].ideal-partial[0].pos;
          if (push_ideal < 0) continue;
          var push_average = d3.mean(partial,function(seg){return seg.ideal-seg.pos});
          if (push_average>0){
            var push = d3.min([push_ideal,push_average]);
            partial.forEach(function(seg){
              seg.pos+=push;
            });
          }
        }
        for (var i = 0; i < segments.length; i++) {
          var rev = segments.slice(0);
          rev.reverse();
          var partial = rev.slice(i);
          var push_ideal = partial[0].ideal-partial[0].pos;
          if (push_ideal > 0) continue;
          var push_average = d3.mean(partial,function(seg){return seg.ideal-seg.pos});
          if (push_average < 0){
            var push = d3.max([push_ideal,push_average]);
            partial.forEach(function(seg){
              seg.pos+=push;
            });
          }
        }
        
        //move nodes to position
        level.forEach(function(node,i){
          node.sort_ypos = segments[i].pos;
        });
        
        Array.prototype.push.apply(final_order, level);
      });
      
      //update change tracking
      history.push(array_eq(old_order,final_order)?1:0);
      //if the last three loops have not changed the order, break
      if (history.length>=3 && d3.sum(history.slice(history.length-3))>=3 ){
        break;
      }
    }
    return levels;
  }
  
  function inner_link_layer(linewidth,source_ratio,sink_ratio){
    var counts = {};
    return function(x1,y1,x2,y2,sink_level){
      if(!counts.hasOwnProperty(""+sink_level)){
        counts[sink_level] = 0;
      } else {
        counts[sink_level]+=1;
      }
      var start = x2-(x2-x1)*(1-sink_ratio);
      var end = x1+(x2-x1)*(source_ratio);
      var width = (end-start);
      var mid = width/2 + start;
      var offset = (counts[sink_level]*linewidth*Math.pow(-1,counts[sink_level]%2));
      var pos = (offset%(width/2))+mid;
      return [
        [x1,y1],
        [pos,y1],
        [pos,y2],
        [x2,y2]
      ];
    }
  }
  
  function array_eq(a,b) {
    if (a === null || b === null) return false;
    if (a.length != b.length) return false;
    for (var i = 0; i < a.length; ++i) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }
  
  function array_sort(a,b){
    var diff_len = a.length!=b.length;
    var min_length = a.length<b.length?a.length:b.length;
    var longer = a.length>b.length?a:b;
    var i = 0;
    while (i < min_length && a[i] == b[i]){
      i+=1;
    }
    if (i==min_length){
      return diff_len?(longer==a?1:-1):0;
    }
    return a[i]-b[i];
  }
  
  return pdgtree;
}
