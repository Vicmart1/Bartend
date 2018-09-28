import React from 'react';
import ReactDOM from 'react-dom';
import IngredientContainer from './ingredient.js';
import prepareCocktail from './index.js';

const MAX_INGREDIENTS = 10;

const ozToMl = (oz) => (oz * 29.5735);
const mlToOz = (ml) => (ml / 29.5735);

var lastMobileScroll = -1;

var Parse = require('parse');
Parse.initialize("parse-server", "parse-server");
Parse.serverURL = "https://bartend.herokuapp.com/parse";

const Cocktail = Parse.Object.extend("CocktailTest");
const Ingredient = Parse.Object.extend("IngredientTest");

class CocktailTile extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      cocktailObject: props.cocktail,
      ingredients: [],
      editMode: false
    }
  }

  componentDidMount() {
    var relation = this.state.cocktailObject.relation("ingredients");
    relation.query().find()
    .then((ingredientsObjects) => {
      this.setState({
        ingredients: ingredientsObjects
      });
    }, (error) => {
      console.log(error);
    });
  }

  openModal(e) {
    ReactDOM.render(<CocktailTile ref={(component) => {window.activeCocktail = component}} key={this.state.cocktailObject.id} cocktail={this.state.cocktailObject}/>, document.querySelector('#modalCocktail'));
    document.getElementById("modalCocktail").classList.add("active");
    document.getElementById("overlay").classList.add("active");
    document.getElementById("overlay").classList.add("show");
    document.body.classList.add("fixed");
    document.getElementById("rootCocktails").children[0].classList.add("background");
    disableScroll();
  }

  closeModal(e) {
    e.stopPropagation();
    removeOverlay();
  }

  editModal(e) {
    if (e.target.parentElement.parentElement.id === "modalCocktail" || e.target.parentElement.parentElement.parentElement.id === "modalCocktail") {
      e.stopPropagation();

      this.setState({
        editMode: true
      });

      if (lastMobileScroll === -1) {
        lastMobileScroll = window.scrollY || window.scrollTop || document.getElementsByTagName("html")[0].scrollTop;
      }

      setTimeout(function() {
        document.body.classList.add("fixedMobile")
        if (window.mobilecheck()) {
          document.body.style.marginTop = (-1 * lastMobileScroll) + "px";
        }
      }, 250);
    }
  }

  updateNewIngredient(name) {
    var ingredientsObjects = this.state.ingredients;
    ingredientsObjects.push(createIngredient(name));
    this.setState({
      ingredients: ingredientsObjects
    });

    document.getElementById("modalIngredients").classList.remove("active");
    document.getElementById("rootCocktails").children[0].classList.remove("background-2");
    setTimeout(function() {
      document.getElementById("ingredientTilesContainer").className = "";
    }, 250);
  }

  addIngredient() {
    window.openIngredientModal(this.state.cocktailObject.get('color'), this.state.ingredients);
  }

  subIngredient(event) {
    var element = event.target.parentElement;

    if (!element.classList.contains("ingredient")) {
      element = element.parentElement;
    }

    var parent = element.parentElement;
    var index = [].slice.call(parent.children).indexOf(element);

    var ingredientsObjects = this.state.ingredients;
    ingredientsObjects.splice(index, 1);
    this.setState({
      ingredients: ingredientsObjects
    });
  }

  finishEdit() {
    document.getElementById("updateAlert").classList.add("show");

    var ingredientResults = [];
    var ingredientsDOM = document.getElementById("modalCocktail").children[0].children[1].children;
    var ingredientsLength = ingredientsDOM.length;
    for (var i = 0; i < ingredientsLength - 1; i++) {
      var amount = parseInt(ingredientsDOM[i].children[1].children[0].children[0].value, 10);
      var name = this.state.ingredients[i].get("type");
      var total = this.state.ingredients[i].get("amount");
      var isAlcohol = this.state.ingredients[i].get("isAlcohol");
      var isLiquid = this.state.ingredients[i].get("isLiquid");
      ingredientResults.push([name, total, amount, isAlcohol, isLiquid]);
    }
    
    // eslint-disable-next-line
    var name = this.state.cocktailObject.get("name");
    var ingredients = ingredientResults;
    var recipe = document.getElementById("modalCocktail").children[0].children[2].value;
    var color = this.state.cocktailObject.get("color") ? this.state.cocktailObject.get("color") : "white";

    prepareCocktail(name, recipe, ingredients, color)
    .then(function(cocktail) {  
      updateAllCocktails(cocktail);
    }, function(error) {
      console.log(error);
    });
  }

  updateSelf() {
    var query = new Parse.Query(Cocktail);
    query.equalTo("name", this.state.cocktailObject.get("name").toLowerCase()).find()
    .then((results) => {
      this.setState({
        cocktailObject: results[0],
        ingredients: [],
        editMode: false
      });
      this.componentDidMount();
    }, (error) => {
      console.log(error);
    });
  }

  render() {
    var floorAmount = -1;
    var ingredientsDOM = [];

    this.state.ingredients.forEach(ingredient => {
      var ingredientAmount = parseInt(this.state.cocktailObject.get("ID_" + ingredient.id), 10);
      var ingredientTotal = ingredient.get('amount');
      var canMake = Math.floor(ingredientTotal/ozToMl(ingredientAmount));
      floorAmount = floorAmount === -1 || canMake < floorAmount ? canMake : floorAmount;

      var unit = ingredient.get('isLiquid') ? 'ml' : ' ' + ingredient.get('type') + '(s)';

      if (this.state.editMode) {
        ingredientsDOM.push(
          <li key={ingredient.get('type')} className="ingredient">
              <svg onClick={(event) => this.subIngredient(event)} className="trashIcon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path className="heroicon-ui" d="M8 6V4c0-1.1.9-2 2-2h4a2 2 0 0 1 2 2v2h5a1 1 0 0 1 0 2h-1v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8H3a1 1 0 1 1 0-2h5zM6 8v12h12V8H6zm8-2V4h-4v2h4zm-4 4a1 1 0 0 1 1 1v6a1 1 0 0 1-2 0v-6a1 1 0 0 1 1-1zm4 0a1 1 0 0 1 1 1v6a1 1 0 0 1-2 0v-6a1 1 0 0 1 1-1z"/></svg>            <div className="mainText">
              <span>
                <input className="mainInput" defaultValue={this.state.cocktailObject.get('ID_' + ingredient.id) ? this.state.cocktailObject.get('ID_' + ingredient.id) : 0} />
              </span> oz of {ingredient.get('type')}
            </div>
          </li>
        );
      } else {
        ingredientsDOM.push(
          <li key={ingredient.get('type')} className="ingredient">
            <div className="mainText">
              <span className="number">
                {this.state.cocktailObject.get('ID_' + ingredient.id)}
              </span> oz of {ingredient.get('type')}
            </div>
            <div className="altText">
              {ingredient.get('amount')}{unit} remaining
            </div>
          </li>
        );
      }
    });

    if (this.state.editMode) {
      if (this.state.ingredients.length < MAX_INGREDIENTS) {
        ingredientsDOM.push(
          <li key="newIngredient" className="ingredient">
            <div className="newIngredient" onClick={(event) => this.addIngredient(event)}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path className="heroicon-ui" d="M17 11a1 1 0 0 1 0 2h-4v4a1 1 0 0 1-2 0v-4H7a1 1 0 0 1 0-2h4V7a1 1 0 0 1 2 0v4h4z"/></svg>
              Add an ingredient
            </div>
          </li>
        );
      }    
    }

    var classes = "cocktail";
    var color = this.state.cocktailObject.get('color');
    if (color && color !== "") {
      classes += " " + color + "-bg";
    } else {
      classes += " white-bg";
    }

    var ingredientsClasses = "ingredients";

    var canMakeString = "";
    switch(floorAmount) {
      case 0 :
        canMakeString = "You do not have enough ingredients to make a " + this.state.cocktailObject.get('name').toLowerCase() + ".";
        break;
      case 1:
        canMakeString = "You can make " + floorAmount + " " + this.state.cocktailObject.get('name').toLowerCase() + ".";
        break;
      default:
        canMakeString = "You can make " + floorAmount + " " + this.state.cocktailObject.get('name').toLowerCase() + "s.";
        break;
    }

    var recipeDOM = <div className='recipe'>{this.state.cocktailObject.get('recipe')}</div>;
    var canmakeDOM = <div className="canMake">{canMakeString}</div>;
    var editIcon = <svg className="editIcon" onClick={(event) => this.editModal(event)} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path className="heroicon-ui" d="M6.3 12.3l10-10a1 1 0 0 1 1.4 0l4 4a1 1 0 0 1 0 1.4l-10 10a1 1 0 0 1-.7.3H7a1 1 0 0 1-1-1v-4a1 1 0 0 1 .3-.7zM8 16h2.59l9-9L17 4.41l-9 9V16zm10-2a1 1 0 0 1 2 0v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6c0-1.1.9-2 2-2h6a1 1 0 0 1 0 2H4v14h14v-6z"/></svg>;

    if (this.state.editMode) {
      enableScroll();
      recipeDOM = <textarea defaultValue={this.state.cocktailObject.get('recipe')}></textarea>;
      canmakeDOM = "";
      editIcon = <svg className="editIcon" onClick={(event) => this.finishEdit(event)} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path className="heroicon-ui" d="M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20zm0-2a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm-2.3-8.7l1.3 1.29 3.3-3.3a1 1 0 0 1 1.4 1.42l-4 4a1 1 0 0 1-1.4 0l-2-2a1 1 0 0 1 1.4-1.42z"/></svg>;
      classes += " to-top";
    }

    return (
      <div className={classes} onClick={(event) => this.openModal(event)}>
        <h1 className='title'>{this.state.cocktailObject.get('name').toLowerCase()}</h1>
        <ul className={ingredientsClasses}>
          {ingredientsDOM} 
        </ul>
        {recipeDOM}
        {canmakeDOM}
        {editIcon}
        <svg className="exitIcon" onClick={(event) => this.closeModal(event)} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path className="heroicon-ui" d="M4.93 19.07A10 10 0 1 1 19.07 4.93 10 10 0 0 1 4.93 19.07zm1.41-1.41A8 8 0 1 0 17.66 6.34 8 8 0 0 0 6.34 17.66zM13.41 12l1.42 1.41a1 1 0 1 1-1.42 1.42L12 13.4l-1.41 1.42a1 1 0 1 1-1.42-1.42L10.6 12l-1.42-1.41a1 1 0 1 1 1.42-1.42L12 10.6l1.41-1.42a1 1 0 1 1 1.42 1.42L13.4 12z"/></svg>
      </div>
    );
  }
}

