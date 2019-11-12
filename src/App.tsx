import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { DemoRegistration } from './registration-component';
import { toForm, RegistrationInput } from './registration';
import { Form } from './forms';

const initial = toForm({ name: 'Kurt', age: 27 });
const App = () =>
  initial.isRight() ? (
    <Registration initialForm={initial.value} />
  ) : (
    <div>Initial data is invalid {initial.value.error}</div>
  );

const Registration = ({ initialForm }: { initialForm: Form<RegistrationInput> }) => {
  const [state, setState] = React.useState(initialForm);
  return <DemoRegistration form={state} onNewForm={setState} />;
};

ReactDOM.render(<App />, document.getElementById('app'));
