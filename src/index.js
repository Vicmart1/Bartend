// eslint-disable-next-line 
import React from 'react';
// eslint-disable-next-line 
import ReactDOM from 'react-dom';
// eslint-disable-next-line 
import CocktailContainer from './cocktail.js';
// eslint-disable-next-line 
import IngredientContainer from './ingredient.js';
// eslint-disable-next-line 
import enableScroll from './cocktail.js';

var Parse = require('parse');
Parse.initialize("parse-server", "parse-server");
Parse.serverURL = "https://bartend.herokuapp.com/parse";

const Cocktail = Parse.Object.extend("CocktailTest");
const Ingredient = Parse.Object.extend("IngredientTest");

const ozToMl = (oz) => (oz * 29.5735);
// eslint-disable-next-line 
const mlToOz = (ml) => (ml / 29.5735);

var createIngredient = function(type, amount, isAlcohol, isLiquid) {
  return new Promise((resolve, reject) => {
    var query = new Parse.Query(Ingredient);
    query.equalTo("type", type.toLowerCase()).find()
    .then((results) => {
      if (results.length === 0) {
        const ingredient = new Ingredient();

        ingredient.set("type", type.toLowerCase());
        ingredient.set("isAlcohol", isAlcohol);
        ingredient.set("amount", amount);
        ingredient.set("isLiquid", isLiquid);

        ingredient.save()
        .then((ingredient) => {
          return resolve(ingredient.id);
        }, (error) => {
          return reject(error);
        });
      } else {
        var ingredient = results[0];
        ingredient.set("isAlcohol", isAlcohol);
        if (amount !== -1) {
          ingredient.set("amount", amount);
        }
        ingredient.set("isLiquid", isLiquid);

        ingredient.save()
        .then((ingredient) => {
          return resolve(ingredient.id);
        }, (error) => {
          return reject(error);
        });
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
      createIngredient(ingredient[0], ingredient[1], ingredient[3], ingredient[4])
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

export default function prepareCocktail(name, recipe, ingredients, color) {
  return new Promise((resolve, reject) => {
    var ingredientsObjects = [];
    addIngredients(ingredients)
    .then(function(ingredientIds) {
      ingredientIds.forEach(id => {
        queryItem(id, Ingredient)
        .then(function(item) {
          ingredientsObjects.push(item);
          if(ingredientsObjects.length === ingredientIds.length) {
            createCocktail(name, recipe, ingredients, color, ingredientsObjects)
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

var updateCocktail = function(recipe, ingredients, color, ingredientsObjects, cocktail) {
  return new Promise((resolve, reject) => {
    var relation = cocktail.relation("ingredients");
    relation.query().find()
    .then((ingredientsObjectReplace) => {
      var relation = cocktail.relation("ingredients");
      ingredientsObjectReplace.forEach(ingredientObjectReplace => {
        relation.remove(ingredientObjectReplace)
        cocktail.unset("ID_" + ingredientObjectReplace.id);
      });

      cocktail.set("recipe", recipe);
      cocktail.set("color", color);
      cocktail.set("ingredientsNum", ingredientsObjects.length);

      for (var i = 0 ; i < ingredientsObjects.length; i++) {
        // eslint-disable-next-line
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
    }, (error) => {
      return reject(error);
    });
  });
}

var createCocktail = function(name, recipe, ingredients, color, ingredientsObjects) {
  return new Promise((resolve, reject) => {
    var query = new Parse.Query(Cocktail);
    query.equalTo("name", name.toLowerCase()).find()
    .then((results) => {
      if (results.length === 0) {
        const cocktail = new Cocktail();

        cocktail.set("name", name.toLowerCase());
        cocktail.set("recipe", recipe);
        cocktail.set("color", color);
        cocktail.set("ingredientsNum", ingredientsObjects.length);

        var relation = cocktail.relation("ingredients");
        for (var i = 0 ; i < ingredientsObjects.length; i++) {
          // eslint-disable-next-line
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
        updateCocktail(recipe, ingredients, color, ingredientsObjects, results[0])
        .then((cocktail) => {
          return resolve(cocktail);
        }, (error) => {
          return reject(error);
        });
      }
    }, (error) => {
      return reject(error);
    });
  });
}

var deleteCocktail = function(name) {
  return new Promise((resolve, reject) => {
    var query = new Parse.Query(Cocktail);
    query.equalTo("name", name.toLowerCase()).find()
    .then((results) => {
      if (results.length === 0) {
        return reject("No cocktail named " + name + " to delete.");
      } else {
        var cocktail = results[0];
        var relation = cocktail.relation("ingredients");
        relation.query().find()
        .then((ingredientsObjectReplace) => {
          var relation = cocktail.relation("ingredients");
          ingredientsObjectReplace.forEach(ingredientObjectReplace => {
            relation.remove(ingredientObjectReplace)
          });

          cocktail.save().then(() => {
            cocktail.destroy().then(() => {
              return resolve("Cocktail successfully deleted.");
            }, (error) => {
              return reject(error);
            });
          }, (error) => {
            return reject(error);
          });
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

    relation.query().find()
    .then((ingredients) => {
      var count = 0;
      ingredients.forEach(ingredient => {
        count++;
        var ingredientAmount = parseInt(cocktail.get("ID_" + ingredient.id), 10);
        var ingredientTotal = ingredient.get('amount');
        var canMake = Math.floor(ingredientTotal/ozToMl(ingredientAmount));

        result += cocktail.get("ID_" + ingredient.id) + "oz of " + ingredient.get('type');
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

/**prepareCocktail('Mai-Tai', recipe, [['raspberry', 300, 4, false, false], ['water', 400, 5, false, true]], 'yellow')
.then(function(cocktail) {  
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
  prepareCocktail('raspberry mojito', recipe, [['rum', 750, 2, true, true], ['cranberry juice', 600, 2.75, false, true], ['gin', 1000, 1.5, true, true]], 'red')
  .then(function(cocktail) {  
    printCocktail(cocktail)
    .then((string) => {
      console.log(string);
    }, (error) => {
      console.log(error);
    });

    /**
    var queryCocktail = new Parse.Query(Cocktail);
    queryCocktail.find()
    .then((cocktails) => {
      ReactDOM.render(<CocktailContainer cocktails={cocktails}/>, document.querySelector('#rootCocktails'));
    }, (error) => {
      console.log(error);
    });

    var queryIngredient = new Parse.Query(Ingredient);
    queryIngredient.find()
    .then((ingredients) => {
      ReactDOM.render(<IngredientContainer ingredients={ingredients}/>, document.querySelector('#rootIngredients'));
    }, (error) => {
      console.log(error);
    });**/

    /**deleteCocktail('mojito')
    .then((string) => {
      console.log(string);
    }, (error) => {
      console.log(error);
    });
  }, function(error) {
    console.log(error);
  });
}**/


/**var queryIngredient = new Parse.Query(Ingredient);
queryIngredient.find()
.then((ingredients) => {
  ReactDOM.render(<IngredientContainer ingredients={ingredients}/>, document.querySelector('#rootIngredients'));
}, (error) => {
  console.log(error);
});**/