class CocktailContainer extends React.Component {
  constructor(props) {
    super(props);

    this.cocktailObjects = []
    var cocktailDOMs = [];

    this.props.cocktails.forEach(cocktail => {
      cocktailDOMs.push(<CocktailTile ref={(cocktail) => {this.cocktailObjects.push(cocktail)}} key={cocktail.id} cocktail={cocktail}/>);
    });
  
    this.state = {
      cocktailsDOM: cocktailDOMs
    }

    document.getElementById("loadScreen").classList.add("hide");
  }

  static getIngredient(name) {
    window.activeCocktail.updateNewIngredient(name);
  }

  getCocktailObjects() {
    return this.cocktailObjects;
  }

  updateCocktail(index) {
    return this.cocktailObjects[index].updateSelf();
  }

  render() {
    return(
      <div className="cocktails">
        {this.state.cocktailsDOM}
      </div>
    );
  }
}

export default CocktailContainer;

function createIngredient(name) {
  const ingredient = new Ingredient();

  ingredient.set("type", name);
  ingredient.set("isAlcohol", false);
  ingredient.set("amount", -1);
  ingredient.set("isLiquid", false);

  return ingredient;
}

function preventDefault(e){
  e.preventDefault();
}

function disableScroll(){
  document.body.addEventListener('touchmove', preventDefault, { passive: false });
}

