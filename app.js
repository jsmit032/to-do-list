//jshint esversion:6
require('dotenv').config()

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}))
app.use(express.static("public"));

const login = "mongodb+srv://admin-jennifer:";
const end = "@cluster0-kzvpn.mongodb.net/";
const database = "todolistDB";
const pw = process.env.PASSWORD;

mongoose.connect(login + pw + end + database, {useNewUrlParser: true, useUnifiedTopology: true});

const itemSchema = new mongoose.Schema({
  name: String
});

const Item = mongoose.model("Item", itemSchema);

const item1 = new Item ({
  name: "Welcome to your todolist!"
});

const item2 = new Item ({
  name: "Hit the + button to add a new item."
});

const item3 = new Item ({
  name: "<-- Hit this button to delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemSchema]
}

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res){
  Item.find({}, function(err, foundItems){
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function(err){
        if (err) {
          console.log(err);
        } else {
          console.log("Succesfully saved default items to DB!");
        }
      });
      res.redirect("/");
    } else {
      res.render('list', {listTitle: "Today", newListItems: foundItems});
    }
  });
});

app.get('/:listName', function(req, res){
  const requestedName = _.capitalize(req.params.listName);

  List.findOne({ name: requestedName }, function(err, foundList){
    if (!err) {
      if (!foundList) {
        const list = new List({
          name: requestedName,
          items: defaultItems
        });

        list.save(function(err){
          if (err) {
            console.log(err);
          }
        });
        res.redirect("/" + requestedName);
      } else {
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items
        });
      }
    }
  });

});

app.post("/", function(req, res){
  const itemName = req.body.newItem;
  const listName = req.body.list;

  var newItem = new Item({ name: itemName });

  if (listName === "Today") {
    newItem.save(function(err){
      if (err) {
        console.log(err);
      } else {
        res.redirect("/");
      }
    });
  } else {
    List.findOne({ name: listName }, function(err, foundList){
      foundList.items.push(newItem);
      foundList.save();
      res.redirect("/"+ listName);
    });
  }

});

app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, {useFindAndModify: false}, function(err){
      if (err) {
        console.log(err);
      } else {
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedItemId }}}, {useFindAndModify: false}, function(err, foundList){
      if (!err){
        res.redirect("/" + listName);
      } else {
        console.log(err);
      }
    });
  }
});

app.get('/about', function(req, res){
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function(){
  console.log("Server has started succesfully.");
});
