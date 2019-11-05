import { Form, projectValid, getFieldValue, getRawValue, isPristine, hasErrors, getErrors, updateField } from './forms';
import { RegistrationInput, nameField, ageField } from './registration';
import { ReactNode } from 'react';
import * as React from 'react';
import { constant } from 'fp-ts/lib/function';

export const renderExample = (
  form: Form<RegistrationInput>,
  onNewForm: (form: Form<RegistrationInput>) => void,
): ReactNode => {
  const isValid = projectValid(false, constant(true), form);
  const name = getFieldValue(form, nameField);
  const age = getFieldValue(form, ageField);

  return (
    <div>
      <div>
        <label>
          Name:{' '}
          <input
            value={getRawValue(name)}
            onChange={x =>
              updateField(form, name, x.currentTarget.value).fold(
                x => console.log('Error while updating', x),
                onNewForm,
              )
            }
          />
        </label>
        {!isPristine(name) && hasErrors(name) && getErrors(name).map(error => <span>{error.description}</span>)}
      </div>
      <div>
        <label>
          Age:{' '}
          <input
            value={getRawValue(age)}
            onChange={x =>
              updateField(form, age, x.currentTarget.value).fold(x => console.log('Error while updating', x), onNewForm)
            }
          />
        </label>
        {!isPristine(age) && hasErrors(age) && getErrors(age).map(error => <span>{error.description}</span>)}
      </div>
      {isValid ? <button>Submit</button> : <span>Fix errors</span>}
    </div>
  );
};
