import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { DemoRegistration } from './registration-component';
import { toForm } from './registration';

const initial = toForm({ name: 'Kurt', age: 27 });
const App = (): JSX.Element =>
  initial.isRight() ? (
    <DemoRegistration form={initial.value} onNewForm={val => console.log(val)} />
  ) : (
    <div>Initial data is invalid {initial.value.error}</div>
  );

ReactDOM.render(<App />, document.getElementById('app'));
