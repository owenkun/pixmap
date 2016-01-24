$(document).ready(function() {  
  var address = 'https://api.clarifai.com/v1/tag/?url=';
  //var img_url = 'http://www.hardlyserious.com/wp-content/uploads/2015/11/23004913732_693061c5d2_Donald-Trump-370x277.jpg';
  var subMax;
  var childMax;

  $("#submitbutton").click(function() {
    var img_url = $("#imglink").val();
    submit(img_url)
  });
  
  function submit(img_url) {

    subMax = $('#tags').val();
    childMax = $('#children').val();

    var request = address.concat(img_url);
    $.ajax({
            url: request,
            beforeSend: function(xhr) {
                 xhr.setRequestHeader("Authorization", "Bearer hC1eL948ZYWlYEqzg37ZjUyxqeea6P")
            }, success: function(data){
                callback(data);
            }
    })
  }

  function callback(data) {
    getSubreddits(data.results[0].result.tag.classes);
  }

  function getSubreddits(tags) {
      var subredditList = [];

      var tagList = tags.slice();

      // REMOVE THIS
      //var tags = [tags[0]];

      getSubredditsHelper(tags, tagList, subredditList);
  }

  function getSubredditsHelper(tags, tagList, subredditList) {

    var tag = tags.shift();

    if (tag) {

      console.log(tag);

      $.ajax({
            url: "https://www.reddit.com/subreddits/search.json?q=" + tag,
            success: function(data){
              subredditList.push(data);              
              getSubredditsHelper(tags, tagList, subredditList);
            }
      });

    }else{      
      parseShit(subredditList, tagList);
    }

  }

  function nodeConstruct(name, subscribers, group) {
    return {name: name, subscribers: subscribers, group: group};
  }

  function linkConstruct(source, target, weight) {
    return {source: source, target: target, weight: weight};
  }

  function parseShit(subredditList, tagList) {    

    //console.log(subredditList);

    var nodes = [];
    var links = [];

    var subreddit;
    var node;
    var link;
    var total_child = 0;
    var count = 0;

    for (var i=0; i<subredditList.length; i++) {

        var sub_length = subredditList[i].data.children.length;
        if(sub_length > subMax)
          sub_length = subMax;

      total_child += subredditList.length;
      for (var j=0; j< sub_length; j++) {
        subreddit = subredditList[i].data.children[j].data;

        console.log(tagList[i] +" " + subreddit.display_name);

        node = nodeConstruct(subreddit.display_name, subreddit.subscribers, j);
        nodes.push(node);



        var list = parse_child(JSON.stringify(subreddit.description));
        var length = list.length;
        if(length > childMax)
          length = childMax;

        for (var k=0; k < length; k++) {
          node = nodeConstruct(list[k], 0, i);
          var add = 1;
          for(var w = 0; w < nodes.length; w++){
            if(nodes[w].name === node.name)
            {
              add = 0;
              break;
            } 
          }
          if(add == 1)
            nodes.push(node);
          var targetIndex = getTargetIndex(nodes, list[k]);

          link = linkConstruct(j, targetIndex, 1);
          links.push(link);
        }
      }
    }
    //console.log(JSON.stringify(links));
    //console.log(JSON.stringify(nodes));

    console.log(nodes);
    console.log(total_child);
    d3shit({nodes: nodes, links: links});

    //console.log({nodes: nodes, links: links});

  }

  function getTargetIndex(list, targetName) {
    for(var i = 0; i < list.length; i++){
      if(list[i].name === targetName)
        return i;
    }
  }

  function parse_child(buffer){
    var index = 0;
    var child_list = [];
    for(var j = 0; j < 50; j++){
        index = get_next(buffer, index)
        if(index >= buffer.length)
          break;
        child_list.push(get_next_reg(buffer, index));
    }
    return child_list;
  }

  function get_next(buffer, index){
    var length = buffer.length;
    var i;
    for(i = index; i < length - 3; i++){
      if(buffer[i] == '/' && buffer[i+1] == 'r' && buffer[i+2] == '/'){
        return i + 3;
      }
    }

    return i + 3;

  }

  function get_next_reg(buffer, index){
    var length = buffer.length;
    var current = "";
      for(var i = index; i < length; i++){

        if(buffer[i].charCodeAt(0) >= 'a'.charCodeAt(0) && buffer[i].charCodeAt(0) <= 'z'.charCodeAt(0)){
          current = current + buffer[i];
        }
        else if(buffer[i].charCodeAt(0) >= 'A'.charCodeAt(0) && buffer[i].charCodeAt(0) <= 'Z'.charCodeAt(0)){
          current = current + buffer[i];
        }
        else if(buffer[i].charCodeAt(0) == '_'.charCodeAt(0)){
          current = current + buffer[i];
        }
        else{
          return current;
        }
      }
      return current;
  }

/*  var data =  {
              "nodes":[
                {"name":"node1","group":1},
                {"name":"node2","group":2},
                {"name":"node3","group":2},
                {"name":"node4","group":3}
              ],
              "links":[
                {"source":2,"target":1,"weight":1},
                {"source":0,"target":2,"weight":3}
              ]
            };

            d3shit(data);*/

  function d3shit (data) {

    

    //console.log(data);

    var width = $('body').width(),
        height = 1500;

    var svg = d3.select("body").append("svg")
      .attr("width", width)
      .attr("height", height);

    var force = d3.layout.force()
      .gravity(.05)
      .distance(300)
      .charge(-100)
      .size([width, height]);

    var json = data;

    force
      .nodes(json.nodes)
      .links(json.links)
      .start();

    var link = svg.selectAll(".link")
      .data(json.links)
      .enter().append("line")
      .attr("class", "link")
      .style("stroke-width", function(d) { return Math.sqrt(d.weight); });

    var node = svg.selectAll(".node")
      .data(json.nodes)
      .enter().append("g")
      .attr("class", "node")
      .call(force.drag);

    node.append("circle")
      .attr("r",function(d) {return d.value});

    node.append("text")
      .attr("dx", 12)
      .attr("dy", ".35em")
      .text(function(d) { return d.name });

    force.on("tick", function() {
      link.attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

      node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
    });
  }
});

