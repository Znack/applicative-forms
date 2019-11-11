import { Form, projectValid, getFieldValue, getRawValue, isPristine, hasErrors, getErrors, updateField } from './forms';
import { RegistrationInput, nameField, ageField } from './registration';
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

  return sequenceT(option)(maybeName, maybeAge)
    .map(([name, age]) => (
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
                updateField(form, age, x.currentTarget.value).fold(
                  x => console.log('Error while updating', x),
                  onNewForm,
                )
              }
            />
          </label>
          {!isPristine(age) && hasErrors(age) && getErrors(age).map(error => <span>{error.description}</span>)}
        </div>
        {isValid ? <button>Submit</button> : <span>Fix errors</span>}
      </div>
    ))
    .getOrElse(<div>Invalid form data, sorry</div>);
};
