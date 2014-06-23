$(function() {

  var $hh =$("#sounds-hh");
  var $sd =$("#sounds-sd");
  var $bd =$("#sounds-bd");

  $hh.on("check:great", function() {
    console.log("receive:cehck:great");
  });
  $hh.on("check:miss", function() {
    console.log("receive:check:miss");
  });
  $sd.on("check:great", function() {
    console.log("receive:cehck:great");
  });
  $sd.on("check:miss", function() {
    console.log("receive:check:miss");
  });
  $bd.on("check:great", function() {
    console.log("receive:cehck:great");
  });
  $bd.on("check:miss", function() {
    console.log("receive:check:miss");
  });

  var $note = $('<span class="sss-note"></span>');
  $note.on("webkitAnimationEnd", function(event) {
    $(this).remove();
  });
  $hh.on("addNote", function() { $(this).append($note.clone(true)); });
  $sd.on("addNote", function() { $(this).append($note.clone(true)); });
  $bd.on("addNote", function() { $(this).append($note.clone(true)); });
});