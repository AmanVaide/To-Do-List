//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// CONNECT TO DATABASE
const mongoose = require("mongoose");

mongoose.connect("mongodb://127.0.0.1:27017/todolistDB")

.then(function() {
    console.log("Connected succesfully to the database");
})
.catch(function(){
    console.log("Database connection faild");
});

//schema creation
const itemSchema = {
  name: String
};
const Item = mongoose.model("Item",itemSchema);
 
const item1 = new Item({
  name:"Welcome to your to do list !"
});
const item2 = new Item({
  name : "Hit the + button to add a new item."
});
const item3 = new Item({
  name : "<-- Hit this to delete an  item."
});

const defaultItems = [item1, item2, item3];

app.get("/", function(req, res) {
  Item.find({})
  .then(function(foundItems){
    if (foundItems.length === 0 ) {

      Item.insertMany(defaultItems)
      .then(function(){
        console.log("insert successful");
      })
      .catch(function(err) {
        console.log(err);
      })
      res.redirect("/");
    } else {
      res.render("list",{ listTitle:"Today", newListItems: foundItems});
    }
  })
  .catch(function(err){
    console.log(err);
  })
});

const listSchema = {
  name : String,
  items : [itemSchema]
};

const List = mongoose.model("List",listSchema);

app.get("/:customListName",(req,res) => {
   customListName = req.params.customListName;

    List.findOne({name:customListName})
    .then((foundList) => {
        if(!foundList) {
          //create new list
          const list = new List( {
            name : customListName,
            items : defaultItems
          });
          list.save();
        res.redirect("/" + customListName);
        } else {
          //show existing list
          res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
        }
        
    })
    .catch((err) => {
      console.log(err);
    })
});



app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;
   const item = new Item({
    name: itemName
   })

   if (listName === "Today") {
    item.save();
    res.redirect("/");
   } else {
     List.findOne({name:listName})
     .then((foundList) =>  {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/"+listName);
     })
     .catch((err) => {
       console.log(err);
     }) 
   }

  
});

app.post("/delete", async function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
   if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId)
    .then(() => {
      console.log(`Deleted ${checkedItemId} Successfully`);
      res.redirect("/");
    })
    .catch((err) => {
      console.log("Deletion Error: " + err);
    })
   } else {
    List.findOne({ name: listName })
      .then((foundList) => {
        if (foundList) {
          foundList.items.pull({ _id: checkedItemId });
          return foundList.save();
        }
      })
      .then(() => {
        console.log("We have removed the item with id: " + checkedItemId + " from " + listName + " list");
        res.redirect("/" + listName);
      })
      .catch((err) => {
        console.log(err);
      });
  }
})



app.get("/work", function(req,res){
  res.render("list", {listTitle: "Work List", newListItems: workItems});
});


app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
