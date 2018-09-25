import React from 'react';
import ReactDOM from 'react-dom';

const MAX_INGREDIENTS = 16;

const ozToMl = (oz) => (oz * 29.5735);
const mlToOz = (ml) => (ml / 29.5735);

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
      editMode: false,
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
    ReactDOM.render(<CocktailTile key={this.state.cocktailObject.id} cocktail={this.state.cocktailObject}/>, document.querySelector('#modalCocktail'));
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
    document.body.classList.remove("fixedMobile")
  }

  editModal(e) {
    if (e.target.parentElement.parentElement.id === "modalCocktail" || e.target.parentElement.parentElement.parentElement.id === "modalCocktail") {
      e.stopPropagation();

      this.setState({
        editMode: true
      });

      setTimeout(function() {
        document.body.classList.add("fixedMobile")
      }, 250);
    }
  }

  addIngredient() {
    var ingredientsObjects = this.state.ingredients;
    ingredientsObjects.push(createIngredient());
    this.setState({
      ingredients: ingredientsObjects
    });
  }

  subIngredient() {
    var ingredientsObjects = this.state.ingredients;
    ingredientsObjects.pop();
    this.setState({
      ingredients: ingredientsObjects
    });
  }

  finishEdit() {
    console.log(document.getElementById("modalCocktail").children[0].children[1].children.length - 2);
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
            <div className="mainText">
              <span>
                <input className="mainInput" defaultValue={this.state.cocktailObject.get('ID_' + ingredient.id)} />
              </span> oz of <input className="mainInput" defaultValue={ingredient.get('type')} />
            </div>
          </li>
        );
      } else {
        ingredientsDOM.push(
          <li key={ingredient.get('type')} className="ingredient">
            <div className="mainText">
              <span className="number">
                {this.state.cocktailObject.get('ID_' + ingredient.id)}
              </span> oz of {ingredient.get('type').toLowerCase()}
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
      if (this.state.ingredients.length > 0) {
        ingredientsDOM.push(
          <li key="subIngredient" className="ingredient">
            <div className="subIngredient" onClick={(event) => this.subIngredient(event)}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path className="heroicon-ui" d="M17 11a1 1 0 0 1 0 2H7a1 1 0 0 1 0-2h10z"/></svg>
              Remove an ingredient
            </div>
          </li>
        );
      }      
    }

    var classes = "cocktail";
    switch(this.state.cocktailObject.get('color')) {
      case 'orange':
        classes += " orange-bg";
        break;
      case 'green':
        classes += " green-bg";
        break;
      case 'blue':
        classes += " blue-bg";
        break;
      case 'purple':
        classes += " purple-bg";
        break;
      case 'white':
        classes += " white-bg";
        break;
      case 'black':
        classes += " black-bg";
        break;
      case 'red':
        classes += " red-bg";
        break;
      case 'yellow':
        classes += " yellow-bg";
        break;
      case 'pink':
        classes += " pink-bg";
        break;
      default:
        classes += " white-bg";
        break;
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

    this.state = {
      cocktails: props.cocktails
    }
  }

  render() {
    var cocktailsDOM = [];
    this.state.cocktails.forEach(cocktail => {
      cocktailsDOM.push(<CocktailTile key={cocktail.id} cocktail={cocktail}/>);
    });
    return(
      <div className="cocktails">
        {cocktailsDOM}
      </div>
    );
  }
}

export default CocktailContainer;

function removeOverlay() {
  document.getElementById("modalCocktail").classList.remove("active");
  document.getElementsByTagName("body")[0].classList.remove("fixed");
  document.getElementById("overlay").classList.remove("show");
  document.getElementById("rootCocktails").children[0].classList.remove("background");
  
  setTimeout(function() {
    document.getElementById("overlay").classList.remove("active");
  }, 250);
};

function createIngredient() {
  const ingredient = new Ingredient();

  ingredient.set("type", "");
  ingredient.set("isAlcohol", false);
  ingredient.set("amount", "");
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
  if (event.target == this) {
    removeOverlay();
  }
}

function removeOverlay() {
  document.getElementById("modalCocktail").classList.remove("active");
  document.getElementsByTagName("body")[0].classList.remove("fixed");
  document.getElementById("overlay").classList.remove("show");
  document.getElementById("rootCocktails").children[0].classList.remove("background");
  enableScroll();
  
  setTimeout(function() {
    document.getElementById("overlay").classList.remove("active");
  }, 250);
};