import React from 'react';

class IngredientTile extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      ingredientsObject: props.ingredient
    }
  }

  render() {
    return (
      <div className='Ingredient'>
        <h3>{this.state.ingredientsObject.get('type')}</h3>
        <div className='amount'>{this.state.ingredientsObject.get('amount')}</div>
        <div className='isAlcohol'>{this.state.ingredientsObject.get('isAlcohol') ? 'Alcohol' : 'Mixer'}</div>
      </div>
    );
  }
}

class IngredientContainer extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      ingredients: props.ingredients
    }
  }

  render() {
    var ingredientsDOM = [];
    this.state.ingredients.forEach(ingredient => {
      ingredientsDOM.push(<IngredientTile key={ingredient.id} ingredient={ingredient}/>);
    });
    return(
      <div>
        {ingredientsDOM}
      </div>
    );
  }
}

export default IngredientContainer;