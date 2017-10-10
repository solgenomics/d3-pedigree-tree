function pedigreeTree(){
  var self = this,
      parents = function(d){return d.parents;},
      id = function(d){return d.id;},
      value = function(d){return d.value;},
      parentsOrdered = true,
      levelWidth = 10,
      nodePadding = 10,
      nodeWidth = 5,
      updateDuration = 0;
      sort = 0,
      groupChildless = false,
      minGroupSize = 2,
      groupExpand = 10,
      hoverhide = false,
      excludeFromGrouping = {},
      data = [],
      autofitSelector = null,
      zoomEnabled = false;
  
  function pdgtree(selector,isUpdate,zoom){
    var layout = pdgtree.treeLayout(data);
    var trans = d3.transition().duration(isUpdate?updateDuration:0);
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
          .attr("x",-10000)
          .attr("y",-10000)
          .attr("width",20000)
          .attr("height",20000)
          .attr("fill","white")
          .style("cursor", "move");
      }
      canv = main_selected.select(".pedigreeTree-canv");
      if(canv.empty()){
        canv = main_selected.append('g').classed("pedigreeTree-canv",true);
      }
      if(!zoom){
        zoom = d3.zoom()
          .scaleExtent([0.2,5])
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
        return 'translate(' + start_pos[0] + ',' + start_pos[1] + ')';
      });
    newNodes.append('circle')
      .attr('r',6)
      .attr('fill',function(d){
        return d.hasOwnProperty('group')? "white":"black";
      })
      .attr('stroke',function(d){
        return d.hasOwnProperty('group')? "black":"white";
      });
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
        })
        .on("mouseover",function(d){
          highlight_links = [];
          for (var i = 0; i < d.links.length; i++) {
            d.links[i].source.links.forEach(function(link){
              if (d.links[i].linktype=="child" && 
                  (link.linktype == "mother" || link.linktype == "father")){
                highlight_links.push(link);
              }
            });
            d.links[i].sink.links.forEach(function(link){
              if (link.linktype=="child" && 
                  (d.links[i].linktype == "mother" || 
                    d.links[i].linktype == "father")){
                highlight_links.push(link);
              }
            });
            highlight_links.push(d.links[i]);
          }
          highlight_nodes = [];
          highlight_links.forEach(function(l){
            highlight_nodes.push(l.source,l.sink);
          });
          var htrans = d3.transition("htrans").ease(d3.easePolyOut).duration(1000);
          canv.select('.link-g').selectAll('.link')
            .transition(htrans).attr("opacity",function(d_2){
              if (highlight_links.indexOf(d_2)>-1){
                return 1;
              } 
              else {
                return 0;
              }
            })
          canv.select('.node-g').selectAll('.node')
            .transition(htrans).attr("opacity",function(d_2){
              if (highlight_nodes.indexOf(d_2)>-1){
                return 1;
              } 
              else {
                return 0;
              }
            })
        });
    }
      
    //update links
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
      .attr('stroke',function(d){
        if (d.linktype=='mother') return 'red';
        else if (d.linktype=='father') return 'blue';
        else if (d.linktype=='child') return 'green';
        return 'gray';
      })
      .attr('d',function(d){
        if (d.linktype=="child"){
          return d3.line()([
            [d.sink.x,d.sink.y],
            [d.sink.x,d.sink.y],
            [d.sink.x,d.sink.y]
          ]);
        }
        return null;
      });
    var allLinks = newLinks.merge(links);
    //set up link generators (to prevent overlap) and line generators.
    var inner_link = inner_link_layer(5,0.25,0.75);
    var outer_link = outer_link_layer(10,layout.y[0]-10,layout.y[1]+10,inner_link);
    var stepline = d3.line().curve(d3.curveStep);
    var basisline = d3.line().curve(d3.curveBasis);
    allLinks.transition(trans).attr("opacity",1).select('path').attr('d',function(d){
      var link_dist = Math.abs(d.sink.level-d.source.level);
      if (d.linktype=='child'){
        return stepline([
          [d.source.x,d.source.y],
          [d.sink.x,d.sink.y]
        ]);
      }
      else if (link_dist<=1){
        return basisline(
          inner_link(
            d.source.x+nodeWidth,d.source.y,
            d.sink.x,d.sink.y,d.sink.level
          )
        );
      } else {
        var level_width = Math.abs(d.source.x-d.sink.x)/link_dist;
        return basisline(
          outer_link(
            d.source.x+nodeWidth,d.source.y,
            d.sink.x,d.sink.y,d.source.level,
            d.sink.level,level_width
          )
        );
      }
    });
    //add expansion behaviour to groups.
    allNodes.filter(function(d){return d.hasOwnProperty('group')})
      .style("cursor", "pointer")
      .on("click",function(d){
        pdgtree.excludeFromGrouping(d.group.slice(0,groupExpand));
        var draw_out = pdgtree(selector,true,zoom);
        if(zoomEnabled){
          var mating_link = d.links.filter(function(l){
              return l.linktype=="child"
            })[0];
          var o_mating = mating_link.source;
          var n_mating = draw_out.tree.matings.filter(function(m){return m.id==o_mating.id})[0];
          main_selected.select(".zoom-controller")
            .transition(draw_out.trans)
            .call(zoom.translateBy,o_mating.x-n_mating.x, o_mating.y-n_mating.y);
        }
      });
    
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
    console.log(node_list);
    return null;
    console.log(node_list);
    node_list.forEach(function(d){setNodeLevels(d);});
    setBestRootNodeLevels(node_list);
    
    var levels = getLevels(node_list);
    if (sort) sortTree(levels,sort);
    
    var xrange = [0,levelWidth*(levels.length-1)]
    var yrange = [0,nodePadding*(d3.max(levels,function(l){return l.length}))-1]
    
    var x = d3.scalePoint()
      .domain(levels.map(function(d,i){return i}))
      .range(xrange);
    
    levels.forEach(function(level,i){
      var y = d3.scalePoint()
        .domain(level.map(function(d,j){return j}))
        .range(yrange);
      var level_x = x(i);
      level.forEach(function(node,j){
        node.y = y(j);
        node.x = level_x;
      });
    });
    
    node_list = [].concat.apply([], levels);
    
    var matings = d3.nest()
      .key(function(node) { return node.mother?node.mother.id:"root"; })
      .key(function(node) { return node.father?node.father.id:"root"; })
      .entries(node_list)
      .reduce(function(arr,mating_group){
        return [].concat.apply(arr,mating_group.values);
      },[]).map(function(mating){
        if (mating.values[0].mother===null || mating.values[0].father=== null){
          return null;
        }
        var m_x = (x(mating.values[0].level)+x(mating.values[0].level-1))/2;
        var m_y = d3.mean(mating.values,function(child){return child.y});
        var m_mother = mating.values[0].mother;
        var m_father = mating.values[0].father;
        return {
          'x':m_x,
          'y':m_y,
          'children':mating.values,
          'mother':m_mother,
          'father':m_father,
          'type':'mating',
          'id':m_mother.id+","+m_father.id,
          'level':mating.values[0].level,
          'links':[]
        }
      }).filter(function(m){return m!=null});
    
    var links = matings.reduce(function(arr,mating){
      arr.push({'source':mating.mother,'sink':mating,'type':'link','linktype':'mother','id':mating.mother.id+'->'+mating.id});
      arr.push({'source':mating.father,'sink':mating,'type':'link','linktype':'father','id':mating.father.id+'->'+mating.id});
      [].push.apply(arr,mating.children.map(function(child){
        return {'source':mating,'sink':child,'type':'link','linktype':'child','id':mating.id+'->'+child.id}
      }));
      return arr;
    },[]);
    links.forEach(function(link){
      link.source.links.push(link);
      link.sink.links.push(link);
    })
    links.sort(function(a,b){
      var adist = Math.pow(a.source.x-a.sink.x,2)+Math.pow(a.source.y-a.sink.y,2);
      var bdist = Math.pow(a.source.x-a.sink.x,2)+Math.pow(a.source.y-a.sink.y,2);
      return d3.ascending(adist,bdist);
    })
    
    
    return {'nodes':node_list,'matings':matings,'links':links,'x':xrange,'y':yrange}
  }
  
  
  
  function autofit_svg(draw_out){
    afsel = d3.select(autofitSelector);
    wrap_width = afsel.attr("width");
    wrap_height = afsel.attr("height");
    var padding = 100;
    var x0 = -padding;
    var y0 = -padding;
    var view_width = draw_out.tree.x[1]-draw_out.tree.x[0]+padding*2;
    var view_height = draw_out.tree.y[1]-draw_out.tree.y[0]+padding*2;  
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
          'links':[],
          '_node_data':node_data
        };
        return idmap[node_id];
      });
    wrapped_nodes.forEach(function(wrapped){
        var parent_ids = parents(wrapped._node_data).map(id);
        if (!parentsOrdered) parent_ids.sort();
        wrapped.parents = parent_ids.map(function(p_id){return idmap[p_id];});
        wrapped.parents.forEach(function(parent){
          parent.children.push(wrapped);
        });
      });
    if (groupChildless){
      var sibling_groups = d3.nest().key(function(wrapped){
          var p_ids = wrapped.parents.map(function(p){return p.id;});
          return p_ids? "NG::"+p_ids.join("++M++") : "NG::_ROOT_";
        })
        .entries(wrapped_nodes);
      var grouped = sibling_groups.reduce(function(grouped, sibling_group){
        var groupable = sibling_group.values.filter(function(wrapped){
          return wrapped.children.length==0 && !excludeFromGrouping[wrapped.id];
        });
        if (groupable.length>=minGroupSize) {
          grouped[sibling_group.key] = {
            'type':'node-group', 
            'id':sibling_group.key, 
            'value':groupable, 
            'children':[],
            'links':[]
          };
          grouped[sibling_group.key].parents = groupable[0].parents.map(function(p){
            p.children.push(grouped[sibling_group.key]);
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
      d3.values(grouped).forEach(function(wrapped){
        if (wrapped.type=='node') {
          wrapped.children = wrapped.children.filter(function(c){
            return !!grouped[c.id];
          });
        }
      });
      return grouped;
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
      return node.mother===null && node.father===null;
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
  
  function sortTree(levels,maxruns){
    levels.forEach(function(level){
      level.forEach(function(node,i){
        node.sort_val = i/(level.length-1||1);
      });
    });
    var old_order = [];
    var final_order = [];
    var history = [];
    for (var run = 0; run < maxruns; run++){
      old_order = [];
      final_order = [];
      levels.forEach(function(level){
        Array.prototype.push.apply(old_order, level);
        level.forEach(function(node,i){
          var child_count = node.children.length;
          if (child_count>0){
            var new_sort_val = node.sort_val;
            var is_intergenerational = false;
            for (var j = 0; j < node.children.length; j++) {
              if (node.children[j].level>node.level+1){
                is_intergenerational = true;
              }
              new_sort_val+=node.children[j].sort_val;
            }
            if (new_sort_val!=0){
              new_sort_val = new_sort_val/(child_count+1);
            }
            if (is_intergenerational){
              node.sort_val = Math.round(new_sort_val);
            }
            else {
              node.sort_val = new_sort_val;
            }
          }
        });
        level.sort(function(a,b){
          return d3.ascending(a.sort_val,b.sort_val);
        });
      });
      levels.forEach(function(level){
        level.forEach(function(node,i){
            if(node.mother!==null&&node.father!==null){
              node.sort_val = (node.sort_val+node.mother.sort_val+node.father.sort_val)/3;
            }
        });
        level.sort(function(a,b){
          return d3.ascending(a.sort_val,b.sort_val);
        });
        Array.prototype.push.apply(final_order, level);
      });
      history.push(array_eq(old_order,final_order)?"O":"X");
      if (history.length>1 && history.slice(history.length-3).join("")=="OOO"){
        break;
      }
    }
    console.log(history.join(""))
    levels.forEach(function(level,i){
      level.forEach(function(node,i){
        var parentSortVal = 0;
        var currentSortVal = node.sort_val;
        if (node.mother!==null && node.father!==null){
          parentSortVal = (node.mother.sort_val+node.father.sort_val)/2;
        } else {
          parentSortVal = currentSortVal;
        }
        node.sort_list = [
          parentSortVal,
          node.mother?node.mother.id:-1,
          node.father?node.father.id:-1,
          node.hasOwnProperty('group')?100000:currentSortVal
        ];
      });
      level.sort(function(a,b){
        return array_sort(a.sort_list,b.sort_list);
      });
    });
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
  
  function outer_link_layer(linewidth,top_edge,bottom_edge,inner_link){
    var filled = {'top':{},'bottom':{}};
    var mid = (bottom_edge-top_edge)/2+top_edge;
    return function(x1,y1,x2,y2,parent_level,child_level,level_width){
      var avg = (y1+y2)/2;
      var boundary = mid-avg>1?top_edge:bottom_edge;
      var stack_direction = mid-avg>1?-1:1;
      var side_filled = mid-avg>1?filled['top']:filled['bottom'];
      var height = 0;
      var height_found = false;
      while (!height_found){
        height_found = true;
        for (var i = parent_level+1; i < child_level; i++) {
          var key = ""+i;
          if(!side_filled.hasOwnProperty(key)){
            side_filled[key] = [];
          }
          if (height==side_filled[key].length){
            side_filled[key].push(false);
          }
          if (side_filled[key][height]){
            height++;
            height_found = false;
          }
        }
      }
      for (var i = parent_level+1; i < child_level; i++) {
        var key = ""+i;
        side_filled[key][height] = true;
      }
      var outer_pos = boundary+linewidth*height*stack_direction
      var leg1 = inner_link(x1,y1,x1+level_width/2,outer_pos,parent_level+1);
      var leg2 = inner_link(x2-level_width/2,outer_pos,x2,y2,child_level);
      return leg1.concat(leg2);
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
