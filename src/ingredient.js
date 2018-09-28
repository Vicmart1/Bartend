import React from 'react';
import CocktailContainer from './cocktail.js';

class IngredientTile extends React.Component {
  constructor(props) {
    super(props);

    if (props.ingredient) {
      this.state = {
        ingredientsObject: props.ingredient
      }
    } else {
      this.state = {
        newIngredient: true
      }
    }
  }

  selectSelf() {
    CocktailContainer.getIngredient(this.state.ingredientsObject.get("type"));
  }

  render() {
    if (!this.state.newIngredient) {
      var unit = this.state.ingredientsObject.get('isLiquid') ? ' ml remaining' : ' ' + this.state.ingredientsObject.get('type') + '(s)';

      return (
        <div className="ingredientTile" onClick={(event) => this.selectSelf(event, 0)}>
          <h3 className="title">{this.state.ingredientsObject.get('type')}</h3>
          <div className="amount">{this.state.ingredientsObject.get('amount')}{unit}</div>
        </div>
      );
    } else {
      return (
        <div className="ingredientTile addTile">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path className="heroicon-ui" d="M17 11a1 1 0 0 1 0 2h-4v4a1 1 0 0 1-2 0v-4H7a1 1 0 0 1 0-2h4V7a1 1 0 0 1 2 0v4h4z"/></svg>
          <h3 className="title">add an ingredient</h3>
        </div>
      );
    }
  }
}

class IngredientContainer extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      ingredients: props.ingredients,
      usedIngredients: props.usedIngredients
    }
  }

  closeModal(e) {
    e.stopPropagation();
    removeOverlay();
  }

  render() {
    var ingredientsDOM = [];
    this.state.ingredients.forEach(ingredient => {
      if (this.state.usedIngredients.filter(e => e.get("type") === ingredient.get("type")).length == 0) {
        ingredientsDOM.push(<IngredientTile key={ingredient.id} ingredient={ingredient}/>);
      }
    });

    ingredientsDOM.push(<IngredientTile key={"new"}/>);

    return(
      <div id="ingredientTilesContainer">
        <div className="ingredientTiles">
          {ingredientsDOM}
          <svg className="exitIcon" onClick={(event) => this.closeModal(event)} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path className="heroicon-ui" d="M4.93 19.07A10 10 0 1 1 19.07 4.93 10 10 0 0 1 4.93 19.07zm1.41-1.41A8 8 0 1 0 17.66 6.34 8 8 0 0 0 6.34 17.66zM13.41 12l1.42 1.41a1 1 0 1 1-1.42 1.42L12 13.4l-1.41 1.42a1 1 0 1 1-1.42-1.42L10.6 12l-1.42-1.41a1 1 0 1 1 1.42-1.42L12 10.6l1.41-1.42a1 1 0 1 1 1.42 1.42L13.4 12z"/></svg>
        </div>
      </div>
    );
  }
}

export default IngredientContainer;

document.getElementById("modalIngredients").onclick = function (event) {
  if (event.target === this) {
    removeOverlay();
  }
}

function removeOverlay() {
  document.getElementById("modalIngredients").classList.remove("active");
  document.getElementById("rootCocktails").children[0].classList.remove("background-2");
  setTimeout(function() {
    document.getElementById("ingredientTilesContainer").className = "";
  }, 250);
};