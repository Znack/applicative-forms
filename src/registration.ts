import {
  Form,
  textField,
  intField,
  map,
  ap,
  of,
  withInitial,
  withValidator,
  UpdateError,
  updateField,
  updateFields,
} from './forms';
import { Either, right, left } from 'fp-ts/lib/Either';

interface RegistrationPasswordsInput {
  passwordPrimary: string;
  passwordConfirmation: string;
}
interface RegistrationInput {
  name: string;
  age: number;
  passwords: RegistrationPasswordsInput;
}

const gatherPasswords = (passwordPrimary: string) => (passwordConfirmation: string): RegistrationPasswordsInput => ({
  passwordPrimary,
  passwordConfirmation,
});

const gatherForm = (name: string) => (age: number) => (passwords: RegistrationPasswordsInput) => ({
  name,
  age,
  passwords,
});

// abstract validators
const intValidator = (raw: string): Either<string[], number> =>
  isNaN(+raw) ? left(['invalidNumber']) : right(Number(raw));

const minLengthStringValidator = (minLength: number) => (raw: string): Either<string[], string> =>
  raw.length < minLength ? left(['invalidLength']) : right(raw);

// form fields, we had better declare it separately and save in vars
const nameField = withInitial('John', textField('name'));
const ageField = withValidator(intValidator, intField('age'));
const primaryPasswordField = withValidator(minLengthStringValidator(7), textField('primary'));
const confirmationPasswordField = withValidator(minLengthStringValidator(7), textField('confirmation'));

// forms declarations
const passwordsForm: Form<RegistrationPasswordsInput> = of(gatherPasswords)
  .addField(primaryPasswordField)
  .addField(confirmationPasswordField);

export const registrationForm: Form<RegistrationInput> = of(gatherForm)
  .addField(nameField)
  .addField(ageField)
  .addField(passwordsForm);

// alternative form declarations just for demo purposes, will be not used later
export const registrationFormClassic: Form<RegistrationInput> = passwordsForm
  .ap(intField('age').map(age => passwords => ({ age, passwords })))
  .ap(map(textField('name'), name => ({ age, passwords }) => ({ name, age, passwords })));

export const prefixForm: Form<RegistrationInput> = ap(
  ap(map(textField('name'), gatherForm), intField('age')),
  passwordsForm,
);

// example of form updating
export const updatePrimaryPassword = (form: Form<RegistrationInput>) => <A>(
  raw: string,
): Either<UpdateError, Form<RegistrationInput>> => updateField(form, primaryPasswordField, raw);

// example how to fill form with already prepared data
export const toForm = ({ name, age }: { name: string; age: number }): Either<UpdateError, Form<RegistrationInput>> =>
  updateFields(registrationForm, [nameField, name], [ageField, age.toString()]);