function enableScroll(){
  document.body.removeEventListener('touchmove', preventDefault, { passive: false });
}

document.getElementById("overlay").onclick = function (event) {
  removeOverlay();
}

document.getElementById("modalCocktail").onclick = function (event) {
  if (event.target === this) {
    removeOverlay();
  }
}

function removeOverlay() {
  document.getElementById("modalCocktail").classList.remove("active");
  document.body.classList.remove("fixed");
  document.body.classList.remove("fixedMobile");
  document.getElementById("overlay").classList.remove("show");
  document.getElementById("rootCocktails").children[0].classList.remove("background");
  enableScroll();
  
  if (window.mobilecheck()) {
    document.body.style.marginTop = "0px";

    if (lastMobileScroll !== -1) {
      window.scrollTo(0, lastMobileScroll);
      lastMobileScroll = -1;
    }
  }

  setTimeout(function() {
    document.getElementById("overlay").classList.remove("active");
  }, 250);
};

function updateAllCocktails(cocktail) {
  var array = window.cocktailGroup.getCocktailObjects();
  for(var i = 0; i < array.length; i++) {
    if (cocktail.get("name") === array[i].props.cocktail.get("name")) {
      window.cocktailGroup.updateCocktail(i);
    }
  }

  window.activeCocktail.updateSelf();
  document.getElementById("updateAlert").classList.remove("show");
}

var queryCocktail = new Parse.Query(Cocktail);
queryCocktail.find()
.then((cocktails) => {
  ReactDOM.render(<CocktailContainer ref={(component) => {window.cocktailGroup = component}} cocktails={cocktails}/>, document.querySelector('#rootCocktails'));
}, (error) => {
  console.log(error);
});

window.mobilecheck = function() {
  var check = false;
  // eslint-disable-next-line
  (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
  return check;
};

window.openIngredientModal = function (color, usedIngredients) {
  var queryIngredient = new Parse.Query(Ingredient);
  queryIngredient.find()
  .then((ingredients) => {
    ReactDOM.unmountComponentAtNode(document.querySelector('#modalIngredients'));
    ReactDOM.render(<IngredientContainer ref={(ingredientObjects) => {window.ingredientObjects = ingredientObjects}} key="ingredients" ingredients={ingredients} usedIngredients={usedIngredients}/>, document.querySelector('#modalIngredients'));
    document.getElementById("modalIngredients").classList.add("active");

    if (color && color !== "") {
      document.getElementById("modalIngredients").children[0].classList.add(color + "-bg");
    } else {
      document.getElementById("modalIngredients").children[0].classList.add("white-bg");
    }

    if (!window.mobilecheck) {
      document.getElementsByClassName("ingredientTiles")[0].style.minHeight = (document.getElementById("modalCocktail").children[0].offsetHeight - 120) + "px";
    }

    document.getElementById("rootCocktails").children[0].classList.add("background-2");

    document.querySelectorAll(".ingredientTile").forEach(function(tile) {
      var width = tile.offsetWidth;
      tile.style.height = (width - 30) + "px";
    });
    
    }, (error) => {
    console.log(error);
  });
}