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

export const registrationForm: Form<RegistrationInput> = of(gatherForm)
  .apF(textField('name'))
  .apF(intField('age'))
  .apF(passwordsForm);

export const registrationFormClassic: Form<RegistrationInput> = passwordsForm
  .ap(intField('age').map(age => passwords => ({ age, passwords })))
  .ap(map(textField('name'), name => ({ age, passwords }) => ({ name, age, passwords })));

export const prefixForm: Form<RegistrationInput> = ap(
  ap(map(textField('name'), gatherForm), intField('age')),
  passwordsForm,
);

// F<A> -> F<A -> F<B>> -> F<B>
