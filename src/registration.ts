import { Form, textField, intField, map, ap, of } from './forms';

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

const passwordsForm: Form<RegistrationPasswordsInput> = textField('confirmation').ap(
  map(textField('primary'), gatherPasswords),
);

export const registrationForm: Form<RegistrationInput> = passwordsForm
  .ap(intField('age').map(age => passwords => ({ age, passwords })))
  .ap(map(textField('name'), name => ({ age, passwords }) => ({ name, age, passwords })));

export const registrationFormWithPure: Form<RegistrationInput> = of(gatherForm)
  .apR(textField('name'))
  .apR(intField('age'))
  .apR(passwordsForm);

export const prefixForm: Form<RegistrationInput> = ap(
  ap(map(textField('name'), gatherForm), intField('age')),
  passwordsForm,
);

// F<A> -> F<A -> F<B>> -> F<B>
