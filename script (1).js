$(document).ready(function() {  
  var address = 'https://api.clarifai.com/v1/tag/?url=';
  var img_url = 'http://i.imgur.com/UP3XIWN.png'
  var request = address.concat(img_url);
  $.ajax({
          url: request,
          beforeSend: function(xhr) {
               xhr.setRequestHeader("Authorization", "Bearer anux28KbAiuOrxsc7WeQzUIKihjbfL")
          }, success: function(data){
              callback(data);
          }
  })

  function callback(data) {
    getSubreddits(data.results[0].result.tag.classes);
  }

  function getSubreddits(tags) {
      var subredditList = [];

      // REMOVE THIS
      var tags = [tags[0]];

      getSubredditsHelper(tags, subredditList);
  }

  function getSubredditsHelper(tags, subredditList) {
    var tag = tags.shift();

    if (tag) {

      $.ajax({
            url: "https://www.reddit.com/subreddits/search.json?q=" + tag,
            success: function(data){

              subredditList.push(data);

              getSubredditsHelper(tags, subredditList);
            }
      });

    }else{
      parseShit(subredditList);
    }

  }

  function parseShit(tags) {
    console.log(tags);
    var list = [];
    for(var i = 0; i < tags[0].data.children.length; i++){
      var buffer = JSON.stringify(tags[0].data.children[i].data);
      var index = 0;
      console.log(buffer);
      console.log("\n---------------------------------------\n");

      //"/r/oregon"
      // letters   a-z|A-Z|0-9|_
      //  /r/letters+^letters
      index = get_next(buffer, index)
      console.log(index);
      list.push("/r/"+get_next_reg(buffer, index));
      index += list[list.length-1].length;
    }

    console.log(JSON.stringify(list));
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
    console.log(length + " " + index);
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

  function get_related_subreddit(value){

  }

  function d3shit (data) {
    var json = JSON.stringify(data);
    var width = 960,
        height = 500

    var svg = d3.select("body").append("svg")
      .attr("width", width)
      .attr("height", height);

    var force = d3.layout.force()
      .gravity(.05)
      .distance(100)
      .charge(-100)
      .size([width, height]);

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

