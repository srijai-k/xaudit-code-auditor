import React from 'react';
export default class Profile extends React.Component {
  componentDidMount() {
    console.log('mounted');
  }
  render() {
    return <div>{this.props.name}</div>;
  }
}
