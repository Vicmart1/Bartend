import React from 'react';
import CocktailContainer from './cocktail.js';

class IngredientTile extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      ingredientsObject: props.ingredient
    }
  }

  selectSelf() {
    CocktailContainer.getIngredient(this.state.ingredientsObject.get("type"));
  }

  render() {
    var unit = this.state.ingredientsObject.get('isLiquid') ? ' ml remaining' : ' ' + this.state.ingredientsObject.get('type') + '(s)';

    return (
      <div className="ingredientTile" onClick={(event) => this.selectSelf(event, 0)}>
        <h3 className="title">{this.state.ingredientsObject.get('type')}</h3>
        <div className="amount">{this.state.ingredientsObject.get('amount')}{unit}</div>
      </div>
    );
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

  render() {
    var ingredientsDOM = [];
    this.state.ingredients.forEach(ingredient => {
      if (this.state.usedIngredients.filter(e => e.get("type") === ingredient.get("type")).length == 0) {
        ingredientsDOM.push(<IngredientTile key={ingredient.id} ingredient={ingredient}/>);
      }
    });
    return(
      <div className="ingredientTilesContainer">
        <div className="ingredientTiles">
          {ingredientsDOM}
        </div>
      </div>
    );
  }
}

export default IngredientContainer;