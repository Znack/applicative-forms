import {
  Form,
  textField,
  intField,
  map,
  ap,
  withInitial,
  withValidator,
  UpdateError,
  updateField,
  form,
  intValidator,
  minLengthStringValidator,
  notEmptyStringValidator,
} from '../forms';
import { Either } from 'fp-ts/lib/Either';

interface RegistrationPasswordsInput {
  passwordPrimary: string;
  passwordConfirmation: string;
}
export interface RegistrationInput {
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

// form fields, we had better declare it separately and save in vars
export const nameField = withValidator(notEmptyStringValidator, withInitial('John', textField()));
export const ageField = withValidator(intValidator, intField());
export const primaryPasswordField = withValidator(minLengthStringValidator(7), textField());
export const confirmationPasswordField = withValidator(minLengthStringValidator(7), textField());

// forms declarations
const passwordsForm: Form<RegistrationPasswordsInput> = form(gatherPasswords)
  .addField(primaryPasswordField)
  .addField(confirmationPasswordField);

export const registrationForm: Form<RegistrationInput> = form(gatherForm)
  .addField(nameField)
  .addField(ageField)
  .addField(passwordsForm);

// alternative form declarations just for demo purposes, will be not used later
export const registrationFormClassic: Form<RegistrationInput> = passwordsForm
  .ap(intField().map(age => passwords => ({ age, passwords })))
  .ap(map(textField(), name => ({ age, passwords }) => ({ name, age, passwords })));

export const prefixForm: Form<RegistrationInput> = ap(ap(map(textField(), gatherForm), intField()), passwordsForm);

// example of form updating
export const updatePrimaryPassword = (form: Form<RegistrationInput>) => <A>(
  raw: string,
): Either<UpdateError, Form<RegistrationInput>> => updateField(form, primaryPasswordField, raw);

// example how to fill form with already prepared data
export const toForm = ({ name, age }: { name: string; age: number }): Either<UpdateError, Form<RegistrationInput>> =>
  updateField(registrationForm, nameField, name).chain(form => updateField(form, ageField, age.toString()));
