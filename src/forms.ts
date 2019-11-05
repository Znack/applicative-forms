import { Option, none } from 'fp-ts/lib/Option';
import { Either, right } from 'fp-ts/lib/Either';

export type FormError = {
  code: string;
  description: string;
};

export interface Form<A> {
  map: <B>(f: (a: A) => B) => Form<B>;
  ap: <B>(fab: Form<(a: A) => B>) => Form<B>;
  addField: A extends (arg: infer Arg) => infer Result ? (fab: Form<Arg>) => Form<Result> : never;
}

export const applicativeForm = {
  map: <A, B>(fa: Form<A>, f: (a: A) => B): Form<B> => null as any,
  of: <A>(a: A): Form<A> => null as any,
  ap: <A, B>(fab: Form<(a: A) => B>, fa: Form<A>): Form<B> => null as any,
};

export const map = applicativeForm.map;
export const of = applicativeForm.of;
export const ap = applicativeForm.ap;

export const initial = <A>(value: A): Form<A> => applicativeForm.of(value);
export const empty = <A>(fieldName: string): Form<A> => null as any;

export const textField = (fieldName: string): Form<string> => empty(fieldName);
export const optionalTextField = (fieldName: string): Form<Option<string>> => empty(fieldName);
export const intField = (fieldName: string): Form<number> => empty(fieldName);
export const withInitial = <A>(initialValue: A, form: Form<A>): Form<A> => null as any;
export const withValidator = <A>(validate: (raw: string) => Either<Array<FormError>, A>, form: Form<A>): Form<A> =>
  null as any;

export type UpdateError = { error: 'unknownField'; fieldName: string } | { error: 'fieldIsNotPrimitive' };

export const getFieldValue = <A, B>(form: Form<A>, field: Form<B>): Form<B> => null as any;
export const updateField = <A, B>(form: Form<A>, field: Form<B>, raw: string): Either<UpdateError, Form<A>> =>
  right(form);
export const updateFields = <A>(
  form: Form<A>,
  ...fields: Array<[Form<unknown>, string]>
): Either<UpdateError, Form<A>> => right(form);

export const getErrors = (form: Form<unknown>): FormError[] => [];
export const hasErrors = <A>(form: Form<A>): boolean => getErrors(form).length > 0;
export const isPristine = <A>(form: Form<A>): boolean => false;
export const getValidated = <A>(form: Form<A>): Option<A> => none;
export const getRawValue = <A>(form: Form<A>): string => '';
export const getOrElse = <A>(defaultValue: A, form: Form<A>): A => getValidated(form).getOrElse(defaultValue);
export const projectValid = <A, B>(defaultValue: B, projection: (a: A) => B, form: Form<A>): B =>
  getValidated(form.map(projection)).getOrElse(defaultValue);

// — some stupid law example
// — multiple application of updateField should be identical to updateFields
// const firstField = textField('first');
// const secondField = textField('second');
// const form = of(tuple)
//   .addField(firstField)
//   .addField(secondField);
// updateField(
//   updateField(
//     form,
//     firstField,
//     x
//   )),
//   secondField,
//   y
// )
// ===
// updateFields(
//   form,
//   [firstField, x],
//   [secondField, y]
// )
