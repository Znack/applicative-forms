import {
  Form,
  projectValid,
  getFieldValue,
  getRawValue,
  isPristine,
  hasErrors,
  getErrors,
  updateField,
} from '../forms';
import {
  RegistrationInput,
  nameField,
  ageField,
  primaryPasswordField,
  confirmationPasswordField,
} from './registration';
import * as React from 'react';
import { constant } from 'fp-ts/lib/function';
import { sequenceT } from 'fp-ts/lib/Apply';
import { option } from 'fp-ts/lib/Option';

export const DemoRegistration = ({
  form,
  onNewForm,
}: {
  form: Form<RegistrationInput>;
  onNewForm: (form: Form<RegistrationInput>) => void;
}): JSX.Element => {
  const isValid = projectValid(false, constant(true), form);
  const maybeName = getFieldValue(form, nameField);
  const maybeAge = getFieldValue(form, ageField);
  const maybePassword = getFieldValue(form, primaryPasswordField);
  const maybePasswordConfirmation = getFieldValue(form, confirmationPasswordField);

  return sequenceT(option)(maybeName, maybeAge, maybePassword, maybePasswordConfirmation)
    .map(([name, age, password, passwordConfirmation]) => (
      <div>
        <div>
          <label>
            Name:{' '}
            <input
              value={getRawValue(name)}
              onChange={x =>
                updateField(form, nameField, x.currentTarget.value).fold(
                  x => console.log('Error while updating', x),
                  onNewForm,
                )
              }
            />
          </label>
          {!isPristine(name) &&
            hasErrors(name) &&
            getErrors(name).map((error, index) => <span key={index}>{error.description}</span>)}
        </div>
        <div>
          <label>
            Age:{' '}
            <input
              value={getRawValue(age)}
              onChange={x =>
                updateField(form, ageField, x.currentTarget.value).fold(
                  x => console.log('Error while updating', x),
                  onNewForm,
                )
              }
            />
          </label>
          {!isPristine(age) &&
            hasErrors(age) &&
            getErrors(age).map((error, index) => <span key={index}>{error.description}</span>)}
        </div>
        <div>
          <label>
            Password:{' '}
            <input
              value={getRawValue(password)}
              onChange={x =>
                updateField(form, primaryPasswordField, x.currentTarget.value).fold(
                  x => console.log('Error while updating', x),
                  onNewForm,
                )
              }
            />
          </label>
          {!isPristine(password) &&
            hasErrors(password) &&
            getErrors(password).map((error, index) => <span key={index}>{error.description}</span>)}
        </div>
        <div>
          <label>
            Confirm password:{' '}
            <input
              value={getRawValue(passwordConfirmation)}
              onChange={x =>
                updateField(form, confirmationPasswordField, x.currentTarget.value).fold(
                  x => console.log('Error while updating', x),
                  onNewForm,
                )
              }
            />
          </label>
          {!isPristine(passwordConfirmation) &&
            hasErrors(passwordConfirmation) &&
            getErrors(passwordConfirmation).map((error, index) => <span key={index}>{error.description}</span>)}
        </div>
        {isValid ? <button>Submit</button> : <span>Fix errors</span>}
      </div>
    ))
    .getOrElse(<div>Invalid form data, sorry</div>);
};
