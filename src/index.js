//import React from 'react';
import ReactDOM from 'react-dom';

var Parse = require('parse');
Parse.initialize("parse-server");
Parse.serverURL = "http://bartend.herokuapp.com/parse";

const Cocktail = Parse.Object.extend("CocktailTest");
const Ingredient = Parse.Object.extend("IngredientTest");

const ozToMl = (oz) => (oz * 29.5735);
const mlToOz = (ml) => (ml / 29.5735);

var createIngredient = function(type, amount, isAlcohol) {
  return new Promise((resolve, reject) => {
    var query = new Parse.Query(Ingredient);
    query.equalTo("type", type.toLowerCase()).find()
    .then((results) => {
      if (results.length === 0) {
        const ingredient = new Ingredient();

        ingredient.set("type", type.toLowerCase());
        ingredient.set("isAlcohol", isAlcohol);
        ingredient.set("amount", amount);

        ingredient.save()
        .then((ingredient) => {
          return resolve(ingredient.id);
        }, (error) => {
          return reject(error);
        });
      } else {
        return resolve(results[0].id);
      }
    }, (error) => {
      return reject(error);
    });
  });
}

var addIngredients = function(ingredients) {
  return new Promise((resolve, reject) => {
    var ingredientIds = [];
    ingredients.forEach(ingredient => {
      createIngredient(ingredient[0], ingredient[1], ingredient[3])
      .then(function(id) {
        ingredientIds.push(id);
        if(ingredientIds.length === ingredients.length) {
          return resolve(ingredientIds);
        }
      }, function(error) {
        return reject(error);
      });
    });
  });
}

function queryItem(id, type) {
  return new Promise((resolve, reject) => {
    var query = new Parse.Query(type);
    query.get(id)
    .then((item) => {
      return resolve(item);
    }, (error) => {
      return reject(error);
    });
  });
}

var prepareCocktail = function(name, recipe, ingredients) {
  return new Promise((resolve, reject) => {
    var ingredientsObjects = [];
    addIngredients(ingredients)
    .then(function(ingredientIds) {
      ingredientIds.forEach(id => {
        queryItem(id, Ingredient).then(function(item) {
          ingredientsObjects.push(item);
          if(ingredientsObjects.length === ingredientIds.length) {
            createCocktail(name, recipe, ingredients, ingredientsObjects)
            .then(function(cocktail) {
              return resolve(cocktail);
            }, function(error) {
              return reject(error);
            });
          }
        }, function(error) {
          return reject(error);
        });
      });
    }, function(error) {
      return reject(error);
    });
  });
}

var createCocktail = function(name, recipe, ingredients, ingredientsObjects) {
  return new Promise((resolve, reject) => {
    var query = new Parse.Query(Cocktail);
    query.equalTo("name", name.toLowerCase()).find()
    .then((results) => {
      if (results.length === 0) {
        const cocktail = new Cocktail();

        cocktail.set("name", name.toLowerCase());
        cocktail.set("recipe", recipe);

        var relation = cocktail.relation("ingredients");
        for (var i = 0 ; i < ingredientsObjects.length; i++) {
          var found = ingredients.find(function(element) {
            return element[0].toLowerCase() === ingredientsObjects[i].get('type');
          });
 
          relation.add(ingredientsObjects[i]);
          cocktail.set("ID_" + ingredientsObjects[i].id, found[2]);
        }
        
        cocktail.save()
        .then((cocktail) => {
          return resolve(cocktail);
        }, (error) => {
          return reject(error);
        });
      } else {
        printCocktail(results[0])
        .then((string) => {
          return reject("This cocktail already exists.\n" + string);
        }, (error) => {
          return reject(error);
        });
      }
    }, (error) => {
      return reject(error);
    });
  });
}

var printCocktail = function(cocktail) {
  return new Promise((resolve, reject) => {
    var result = "";
    result += "A " + cocktail.get('name') + " has ";
    var relation = cocktail.relation("ingredients");
    var floorAmount = -1;

    relation.query().find().then((ingredients) => {
      var count = 0;
      ingredients.forEach(ingredient => {
        count++;
        var ingredientAmount = parseInt(cocktail.get("ID_" + ingredient.id));
        var ingredientTotal = ingredient.get('amount');
        var canMake = Math.floor(ingredientTotal/ozToMl(ingredientAmount));

        result += ingredientAmount + "oz of " + ingredient.get('type');
        floorAmount = floorAmount === -1 || canMake < floorAmount ? canMake : floorAmount;

        if (count === ingredients.length) {
          return resolve(result + "\nYou have enough ingredients to make " + floorAmount + " " + cocktail.get('name') + "(s) \nTo make one: " + cocktail.get('recipe'));
        } else {
          result += ", ";
        }
      });
    }, (error) => {
      return reject(error);
    });
  });
};

var recipe = "Add ingredients in a shaker filled with ice. Shake aggressively and pour over a glass of ice. Garnish with limes."

prepareCocktail('mojito', recipe, [['vodka', 750, 1.5, true], ['gin', 250, 2, true], ['tequila', 500, 1, true]]).then(function(cocktail) {  
  printCocktail(cocktail)
  .then((string) => {
    console.log(string);
  }, (error) => {
    console.log(error);
  });
  makeAnother();
}, function(error) {
  console.log(error);
  makeAnother();
});

function makeAnother() {
  prepareCocktail('cosmopolitan', recipe, [['vodka', 750, 2.5, true], ['cranberry juice', 600, 2.75, false], ['gin', 1000, 1.5, true]]).then(function(cocktail) {  
    printCocktail(cocktail)
    .then((string) => {
      console.log(string);
    }, (error) => {
      console.log(error);
    });
  }, function(error) {
    console.log(error);
  });
}


ReactDOM.render("Hello world!", document.querySelector('#root'));
